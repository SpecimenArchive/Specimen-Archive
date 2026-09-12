import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {gzipSync} from 'node:zlib';import {randomUUID} from 'node:crypto';import {setTimeout as delay} from 'node:timers/promises';import {PNG} from 'pngjs';
import type {BrowserContext,Page} from '@playwright/test';import type {Circuit} from '../../shared/types';import type {ExhibitLive,ExhibitRecord,ExhibitDecision,ExecutedEvent} from '../../shared/exhibit';import type {Encounter,ActionReceipt,DisplayFrame,ObservationState} from '../../shared/observation';
import {executionOrigin} from '../provenance';import {sha256} from '../browser/evidence';import {MODEL_CONFIG} from '../model/config';import {EXHIBIT_CONFIG as C} from './config';import {ExhibitController} from './controller';import {OBSERVATION_RETINA} from './observation-encoder';import {RemoteDesktopSession} from './remote-desktop';import {windowsPageAgreement} from './windows-geometry';import {ObservationJournal} from './journal';import {EXTERNAL_POLICY as P,RESEARCH_PAGES,approvedPage,coinAddress,restrictionReason,EncounterPlanner} from './external-policy';import type {EpisodeOptions} from './runner';
const ORIGIN=executionOrigin('external-observation');
/** Persistent browser + neural checkpoint. The supervisor selects environments;
 * only the unchanged PNG -> rate circuit -> motor decoder proposes wheel input. */
