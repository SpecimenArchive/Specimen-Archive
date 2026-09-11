import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import type { Circuit } from '../shared/types';
import { Engine } from './model/engine';
import { MODEL_CONFIG as C } from './model/config';
import { Storage } from './storage';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const production=process.argv.includes('--production');
const port=Number(process.env.PORT||4317);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be an integer from 1024 to 65535');
const circuit=JSON.parse(readFileSync(resolve(ROOT,'data/processed/circuit.json'),'utf8')) as Circuit;
const engine=new Engine(circuit);
let runId=`s01_${Date.now()}_${randomUUID().slice(0,8)}`,startedAt=new Date().toISOString(),seq=0;
let store=new Storage(process.env.RUNTIME_DIR||resolve(ROOT,'runtime'),runId,startedAt);store.restore(engine);store.prune();
engine.event('session','Observation session opened');
let segmentStart=engine.time;
let snapshot=engine.snapshot(runId,seq,startedAt,0);
const connections=new Set<WebSocket>();
const server=createServer();
const wss=new WebSocketServer({noServer:true,maxPayload:1024});
let droppedFrames=0;
server.on('upgrade',(request,socket,head)=>{
  if(request.url?.split('?')[0]!=='/stream')return;
  const origin=request.headers.origin;
  if(origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(origin)){socket.destroy();return;}
  wss.handleUpgrade(request,socket,head,ws=>{connections.add(ws);ws.send(JSON.stringify({type:'resync',snapshot}));ws.on('close',()=>connections.delete(ws));ws.on('error',()=>connections.delete(ws));ws.on('message',()=>ws.close(1008,'Observation only'));});
});
const vite=production?null:await (await import('vite')).createServer({root:ROOT,server:{middlewareMode:true,hmr:{server}},appType:'spa'});
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8'};
server.on('request',(req,res)=>{
  const url=new URL(req.url||'/',`http://127.0.0.1:${port}`);
  const json=(value:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  if(req.method!=='GET'&&req.method!=='HEAD'){json({error:'Observation only'},405);return;}
  if(url.pathname==='/api/health'){json({ok:true,runId,seq,modelTime:engine.time,clients:connections.size,droppedFrames,timeScale:C.timeScale});return;}
  if(url.pathname==='/api/state'){json(snapshot);return;}
  if(url.pathname==='/api/circuit'){json(circuit);return;}
  if(url.pathname==='/api/manifest'){json(JSON.parse(readFileSync(resolve(ROOT,'data/processed/manifest.json'),'utf8')));return;}
  if(url.pathname==='/api/connectome'){json(JSON.parse(readFileSync(resolve(ROOT,'data/processed/connectome.json'),'utf8')));return;}
  if(url.pathname==='/api/sessions'){store.writeMeta();json(store.list());return;}
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
  const now=performance.now(),elapsed=(now-last)/1000;last=now;
  if(elapsed>2)engine.event('session',`Scheduler gap ${elapsed.toFixed(1)} s; catch-up bounded`);
  accumulator+=Math.min(elapsed,.2)*C.timeScale;
  let steps=0;while(accumulator>=C.dt&&steps<20){engine.step();accumulator-=C.dt;steps++;}
  if(now-lastStream>=1000/C.streamHz){lastStream=now;snapshot=engine.snapshot(runId,++seq,startedAt,(Date.now()-Date.parse(startedAt))/1000);const packet=JSON.stringify({type:'snapshot',snapshot});for(const ws of connections){if(ws.readyState!==WebSocket.OPEN)continue;if(ws.bufferedAmount>64*1024){droppedFrames++;ws.close(1013,'Slow observer; reconnect for resync');continue;}ws.send(packet);}}
  if(now-lastRecord>=200){lastRecord=now;store.record(snapshot);}
  if(now-lastSave>=5000){lastSave=now;store.checkpoint(engine);}
  if(engine.time-segmentStart>=120){store.close();runId=`s01_${Date.now()}_${randomUUID().slice(0,8)}`;startedAt=new Date().toISOString();seq=0;store=new Storage(store.root,runId,startedAt);store.prune();segmentStart=engine.time;engine.event('session','New recorded observation segment');}
},10);
const heartbeat=setInterval(()=>{for(const ws of connections)if(ws.readyState===WebSocket.OPEN)ws.ping();},15000);
async function shutdown(){if(stopped)return;stopped=true;clearInterval(interval);clearInterval(heartbeat);store.checkpoint(engine);store.close();for(const ws of connections)ws.close(1001,'Local engine stopped');wss.close();await vite?.close();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
server.listen(port,'127.0.0.1',()=>console.log(`SPECIMEN 01 · ${circuit.nodes.length} neurons / ${circuit.edges.length} connections\nLocal observation: http://127.0.0.1:${port}\nModel runs at ${C.timeScale}× wall time. Ctrl+C to stop.`));
