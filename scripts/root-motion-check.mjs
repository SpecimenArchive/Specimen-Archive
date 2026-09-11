import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, copyFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const temporary='src/render/.photographic-before-root-fix.ts';
writeFileSync(temporary,execFileSync('git',['-c','safe.directory=C:/path/to/SpecimenArchive','show','2a18bd2:src/render/photographic.ts']),{flag:'wx'});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:960},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4317/photographic-study.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.photoStudy?.ready);
 const result=await page.evaluate(async()=>{
  const s=window.photoStudy;s.pause();const b=s.renderAt(19),base={...b,pose:{...b.pose,bend:0,heading:-.18}};
  const {PhotographicRenderer}=await import('/src/render/.photographic-before-root-fix.ts');
  const oldCanvas=document.createElement('canvas'),old=new PhotographicRenderer(oldCanvas,s.circuit);await old.ready;
  const c=document.createElement('canvas');c.width=1002;c.height=470;const ctx=c.getContext('2d');
  const roots=[[.445,.371],[.565,.331],[.461,.533],[.580,.512],[.487,.707],[.586,.690]];
  function cycle(draw,canvas){
   const images=[];for(let k=0;k<12;k++){draw({...base,pose:{...base.pose,ciliaPhase:k*Math.PI/6}});ctx.drawImage(canvas,0,0);images.push(ctx.getImageData(0,0,1002,470).data);}
   return roots.map(([x,y])=>{
    const cx=Math.round((x-.5)*.84*1002+501),cy=Math.round((y-.5)*.84*470+235);let changed=0,maximumDelta=0;
    for(let yy=cy-8;yy<=cy+8;yy++)for(let xx=cx-8;xx<=cx+8;xx++){
      const i=(yy*1002+xx)*4;let delta=0;
      for(const p of images)for(let ch=0;ch<3;ch++)delta=Math.max(delta,Math.abs(p[i+ch]-images[0][i+ch]));
      if(delta)changed++;maximumDelta=Math.max(maximumDelta,delta);
    }return {source:[x,y],viewport:[cx,cy],changed,maximumDelta};
   });
  }
  const before=cycle(state=>old.draw(state),oldCanvas),after=cycle(state=>s.diagnosticDraw(state),s.canvas);old.dispose();s.renderAt(8);return {before,after};
 });
 assert(result.before.some(r=>r.changed>10),'Must reproduce attachment distortion');
 assert(result.after.every(r=>r.changed===0),'All six protected roots must remain fixed through beat phase');
 writeFileSync('docs/results/root-motion-check.json',JSON.stringify({checkedAt:new Date().toISOString(),diagnostic:'Recorded activity with pose held at registration angle and zero bend; twelve oscillator phases. 17x17 pixel ROI at each of six roots. Synthetic renderer regression.',...result},null,2)+'\n');
 if(!existsSync('docs/previews/photographic-motion-root-defect.webm'))copyFileSync('docs/previews/photographic-motion.webm','docs/previews/photographic-motion-root-defect.webm');
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();unlinkSync(temporary);}
