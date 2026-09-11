import { chromium,type Browser,type BrowserContext,type Video } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdirSync,writeFileSync,readdirSync,statSync,copyFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Circuit } from '../../shared/types';
import type { ExhibitRecord,ExhibitDecision,ExhibitLive,ExecutedEvent } from '../../shared/exhibit';
import type { BrowserIntervention } from '../browser/config';
import { artifactManifest,sha256 } from '../browser/evidence';
import { executionOrigin } from '../provenance';
import { MODEL_CONFIG } from '../model/config';
import { EXHIBIT_CONFIG as C,type TaskLayout } from './config';
import { ExhibitController } from './controller';
import { exhibitTask } from './task';
import { DesktopSession } from './desktop';
import { RemoteDesktopSession } from './remote-desktop';
import {prepareStationTabs,STATION_SCHEDULE} from './station-tabs';
import {runObservationEpisode} from './observation-runner';
import type {ObservationJournal} from './journal';
const ORIGIN=executionOrigin('exhibit-process');
export interface EpisodeOptions {root:string;sessionId:string;episode:number;seed:number;layout:TaskLayout;intervention:BrowserIntervention;fast?:boolean;signal?:AbortSignal;faultAfter?:number;journal?:ObservationJournal;onUpdate?:(state:ExhibitLive)=>void}
export async function runEpisode(circuit:Circuit,o:EpisodeOptions){
  if(process.env.EXHIBIT_DESKTOP==='windows'&&process.env.EXHIBIT_OBSERVATION_PROFILE==='1')return runObservationEpisode(circuit,o);
  const startedAt=new Date().toISOString(),runId=`exhibit_${Date.now()}_${randomUUID().slice(0,8)}`,directory=resolve(o.root,runId);
  mkdirSync(directory,{recursive:true});
  const decisions:ExhibitDecision[]=[],events:ExecutedEvent[]=[],origin={...ORIGIN,runId};
  let currentCommandId:string|null=null,browser:Browser|undefined,context:BrowserContext|undefined,video:Video|null=null,desktop:DesktopSession|RemoteDesktopSession|undefined;
  const record:ExhibitRecord={schemaVersion:1,kind:'continuous-browser-episode',recorder:'Specimen Recorder',id:runId,sessionId:o.sessionId,origin,
    config:C,configSha256:sha256(JSON.stringify(C)),model:MODEL_CONFIG,execution:{paced:!o.fast,minimumWindowWallMs:o.fast?0:C.windowWallMs,nodeVersion:process.version,faultAfterWindow:o.faultAfter},startedAt,completedAt:'',seed:o.seed,layout:o.layout,intervention:o.intervention,browserVersion:'',
    coverage:{neuronIds:circuit.nodes.map(n=>n.id),edges:circuit.edges.length,synapses:circuit.edges.reduce((s,e)=>s+e.weight,0)},
    setup:{note:'Supervisor: new isolated browser, local task placement and navigation, cursor at (320,216), zero neural state. Fixed 48-window budget. Evaluator excluded from controller.',events:[]},decisions:[],evaluator:{navigated:false,activated:false,activationCount:0},outcome:'error',artifacts:[]};
  let live:ExhibitLive={sessionId:o.sessionId,runId,packetSeq:0,timestamp:startedAt,state:'starting',episode:o.episode,decision:0,intervention:o.intervention,layout:o.layout,seed:o.seed,
    sourceRevision:origin.sourceRevision,sourceDirty:origin.sourceDirty,configSha256:record.configSha256,dataVersion:origin.dataVersion,
    inputFrame:null,browserFrame:null,capturedAt:null,snapshot:null,input:null,motor:null,command:null,commandId:null,history:[],notice:'Supervisor opens a new bounded episode.',metrics:{episodes:0,failures:0,rssMB:0,windowWallMs:C.windowWallMs,modelSecondsPerWindow:6}};
  const emit=(patch:Partial<ExhibitLive>)=>{live={...live,...patch,timestamp:new Date().toISOString()};o.onUpdate?.(live);};emit({});
  const fixture=createServer((req,res)=>{if(!['/','/ledger'].includes(req.url||'')){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(exhibitTask(o.seed,req.url==='/ledger'?1:0,o.layout));});
  await new Promise<void>(r=>fixture.listen(0,'127.0.0.1',r));
  const port=(fixture.address() as {port:number}).port;
  try{
    if(!o.fast&&process.env.EXHIBIT_DESKTOP!=='0'){desktop=process.env.EXHIBIT_DESKTOP==='windows'?await RemoteDesktopSession.open():await DesktopSession.open();browser=desktop.browser;}
    else browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
    record.browserVersion=browser.version();
    context=await browser.newContext({viewport:{width:C.width,height:C.height},deviceScaleFactor:1,acceptDownloads:false,serviceWorkers:'block',recordVideo:{dir:directory,size:{width:C.width,height:C.height}}});
    context.setDefaultTimeout(5000);
    const stationEnabled=desktop instanceof RemoteDesktopSession;
    if(stationEnabled)await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      const allowed=url.origin===`http://127.0.0.1:${port}`||url.origin==='http://127.0.0.1:4317'||url.protocol==='https:'&&(url.hostname==='elifesciences.org'||url.hostname.endsWith('.elifesciences.org'));
      if(!allowed||!['GET','HEAD'].includes(request.method())){await route.abort('blockedbyclient');return;}await route.continue();
    });
    // Forward only the local fixture through the established backend. The
    // desktop may be in WSL; no public listener or privileged task input is used.
    if(desktop)await context.route(`http://127.0.0.1:${port}/**`,async route=>{
      const response=await fetch(route.request().url());
      await route.fulfill({status:response.status,contentType:'text/html; charset=utf-8',body:await response.text()});
    });
    await context.exposeBinding('__recordEvent',(_,event)=>{events.push({...event,commandId:currentCommandId});});
    await context.addInitScript(()=>{
      for(const type of ['mousemove','mousedown','mouseup','click','wheel'])addEventListener(type,e=>{
        const m=e as MouseEvent,w=e as WheelEvent;
        void (window as any).__recordEvent({type,timestamp:new Date().toISOString(),pageTimeMs:performance.now(),url:location.pathname,x:m.clientX,y:m.clientY,deltaY:type==='wheel'?w.deltaY:undefined,trusted:e.isTrusted});
      },true);
    });
    const station=desktop instanceof RemoteDesktopSession?await prepareStationTabs(context,record,{width:640*desktop.info.scale,height:360*desktop.info.scale}):undefined;
    const page=await context.newPage();video=page.video();
    if(desktop){for(const c of browser.contexts())if(c!==context)for(const p of c.pages())await p.close();await desktop.arrange(page);}
    page.on('framenavigated',frame=>{if(frame===page.mainFrame())events.push({type:'navigation',timestamp:new Date().toISOString(),pageTimeMs:0,url:new URL(frame.url()).pathname,commandId:currentCommandId});});
    const inputScale=desktop instanceof RemoteDesktopSession?desktop.info.scale:1;
    const screenshot=()=>desktop instanceof RemoteDesktopSession?desktop.screenshot(page):page.screenshot({animations:'disabled'});
    await page.goto(`http://127.0.0.1:${port}/`);await page.mouse.move(C.cursor.x*inputScale,C.cursor.y*inputScale);await delay(60);record.setup.events=events.slice();
    if(station)await station.focus(page,'seeded-task');
    const controller=new ExhibitController(circuit,runId,startedAt,o.intervention);let cursor={...C.cursor},png=await screenshot(),capturedAt=new Date().toISOString();
    writeFileSync(join(directory,'frame-000.png'),png);
    let presentation=await desktop?.capture(directory,0,'frame-000.png',capturedAt,cursor);
    for(let decision=0;decision<C.decisions;decision++){
      o.signal?.throwIfAborted();
      if(o.faultAfter===decision)await browser.close(); // Explicit operator fault injection for recovery validation only.
      const imageBefore=`frame-${String(decision).padStart(3,'0')}.png`,windowStart=performance.now();
      const calculation=await controller.observe(png,decision,async(snapshot,input)=>{
        o.signal?.throwIfAborted();
        if(!o.fast)await delay(Math.max(0,windowStart+(snapshot.seq-decision*C.modelSteps)/C.modelSteps*C.windowWallMs-performance.now()),undefined,{signal:o.signal});
        emit({state:'integrating',decision,inputFrame:`${runId}/${imageBefore}`,browserFrame:`${runId}/${imageBefore}`,desktop:presentation??null,capturedAt,snapshot,input,motor:null,command:null,commandId:null,notice:'Captured pixels held constant for six model seconds. 2× model time; display interpolates only received states.'});
      });
      const commandId=`${runId}:c${String(decision).padStart(3,'0')}`;currentCommandId=commandId;
      const from={...cursor},actionStarted=new Date().toISOString(),command=calculation.command;
      const nativeInput:ExhibitDecision['executed']['nativeInput']=desktop instanceof RemoteDesktopSession?{version:'windows-view-v2',coordinateScale:inputScale,wheelScale:1,wheelEventScale:1/inputScale}:undefined;
      if(nativeInput&&command.kind==='scroll')nativeInput.scrollBefore=await page.evaluate(()=>scrollY);
      if(command.kind==='move'){cursor={x:Math.max(10,Math.min(C.width-10,cursor.x+command.dx)),y:cursor.y};await page.mouse.move(cursor.x*inputScale,cursor.y*inputScale);}
      // Chromium's emulated view scales pointer coordinates and DOM wheel
      // events, but compositor scroll distance stays in the original DIP.
      if(command.kind==='scroll')await page.mouse.wheel(0,command.wheelY);
      if(command.kind==='click'){await page.mouse.down();await page.mouse.up();}
      // Passive settling for the real input event/navigation before recapture; no locator or scrolling helper.
      await delay(100,undefined,{signal:o.signal});await page.waitForLoadState('load');
      const actionCompleted=new Date().toISOString(),after=await screenshot(),afterCaptured=new Date().toISOString(),imageAfter=`frame-${String(decision+1).padStart(3,'0')}.png`;
      if(nativeInput&&command.kind==='scroll')nativeInput.scrollAfter=await page.evaluate(()=>scrollY);
      let mappingError=false;
      if(desktop instanceof RemoteDesktopSession){
        for(const event of events.filter(e=>e.commandId===commandId&&['mousemove','mousedown','mouseup','click','wheel'].includes(e.type))){
          if(!event.trusted||event.x!==cursor.x||event.y!==cursor.y||event.type==='wheel'&&Math.abs(event.deltaY!-command.wheelY/inputScale)>.01)mappingError=true;
        }
        if(nativeInput?.scrollBefore!==undefined&&nativeInput.scrollAfter!==undefined){const delta=nativeInput.scrollAfter-nativeInput.scrollBefore;if(Math.abs(delta)>Math.abs(command.wheelY)+1||delta*command.wheelY<0)mappingError=true;}
      }
      writeFileSync(join(directory,imageAfter),after);
      const desktopAfter=await desktop?.capture(directory,decision+1,imageAfter,afterCaptured,cursor);
      const d:ExhibitDecision={context:{sourceRevision:origin.sourceRevision,sourceDirty:origin.sourceDirty,configSha256:record.configSha256,dataVersion:origin.dataVersion,intervention:o.intervention,episode:o.episode,seed:o.seed,layout:o.layout},sessionId:o.sessionId,runId,commandId,decision,imageBefore,imageAfter,imageSha256:sha256(png),afterSha256:sha256(after),capturedAt,completedAt:afterCaptured,...calculation,
        desktopBefore:presentation,desktopAfter,
        executed:{startedAt:actionStarted,completedAt:actionCompleted,from,to:{...cursor},events:events.filter(e=>e.commandId===commandId),...(nativeInput?{nativeInput}:{})}};
      decisions.push(d);writeFileSync(join(directory,`decision-${decision}.json.gz`),gzipSync(JSON.stringify(d)));
      if(mappingError)throw new Error('Native presentation/input mapping changed; saved actual events disagree with the decoded command');
      png=after;capturedAt=afterCaptured;presentation=desktopAfter;
      emit({state:'executed',browserFrame:`${runId}/${imageAfter}`,desktop:presentation??null,motor:d.motor,command:d.command,commandId,history:[...live.history,{commandId,runId,decision,modelStep:d.modelEndStep,kind:command.kind,detail:`${command.dx||command.wheelY||0} px · ${d.executed.events.map(e=>e.type).join(' → ')||'gate closed'}`,timestamp:actionCompleted}].slice(-24),notice:command.reason});
    }
    // Evaluator runs after the fixed budget, and never feeds the encoder/decoder.
    record.evaluator={...await page.evaluate(()=>(window as any).__outcome),navigated:events.some(e=>e.type==='navigation'&&e.url==='/ledger'&&e.commandId!==null)};
    record.outcome=record.evaluator.activated?'activated':record.evaluator.navigated?'navigated-only':'not-activated';
    if(station&&desktop){
      currentCommandId=null;await station.focus(station.dashboard,'dashboard');
      if(desktop instanceof RemoteDesktopSession)await desktop.present(station.dashboard);
      // More dashboard time than a typical 48-window excursion. No neural
      // integration or input executes during the explicitly idle dwell.
      const until=Date.now()+STATION_SCHEDULE.dashboardSeconds*1000;let frame=C.decisions+1;
      while(Date.now()<until){
        o.signal?.throwIfAborted();const image=`frame-${String(frame).padStart(3,'0')}.png`,bytes=desktop instanceof RemoteDesktopSession?await desktop.screenshot(station.dashboard):await station.dashboard.screenshot(),at=new Date().toISOString();
        writeFileSync(join(directory,image),bytes);const capture=await desktop.capture(directory,frame++,image,at,{x:0,y:0});capture.cursorSource='not-present';
        emit({state:'idle',browserFrame:`${runId}/${image}`,desktop:capture,command:null,commandId:null,notice:'Supervisor returned to the live dashboard. Neural state is held between excursions; tab focus is orchestration.'});
        await delay(2000,undefined,{signal:o.signal});
      }
      station.note('dwell-complete','dashboard',`${STATION_SCHEDULE.dashboardSeconds} wall seconds; model state preserved without integration.`);
    }
  }catch(e){record.error=(e as Error).message;record.outcome='error';}
  finally{
    try{await context?.close();}catch{/* Browser may have been closed by the explicit fault test. */}
    try{await video?.saveAs(join(directory,'browser.webm'));await video?.delete();}catch(e){
      // A killed browser invalidates its RPC connection, but local Playwright
      // may already have finalized its original recording during close.
      const finalized=readdirSync(directory).filter(n=>n.endsWith('.webm')&&n!=='browser.webm').map(n=>join(directory,n)).find(p=>statSync(p).size>0);
      if(finalized)copyFileSync(finalized,join(directory,'browser.webm'));
      else{record.error=[record.error,`Video: ${(e as Error).message}`].filter(Boolean).join('; ');record.outcome='error';}
    }
    await browser?.close().catch(()=>{});await desktop?.close();await new Promise<void>(r=>fixture.close(()=>r()));
  }
  writeFileSync(join(directory,'trace.json.gz'),gzipSync(JSON.stringify(decisions)));
  record.completedAt=new Date().toISOString();record.decisions=decisions.map(({samples,...d})=>d);record.artifacts=artifactManifest(directory);
  writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');
  emit({state:record.outcome==='error'?'recovering':'complete',outcome:record.outcome,notice:record.error||`Episode complete: ${record.outcome}. Supervisor will reset after the fixed budget.`});
  return {record,directory};
}
