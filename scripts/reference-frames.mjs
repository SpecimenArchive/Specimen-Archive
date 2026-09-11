import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
await page.goto('http://127.0.0.1:4317');
for(const [file,name] of [['elife-26000-media1.mp4','dic-72hpf-whole-body'],['elife-26000-media2.mp4','dic-72hpf-head'],['elife-02730-media8.mp4','dic-72hpf-bending']]){
  const result=await page.evaluate(async file=>{
    const video=document.createElement('video');video.muted=true;video.src='/data/raw/'+file;document.body.append(video);
    await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error('Video decode failed '+video.error?.message));});
    video.currentTime=.75;await new Promise(r=>video.onseeked=r);
    const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);video.remove();return {image:c.toDataURL('image/png').split(',')[1],duration:video.duration,width:c.width,height:c.height};
  },file);
  writeFileSync('docs/references/'+name+'.png',Buffer.from(result.image,'base64'));console.log(JSON.stringify({file,name,duration:result.duration,width:result.width,height:result.height}));
}
await browser.close();
