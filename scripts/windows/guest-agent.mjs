import {FileTransport} from './file-transport.mjs';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {connect} from 'node:net';
import {mkdirSync,readFileSync,readdirSync,writeFileSync,renameSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {userInfo} from 'node:os';
import {randomUUID} from 'node:crypto';
if(process.platform!=='win32'||userInfo().username!=='WDAGUtilityAccount'||process.env.SPECIMEN_SANDBOX_GUEST!=='1')throw new Error('Refusing desktop access outside the project Windows Sandbox');
const tools='C:/SpecimenTools',exchange='C:/SpecimenExchange',config=JSON.parse(readFileSync(join(tools,'station.json'),'utf8'));
const chromePath='C:/SpecimenStation/Chrome/chrome.exe';
const native=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(tools,'native-worker.ps1')],{windowsHide:true,stdio:['pipe','pipe','pipe']});
let nativeSequence=0,active=null;const pending=new Map();
const lines=createInterface({input:native.stdout});lines.on('line',line=>{const message=JSON.parse(line),p=pending.get(message.id);if(p){pending.delete(message.id);message.error?p.reject(new Error(message.error)):p.resolve(message.result);}});
native.stderr.on('data',b=>writeFileSync(join(exchange,'native-error.txt'),b));
native.on('exit',()=>{for(const p of pending.values())p.reject(new Error('Native Windows capture worker exited'));pending.clear();});
function requestNative(method,pid){return new Promise((resolve,reject)=>{const id=++nativeSequence;pending.set(id,{resolve,reject});native.stdin.write(JSON.stringify({id,method,pid})+'\n');setTimeout(()=>{if(pending.delete(id))reject(new Error('Windows capture worker timed out'));},5000).unref();});}
function atomic(path,value){writeFileSync(path+'.tmp',JSON.stringify(value));renameSync(path+'.tmp',path);}
function safeSend(link,message){try{link.send(message);}catch{if(active?.link===link)void stop();}}
async function stop(){if(!active)return;const old=active;active=null;old.link.close();for(const peer of old.peers.values())peer.destroy();old.chrome?.kill();if(old.chrome?.exitCode===null)await new Promise(r=>{old.chrome.once('exit',r);setTimeout(r,2000);});if(old.profile.startsWith('C:/SpecimenStation/profiles/'))try{rmSync(old.profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch{/* The disposable guest removes a locked profile on shutdown. */}}
async function startConnection(id){
  if(active)return;
  const link=new FileTransport(join(exchange,'links',id),'guest'),profile='C:/SpecimenStation/profiles/'+randomUUID(),peers=new Map();
  const state=active={id,link,profile,peers,lastSeen:Date.now(),chrome:null,cdpPort:0};
  link.on('error',()=>void stop());
  link.on('message',message=>{state.lastSeen=Date.now();void handle(message).catch(error=>safeSend(link,{kind:'reply',id:message.id,error:error.message}));});
  async function handle(m){
    if(m.kind==='heartbeat')return;
    if(m.kind==='open'){
      if(m.port!==state.cdpPort||!state.cdpPort)throw new Error('Only the owned Chrome CDP endpoint may be bridged');
      const peer=connect({host:'127.0.0.1',port:m.port},()=>safeSend(link,{kind:'open',id:m.id}));peers.set(m.id,peer);
      peer.on('data',b=>safeSend(link,{kind:'data',id:m.id,data:b.toString('base64')}));peer.on('error',()=>peer.destroy());peer.on('close',()=>{peers.delete(m.id);safeSend(link,{kind:'end',id:m.id});});return;
    }
    if(m.kind==='data'){peers.get(m.id)?.write(Buffer.from(m.data,'base64'));return;}
    if(m.kind==='end'){peers.get(m.id)?.end();return;}
    if(m.kind!=='request')throw new Error('Unknown station message');
    let result;
    if(m.method==='start'){
      mkdirSync(profile,{recursive:true});
      state.chrome=spawn(chromePath,['--no-first-run','--no-default-browser-check','--disable-session-crashed-bubble','--force-device-scale-factor=1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-position=144,18','--window-size=1312,823','about:blank'],{windowsHide:true,stdio:'ignore'});
      state.chrome.once('error',error=>safeSend(link,{kind:'reply',id:m.id,error:error.message}));
      const deadline=Date.now()+15000;while(!existsSync(join(profile,'DevToolsActivePort'))){if(Date.now()>deadline||state.chrome.exitCode!==null)throw new Error('Guest Chrome failed to start');await new Promise(r=>setTimeout(r,50));}
      const [port,path]=readFileSync(join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/);state.cdpPort=Number(port);
      result={stationId:config.stationId,isolation:'windows-sandbox',cdpPort:state.cdpPort,webSocketPath:path,width:1600,height:900};
    }else if(m.method==='arrange'||m.method==='capture'){
      if(!state.chrome?.pid)throw new Error('Owned Chrome is not running');result=await requestNative(m.method,state.chrome.pid);
    }else if(m.method==='stop'){safeSend(link,{kind:'reply',id:m.id,result:{ok:true}});setTimeout(()=>void stop(),100);return;}
    else throw new Error('Unsupported station request');
    safeSend(link,{kind:'reply',id:m.id,result});
  }
}
mkdirSync(join(exchange,'links'),{recursive:true});
setInterval(()=>{
  atomic(join(exchange,'ready.json'),{protocol:1,stationId:config.stationId,isolation:'windows-sandbox',os:'Windows 11',timeZone:config.timeZone,heartbeat:Date.now()});
  if(active&&Date.now()-active.lastSeen>20000)void stop();
  if(!active)for(const id of readdirSync(join(exchange,'links'))){if(!/^[a-f0-9-]{36}$/.test(id))continue;const request=join(exchange,'links',id,'request.json');if(existsSync(request)){const r=JSON.parse(readFileSync(request,'utf8'));if(!r.accepted&&Date.now()-r.at<30000){atomic(request,{...r,accepted:true});void startConnection(id);break;}}}
},500);
