import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:960},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:4317/photographic-study.html',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.photoStudy?.ready);
await page.locator('#specimen-still').screenshot({path:'docs/screenshots/photographic-still-v2-panel.png'});
await page.screenshot({path:'docs/screenshots/photographic-still-v2-review.png',fullPage:true});
const result=await page.evaluate(()=>{
  const p=window.photoStudy;
  const s=p.renderAt(8);
  return {viewport:{width:p.canvas.width,height:p.canvas.height},controls:p.controls(),modelTime:s.modelTime,
    motor:s.motor,bodyText:document.body.innerText,range:p.frames.reduce((r,s)=>({min:Math.min(r.min,s.pose.bend),max:Math.max(r.max,s.pose.bend)}),{min:Infinity,max:-Infinity})};
});
console.log(JSON.stringify({...result,bodyText:undefined,encodingClean:!/[\u00c2\u00c3\ufffd]/.test(result.bodyText),errors},null,2));
if(process.argv.includes('--record')) {
  const recording=await page.evaluate(async()=>{
    const p=window.photoStudy;p.pause();p.renderAt(0);
    const stream=p.canvas.captureStream(60);
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
    const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
    const ended=new Promise(r=>recorder.onstop=r);
    p.timings.length=0;recorder.start();const start=performance.now();p.play();
    await new Promise(r=>setTimeout(r,19500));p.pause();recorder.stop();await ended;
    const wallDuration=(performance.now()-start)/1000;
    stream.getTracks().forEach(t=>t.stop());
    const bytes=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());
    let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    const times=p.timings.slice().sort((a,b)=>a-b);
    return {base64:btoa(binary),mime,wallDuration,frames:p.timings.length,medianFrameMs:times[Math.floor(times.length*.5)],p95FrameMs:times[Math.floor(times.length*.95)],modelStart:p.start,modelEnd:p.start+9.75};
  });
  writeFileSync('docs/previews/photographic-motion.webm',Buffer.from(recording.base64,'base64'));
  const measured={...recording,base64:undefined,capturedAt:new Date().toISOString(),errors};
  writeFileSync('docs/results/photographic-recording.json',JSON.stringify(measured,null,2)+'\n');
  console.log(JSON.stringify(measured,null,2));
}
await browser.close();
if(errors.length)process.exitCode=1;