export class ExternalStation {
 private desktop?:RemoteDesktopSession;private context?:BrowserContext;private page?:Page;private checkpoint?:ExhibitRecord['initialCheckpoint'];
 private planner=new EncounterPlanner(process.env.EXHIBIT_EXTERNAL_ENVIRONMENT==='research');private encounter?:Encounter;private journey:Encounter[]=[];private visit=0;private encounterDecisions=0;private unchanged=0;
 private live!:ExhibitLive;private directory='';private runId='';private frame=0;private displayIndex=0;private displayFrames:DisplayFrame[]=[];private displayRunning=false;private displayWork?:Promise<void>;private displayError?:Error;
 private commandId:string|null=null;private events:ExecutedEvent[]=[];private cursor={x:0,y:0};private update?:(live:ExhibitLive)=>void;
 private counters={uniquePages:0,coinPages:0,attempted:0,moved:0,boundary:0,policyBlocked:0,failed:0};private visited=new Set<string>();private coinVisited=new Set<string>();private continuityStartedAt=new Date().toISOString();
 recording:NonNullable<ObservationState['recording']>={pending:0};
 constructor(readonly journal:ObservationJournal){}
 private emit(patch:Partial<ExhibitLive>={},operation?:string,sensory?:ObservationState['sensory']){
  const prior=this.live?.observation;this.live={...this.live,...patch,timestamp:new Date().toISOString()};
  this.live.observation={...this.journal.state(this.encounter??{id:'pons',label:'Pons Explore',url:P.initial},operation??prior?.operation??this.live.notice,sensory??prior?.sensory??'not-sampling'),profile:P.version,encounter:this.encounter?{...this.encounter}:undefined,journey:this.journey.map(e=>({...e})),counters:{...this.counters},accessNotice:this.planner.ponsBlocked,recording:{...this.recording},continuityStartedAt:this.continuityStartedAt};this.update?.(this.live);
 }
 private operation(kind:string,summary:string,status:'completed'|'failed'|'executing'|'blocked'='completed'){
  return this.journal.event(this.runId,{source:'orchestration',kind,status,page:this.encounter?.label??'Pons Explore',summary,completedAt:status==='completed'?new Date().toISOString():undefined});
 }
 private async open(){
  if(this.page&&!this.page.isClosed())return;
  this.desktop=await RemoteDesktopSession.open();this.context=await this.desktop.browser.newContext({viewport:{width:640,height:360},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block'});this.context.setDefaultTimeout(8000);
  await this.context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url());const pons=u.origin==='https://www.ponsfamily.com',research=u.hostname==='elifesciences.org'||u.hostname.endsWith('.elifesciences.org')||u.hostname==='jekelylab.github.io';
   const resource=pons?(/^\/_next\//.test(u.pathname)||/^\/api\/(?:pons-launches(?:\/|$)|(?:pons-token-images|token-image|eth-price)$|pons-(?:v2-)?market\/0x[\da-f]{40}(?:\/(?:chart|trades|ath|tip|dev-trades|distributor|creator-fees))?$)/i.test(u.pathname)||/\.(?:ico|png|svg|jpg|jpeg|webp|woff2?)$/.test(u.pathname)||approvedPage(u.origin+u.pathname)):research;
   const restricted=pons&&u.pathname==='/blocked';
   if(!['GET','HEAD'].includes(r.method())||u.protocol!=='https:'||!(r.isNavigationRequest()?approvedPage(r.url())||restricted:resource))return route.abort('blockedbyclient');
   await route.continue();
  });
  await this.context.routeWebSocket(/.*/,ws=>ws.close());
  await this.context.exposeBinding('__specimenInput',(_,event)=>{if(this.commandId)this.events.push({...event,commandId:this.commandId});});
  await this.context.addInitScript(()=>{for(const type of ['wheel','mousemove','mousedown','mouseup','click'])addEventListener(type,e=>{const m=e as MouseEvent,w=e as WheelEvent;void (window as any).__specimenInput({type,timestamp:new Date().toISOString(),pageTimeMs:performance.now(),url:location.origin+location.pathname,x:m.clientX,y:m.clientY,deltaY:type==='wheel'?w.deltaY:undefined,trusted:e.isTrusted});},true);});
  this.page=await this.context.newPage();for(const c of this.desktop.browser.contexts())if(c!==this.context)for(const p of c.pages())await p.close();
  await this.desktop.arrange(this.page);await this.page.setViewportSize(this.desktop.pageSize);await this.desktop.present(this.page);this.cursor={x:Math.round(this.desktop.pageSize.width*.4),y:Math.round(this.desktop.pageSize.height*.7)};this.encounter=undefined;this.continuityStartedAt=new Date().toISOString();
 }
 private async navigate(url:string,reason:string){
  if(!approvedPage(url))throw new Error('Supervisor refused an unapproved destination');
  const event=this.operation('navigate',`${reason} Destination selected by the environment supervisor.`, 'executing');this.emit({state:'idle',inputFrame:null,input:null,command:null,commandId:null},'Opening an approved external page','not-sampling');
  const response=await this.page!.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await this.page!.waitForTimeout(700);
  const actual=this.page!.url(),text=(await this.page!.locator('body').innerText()).slice(0,7000),restriction=restrictionReason(actual,text,response?.status());
  if(restriction){this.journal.finish(event,{status:'blocked',reason:restriction,completedAt:new Date().toISOString()});if(new URL(url).hostname==='www.ponsfamily.com'){this.planner.ponsBlocked=restriction;await this.navigate(RESEARCH_PAGES[0],'Pons reports restricted access; approved research fallback.');return;}throw new Error(restriction);}
  if(!approvedPage(actual))throw new Error('Navigation left the approved page routes');
  await this.page!.bringToFront();await this.desktop!.present(this.page!);await this.page!.mouse.move(this.cursor.x,this.cursor.y,{steps:4});
  this.operation('pointer',`Supervisor positioned the input cursor at (${this.cursor.x}, ${this.cursor.y}) CSS px. No neural cursor movement is claimed.`);
  const title=(await this.page!.title()).slice(0,160),tokenAddress=coinAddress(actual),kind=tokenAddress?'coin':actual===P.initial?'explore':'research';
  this.encounter={visitId:`visit-${++this.visit}`,id:actual,label:title,url:actual,kind,enteredAt:new Date().toISOString(),source:'orchestration',tokenAddress,runId:this.runId,transitionId:event.id};this.journey.push(this.encounter);this.journey=this.journey.slice(-12);this.planner.entered(actual);this.visited.add(actual);if(tokenAddress)this.coinVisited.add(tokenAddress.toLowerCase());this.counters.uniquePages=this.visited.size;this.counters.coinPages=this.coinVisited.size;this.encounterDecisions=0;this.unchanged=0;
  this.journal.finish(event,{status:'completed',page:title,summary:`Opened ${title}. Environment selection is orchestration.`,completedAt:new Date().toISOString()});this.emit({},`Observing ${title}`);
 }
 private async discover(){if(this.encounter?.kind!=='explore')return;this.planner.discover(await this.page!.locator('a[href]').evaluateAll(as=>as.map(a=>({url:(a as HTMLAnchorElement).href,title:(a.textContent??'').slice(0,160)}))));}
 private async position(){return this.page!.evaluate(({x,y})=>{
  const hit=document.elementFromPoint(x,y);let element:Element|null=hit,scroller:Element=document.scrollingElement!;
  while(element){if(element.scrollHeight>element.clientHeight+2&&['auto','scroll'].includes(getComputedStyle(element).overflowY)){scroller=element;break;}element=element.parentElement;}
  return {scroll:scroller.scrollTop,range:scroller.scrollHeight-scroller.clientHeight,url:location.origin+location.pathname,visible:document.visibilityState==='visible',form:!!hit?.closest('input,textarea,select,[contenteditable="true"],[role="spinbutton"]'),container:scroller.tagName};
 },this.cursor);}
 private async capture(){
  if(this.displayError)throw this.displayError;if(!await this.page!.evaluate(()=>document.visibilityState==='visible'))throw new Error('The sensory page lost visibility; input stopped');
  const png=await this.desktop!.screenshot(this.page!),at=new Date().toISOString(),name=`frame-${String(this.frame).padStart(4,'0')}.png`;writeFileSync(join(this.directory,name),png);
  const native=await this.desktop!.capture(this.directory,this.frame++,name,at,this.cursor);native.cursorSource='not-present';const agreement=windowsPageAgreement(PNG.sync.read(readFileSync(join(this.directory,native.path))),PNG.sync.read(png),native.station!.viewport);
  if(agreement<.92)throw new Error(`Visible page/input mismatch (${(agreement*100).toFixed(1)}% agreement); input stopped`);
  return {png,at,name,native};
 }
 private startDisplay(){
  this.displayRunning=true;this.displayError=undefined;
  this.displayWork=(async()=>{while(this.displayRunning){const start=performance.now();try{const frame=await this.desktop!.display(this.directory,this.runId,this.displayIndex++);this.displayFrames.push(frame);this.journal.capture(Date.parse(frame.capturedAt));this.emit({display:frame});}catch(e){if(this.displayRunning){this.displayError=e as Error;this.emit({state:'recovering',notice:'Windows capture interrupted; input held.'},'Windows capture interrupted; input held.','not-sampling');}break;}await delay(Math.max(0,P.displayIntervalMs-(performance.now()-start)));}})();
 }
 private async stopDisplay(){this.displayRunning=false;await this.displayWork;}
 async close(){await this.stopDisplay();await this.desktop?.close();this.desktop=undefined;this.page=undefined;this.context=undefined;}
 async episode(circuit:Circuit,o:EpisodeOptions){
  const startedAt=new Date().toISOString(),runId=`exhibit_${Date.now()}_${randomUUID().slice(0,8)}`;this.runId=runId;this.directory=resolve(o.root,runId);mkdirSync(this.directory,{recursive:true});this.frame=0;this.displayIndex=0;this.displayFrames=[];this.update=o.onUpdate;this.events=[];
  const controller=new ExhibitController(circuit,runId,startedAt,o.intervention);if(this.checkpoint)controller.engine.restore(this.checkpoint);
  const decisions:ExhibitDecision[]=[],record:ExhibitRecord={schemaVersion:1,kind:'continuous-browser-episode',recorder:'Specimen Recorder',id:runId,sessionId:o.sessionId,origin:{...ORIGIN,runId},config:C,configSha256:sha256(JSON.stringify(C)),model:MODEL_CONFIG,externalConfig:P,initialCheckpoint:this.checkpoint,startedAt,completedAt:'',seed:o.seed,layout:o.layout,intervention:o.intervention,browserVersion:'',execution:{paced:true,minimumWindowWallMs:P.windowWallMs,nodeVersion:process.version},coverage:{neuronIds:circuit.nodes.map(n=>n.id),edges:circuit.edges.length,synapses:circuit.edges.reduce((s,e)=>s+e.weight,0)},setup:{note:'Persistent external browser. Visible pixel contrast drives the unchanged rate circuit and wheel decoder. Environment supervisor selects approved pages from discovered links and visit coverage; navigation and fixed cursor placement are orchestration. DOM observations only guard/verify input and supply page metadata, never motor direction. Recording/replay run in a separate finalizer process.',events:[]},decisions:[],evaluator:{navigated:false,activated:false,activationCount:0},outcome:'error',artifacts:[],stages:{execution:'failed',recording:'unavailable'}};
  this.live={sessionId:o.sessionId,runId,packetSeq:0,timestamp:startedAt,state:'starting',episode:o.episode,decision:0,intervention:o.intervention,layout:o.layout,seed:o.seed,sourceRevision:ORIGIN.sourceRevision,sourceDirty:ORIGIN.sourceDirty,configSha256:record.configSha256,dataVersion:ORIGIN.dataVersion,inputFrame:null,browserFrame:null,capturedAt:null,snapshot:controller.engine.ticks?controller.engine.snapshot(runId,controller.engine.ticks,startedAt,0):null,input:null,motor:null,command:null,commandId:null,history:[],notice:'Opening external observation.',metrics:{episodes:0,failures:0,rssMB:0,windowWallMs:P.windowWallMs,modelSecondsPerWindow:6}};this.emit();
  try{
   await this.open();record.browserVersion=this.desktop!.browser.version();if(!this.encounter)await this.navigate(this.planner.next(),'Initial external environment.');this.startDisplay();
   for(let decision=0;decision<P.decisionWindows;decision++){
    o.signal?.throwIfAborted();if(this.displayError)throw this.displayError;
    if(this.encounterDecisions>=P.maximumEncounterDecisions||this.unchanged>=P.maximumUnchanged){await this.discover();const next=this.planner.next(this.encounter!.url);if(next===this.encounter!.url){this.operation('stagnation','No new approved coin links are available; visiting published larval research.','blocked');await this.navigate(RESEARCH_PAGES[0],'No new approved listing destination.');}else await this.navigate(next,this.unchanged>=P.maximumUnchanged?'Recovered after three unchanged results.':'Encounter observation budget reached.');}
    await this.discover();const page=this.page!,before=await this.capture(),position=await this.position(),windowStart=performance.now(),baseStep=controller.engine.ticks;
    const calculation=await controller.observe(before.png,decision,async(snapshot,input)=>{o.signal?.throwIfAborted();if(this.displayError)throw this.displayError;await delay(Math.max(0,windowStart+(snapshot.seq-baseStep)/C.modelSteps*P.windowWallMs-performance.now()),undefined,{signal:o.signal});this.emit({state:'integrating',decision,inputFrame:`${runId}/${before.name}`,browserFrame:`${runId}/${before.name}`,desktop:before.native,capturedAt:before.at,snapshot,input,motor:null,command:null,commandId:null,notice:'Integrating captured pixels through the larval circuit.'},`Sensing ${this.encounter!.label}`,'current');},OBSERVATION_RETINA.version);
    const command=calculation.command,commandId=`${runId}:c${String(decision).padStart(3,'0')}`,proposedAt=new Date().toISOString(),check=await this.position();
    const receipt:ActionReceipt={proposedAt,status:'wait',scrollBefore:check.scroll,scrollAfter:check.scroll,urlBefore:check.url,urlAfter:check.url,cursor:{...this.cursor},viewport:before.native.station!.viewport,trustedEvents:0,reason:command.reason};
    const event=this.journal.event(runId,{source:'neural',kind:command.kind,status:'queued',page:this.encounter!.label,summary:`Proposed ${command.kind==='scroll'?`${command.wheelY} px wheel input`:'wait'} from recorded motor outputs.`,commandId,decision,modelStep:calculation.modelEndStep,inputFrame:`${runId}/${before.name}`,reason:command.reason,parameters:{wheelY:command.wheelY}});
    if(Date.now()-Date.parse(before.at)>P.inputMaximumAgeMs||check.url!==position.url||!check.visible||this.displayError){receipt.status='stale-input';receipt.reason='Source frame is stale or no longer the visible page';this.counters.policyBlocked++;}
    else if(!approvedPage(check.url)||check.form){receipt.status='policy-blocked';receipt.reason='The fixed cursor is over a form control or the page route is unapproved';this.counters.policyBlocked++;}
    else{
     receipt.acceptedAt=new Date().toISOString();if(command.kind==='scroll'){
      this.counters.attempted++;this.commandId=commandId;this.journal.finish(event,{status:'executing',startedAt:receipt.acceptedAt});receipt.dispatchedAt=new Date().toISOString();await page.mouse.wheel(0,command.wheelY);await delay(180,undefined,{signal:o.signal});const result=await this.position();this.commandId=null;receipt.acknowledgedAt=new Date().toISOString();receipt.scrollAfter=result.scroll;receipt.urlAfter=result.url;receipt.trustedEvents=this.events.filter(e=>e.commandId===commandId&&e.type==='wheel'&&e.trusted).length;
      const delta=receipt.scrollAfter-receipt.scrollBefore;if(receipt.trustedEvents!==1||Math.abs(delta)>Math.abs(command.wheelY)+1||delta*command.wheelY<0||receipt.urlAfter!==receipt.urlBefore){receipt.status='failed';receipt.reason='Observed browser effect did not match the accepted wheel input';this.counters.failed++;}
      else if(delta===0){receipt.status='boundary';receipt.reason='Trusted wheel acknowledged; the scroll container did not move';this.counters.boundary++;}
      else{receipt.status='moved';receipt.reason=`Observed ${Math.abs(delta)} px ${delta>0?'down':'up'} in the ${result.container.toLowerCase()} scroll container`;this.counters.moved++;}
     }
    }
    const after=await this.capture();receipt.observedAt=after.at;this.unchanged=receipt.status==='moved'?0:this.unchanged+1;this.encounterDecisions++;
    const d:ExhibitDecision={sensoryProfile:OBSERVATION_RETINA.version,page:{id:this.encounter!.id,label:this.encounter!.label,url:this.encounter!.url},receipt,context:{sourceRevision:ORIGIN.sourceRevision,sourceDirty:ORIGIN.sourceDirty,configSha256:record.configSha256,dataVersion:ORIGIN.dataVersion,intervention:o.intervention,episode:o.episode,seed:o.seed,layout:o.layout},sessionId:o.sessionId,runId,commandId,decision,imageBefore:before.name,imageAfter:after.name,imageSha256:sha256(before.png),afterSha256:sha256(after.png),capturedAt:before.at,completedAt:after.at,...calculation,desktopBefore:before.native,desktopAfter:after.native,executed:{startedAt:receipt.dispatchedAt??proposedAt,completedAt:after.at,from:{...this.cursor},to:{...this.cursor},events:this.events.filter(e=>e.commandId===commandId),nativeInput:{version:'windows-view-v2',coordinateScale:1,wheelScale:1,wheelEventScale:1,scrollBefore:receipt.scrollBefore,scrollAfter:receipt.scrollAfter}}};decisions.push(d);writeFileSync(join(this.directory,`decision-${decision}.json.gz`),gzipSync(JSON.stringify(d)));
    if(this.encounter!.decision===undefined){this.encounter!.decision=decision;this.encounter!.runId=runId;this.encounter!.thumbnail=`${runId}/${before.name}`;}
    this.journal.finish(event,{status:receipt.status==='failed'?'failed':['policy-blocked','stale-input','boundary'].includes(receipt.status)?'blocked':'completed',summary:receipt.reason,reason:receipt.reason,completedAt:after.at,result:{trustedInputs:receipt.trustedEvents,scrollBefore:receipt.scrollBefore,scrollAfter:receipt.scrollAfter}});this.journal.decision(Date.parse(receipt.dispatchedAt??proposedAt),Date.parse(after.at),Date.parse(before.at),6,!!receipt.dispatchedAt,receipt.status==='moved');
    this.emit({state:'executed',desktop:after.native,browserFrame:`${runId}/${after.name}`,receipt,command,motor:calculation.motor,commandId,history:[...this.live.history,{commandId,runId,decision,modelStep:d.modelEndStep,kind:command.kind,detail:receipt.reason,timestamp:after.at}].slice(-60),notice:receipt.reason},receipt.reason,'previous-decision');
    if(receipt.status==='failed'||receipt.status==='stale-input')throw new Error(receipt.reason);
   }
   record.outcome='observed';record.stages!.execution='completed';this.checkpoint=controller.engine.checkpoint();
  }catch(e){record.error=(e as Error).message;this.counters.failed++;this.operation('recovery',record.error,'failed');this.emit({state:'recovering',notice:record.error},'External capture interrupted; supervisor recovery.','not-sampling');await this.close();this.checkpoint=controller.engine.checkpoint();}
  finally{this.commandId=null;await this.stopDisplay();this.journal.cancelRun(runId,record.error??'Recording segment ended');}
  record.completedAt=new Date().toISOString();record.decisions=decisions.map(({samples,...d})=>d);record.observationEvents=this.journal.runEvents(runId);record.displayFrames=this.displayFrames;writeFileSync(join(this.directory,'trace.json.gz'),gzipSync(JSON.stringify(decisions)));writeFileSync(join(this.directory,'pending-record.json'),JSON.stringify(record,null,2)+'\n');return {record,directory:this.directory};
 }
}
