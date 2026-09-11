import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,type Browser,type Page} from '@playwright/test';
import {PNG} from 'pngjs';
import {sha256} from '../browser/evidence';
import {WINDOWS_CALIBRATION,locateWindowsViewport} from './windows-geometry';
import type {DesktopCapture} from '../../shared/exhibit';

/** Loopback HTTP travels through an authenticated SSH forward to the remote VM.
 * Connection failure aborts the episode. Commands are never retried. */
export class RemoteDesktopSession {
  browser!:Browser;readonly width=1600;readonly height=900;
  private sequence=0;private heartbeat?:ReturnType<typeof setInterval>;private failure?:Error;private closed=false;
  private viewport?:{x:number;y:number;scale:number};private bounds?:string;
  private constructor(readonly endpoint:string,private token:string,readonly info:{leaseId:string;bootId:string;stationId:string;os:string;isolation:string}){}
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
      assert(/^\/cdp\/[a-f0-9-]+$/.test(info.webSocketPath));
      session.heartbeat=setInterval(()=>{void session.request('heartbeat',false).catch(e=>{session.failure=e;void session.browser?.close().catch(()=>{});});},4000);
      session.browser=await chromium.connectOverCDP(`ws://${url.host}${info.webSocketPath}`,{headers:{Authorization:`Bearer ${token}`,'X-Specimen-Lease':info.leaseId,'X-Specimen-Boot':info.bootId},timeout:15000});
      return session;
    }catch(error){await session.close();throw error;}
  }
  private async request(method:string,ordered=true):Promise<any>{
    if(this.failure&&method!=='stop')throw this.failure;
    const response=await fetch(`${this.endpoint}/${method}`,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({...this.info,sequence:ordered?++this.sequence:undefined}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error(`Windows worker ${method} HTTP ${response.status}`);
    return response.json();
  }
  private validate(c:any){
    assert.equal(c.os,'Windows 11');assert.equal(c.width,1600);assert.equal(c.height,900);assert.equal(c.dpi,96);assert.equal(c.timeZone,'GMT Standard Time');
    assert.equal(c.bootId,this.info.bootId);assert.equal(c.stationId,this.info.stationId);
    assert(Number.isFinite(c.captureMs)&&c.captureMs>=0);assert(Number.isFinite(c.sourceCapturedAt));
    if(this.bounds)assert.equal(JSON.stringify(c.window),this.bounds,'Windows browser moved after calibration');
  }
  async arrange(page:Page){
    await page.bringToFront();await this.request('arrange');await page.setContent(WINDOWS_CALIBRATION);
    const before=PNG.sync.read(await page.screenshot());
    const cdp=await page.context().newCDPSession(page);
    try{await cdp.send('Emulation.setDeviceMetricsOverride',{width:640,height:360,deviceScaleFactor:1,mobile:false,scale:2});
      const after=PNG.sync.read(await page.screenshot());assert.equal(after.width,640);assert.equal(after.height,360);assert(before.data.equals(after.data),'Display scaling changed the sensory image');
      await page.waitForTimeout(150);const capture=await this.request('capture');this.validate(capture);
      this.viewport=locateWindowsViewport(PNG.sync.read(Buffer.from(capture.png,'base64')),after);this.bounds=JSON.stringify(capture.window);
    }finally{await cdp.detach();}
  }
  async capture(directory:string,index:number,pageFrame:string,pageCapturedAt:string,cursor:{x:number;y:number}):Promise<DesktopCapture>{
    assert(this.viewport,'Windows desktop must pass pixel calibration first');
    const requestedAt=Date.now(),started=performance.now(),c=await this.request('capture'),roundTripMs=performance.now()-started;this.validate(c);
    const bytes=Buffer.from(c.png,'base64'),png=PNG.sync.read(bytes);assert.equal(png.width,1600);assert.equal(png.height,900);
    const uncertainty=Math.max(0,(roundTripMs-c.captureMs)/2),capturedAt=new Date(requestedAt+uncertainty).toISOString(),path=`desktop-${String(index).padStart(3,'0')}.png`;
    writeFileSync(join(directory,path),bytes);
    return {path,pageFrame,pageCapturedAt,capturedAt,completedAt:new Date().toISOString(),width:1600,height:900,sha256:sha256(bytes),cursor:{...cursor},captureMs:c.captureMs,roundTripMs:+roundTripMs.toFixed(2),pageLagMs:Date.parse(capturedAt)-Date.parse(pageCapturedAt),source:'windows-gdi',cursorSource:'recorded-page-pointer',sourceCapturedAt:new Date(c.sourceCapturedAt).toISOString(),timestampBasis:'backend-midpoint-estimate',clockUncertaintyMs:+uncertainty.toFixed(2),station:{os:c.os,osBuild:c.osBuild,isolation:'remote-vm',id:this.info.stationId,bootId:this.info.bootId,timeZone:c.timeZone,dpi:c.dpi,viewport:this.viewport,window:c.window,taskbar:c.taskbar}};
  }
  async close(){if(this.closed)return;this.closed=true;clearInterval(this.heartbeat);await this.request('stop').catch(()=>{});await this.browser?.close().catch(()=>{});}
}
