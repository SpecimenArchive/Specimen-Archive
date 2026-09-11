import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1000,height:650},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4317',{waitUntil:'networkidle'});
const result=await page.evaluate(async()=>{
  document.getElementById('root').style.display='none';
  const canvas=document.createElement('canvas');canvas.style.cssText='width:1000px;height:650px;display:block';document.body.append(canvas);
  const {drawSpecimen,loadTissue}=await import('/src/render/specimen.ts');loadTissue();
  const snapshots=[],durations=[];let state=await fetch('/api/state').then(r=>r.json()),previous=state,arrival=performance.now(),lastFrame=0;
  const ws=new WebSocket(`ws://${location.host}/stream`);
  ws.onmessage=e=>{const s=JSON.parse(e.data).snapshot;if(s){previous=state;state=s;arrival=performance.now();snapshots.push(s);}};
  let animation;
  const draw=()=>{const now=performance.now();if(lastFrame)durations.push(now-lastFrame);lastFrame=now;let s=state;const a=Math.min(1,(now-arrival)/60);if(previous.runId===state.runId&&state.modelTime-previous.modelTime<.3){const pose={...state.pose};for(const key of Object.keys(pose))pose[key]=previous.pose[key]+(state.pose[key]-previous.pose[key])*a;s={...state,pose};}
    drawSpecimen(canvas,s,{anatomy:false,trails:false,zoom:1,reducedMotion:false});
    const ctx=canvas.getContext('2d');ctx.font='11px monospace';ctx.fillStyle='#5c6d69';ctx.fillText(`RECORDED LIVE · ${state.modelTime.toFixed(2)} SIM S · 0.5× TIME`,30,27);animation=requestAnimationFrame(draw);
  };draw();
  const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  const media=canvas.captureStream(30),recorder=new MediaRecorder(media,{mimeType:mime,videoBitsPerSecond:4500000}),chunks=[];
  recorder.ondataavailable=e=>chunks.push(e.data);const ended=new Promise(r=>recorder.onstop=r);recorder.start();await new Promise(r=>setTimeout(r,12000));recorder.stop();await ended;cancelAnimationFrame(animation);ws.close();media.getTracks().forEach(t=>t.stop());
  const buf=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());let binary='';for(let i=0;i<buf.length;i+=8192)binary+=String.fromCharCode(...buf.subarray(i,i+8192));
  durations.sort((a,b)=>a-b);
  return {video:btoa(binary),snapshots,metrics:{renderedFrames:durations.length,medianFrameMs:durations[Math.floor(durations.length*.5)],p95FrameMs:durations[Math.floor(durations.length*.95)],wallDurationSeconds:12,modelTimeStart:snapshots[0]?.modelTime,modelTimeEnd:snapshots.at(-1)?.modelTime}};
});
mkdirSync('docs/previews',{recursive:true});
writeFileSync('docs/previews/specimen-movement.webm',Buffer.from(result.video,'base64'));
writeFileSync('docs/results/movement-recording.json',JSON.stringify({metrics:result.metrics,snapshots:result.snapshots},null,2)+'\n');
console.log(JSON.stringify(result.metrics));await browser.close();
