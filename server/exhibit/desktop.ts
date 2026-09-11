import { spawn,type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium,type Browser,type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createServer,type Server,type Socket } from 'node:net';
import { createInterface } from 'node:readline';
import { sha256 } from '../browser/evidence';
import type { DesktopCapture } from '../../shared/exhibit';

/** Presentation only. It has no reference to the sensory encoder or decoder. */
export class DesktopSession {
  private constructor(readonly child:ChildProcess,readonly browser:Browser,readonly port:number,readonly width:number,readonly height:number,readonly tunnels:Server[]){}
  static async open(){
    const script=resolve('scripts/desktop-session.py');
    const args=process.platform==='win32'?['-d',process.env.EXHIBIT_WSL_DISTRO||'Ubuntu','--','python3',script.replace(/^([A-Za-z]):/,(_,drive:string)=>`/mnt/${drive.toLowerCase()}`).replace(/\\/g,'/')]:[script];
    const child=spawn(process.platform==='win32'?'wsl.exe':'python3',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});
    const lines=createInterface({input:child.stdout!}),peers=new Map<number,Socket>(),tunnels:Server[]=[];let nextId=0;
    const send=(message:unknown)=>{if(!child.stdin?.destroyed&&!child.stdin?.writableEnded)child.stdin?.write(JSON.stringify(message)+'\n');};
    const disconnect=()=>{peers.forEach(peer=>peer.destroy());peers.clear();tunnels.forEach(server=>server.close());};
    child.once('exit',disconnect);child.stdin?.on('error',disconnect);
    try{
      const info=await new Promise<{cdpPort:number;capturePort:number;width:number;height:number}>((ok,fail)=>{
        let error='';const timer=setTimeout(()=>fail(new Error('Isolated desktop startup timed out. Run the desktop setup in README. '+error.slice(-600))),30000);
        child.stderr!.on('data',b=>{error+=b.toString();});
        child.once('error',e=>{clearTimeout(timer);fail(e);});
        child.once('exit',code=>{clearTimeout(timer);fail(new Error(`Desktop exited (${code}): ${error.slice(-1200)}`));});
        lines.once('line',line=>{try{clearTimeout(timer);ok(JSON.parse(line));}catch(e){fail(e);}});
      });
      lines.on('line',line=>{const m=JSON.parse(line),peer=peers.get(m.id);if(m.type==='open')peer?.resume();if(m.type==='data')peer?.write(Buffer.from(m.data,'base64'));if(m.type==='end'){peer?.end();peers.delete(m.id);}});
      const tunnel=async(port:number)=>{const server=createServer(peer=>{const id=++nextId;peers.set(id,peer);peer.pause();send({id,type:'open',port});peer.on('data',data=>send({id,type:'data',data:data.toString('base64')}));peer.on('close',()=>{send({id,type:'end'});peers.delete(id);});peer.on('error',()=>peer.destroy());});tunnels.push(server);await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));return (server.address() as {port:number}).port;};
      const cdp=await tunnel(info.cdpPort),capture=await tunnel(info.capturePort);
      const version=await (await fetch(`http://127.0.0.1:${cdp}/json/version`)).json() as {webSocketDebuggerUrl:string};
      const endpoint=new URL(version.webSocketDebuggerUrl);endpoint.host=`127.0.0.1:${cdp}`;
      const browser=await chromium.connectOverCDP(endpoint.href,{timeout:15000});
      return new DesktopSession(child,browser,capture,info.width,info.height,tunnels);
    }catch(e){tunnels.forEach(s=>s.close());peers.forEach(s=>s.destroy());child.stdin?.end();throw e;}
  }
  async arrange(page:Page){
    const cdp=await page.context().newCDPSession(page);
    const {windowId}=await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds',{windowId,bounds:{left:79,top:14,width:642,height:466,windowState:'normal'}});
    await cdp.detach();
    await page.bringToFront();
    const response=await fetch(`http://127.0.0.1:${this.port}/arrange`,{signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('Desktop window arrangement failed');
  }
  async capture(directory:string,index:number,pageFrame:string,pageCapturedAt:string,cursor:{x:number;y:number}):Promise<DesktopCapture>{
    const requestedAt=Date.now(),started=performance.now(),response=await fetch(`http://127.0.0.1:${this.port}/capture`,{signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error(`Desktop capture HTTP ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer()),roundTripMs=performance.now()-started,captureMs=Number(response.headers.get('X-Capture-Ms'));
    // WSL's wall clock can differ from Windows. Retain its raw timestamp and
    // bound a backend-clock estimate by the measured request/response interval.
    const uncertainty=Math.max(0,(roundTripMs-captureMs)/2),capturedAt=new Date(requestedAt+uncertainty).toISOString();
    const path=`desktop-${String(index).padStart(3,'0')}.png`;writeFileSync(resolve(directory,path),bytes);
    return {path,pageFrame,pageCapturedAt,capturedAt,completedAt:new Date().toISOString(),sourceCapturedAt:new Date(Number(response.headers.get('X-Captured-At'))).toISOString(),timestampBasis:'backend-midpoint-estimate',clockUncertaintyMs:+uncertainty.toFixed(2),width:this.width,height:this.height,sha256:sha256(bytes),cursor:{...cursor},captureMs,roundTripMs:+roundTripMs.toFixed(2),pageLagMs:Date.parse(capturedAt)-Date.parse(pageCapturedAt),source:'x11-root',cursorSource:'recorded-page-pointer'};
  }
  async close(){this.tunnels.forEach(s=>s.close());this.child.stdin?.end();await new Promise<void>(r=>{if(this.child.exitCode!==null)return r();this.child.once('exit',()=>r());setTimeout(()=>{this.child.kill();r();},6000).unref();});}
}
