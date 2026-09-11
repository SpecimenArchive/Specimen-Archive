import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:960},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:4317/photographic-study.html',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.photoStudy?.ready);
const result=await page.evaluate(async()=>{
  const s=window.photoStudy;s.pause();
  const c=document.createElement('canvas');c.width=1002;c.height=470;const ctx=c.getContext('2d');
  const pixels=t=>{s.renderAt(t);ctx.drawImage(s.canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
  const a=pixels(0),b=pixels(8),again=pixels(8);
  let backgroundChanged=0,bodyChanged=0,frozenChanged=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const i=(y*c.width+x)*4;
    const diff=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
    if((x<300||x>720||y<35||y>445)&&diff)backgroundChanged++;
    else if(diff>3)bodyChanged++;
    if(b[i]!==again[i]||b[i+1]!==again[i+1]||b[i+2]!==again[i+2])frozenChanged++;
  }
  // Same controls and state give bit-identical output after wall time advances.
  await new Promise(r=>setTimeout(r,300));const frozen=pixels(8);
  let wallTimeChanged=0;for(let i=0;i<b.length;i++)if(b[i]!==frozen[i])wallTimeChanged++;
  const states=[0,4,8,12,19.5].map(t=>{const snap=s.renderAt(t);return {wallTime:t,modelTime:snap.modelTime,seq:snap.seq,controls:s.controls()};});
  return {backgroundChanged,bodyChanged,frozenChanged,wallTimeChanged,states};
});
assert.equal(result.backgroundChanged,0,'Background must be independent');
assert.equal(result.frozenChanged,0);assert.equal(result.wallTimeChanged,0);
assert(result.bodyChanged>1000,'Real movement must change the specimen');
for(const t of [0,8,12,19.5]){
  await page.evaluate(t=>window.photoStudy.renderAt(t),t);
  await page.locator('#specimen-still').screenshot({path:`docs/screenshots/photographic-motion-${t}s.png`});
}
await page.setViewportSize({width:390,height:844});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Narrow page must not overflow');
await page.screenshot({path:'docs/screenshots/photographic-study-narrow.png',fullPage:true});
writeFileSync('docs/results/photographic-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),...result,narrowOverflow:false},null,2)+'\n');
console.log(JSON.stringify(result,null,2));await browser.close();
