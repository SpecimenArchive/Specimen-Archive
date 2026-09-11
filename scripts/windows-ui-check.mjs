import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.EXHIBIT_URL||'http://127.0.0.1:4319',out='runtime/windows-review';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
const errors=[],checks=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('.apparatus-panel[data-desktop-frame]');
  for(const [width,height] of [[1440,1050],[1920,1080],[1024,768],[390,844]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const ids=await page.locator('.apparatus-panel,.connected-views>section').evaluateAll(es=>es.map(e=>[e.dataset.runId,e.dataset.modelStep]));assert(ids.every(v=>JSON.stringify(v)===JSON.stringify(ids[0])));
    await page.screenshot({path:`${out}/dashboard-${width}.png`,fullPage:width===1440});
    await page.getByRole('button',{name:'Expand station'}).click();await page.screenshot({path:`${out}/expanded-${width}.png`});
    if(width===1440){const canvas=page.locator('.apparatus-image canvas');await canvas.screenshot({path:`${out}/monitor-apparatus.png`});const box=await canvas.boundingBox(),scale=box.width/1659;await page.screenshot({path:`${out}/monitor-close-up.png`,clip:{x:box.x+855*scale,y:box.y+145*scale,width:690*scale,height:425*scale}});await page.screenshot({path:`${out}/marker-close-up.png`,clip:{x:box.x+385*scale,y:box.y+655*scale,width:425*scale,height:185*scale}});}
    await page.keyboard.press('Escape');assert.equal(await page.locator('.station-expanded').count(),0);
    checks.push({width,height,overflow:false,fourViewsMatch:true,expandEscape:true});
  }
  const station=await browser.newPage({viewport:{width:1280,height:720}}),captureRequests=[];station.on('pageerror',e=>errors.push(e.message));
  station.on('request',r=>{if(r.url().includes('/api/exhibit/artifacts/'))captureRequests.push(r.url());});
  await station.goto(base+'/?display=workstation');await station.waitForSelector('.session-line[data-run-id]');
  await station.waitForTimeout(3000);
  assert.equal(await station.locator('.apparatus-panel').count(),0);assert.equal(await station.locator('.controlled-image img,.retina-block img').count(),0);assert.equal(captureRequests.length,0);
  assert.equal(await station.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await station.screenshot({path:`${out}/workstation-mode.png`,fullPage:true});
  const live=await(await fetch(base+'/api/exhibit/live')).json();
  assert.equal(live.desktop?.source,'windows-gdi');assert.equal(live.sourceDirty,false);
  if(live.desktop){const response=await fetch(`${base}/api/exhibit/artifacts/${live.runId}/${live.desktop.path}`);assert(response.ok);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),live.desktop.sha256);writeFileSync(`${out}/unwarped-${live.desktop.source}.png`,bytes);}
  const mutation=await fetch(base+'/api/exhibit/live',{method:'POST'});assert.equal(mutation.status,405);
  const result={checkedAt:new Date().toISOString(),backendSourceRevision:live.sourceRevision,backendSourceDirty:live.sourceDirty,sessionId:live.sessionId,captureSource:live.desktop?.source,frontend:'VM production frontend; backend source revision recorded above.',checks,workstation:{capturesRequested:0,embeddedCaptures:0,liveData:true},mutationHTTP:mutation.status,errors};
  writeFileSync('docs/results/windows-ui.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));assert.equal(errors.length,0);
}finally{await browser.close();}
