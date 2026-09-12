import { createServer } from 'node:http';
import { readFileSync, existsSync,unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import type { Circuit } from '../shared/types';
import { Engine } from './model/engine';
import { MODEL_CONFIG as C } from './model/config';
import { Storage } from './storage';
import { Experiment, EXPERIMENT_CONFIG } from './experiment';
import { ExperimentStore } from './experiment-store';
import { SpecimenRecorder, GitHubCLI } from './recorder';
import { executionOrigin } from './provenance';
import { replayExperiment } from './replay';
import { BrowserService } from './browser/service';
import { ExhibitService } from './exhibit/service';
import { serveVideo } from './media';
import { observerOrigins } from './observer-origins';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const production=process.argv.includes('--production');
const browserEnabled=process.argv.includes('--browser-demo');
const exhibitEnabled=!browserEnabled&&!process.argv.includes('--light-demo');
const port=Number(process.env.PORT||4317);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be an integer from 1024 to 65535');
const allowedObservers=observerOrigins(port,process.env.EXHIBIT_OBSERVER_ORIGINS);
const allowedHosts=new Set([...allowedObservers].map(o=>new URL(o).host));
const canonicalHost=process.env.EXHIBIT_PUBLIC_HOST;
if(canonicalHost&&!allowedHosts.has(canonicalHost))throw new Error('Public hostname needs an exact observer origin');
const circuit=JSON.parse(readFileSync(resolve(ROOT,'data/processed/circuit.json'),'utf8')) as Circuit;
const engine=new Engine(circuit);
let runId=`s01_${Date.now()}_${randomUUID().slice(0,8)}`,startedAt=new Date().toISOString(),seq=0;
let store=new Storage(process.env.RUNTIME_DIR||resolve(ROOT,'runtime'),runId,startedAt);store.markInterrupted();const recoveredTrial=store.restore(engine);store.prune();
const executedOrigin=executionOrigin(runId);
const resumable=recoveredTrial&&recoveredTrial.origin.sourceRevision===executedOrigin.sourceRevision&&recoveredTrial.origin.sourceDirty===executedOrigin.sourceDirty&&recoveredTrial.version===EXPERIMENT_CONFIG.version?recoveredTrial:undefined;
let experiment=new Experiment(engine,executedOrigin,resumable);
const experimentStore=new ExperimentStore(store.root);
const recorder=new SpecimenRecorder(experimentStore,new GitHubCLI(experimentStore.root),process.env.RECORDER_REPOSITORY,process.env.RECORDER_ENABLED==='1');
if(resumable?.completed)experimentStore.save(resumable.completed);
engine.event('session','Observation session opened');
let segmentStart=engine.time;
let snapshot=engine.snapshot(runId,seq,startedAt,0);
const connections=new Set<WebSocket>();
let lastExhibitBroadcast=0;
const observerPacket=(live:import('../shared/exhibit').ExhibitLive)=>({...live,history:live.history.slice(-20),observation:live.observation?{...live.observation,events:live.observation.events.slice(-20),journey:live.observation.journey?.slice(-8)}:undefined});
const browserService=new BrowserService(store.root,circuit,live=>{
  if(!live.snapshot)return;snapshot=live.snapshot;
  const packet=JSON.stringify({type:'snapshot',snapshot,browser:live});
  for(const ws of connections)if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>256*1024){ws.close(1013,'Slow observer');continue;}ws.send(packet);}
});
const exhibitService=new ExhibitService(store.root,circuit,live=>{
  if(live.snapshot)snapshot=live.snapshot;
  // Recording keeps every neural sample. The observer receives bounded complete
  // state packets, at most 10 Hz, and skips a sample under backpressure.
  const now=performance.now();if(now-lastExhibitBroadcast<100)return;lastExhibitBroadcast=now;
  const packet=JSON.stringify({type:'snapshot',snapshot:live.snapshot,exhibit:observerPacket(live)});
  for(const ws of connections)if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>256*1024){droppedFrames++;if(ws.bufferedAmount>2*1024*1024)ws.close(1013,'Slow observer');continue;}ws.send(packet);}
});
const server=createServer();
const wss=new WebSocketServer({noServer:true,maxPayload:1024});
let droppedFrames=0;
server.on('upgrade',(request,socket,head)=>{
  if(request.url?.split('?')[0]!=='/stream'||!allowedHosts.has(request.headers.host??'')){socket.destroy();return;}
  const origin=request.headers.origin;
  if(origin&&!allowedObservers.has(origin)){socket.destroy();return;}
  wss.handleUpgrade(request,socket,head,ws=>{connections.add(ws);ws.send(JSON.stringify({type:'resync',snapshot:exhibitEnabled?exhibitService.live?.snapshot:snapshot,browser:browserEnabled?browserService.live:null,exhibit:exhibitEnabled&&exhibitService.live?observerPacket(exhibitService.live):null}));ws.on('close',()=>connections.delete(ws));ws.on('error',()=>connections.delete(ws));ws.on('message',()=>ws.close(1008,'Observation only'));});
});
const vite=production?null:await (await import('vite')).createServer({root:ROOT,server:{middlewareMode:true,hmr:{server}},appType:'spa'});
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webm':'video/webm','.md':'text/markdown; charset=utf-8'};
server.on('request',(req,res)=>{
  if(!allowedHosts.has(req.headers.host??'')){res.writeHead(421);res.end('Unrecognised observation host');return;}
  if(canonicalHost&&req.headers.host==='www.'+canonicalHost){res.writeHead(308,{Location:`https://${canonicalHost}${req.url?.startsWith('/')?req.url:'/'}`});res.end();return;}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(canonicalHost&&req.headers.host===canonicalHost)res.setHeader('Strict-Transport-Security','max-age=31536000');
  const url=new URL(req.url||'/',`http://127.0.0.1:${port}`);
  const json=(value:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  if(req.method!=='GET'&&req.method!=='HEAD'){json({error:'Observation only'},405);return;}
  if(url.pathname==='/api/health'){json({ok:true,runId:exhibitEnabled?exhibitService.live?.runId:snapshot.runId,sessionId:exhibitService.sessionId,seq:snapshot.seq,modelTime:snapshot.modelTime,clients:connections.size,droppedFrames,timeScale:exhibitEnabled?2:browserEnabled?'accelerated windows':C.timeScale,mode:exhibitEnabled?'exhibit':browserEnabled?'browser':'light',exhibit:exhibitEnabled?exhibitService.live?.metrics:null,recorderError:(exhibitEnabled?exhibitService.recorder:browserEnabled?browserService.recorder:recorder).lastError});return;}
  if(url.pathname==='/api/exhibit/live'){json(exhibitService.live);return;}
  if(url.pathname==='/api/memory'){json(exhibitService.memory?.view()??null);return;}
  if(url.pathname.startsWith('/api/memory/')){const id=url.pathname.slice('/api/memory/'.length),m=/^memory-[a-f0-9]{24}$/.test(id)?exhibitService.memory?.detail(id):null;json(m??{error:'Memory not found'},m?200:404);return;}
  if(url.pathname==='/api/exhibit/publications'){void exhibitService.archive().then(a=>json(a.publications.slice(0,200))).catch(()=>json({error:'Archive unavailable'},503));return;}
  if(url.pathname==='/api/exhibit/records'){void exhibitService.archive().then(({records})=>{const selected=[...new Map([...records.slice(0,200),...records.filter(r=>r.config.heldOutSeeds.includes(r.seed))].map(r=>[r.id,r])).values()];json(selected.map(({decisions,observationEvents,...r})=>({...r,decisions:decisions.length,actions:decisions.filter(d=>d.command.kind!=='wait').length,executedActions:observationEvents?observationEvents.filter(e=>e.source==='neural'&&e.kind!=='wait'&&e.status==='completed'&&e.result?.scrollAfter!==e.result?.scrollBefore).length:null,artifactsAvailable:!!exhibitService.file(r.id,'trace.json.gz')})));}).catch(()=>json({error:'Archive unavailable'},503));return;}
  if(url.pathname.startsWith('/api/exhibit/record/')){const r=exhibitService.record(url.pathname.slice('/api/exhibit/record/'.length));json(r??{error:'Record not found'},r?200:404);return;}
  if(url.pathname==='/api/exhibit/preview'){
    const path=resolve(ROOT,'runtime/integrated-preview/integrated-45s.webm');if(!existsSync(path)){json({error:'Download the evidence release to restore the local preview'},404);return;}serveVideo(req,res,path);return;
  }
  if(url.pathname==='/api/exhibit/workstation-preview'){
    const path=resolve(ROOT,'runtime/workstation-review/workstation-55s.webm');if(!existsSync(path)){json({error:'Local workstation review recording is not installed'},404);return;}serveVideo(req,res,path);return;
  }
  if(url.pathname.startsWith('/api/exhibit/decision/')){const [id,index]=url.pathname.slice('/api/exhibit/decision/'.length).split('/');const d=/^\d+$/.test(index)?exhibitService.decision(id,Number(index)):null;json(d??{error:'Raw trace expired or decision not complete'},d?200:404);return;}
  if(url.pathname.startsWith('/api/exhibit/artifacts/')){
    const [id,name]=url.pathname.slice('/api/exhibit/artifacts/'.length).split('/');const path=exhibitService.file(id,name);
    if(!path){json({error:'Raw artifact expired or not found'},404);return;}res.setHeader('Cache-Control','private, max-age=86400, immutable');if(extname(path)==='.webm'){serveVideo(req,res,path);return;}res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));return;
  }
  if(url.pathname==='/api/browser/live'){json(browserService.live);return;}
  if(url.pathname==='/api/browser/records'){json(browserService.records().slice(0,50));return;}
  if(url.pathname==='/api/browser/publications'){json(browserService.publications().slice(0,50));return;}
  if(url.pathname.startsWith('/api/browser/artifacts/')){
    const [id,name]=url.pathname.slice('/api/browser/artifacts/'.length).split('/');const path=browserService.file(id,name);
    if(!path){json({error:'Artifact not found'},404);return;}res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));return;
  }
  if(url.pathname.startsWith('/api/browser/replay/')){const frames=browserService.trace(url.pathname.slice('/api/browser/replay/'.length));json(frames??{error:'Recorded trace not found'},frames?200:404);return;}
  if(url.pathname==='/api/state'){json(snapshot);return;}
  if(url.pathname==='/api/circuit'){json(circuit);return;}
  if(url.pathname==='/api/experiment'){json(experiment.summary());return;}
  if(url.pathname==='/api/publications'){json(experimentStore.publications().slice(0,50));return;}
  if(url.pathname==='/api/experiments'){json(experimentStore.records().slice(0,50));return;}
  if(url.pathname.startsWith('/api/experiments/')){
    const [id,view]=url.pathname.slice('/api/experiments/'.length).split('/');const record=experimentStore.read(id);
    if(!record){json({error:'Experiment not found'},404);return;}
    if(view==='replay'){try{json(replayExperiment(record,circuit));}catch(e){json({error:(e as Error).message},409);}return;}
    json(record);return;
  }
  if(url.pathname==='/api/manifest'){json(JSON.parse(readFileSync(resolve(ROOT,'data/processed/manifest.json'),'utf8')));return;}
  if(url.pathname==='/api/connectome'){json(JSON.parse(readFileSync(resolve(ROOT,'data/processed/connectome.json'),'utf8')));return;}
  if(url.pathname==='/api/sessions'){json(store.list());return;}
  if(url.pathname.startsWith('/api/sessions/')){const frames=store.read(url.pathname.slice('/api/sessions/'.length));json(frames??{error:'Session not found'},frames?200:404);return;}
  if(url.pathname==='/api/config'){json({displayName:'Specimen 01',ticker:'$LARVA',xHandle:process.env.PUBLIC_X_HANDLE||null,contract:process.env.PUBLIC_CONTRACT_ADDRESS||null,model:C});return;}
  if(url.pathname.startsWith('/docs/')){
    const name=url.pathname.slice(6);if(!/^[A-Za-z0-9_/.-]+$/.test(name)||name.includes('..')){json({error:'Invalid path'},400);return;}
    const path=resolve(ROOT,'docs',name);if(existsSync(path)&&extname(path)){res.setHeader('Content-Type',mime[extname(path)]||'text/plain');res.end(readFileSync(path));}else json({error:'Not found'},404);return;
  }
  if(url.pathname.startsWith('/api/')){json({error:'Not found'},404);return;}
  if(vite){vite.middlewares(req,res);return;}
  const base=resolve(ROOT,'dist');let path=resolve(base,'.'+decodeURIComponent(url.pathname));
  if(!path.startsWith(base+ '/'.replace('/',process.platform==='win32'?'\\':'/'))&&path!==base){json({error:'Invalid path'},400);return;}
  if(!existsSync(path)||!extname(path))path=resolve(base,'index.html');
  if(!existsSync(path)){json({error:'Build missing. Run npm run build.'},503);return;}
  res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(readFileSync(path));
});
let stopped=false,last=performance.now(),accumulator=0,lastStream=last,lastRecord=last,lastSave=last;
const interval=setInterval(()=>{
  if(browserEnabled||exhibitEnabled)return;
  const now=performance.now(),elapsed=(now-last)/1000;last=now;
  if(elapsed>2)engine.event('session',`Scheduler gap ${elapsed.toFixed(1)} s; catch-up bounded`);
  accumulator+=Math.min(elapsed,.2)*C.timeScale;
  let steps=0;while(accumulator>=C.dt&&steps<20){
    if(experiment.elapsed>=EXPERIMENT_CONFIG.cycleSeconds)experiment=new Experiment(engine,{...executedOrigin,runId});
    const completed=experiment.step();if(completed){experimentStore.save(completed);void recorder.tick();}
    accumulator-=C.dt;steps++;
  }
  if(now-lastStream>=1000/C.streamHz){const period=1000/C.streamHz;lastStream+=Math.floor((now-lastStream)/period)*period;snapshot=engine.snapshot(runId,++seq,startedAt,(Date.now()-Date.parse(startedAt))/1000);const packet=JSON.stringify({type:'snapshot',snapshot});for(const ws of connections){if(ws.readyState!==WebSocket.OPEN)continue;if(ws.bufferedAmount>64*1024){droppedFrames++;ws.close(1013,'Slow observer; reconnect for resync');continue;}ws.send(packet);}}
  if(now-lastRecord>=200){lastRecord=now;store.record(snapshot);}
  if(now-lastSave>=5000){lastSave=now;store.checkpoint(engine,experiment.state);}
  if(engine.time-segmentStart>=120){store.close();runId=`s01_${Date.now()}_${randomUUID().slice(0,8)}`;startedAt=new Date().toISOString();seq=0;store=new Storage(store.root,runId,startedAt);store.prune();segmentStart=engine.time;engine.event('session','New recorded observation segment');}
},10);
const heartbeat=setInterval(()=>{for(const ws of connections)if(ws.readyState===WebSocket.OPEN)ws.ping();},15000);
const recorderPoll=setInterval(()=>{if(exhibitEnabled&&process.env.SPECIMEN_EXTERNAL_RECORDER==='1')return;void (exhibitEnabled?exhibitService.recorder:browserEnabled?browserService.recorder:recorder).tick();},10000);
async function shutdown(){if(stopped)return;stopped=true;browserService.stopping=true;clearInterval(interval);clearInterval(heartbeat);clearInterval(recorderPoll);clearInterval(privateStopPoll);if(!browserEnabled&&!exhibitEnabled)store.checkpoint(engine,experiment.state);store.close();for(const ws of connections)ws.close(1001,'Local engine stopped');wss.close();if(browserEnabled)await browserService.stop();if(exhibitEnabled)await exhibitService.stop();await vite?.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
const privateStopPoll=setInterval(()=>{const path=process.env.EXHIBIT_STOP_FILE;if(path&&existsSync(path)){unlinkSync(path);void shutdown();}},1000);
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
server.listen(port,'127.0.0.1',()=>console.log(`SPECIMEN 01 · ${circuit.nodes.length} neurons / ${circuit.edges.length} connections\nLocal observation: http://127.0.0.1:${port}\n${exhibitEnabled?'Continuous intact exhibit: 6 model seconds per image / 3 wall seconds, 48 windows per episode.':browserEnabled?'Baseline browser mode: 6 model seconds per image / minimum 600 ms.':`Light model runs at ${C.timeScale}× wall time.`} Ctrl+C to stop.`));
if(browserEnabled)void browserService.start(process.argv.includes('--repeat')).catch(e=>console.error('Browser demonstration failed:',e.message));
if(exhibitEnabled)void exhibitService.start().catch(e=>console.error('Exhibit failed:',e.message));
