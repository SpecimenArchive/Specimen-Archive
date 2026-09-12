import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {gzipSync} from 'node:zlib';import {randomUUID} from 'node:crypto';import {setTimeout as delay} from 'node:timers/promises';import {PNG} from 'pngjs';import {windowsPageAgreement} from './windows-geometry';
import type {BrowserContext,Page,Video} from '@playwright/test';import type {Circuit} from '../../shared/types';import type {ExhibitLive,ExhibitRecord,ExhibitDecision,ExecutedEvent,DesktopCapture} from '../../shared/exhibit';import type {ObservationPage,ObservationEvent} from '../../shared/observation';
import {executionOrigin} from '../provenance';import {artifactManifest,sha256} from '../browser/evidence';import {MODEL_CONFIG} from '../model/config';import {EXHIBIT_CONFIG as C} from './config';import {ExhibitController} from './controller';import {OBSERVATION_RETINA} from './observation-encoder';import {RemoteDesktopSession} from './remote-desktop';import {ObservationJournal} from './journal';import type {EpisodeOptions} from './runner';
export const OBSERVATION_SCHEDULE=Object.freeze([
 {decision:0,page:'dashboard'},{decision:16,page:'reference'},{decision:21,page:'dashboard'},{decision:36,page:'worksheet'},{decision:41,page:'dashboard'}
]);
export const OBSERVATION_PAGES:ObservationPage[]=[{id:'dashboard',label:'Observation dashboard',url:'http://127.0.0.1:4317/?display=workstation'},{id:'reference',label:'Published connectome',url:'https://elifesciences.org/articles/97964'},{id:'worksheet',label:'Methods & worksheet',url:'http://127.0.0.1:4317/docs/WORKSHEET.html'}];
const ORIGIN=executionOrigin('observation-process');
export async function runObservationEpisode(circuit:Circuit,o:EpisodeOptions){
 const startedAt=new Date().toISOString(),runId=`exhibit_${Date.now()}_${randomUUID().slice(0,8)}`,directory=resolve(o.root,runId);mkdirSync(directory,{recursive:true});
 const journal=o.journal??new ObservationJournal(o.sessionId),origin={...ORIGIN,runId},decisions:ExhibitDecision[]=[],events:ExecutedEvent[]=[],pages=new Map<string,Page>(),videos=new Map<string,Video>();
 let desktop:RemoteDesktopSession|undefined,context:BrowserContext|undefined,active=OBSERVATION_PAGES[0],currentCommandId:string|null=null,frameIndex=0;
 const record:ExhibitRecord={schemaVersion:1,kind:'continuous-browser-episode',recorder:'Specimen Recorder',id:runId,sessionId:o.sessionId,origin,config:C,configSha256:sha256(JSON.stringify(C)),model:MODEL_CONFIG,startedAt,completedAt:'',seed:o.seed,layout:o.layout,intervention:o.intervention,browserVersion:'',execution:{paced:true,minimumWindowWallMs:C.windowWallMs,nodeVersion:process.version},coverage:{neuronIds:circuit.nodes.map(n=>n.id),edges:circuit.edges.length,synapses:circuit.edges.reduce((s,e)=>s+e.weight,0)},setup:{note:'Observation contrast profile: 48 paced windows in the unchanged rate circuit. Pixel texture in two documented bands drives PRCs; the existing motor decoder selects wheel direction. Approved tab preparation/focus, native pinning and native pointer centering are orchestration. Main dashboard receives 38/48 windows. No DOM target or scroll offset reaches the controller.',events:[]},decisions:[],evaluator:{navigated:false,activated:false,activationCount:0},outcome:'error',artifacts:[],observationConfig:{retina:OBSERVATION_RETINA,schedule:OBSERVATION_SCHEDULE}};
 let live:ExhibitLive={sessionId:o.sessionId,runId,packetSeq:0,timestamp:startedAt,state:'starting',episode:o.episode,decision:0,intervention:o.intervention,layout:o.layout,seed:o.seed,sourceRevision:origin.sourceRevision,sourceDirty:origin.sourceDirty,configSha256:record.configSha256,dataVersion:origin.dataVersion,inputFrame:null,browserFrame:null,capturedAt:null,snapshot:null,input:null,motor:null,command:null,commandId:null,history:[],notice:'Preparing the observation desktop.',metrics:{episodes:0,failures:0,rssMB:0,windowWallMs:C.windowWallMs,modelSecondsPerWindow:6}};
 const emit=(patch:Partial<ExhibitLive>,operation=live.notice,sensory:'current'|'previous-decision'|'not-sampling'='not-sampling')=>{live={...live,...patch,timestamp:new Date().toISOString(),observation:journal.state(active,operation,sensory)};o.onUpdate?.(live);};
 const orchestration=(kind:string,summary:string,status:ObservationEvent['status']='completed')=>journal.event(runId,{source:'orchestration',kind,status,page:active.label,summary,completedAt:status==='completed'?new Date().toISOString():undefined});
 const queued=OBSERVATION_SCHEDULE.slice(1).map(s=>journal.event(runId,{source:'orchestration',kind:'visit',status:'queued',page:OBSERVATION_PAGES.find(p=>p.id===s.page)!.label,summary:`After ${s.decision} completed decisions, visit ${OBSERVATION_PAGES.find(p=>p.id===s.page)!.label}.`,parameters:{destination:s.page},decision:s.decision}));
 async function capture(page:Page){
  if(!await page.evaluate(()=>document.visibilityState==='visible'))throw new Error('Sensory page is no longer the visible Chrome tab; input stopped.');
  const png=await desktop!.screenshot(page),at=new Date().toISOString(),name=`frame-${String(frameIndex).padStart(4,'0')}.png`;writeFileSync(join(directory,name),png);
  const native=await desktop!.capture(directory,frameIndex++,name,at,{x:0,y:0});native.cursorSource='not-present';
  const agreement=windowsPageAgreement(PNG.sync.read(readFileSync(join(directory,native.path))),PNG.sync.read(png),native.station!.viewport);
  if(agreement<.92)throw new Error(`Visible Windows page differs from the sensory PNG (${(agreement*100).toFixed(1)}% agreement). Input stopped; check an OS overlay or changed page geometry.`);
  journal.capture();return {png,at,name,native};
 }
 emit({});
 try{
  desktop=await RemoteDesktopSession.open();record.browserVersion=desktop.browser.version();
  context=await desktop.browser.newContext({viewport:{width:640,height:360},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block',recordVideo:{dir:directory,size:{width:1280,height:720}}});context.setDefaultTimeout(8000);
  await context.route('**/*',async route=>{const request=route.request(),url=new URL(request.url()),allowed=url.origin==='http://127.0.0.1:4317'||url.protocol==='https:'&&(url.hostname==='elifesciences.org'||url.hostname.endsWith('.elifesciences.org'));if(!allowed||!['GET','HEAD'].includes(request.method())){await route.abort('blockedbyclient');return;}await route.continue();});
  await context.exposeBinding('__recordEvent',({page},event)=>{if(currentCommandId&&page===pages.get(active.id))events.push({...event,commandId:currentCommandId});});
  await context.addInitScript(()=>{for(const type of ['wheel','mousedown','mouseup','click','mousemove'])addEventListener(type,e=>{const m=e as MouseEvent,w=e as WheelEvent;void (window as any).__recordEvent({type,timestamp:new Date().toISOString(),pageTimeMs:performance.now(),url:location.pathname,x:m.clientX,y:m.clientY,deltaY:type==='wheel'?w.deltaY:undefined,trusted:e.isTrusted});},true);});
  const main=await context.newPage();pages.set('dashboard',main);if(main.video())videos.set('dashboard',main.video()!);
  for(const c of desktop.browser.contexts())if(c!==context)for(const p of c.pages())await p.close();
  await desktop.arrange(main);await main.setViewportSize(desktop.pageSize);await desktop.present(main);await main.goto(active.url,{waitUntil:'domcontentloaded'});await desktop.present(main);
  await desktop.pinDashboard();orchestration('pin','Verified the native Chrome dashboard tab is pinned.');
  for(const spec of OBSERVATION_PAGES.slice(1)){const page=await context.newPage();await page.setViewportSize(desktop.pageSize);try{await page.goto(spec.url,{waitUntil:'domcontentloaded',timeout:15000});pages.set(spec.id,page);if(page.video())videos.set(spec.id,page.video()!);orchestration('prepare',`Prepared ${spec.label}; no neural action was attributed to setup.`);}catch{orchestration('prepare',`${spec.label} could not load; its visit will be skipped.`,'failed');await page.close();}}
  await main.bringToFront();await desktop.present(main);await main.mouse.move(desktop.pageSize.width/2,desktop.pageSize.height/2);orchestration('pointer','Centered the native Windows pointer during page presentation to clear tab hover cards.');record.setup.events=events.slice();
  const controller=new ExhibitController(circuit,runId,startedAt,o.intervention);
  for(let decision=0;decision<C.decisions;decision++){
   o.signal?.throwIfAborted();if(o.faultAfter===decision)await desktop.browser.close();
   const switchTo=OBSERVATION_SCHEDULE.find(s=>s.decision===decision&&decision>0);
   if(switchTo){const job=queued.find(q=>q.decision===decision)!,next=OBSERVATION_PAGES.find(p=>p.id===switchTo.page)!;
    journal.finish(job,{status:'executing',startedAt:new Date().toISOString()});emit({state:'idle',inputFrame:null,input:null,command:null,commandId:null,notice:`Orchestration: changing to ${next.label}.`},`Changing to ${next.label}`);
    if(pages.has(next.id)){active=next;const page=pages.get(active.id)!;await page.bringToFront();await desktop.present(page);await page.mouse.move(desktop.pageSize.width/2,desktop.pageSize.height/2);journal.finish(job,{status:'completed',completedAt:new Date().toISOString(),summary:`Returned to ${next.label}. Model state retained; tab focus is orchestration.`});}
    else journal.finish(job,{status:'blocked',completedAt:new Date().toISOString(),reason:'Approved page unavailable; current page retained.'});
   }
   const page=pages.get(active.id)!,before=await capture(page),windowStart=performance.now();
   const calculation=await controller.observe(before.png,decision,async(snapshot,input)=>{
    o.signal?.throwIfAborted();await delay(Math.max(0,windowStart+(snapshot.seq-decision*C.modelSteps)/C.modelSteps*C.windowWallMs-performance.now()),undefined,{signal:o.signal});
    emit({state:'integrating',decision,inputFrame:`${runId}/${before.name}`,browserFrame:`${runId}/${before.name}`,desktop:before.native,capturedAt:before.at,snapshot,input,motor:null,command:null,commandId:null,notice:`Integrating the visible ${active.label.toLowerCase()}; six model seconds per decision.`},`Sensing ${active.label.toLowerCase()}`,'current');
   },OBSERVATION_RETINA.version);
   const command=calculation.command,commandId=`${runId}:c${String(decision).padStart(3,'0')}`,actionStarted=new Date().toISOString();
   const accepted=journal.event(runId,{source:'neural',kind:command.kind,status:'queued',page:active.label,summary:command.kind==='wait'?'Wait for the next sensory sample.':`Accepted ${command.wheelY} px wheel command.`,reason:command.reason,commandId,decision,modelStep:calculation.modelEndStep,inputFrame:`${runId}/${before.name}`,parameters:{wheelY:command.wheelY}});
   emit({state:'executed',motor:calculation.motor,command,commandId},'Executing the accepted neural decision','current');
   if(!await page.evaluate(()=>document.visibilityState==='visible'))throw new Error('Visible tab changed before execution; accepted command cancelled.');
   currentCommandId=commandId;journal.finish(accepted,{status:'executing',startedAt:actionStarted});
   const scrollBefore=await page.evaluate(()=>scrollY);if(command.kind==='scroll')await page.mouse.wheel(0,command.wheelY);
   await delay(140,undefined,{signal:o.signal});const scrollAfter=await page.evaluate(()=>scrollY),actionCompleted=new Date().toISOString(),actual=events.filter(e=>e.commandId===commandId);currentCommandId=null;
   const after=await capture(page),changed=scrollAfter!==scrollBefore,attempted=command.kind!=='wait',mappingError=actual.some(e=>!e.trusted||e.type==='wheel'&&Math.abs(e.deltaY!-command.wheelY)>.01)||Math.abs(scrollAfter-scrollBefore)>Math.abs(command.wheelY)+1||(scrollAfter-scrollBefore)*command.wheelY<0||command.kind==='scroll'&&!actual.some(e=>e.type==='wheel');
   const d:ExhibitDecision={sensoryProfile:OBSERVATION_RETINA.version,page:active,context:{sourceRevision:origin.sourceRevision,sourceDirty:origin.sourceDirty,configSha256:record.configSha256,dataVersion:origin.dataVersion,intervention:o.intervention,episode:o.episode,seed:o.seed,layout:o.layout},sessionId:o.sessionId,runId,commandId,decision,imageBefore:before.name,imageAfter:after.name,imageSha256:sha256(before.png),afterSha256:sha256(after.png),capturedAt:before.at,completedAt:after.at,...calculation,desktopBefore:before.native,desktopAfter:after.native,executed:{startedAt:actionStarted,completedAt:actionCompleted,from:{x:0,y:0},to:{x:0,y:0},events:actual,nativeInput:{version:'windows-view-v2',coordinateScale:1,wheelScale:1,wheelEventScale:1,scrollBefore,scrollAfter}}};
   decisions.push(d);writeFileSync(join(directory,`decision-${decision}.json.gz`),gzipSync(JSON.stringify(d)));
   journal.finish(accepted,{status:mappingError?'failed':attempted&&!changed?'blocked':'completed',startedAt:actionStarted,completedAt:actionCompleted,reason:mappingError?'Actual input mapping disagreed with the decoded command.':command.kind==='wait'?command.reason:!changed?'The page is at its scroll boundary.':command.reason,result:{trustedInputs:actual.filter(e=>e.trusted).length,scrollBefore,scrollAfter}});
   journal.decision(Date.parse(actionStarted),Date.parse(actionCompleted),Date.parse(before.at),6,attempted,attempted&&changed&&!mappingError);
   if(mappingError)throw new Error('Native observation input mapping failed; actual event and frames were retained.');
   emit({state:'executed',browserFrame:`${runId}/${after.name}`,desktop:after.native,motor:d.motor,command,commandId,history:[...live.history,{commandId,runId,decision,modelStep:d.modelEndStep,kind:command.kind,detail:`${command.wheelY} px · ${changed?'page scrolled':command.kind==='wait'?'motor gate closed':'scroll boundary'}`,timestamp:actionCompleted}].slice(-60),notice:command.reason},`Observed ${command.kind==='wait'?'a neural wait':changed?'page scrolling':'a scroll boundary'} on ${active.label.toLowerCase()}`,'previous-decision');
  }
  record.outcome='observed';record.stages={execution:'completed',recording:'unavailable'};
 }catch(error){record.error=(error as Error).message;record.outcome='error';record.stages={execution:'failed',recording:'unavailable'};orchestration('recovery',record.error,'failed');emit({state:'recovering',inputFrame:null,input:null,command:null,commandId:null,notice:record.error},record.error);}
 finally{
  journal.cancelRun(runId,record.error??'Episode ended before queued maintenance.');currentCommandId=null;
  const bounded=async<T>(work:Promise<T>,label:string)=>{let timer:ReturnType<typeof setTimeout>;try{return await Promise.race([work,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out after browser disconnection`)),15000);})]);}finally{clearTimeout(timer!);}};
  try{await bounded(Promise.resolve(context?.close()),'Recording context close');}catch(error){record.stages!.recording='failed';record.stages!.recordingError=(error as Error).message;}
  try{for(const [id,video] of videos){await bounded(video.saveAs(join(directory,id==='dashboard'?'browser.webm':`${id}.webm`)),'Recording save');await bounded(video.delete(),'Recording cleanup');}if(videos.size&&record.stages!.recording!=='failed')record.stages!.recording='saved';}
  catch(error){record.stages!.recording='failed';record.stages!.recordingError=(error as Error).message;}
  await desktop?.close();
 }
 record.observationEvents=journal.runEvents(runId);record.completedAt=new Date().toISOString();record.decisions=decisions.map(({samples,...d})=>d);
 writeFileSync(join(directory,'trace.json.gz'),gzipSync(JSON.stringify(decisions)));record.artifacts=artifactManifest(directory);writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');
 emit({state:record.outcome==='error'?'recovering':'complete',inputFrame:null,input:null,command:null,commandId:null,notice:record.error??'Observation episode recorded; supervised renewal follows.'},record.error??'Finalising the observation record');return {record,directory};
}
