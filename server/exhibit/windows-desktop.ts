import {mkdirSync,readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createServer,type Server,type Socket} from 'node:net';
import {chromium,type Browser,type Page} from '@playwright/test';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import {FileTransport} from '../../scripts/windows/file-transport.mjs';
import {sha256} from '../browser/evidence';
import {WINDOWS_CALIBRATION,locateWindowsViewport} from './windows-geometry';
import type {DesktopCapture} from '../../shared/exhibit';
export class WindowsDesktopSession {
  readonly width=1600;readonly height=900;private sequence=0;private nextPeer=0;
  private pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void}>();private peers=new Map<number,Socket>();
  private server?:Server;private heartbeat:ReturnType<typeof setInterval>;private viewport?:{x:number;y:number;scale:number};private bounds?:string;
  browser!:Browser;
  private constructor(readonly link:FileTransport,readonly stationId:string){
    link.on('message',m=>{if(m.kind==='reply'){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);m.error?p.reject(new Error(m.error)):p.resolve(m.result);}}else{const peer=this.peers.get(m.id);if(m.kind==='open')peer?.resume();if(m.kind==='data')peer?.write(Buffer.from(m.data,'base64'));if(m.kind==='end'){peer?.end();this.peers.delete(m.id);}}});
    link.on('error',e=>{for(const p of this.pending.values())p.reject(e);this.pending.clear();this.peers.forEach(p=>p.destroy());});
    this.heartbeat=setInterval(()=>{try{link.send({kind:'heartbeat'});}catch{/* Pending requests have bounded timeouts. */}},1000);
  }
  private request(method:string){return new Promise<any>((resolve,reject)=>{const id=++this.sequence;this.pending.set(id,{resolve,reject});this.link.send({kind:'request',id,method});setTimeout(()=>{if(this.pending.delete(id))reject(new Error(`Windows station ${method} timed out; inspect guest startup-error.txt/native-error.txt`));},30000).unref();});}
  static async open(){
    const station=process.env.EXHIBIT_WINDOWS_STATION;
    if(!station)throw new Error('Windows desktop unavailable: prepare and start Windows Sandbox, then set EXHIBIT_WINDOWS_STATION. See docs/WINDOWS_STATION.md. No Linux substitute is selected.');
    const root=resolve(station),config=JSON.parse(readFileSync(join(root,'tools/station.json'),'utf8')),readyPath=join(root,'exchange/ready.json');
    if(!existsSync(readyPath))throw new Error('Windows Sandbox guest is not running. Start its .wsb configuration; inspect exchange/startup-error.txt if startup fails.');
    const ready=JSON.parse(readFileSync(readyPath,'utf8'));
    assert.equal(ready.isolation,'windows-sandbox');assert.equal(ready.os,'Windows 11');assert.equal(ready.stationId,config.stationId);
    assert(Date.now()-ready.heartbeat<10000&&ready.heartbeat-Date.now()<10000,'Windows Sandbox heartbeat is stale or its clock is not synchronized');
    const id=randomUUID(),directory=join(root,'exchange/links',id);mkdirSync(directory,{recursive:true});
    const session=new WindowsDesktopSession(new FileTransport(directory,'host'),config.stationId);
    writeFileSync(join(directory,'request.json.tmp'),JSON.stringify({at:Date.now()}));renameSync(join(directory,'request.json.tmp'),join(directory,'request.json'));
    try{
      const info=await session.request('start');assert.equal(info.stationId,config.stationId);assert.equal(info.isolation,'windows-sandbox');
      session.server=createServer(peer=>{const peerId=++session.nextPeer;session.peers.set(peerId,peer);peer.pause();session.link.send({kind:'open',id:peerId,port:info.cdpPort});peer.on('data',b=>session.link.send({kind:'data',id:peerId,data:b.toString('base64')}));peer.on('error',()=>peer.destroy());peer.on('close',()=>{session.peers.delete(peerId);try{session.link.send({kind:'end',id:peerId});}catch{}});});
      await new Promise<void>(r=>session.server!.listen(0,'127.0.0.1',r));const port=(session.server.address() as {port:number}).port;
      session.browser=await chromium.connectOverCDP(`ws://127.0.0.1:${port}${info.webSocketPath}`,{timeout:30000});return session;
    }catch(error){await session.close();throw error;}
  }
  async arrange(page:Page){
    await page.bringToFront();await this.request('arrange');
    // This explicit setup image is replaced by the real task before any model
    // input or controller-generated action. The 2x scale never changes CSS pixels.
    await page.setContent(WINDOWS_CALIBRATION);const before=PNG.sync.read(await page.screenshot());
    const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width:640,height:360,deviceScaleFactor:1,mobile:false,scale:2});
    const after=PNG.sync.read(await page.screenshot());assert.equal(after.width,640);assert.equal(after.height,360);assert(before.data.equals(after.data),'Presentation scaling changed the sensory image');
    await page.waitForTimeout(150);const capture=await this.request('capture');this.validate(capture);
    this.viewport=locateWindowsViewport(PNG.sync.read(Buffer.from(capture.png,'base64')),after);this.bounds=JSON.stringify(capture.window);
    await cdp.detach();
  }
  private validate(c:any){assert.equal(c.os,'Windows 11');assert.equal(c.width,1600);assert.equal(c.height,900);assert.equal(c.dpi,96);assert.equal(c.timeZone,'GMT Standard Time');if(this.bounds)assert.equal(JSON.stringify(c.window),this.bounds,'Windows browser moved after viewport calibration');}
  async capture(directory:string,index:number,pageFrame:string,pageCapturedAt:string,cursor:{x:number;y:number}):Promise<DesktopCapture>{
    assert(this.viewport,'Windows presentation must pass pixel calibration first');
    const requestedAt=Date.now(),started=performance.now(),c=await this.request('capture'),roundTripMs=performance.now()-started;this.validate(c);
    const bytes=Buffer.from(c.png,'base64'),png=PNG.sync.read(bytes);assert.equal(png.width,1600);assert.equal(png.height,900);
    const uncertainty=Math.max(0,(roundTripMs-c.captureMs)/2),capturedAt=new Date(requestedAt+uncertainty).toISOString(),path=`desktop-${String(index).padStart(3,'0')}.png`;writeFileSync(join(directory,path),bytes);
    return {path,pageFrame,pageCapturedAt,capturedAt,completedAt:new Date().toISOString(),width:1600,height:900,sha256:sha256(bytes),cursor:{...cursor},captureMs:c.captureMs,roundTripMs:+roundTripMs.toFixed(2),pageLagMs:Date.parse(capturedAt)-Date.parse(pageCapturedAt),source:'windows-gdi',cursorSource:'recorded-page-pointer',sourceCapturedAt:new Date(c.sourceCapturedAt).toISOString(),timestampBasis:'backend-midpoint-estimate',clockUncertaintyMs:+uncertainty.toFixed(2),station:{os:c.os,osBuild:c.osBuild,isolation:'windows-sandbox',id:this.stationId,timeZone:c.timeZone,dpi:c.dpi,viewport:this.viewport,window:c.window,taskbar:c.taskbar}};
  }
  async close(){clearInterval(this.heartbeat);try{await this.request('stop');}catch{}this.peers.forEach(p=>p.destroy());this.server?.close();this.link.close();for(const p of this.pending.values())p.reject(new Error('Windows station closed'));this.pending.clear();}
}
