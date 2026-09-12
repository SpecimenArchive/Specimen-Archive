import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,type Browser,type Page,type CDPSession} from '@playwright/test';
import {PNG} from 'pngjs';
import {sha256} from '../browser/evidence';
import {WINDOWS_CALIBRATION,locateWindowsViewport} from './windows-geometry';
import type {DesktopCapture} from '../../shared/exhibit';

/** Authenticated loopback HTTP connects the backend and worker on the VM.
 * Connection failure aborts the episode. Commands are never retried. */
export class RemoteDesktopSession {
  browser!:Browser;get width(){return this.info.width;}get height(){return this.info.height;}
  private sequence=0;private heartbeat?:ReturnType<typeof setInterval>;private failure?:Error;private closed=false;
  private ordered:Promise<unknown>=Promise.resolve();
  private viewport?:{x:number;y:number;scale:number};private bounds?:string;
  get pageSize(){assert(this.viewport);return {width:this.width,height:this.height-48-this.viewport.y};}
  async pinDashboard(){return this.request('pin');}
  private presentation?:{page:Page;scale:number};private pageSessions=new Map<Page,CDPSession>();
  private constructor(readonly endpoint:string,private token:string,readonly info:{leaseId:string;bootId:string;stationId:string;os:string;isolation:string;width:number;height:number;scale:number}){}
  static async open(){
    const endpoint=process.env.EXHIBIT_WINDOWS_URL,tokenFile=process.env.EXHIBIT_WINDOWS_TOKEN_FILE;
    if(!endpoint||!tokenFile)throw new Error('Remote Windows VM access missing. Configure EXHIBIT_WINDOWS_URL and EXHIBIT_WINDOWS_TOKEN_FILE; see docs/WINDOWS_STATION.md.');
    const url=new URL(endpoint);
    assert(url.protocol==='http:'&&url.hostname==='127.0.0.1'&&url.pathname==='/'&&!url.username&&!url.password&&!url.search,'Worker URL must be an SSH-forwarded http://127.0.0.1:port origin');
    const token=readFileSync(tokenFile,'utf8').trim();assert(/^[a-f0-9]{64}$/.test(token),'Invalid worker token file');
    const response=await fetch(new URL('/session',url),{method:'POST',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(65000)});
    if(!response.ok)throw new Error(`Windows worker session HTTP ${response.status}`);
    const info=await response.json() as RemoteDesktopSession['info']&{webSocketPath:string};
    const session=new RemoteDesktopSession(url.origin,token,info);
    try{
      assert.equal(info.os,'Windows 11');assert.equal(info.isolation,'remote-vm');
      assert((info.width===1600&&info.height===900&&info.scale===2)||(info.width===1280&&info.height===800&&info.scale===1.5),'Unconfigured native display');
      assert(/^\/cdp\/[a-f0-9-]+$/.test(info.webSocketPath));
      session.heartbeat=setInterval(()=>{void session.request('heartbeat',false).catch(e=>{session.failure=e;void session.browser?.close().catch(()=>{});});},4000);
      session.browser=await chromium.connectOverCDP(`ws://${url.host}${info.webSocketPath}`,{headers:{Authorization:`Bearer ${token}`,'X-Specimen-Lease':info.leaseId,'X-Specimen-Boot':info.bootId},timeout:15000});
      return session;
    }catch(error){await session.close();throw error;}
  }
  private request(method:string,ordered=true):Promise<any>{
    if(!ordered)return this.send(method,false);
    const next=this.ordered.then(()=>this.send(method,true));this.ordered=next.catch(()=>{});return next;
  }
  private async send(method:string,ordered:boolean):Promise<any>{
    if(this.failure&&method!=='stop')throw this.failure;
    const response=await fetch(`${this.endpoint}/${method}`,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({...this.info,sequence:ordered?++this.sequence:undefined}),signal:AbortSignal.timeout(method==='pin'?35000:10000)});
    if(!response.ok)throw new Error(`Windows worker ${method} HTTP ${response.status}`);
    return response.json();
  }
  private validate(c:any){
    assert.equal(c.os,'Windows 11');assert.equal(c.width,this.width);assert.equal(c.height,this.height);assert.equal(c.dpi,96);assert.equal(c.timeZone,'GMT Standard Time');
    assert.equal(c.bootId,this.info.bootId);assert.equal(c.stationId,this.info.stationId);
    assert(Number.isFinite(c.captureMs)&&c.captureMs>=0);assert(Number.isFinite(c.sourceCapturedAt));
    if(this.bounds)assert.equal(JSON.stringify(c.window),this.bounds,'Windows browser moved after calibration');
  }
  async arrange(page:Page){
    await page.bringToFront();await this.request('arrange');await page.setContent(WINDOWS_CALIBRATION);
    const before=PNG.sync.read(await page.screenshot());
    await this.present(page,this.info.scale);
    const after=PNG.sync.read(await this.screenshot(page));assert.equal(after.width,640);assert.equal(after.height,360);assert(before.data.equals(after.data),'Display scaling changed the sensory image');
    await this.paint(page);const capture=await this.request('capture');this.validate(capture);
    this.viewport=locateWindowsViewport(PNG.sync.read(Buffer.from(capture.png,'base64')),after,this.info.scale);this.bounds=JSON.stringify(capture.window);
  }
  async present(page:Page,scale=1){
    // Playwright setViewportSize restores the native window to normal bounds.
    // Explicit presentation is setup/tab orchestration: maximize again before
    // applying the page metrics. Capture itself never repairs lost focus.
    await this.request('arrange');
    this.presentation={page,scale};let cdp=this.pageSessions.get(page);
    if(!cdp){cdp=await page.context().newCDPSession(page);this.pageSessions.set(page,cdp);}
    const size=page.viewportSize();assert(size,'Station page requires an explicit sensory/layout viewport');
    // Another protocol session can restore its cached metrics. Clear first so
    // Chromium applies these parameters even when our own values repeat.
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.send('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:false,scale,dontSetVisibleSize:true});
    await cdp.send('Emulation.setVisibleSize',{width:Math.round(size.width*scale),height:Math.round(size.height*scale)});
    await this.paint(page);
  }
  private async paint(page:Page){await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));}
  async screenshot(page:Page){
    const cdp=this.pageSessions.get(page);assert(cdp,'Present the station page before capture');
    const size=page.viewportSize();assert(size);
    // The presentation session must also capture the sensory image. A separate
    // session restores its own metrics and silently changes on-screen scale.
    // Only viewport/scroll geometry is read; no DOM target is consulted.
    const {cssVisualViewport}=await cdp.send('Page.getLayoutMetrics');
    // The observation profile uses the actual 1:1 visible Chrome view, including
    // its scrollbar allocation. Scaled legacy/calibration input stays unscaled.
    const shot=await cdp.send('Page.captureScreenshot',this.presentation?.scale===1
      ?{format:'png',fromSurface:false,captureBeyondViewport:false}
      :{format:'png',clip:{x:cssVisualViewport.pageX,y:cssVisualViewport.pageY,...size,scale:1},captureBeyondViewport:true});
    const bytes=Buffer.from(shot.data,'base64'),png=PNG.sync.read(bytes);assert.equal(png.width,size.width);assert.equal(png.height,size.height);return bytes;
  }
  async capture(directory:string,index:number,pageFrame:string,pageCapturedAt:string,cursor:{x:number;y:number}):Promise<DesktopCapture>{
    assert(this.viewport,'Windows desktop must pass pixel calibration first');
    assert(this.presentation);await this.paint(this.presentation.page);
    const requestedAt=Date.now(),started=performance.now(),c=await this.request('capture'),roundTripMs=performance.now()-started;this.validate(c);
    const bytes=Buffer.from(c.png,'base64'),png=PNG.sync.read(bytes);assert.equal(png.width,this.width);assert.equal(png.height,this.height);
    const uncertainty=Math.max(0,(roundTripMs-c.captureMs)/2),capturedAt=new Date(requestedAt+uncertainty).toISOString(),path=`desktop-${String(index).padStart(3,'0')}.png`;
    writeFileSync(join(directory,path),bytes);
    return {path,pageFrame,pageCapturedAt,capturedAt,completedAt:new Date().toISOString(),width:this.width,height:this.height,sha256:sha256(bytes),cursor:{...cursor},captureMs:c.captureMs,roundTripMs:+roundTripMs.toFixed(2),pageLagMs:Date.parse(capturedAt)-Date.parse(pageCapturedAt),source:'windows-gdi',cursorSource:'recorded-page-pointer',sourceCapturedAt:new Date(c.sourceCapturedAt).toISOString(),timestampBasis:'backend-midpoint-estimate',clockUncertaintyMs:+uncertainty.toFixed(2),station:{os:c.os,osBuild:c.osBuild,isolation:'remote-vm',id:this.info.stationId,bootId:this.info.bootId,timeZone:c.timeZone,dpi:c.dpi,viewport:{...this.viewport,scale:this.presentation.scale},window:c.window,taskbar:c.taskbar}};
  }
  async close(){if(this.closed)return;this.closed=true;clearInterval(this.heartbeat);await this.request('stop').catch(()=>{});await this.browser?.close().catch(()=>{});}
  async display(directory:string,runId:string,index:number):Promise<import('../../shared/observation').DisplayFrame>{
    assert(this.viewport);const started=performance.now(),requestedAt=Date.now(),c=await this.request('display'),roundTripMs=performance.now()-started;this.validate(c);
    const bytes=Buffer.from(c.png,'base64'),path=`view-${String(index).padStart(6,'0')}.jpg`,capturedAt=new Date(c.sourceCapturedAt).toISOString();
    writeFileSync(join(directory,path),bytes);
    return {runId,path,seq:index,capturedAt,width:c.width,height:c.height,captureMs:c.captureMs,roundTripMs,source:'windows-gdi',viewport:{...this.viewport,scale:1},sha256:sha256(bytes)};
  }
  async nativeView(directory:string,index:number,cursor:{x:number;y:number}){
    assert(this.viewport&&this.presentation?.scale===1,'Native sensory crops require the calibrated 1:1 Chrome viewport');
    const started=performance.now(),c=await this.request('capture'),roundTripMs=performance.now()-started;this.validate(c);
    const bytes=Buffer.from(c.png,'base64'),full=PNG.sync.read(bytes),size=this.pageSize;
    assert.equal(full.width,this.width);assert.equal(full.height,this.height);
    assert(this.viewport.x>=0&&this.viewport.y>=0&&this.viewport.x+size.width<=full.width&&this.viewport.y+size.height<=full.height);
    const crop=new PNG(size);PNG.bitblt(full,crop,this.viewport.x,this.viewport.y,size.width,size.height,0,0);const png=PNG.sync.write(crop);
    const at=new Date(c.sourceCapturedAt).toISOString(),name=`frame-${String(index).padStart(4,'0')}.png`,path=`desktop-${String(index).padStart(3,'0')}.png`;
    writeFileSync(join(directory,path),bytes);writeFileSync(join(directory,name),png);
    const native:DesktopCapture={path,pageFrame:name,pageCapturedAt:at,capturedAt:at,completedAt:new Date().toISOString(),width:this.width,height:this.height,sha256:sha256(bytes),cursor:{...cursor},captureMs:c.captureMs,roundTripMs,pageLagMs:0,source:'windows-gdi',cursorSource:'not-present',sourceCapturedAt:at,timestampBasis:'native-clock',clockUncertaintyMs:0,station:{os:c.os,osBuild:c.osBuild,isolation:'remote-vm',id:this.info.stationId,bootId:this.info.bootId,timeZone:c.timeZone,dpi:c.dpi,viewport:{...this.viewport,scale:1},window:c.window,taskbar:c.taskbar}};
    return {png,at,name,native};
  }
}
