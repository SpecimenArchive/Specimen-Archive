import {createServer} from 'node:http';
import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {createInterface} from 'node:readline';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync,unlinkSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {userInfo} from 'node:os';
import {WebSocket,WebSocketServer} from 'ws';
import {WorkerLease} from '../../server/exhibit/worker-lease';

// Provisioning is explicit and remote-only. Never start this on an everyday PC.
const configPath=process.env.SPECIMEN_REMOTE_CONFIG;
if(process.platform!=='win32'||!configPath)throw new Error('Run start-worker.ps1 inside the dedicated Windows 11 VM');
const config=JSON.parse(readFileSync(configPath,'utf8'));
if(config.isolation!=='remote-vm'||config.dedicated!==true||typeof config.userName!=='string'||userInfo().username.toLowerCase()!==config.userName.toLowerCase())throw new Error('This account is not the configured dedicated remote station');
const root=resolve(config.root),token=readFileSync(join(root,'worker-token.txt'),'utf8').trim(),lease=new WorkerLease(token);
const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
let native:ChildProcessWithoutNullStreams|undefined,nativeSequence=0,chrome:ReturnType<typeof spawn>|undefined,cdpURL='',stopping:Promise<void>|undefined;
let active=false,requestBusy=false,closed=false,cleanupFailed=false,ownedProfile:string|undefined;
const peers=new Set<WebSocket>();
const audit=(kind:string,detail:object={})=>{
  // Bounded latest operational receipt; episode evidence belongs to the backend.
  const receipt={at:new Date().toISOString(),bootId:lease.bootId,stationId:config.stationId,kind,...detail};
  writeFileSync(join(root,'worker-status.json'),JSON.stringify(receipt,null,2));
  const historyPath=join(root,'worker-history.json');let history:object[]=[];try{history=JSON.parse(readFileSync(historyPath,'utf8'));}catch{}
  writeFileSync(historyPath,JSON.stringify([...history,receipt].slice(-200),null,2));
};
async function stop(reason:string){
  if(stopping)return stopping;
  stopping=(async()=>{
    active=false;for(const peer of peers)peer.terminate();peers.clear();
    const ownedChrome=chrome;cdpURL='';
    if(ownedChrome?.pid&&ownedChrome.exitCode===null&&ownedChrome.signalCode===null){
      // CDP/context closure can already be taking the final browser window
      // down. Observe the owned child before issuing a tree cleanup request.
      await waitForExit(ownedChrome,1200);
    }
    if(ownedChrome?.pid&&ownedChrome.exitCode===null&&ownedChrome.signalCode===null){
      // Exact owned PID only; no process-name-wide cleanup.
      const kill=spawn('taskkill.exe',['/PID',String(ownedChrome.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
      const code=await new Promise<number|null>((r,reject)=>{kill.once('error',reject);kill.once('exit',r);});
      await waitForExit(ownedChrome,2500);
      if(code!==0&&ownedChrome.exitCode===null&&ownedChrome.signalCode===null)throw new Error(`Owned Chrome cleanup failed (taskkill exit ${code}); operator recovery required`);
    }
    chrome=undefined;
    native?.stdin.end();native?.kill();native=undefined;
    if(ownedProfile){const target=resolve(ownedProfile),parent=resolve(root,'profiles');if(!target.startsWith(parent+sep)||target===parent)throw new Error('Invalid profile cleanup target');try{rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});}catch{/* Report remains private; a locked profile may require operator cleanup. */}ownedProfile=undefined;}
    for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Worker session closed'));}pending.clear();
    lease.release();cleanupFailed=false;audit('stopped',{reason});
  })().catch(error=>{cleanupFailed=true;throw error;}).finally(()=>{stopping=undefined;});return stopping;
}
async function waitForExit(child:ReturnType<typeof spawn>,milliseconds:number){
  if(child.exitCode!==null||child.signalCode!==null)return;
  await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);child.off('exit',done);resolve();};const timer=setTimeout(done,milliseconds);child.once('exit',done);});
}
function requestStop(reason:string){void stop(reason).catch(error=>audit('cleanup-failed',{error:error instanceof Error?error.message:String(error)}));}
function nativeRequest(method:string):Promise<any>{
  return new Promise((resolve,reject)=>{
    if(!native||native.exitCode!==null){reject(new Error('Native capture helper unavailable'));return;}
    const id=++nativeSequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Native capture timed out'));},['info','pin'].includes(method)?30000:6000);
    pending.set(id,{resolve,reject,timer});native.stdin.write(JSON.stringify({id,method,pid:chrome?.pid})+'\n');
  });
}
async function start(){
  active=true;
  try{
    const ownedNative=native=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',resolve('scripts/windows/native-worker.ps1')],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,SPECIMEN_REMOTE_CONFIG:resolve(configPath!),SPECIMEN_REMOTE_GUEST:'1'}});
    const lines=createInterface({input:ownedNative.stdout});
    const nativeCurrent=()=>active&&native===ownedNative;
    lines.on('line',line=>{if(!nativeCurrent())return;try{const m=JSON.parse(line),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error)):p.resolve(m.result);}}catch{requestStop('Invalid native response');}});
    ownedNative.on('error',()=>{if(nativeCurrent())requestStop('Native helper failed');});
    ownedNative.on('exit',(code,signal)=>{if(nativeCurrent()){audit('native-exited',{code,signal});requestStop('Native helper exited');}});
    ownedNative.stdin.on('error',()=>{if(nativeCurrent())requestStop('Native input pipe failed');});
    let nativeError='';const nativeLog=join(root,'native.stderr.log');writeFileSync(nativeLog,'');
    ownedNative.stderr.on('data',bytes=>{if(native!==ownedNative)return;nativeError=(nativeError+String(bytes)).slice(-8192);writeFileSync(nativeLog,nativeError);});
    const verified=await nativeRequest('info');
    if(verified.os!=='Windows 11'||verified.isolation!=='remote-vm')throw new Error('Native VM verification failed');
    const profile=ownedProfile=join(root,'profiles',randomUUID());mkdirSync(profile,{recursive:true});
    const ownedChrome=chrome=spawn(config.chromePath,['--no-first-run','--no-default-browser-check','--disable-session-crashed-bubble','--disable-smooth-scrolling','--force-renderer-accessibility','--force-device-scale-factor=1','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-position=144,18','--window-size=1312,823','about:blank'],{windowsHide:true,stdio:'ignore'});
    ownedChrome.once('error',()=>{if(active&&chrome===ownedChrome)requestStop('Chrome failed to start');});ownedChrome.once('exit',()=>{if(active&&chrome===ownedChrome)requestStop('Chrome exited');});
    const deadline=Date.now()+30000;
    let port='',path='';
    while(true){
      if(!active||Date.now()>deadline||ownedChrome.exitCode!==null)throw new Error('Chrome startup timed out');
      try{[port,path]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/);if(/^\d+$/.test(port)&&/^\/devtools\/browser\/[a-f0-9-]+$/.test(path))break;}
      catch(error){if(!['ENOENT','EBUSY','EACCES'].includes((error as NodeJS.ErrnoException).code??''))throw error;}
      // Windows may expose this new file while Chrome still holds its writer.
      // Retry setup discovery only, never an input command or an old session.
      await new Promise(r=>setTimeout(r,100));
    }
    cdpURL=`ws://127.0.0.1:${port}${path}`;
    // Cold Windows module/C# initialization precedes the backend lease. Once
    // handed to the backend, the existing 20-second heartbeat deadline applies.
    const ownership=lease.acquire();
    audit('leased');return {...ownership,stationId:config.stationId,os:verified.os,isolation:'remote-vm',width:verified.width,height:verified.height,scale:verified.scale,webSocketPath:`/cdp/${ownership.leaseId}`};
  }catch(error){await stop('Startup failed');throw error;}
}
const server=createServer(async(req,res)=>{
  const send=(status:number,value:object)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  if(req.headers.origin||!lease.authorize(req.headers.authorization)){send(401,{error:'Unauthorized'});return;}
  if(req.method!=='POST'){send(405,{error:'POST required'});return;}
  if(!['/session','/heartbeat','/arrange','/pin','/capture','/stop'].includes(req.url??'')){send(404,{error:'Unknown operation'});return;}
  try{
    let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){send(413,{error:'Request too large'});return;}}
    if(req.url==='/session'){
      if(active||stopping||cleanupFailed){send(409,{error:'Station is already owned or awaiting cleanup'});return;}
      send(200,await start());return;
    }
    const m=JSON.parse(body);lease.verify(m.leaseId,m.bootId);
    if(req.url==='/heartbeat'){lease.heartbeat(m.leaseId,m.bootId);send(200,{ok:true});return;}
    if(req.url==='/stop'){lease.command(m.leaseId,m.bootId,m.sequence);await stop('Backend shutdown');send(200,{ok:true});return;}
    if(requestBusy){send(409,{error:'Native operation in progress'});return;}
    lease.command(m.leaseId,m.bootId,m.sequence);requestBusy=true;
    try{const result=await nativeRequest(req.url!.slice(1));lease.verify(m.leaseId,m.bootId);send(200,{...result,bootId:lease.bootId,stationId:config.stationId});}
    finally{requestBusy=false;}
  }catch(error){audit('request-failed',{operation:req.url,error:error instanceof Error?error.message:String(error)});send(409,{error:'Station request failed; inspect the private worker receipt'});}
});
const bridge=new WebSocketServer({noServer:true,maxPayload:24*1024*1024});
server.on('upgrade',(req,socket,head)=>{
  try{
    if(req.headers.origin||!lease.authorize(req.headers.authorization))throw new Error('Unauthorized');
    const id=String(req.headers['x-specimen-lease']),boot=String(req.headers['x-specimen-boot']);lease.verify(id,boot);
    if(req.url!==`/cdp/${id}`||!cdpURL||peers.size)throw new Error('Invalid CDP ownership');
    bridge.handleUpgrade(req,socket,head,downstream=>{
      const endpoint=cdpURL;
      const stopOwned=(reason:string)=>{if(active&&cdpURL===endpoint)requestStop(reason);};
      const upstream=new WebSocket(endpoint,{maxPayload:24*1024*1024});peers.add(downstream);peers.add(upstream);
      // Playwright can send immediately after handshake. Queue only while the
      // local upstream opens, bounded at 1 MB; never reconnect this channel.
      let queue:Buffer[]=[];let queued=0;
      downstream.on('message',(bytes,binary)=>{
        try{lease.verify(id,boot);const data=Buffer.from(bytes as Buffer);if(upstream.readyState===WebSocket.OPEN){if(upstream.bufferedAmount>4*1024*1024)throw new Error('Backpressure');upstream.send(data,{binary});}else if(upstream.readyState===WebSocket.CONNECTING){queued+=data.length;if(queued>1024*1024)throw new Error('Backpressure');queue.push(data);}else throw new Error('Disconnected');}
        catch{stopOwned('CDP connection lost');}
      });
      upstream.on('open',()=>{for(const bytes of queue)upstream.send(bytes,{binary:false});queue=[];});
      upstream.on('message',(bytes,binary)=>{if(downstream.readyState===WebSocket.OPEN&&downstream.bufferedAmount<4*1024*1024)downstream.send(bytes,{binary});else stopOwned('CDP backpressure');});
      for(const peer of [downstream,upstream]){peer.on('error',()=>stopOwned('CDP failure'));peer.on('close',()=>stopOwned('CDP disconnected'));}
    });
  }catch{socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');}
});
const watchdog=setInterval(()=>{const marker=join(root,'stop-worker');if(existsSync(marker)){unlinkSync(marker);void shutdown();return;}if(lease.expired())requestStop('Backend heartbeat expired');},1000);
async function shutdown(){if(closed)return;closed=true;clearInterval(watchdog);await stop('Operator emergency stop');bridge.close();server.close();}
process.on('SIGINT',()=>void shutdown());process.on('SIGTERM',()=>void shutdown());
server.on('error',error=>{console.error(error.message);void shutdown();process.exitCode=1;});
server.listen(4320,'127.0.0.1',()=>{audit('ready');console.log('Specimen worker ready on VM loopback port 4320. Ctrl+C is the private emergency stop.');});
