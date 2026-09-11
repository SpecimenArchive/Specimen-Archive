import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.EXHIBIT_URL||'http://127.0.0.1:4318';
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)}),page=await browser.newPage({viewport:{width:1440,height:1050}}),samples=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
// Deliberately delay only presentation files. All actions stay in the backend.
await page.route('**/api/exhibit/artifacts/**/desktop-*.png',async route=>{await new Promise(r=>setTimeout(r,800));await route.continue();});
await page.goto(base);await page.waitForSelector('.apparatus-panel[data-desktop-frame]');const start=Date.now();let previous;
while(Date.now()-start<15000){
  const sample=await page.locator('.apparatus-panel,.connected-views>section').evaluateAll(es=>es.map(e=>({run:e.dataset.runId,step:Number(e.dataset.modelStep),desktop:e.dataset.desktopFrame})));
  if(sample[0].run){assert(sample.every(e=>e.run===sample[0].run&&e.step===sample[0].step));if(previous?.run===sample[0].run)assert(sample[0].step>=previous.step,'Delayed image must never rewind the neural sample');previous=sample[0];samples.push(sample[0]);}
  await page.waitForTimeout(25);
}
assert.equal(errors.length,0);const result={checkedAt:new Date().toISOString(),delayMs:800,observations:samples.length,framePairs:new Set(samples.map(s=>s.desktop)).size,monotonic:true,fourViewsAligned:true,errors};writeFileSync('docs/results/workstation-latency.json',JSON.stringify(result,null,2));await browser.close();console.log(result);
