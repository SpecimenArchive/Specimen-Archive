import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, copyFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
// Reproduce the rejected shader from its real checkpoint, without rewriting it.
const temporary='src/render/.photographic-before-head-fix.ts';
writeFileSync(temporary,execFileSync('git',['-c','safe.directory=C:/path/to/SpecimenArchive','show','766afbd:src/render/photographic.ts']),{flag:'wx'});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1100,height:960},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4317/photographic-study.html',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.photoStudy?.ready);
  const result=await page.evaluate(async()=>{
    const s=window.photoStudy;s.pause();const base=s.renderAt(19);
    const {PhotographicRenderer}=await import('/src/render/.photographic-before-head-fix.ts');
    const oldCanvas=document.createElement('canvas');const old=new PhotographicRenderer(oldCanvas,s.circuit);await old.ready;
    const read=document.createElement('canvas');read.width=1002;read.height=470;const ctx=read.getContext('2d');
    function cycle(draw,canvas){
      const pictures=[];
      for(let k=0;k<12;k++){
        draw({...base,pose:{...base.pose,ciliaPhase:k*Math.PI/6}});ctx.drawImage(canvas,0,0);
        pictures.push(ctx.getImageData(0,0,1002,470).data);
      }
      let headChangedPixels=0,headMaximumChannelDelta=0,appendageChangedPixels=0;
      const first=pictures[0];
      for(let y=0;y<470;y++)for(let x=0;x<1002;x++){
        const i=(y*1002+x)*4;let delta=0;
        for(const p of pictures)for(let ch=0;ch<3;ch++)delta=Math.max(delta,Math.abs(first[i+ch]-p[i+ch]));
        if(x>=440&&x<=558&&y>=88&&y<=153){if(delta)headChangedPixels++;headMaximumChannelDelta=Math.max(headMaximumChannelDelta,delta);}
        else if(delta>3)appendageChangedPixels++;
      }
      return {headChangedPixels,headMaximumChannelDelta,appendageChangedPixels};
    }
    const before=cycle(state=>old.draw(state),oldCanvas),after=cycle(state=>s.diagnosticDraw(state),s.canvas);
    old.dispose();s.renderAt(8);
    return {before,after,phaseSamples:12,roi:{x:440,y:88,width:119,height:66},diagnostic:'Fixed recorded state; only oscillator phase varied. Synthetic diagnostic, not an experiment response.'};
  });
  assert(result.before.headChangedPixels>100,'Must reproduce the head deformation');
  assert.equal(result.after.headChangedPixels,0,'Ciliary beat must not deform head tissue or pigment');
  assert(result.after.appendageChangedPixels>100,'Independent appendage movement must remain');
  writeFileSync('docs/results/head-motion-check.json',JSON.stringify({checkedAt:new Date().toISOString(),...result},null,2)+'\n');
  const oldClip='docs/previews/photographic-motion-head-defect.webm';
  if(!existsSync(oldClip))copyFileSync('docs/previews/photographic-motion.webm',oldClip);
  console.log(JSON.stringify(result,null,2));
} finally {await browser.close();unlinkSync(temporary);}
