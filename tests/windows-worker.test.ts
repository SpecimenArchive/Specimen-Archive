import test from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {WorkerLease} from '../server/exhibit/worker-lease';
import {locateWindowsViewport} from '../server/exhibit/windows-geometry';

test('worker requires authentication, rejects concurrent owners, duplicate commands and old boots',()=>{
  let now=0;const lease=new WorkerLease('a'.repeat(64),20000,()=>now);
  assert.equal(lease.authorize(undefined),false);assert.equal(lease.authorize(`Bearer ${'b'.repeat(64)}`),false);assert.equal(lease.authorize(`Bearer ${'a'.repeat(64)}`),true);
  const first=lease.acquire();assert.throws(()=>lease.acquire(),/already leased/);
  lease.command(first.leaseId,first.bootId,1);assert.throws(()=>lease.command(first.leaseId,first.bootId,1),/Stale/);
  assert.throws(()=>lease.command(first.leaseId,first.bootId,3),/out-of-order/);
  assert.throws(()=>lease.command(first.leaseId,'other-boot',2),/foreign/);
  now=20000;assert(lease.expired());assert.throws(()=>lease.heartbeat(first.leaseId,first.bootId),/Expired/);
  assert.throws(()=>lease.acquire(),/cleanup/);lease.release();const second=lease.acquire();assert.notEqual(first.leaseId,second.leaseId);
  assert.throws(()=>lease.command(first.leaseId,first.bootId,2),/foreign/);
});
test('Windows calibration checks every scaled pixel and rejects clipped or shifted presentation',()=>{
  const input=new PNG({width:640,height:360}),desktop=new PNG({width:1600,height:900});
  for(let y=0;y<360;y++)for(let x=0;x<640;x++){
    const color=[x<320?211:29,y<180?31:197,x<320?53:73,255];input.data.set(color,(y*640+x)*4);
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)desktop.data.set(color,((100+y*2+dy)*1600+150+x*2+dx)*4);
  }
  assert.deepEqual(locateWindowsViewport(desktop,input),{x:150,y:100,scale:2});
  desktop.data[((100+350*2)*1600+150+630*2)*4]=0;
  assert.throws(()=>locateWindowsViewport(desktop,input),/complete/);
});
test('persistent 1280x800 console uses calibrated 1.5x presentation without changing sensory dimensions',()=>{
  const input=new PNG({width:640,height:360}),desktop=new PNG({width:1280,height:800});
  for(let y=0;y<360;y++)for(let x=0;x<640;x++)input.data.set([x<320?211:29,y<180?31:197,x<320?53:73,255],(y*640+x)*4);
  for(let y=0;y<540;y++)for(let x=0;x<960;x++){
    const p=(Math.floor(y/1.5)*640+Math.floor(x/1.5))*4;
    desktop.data.set(input.data.subarray(p,p+4),((100+y)*1280+150+x)*4);
  }
  assert.deepEqual(locateWindowsViewport(desktop,input,1.5),{x:150,y:100,scale:1.5});
  assert.throws(()=>locateWindowsViewport(desktop,input,2),/Unconfigured/);
  desktop.data[((100+539)*1280+150+959)*4]=0;
  assert.throws(()=>locateWindowsViewport(desktop,input,1.5),/complete/);
});
