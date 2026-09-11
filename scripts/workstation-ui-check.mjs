import { chromium } from '@playwright/test';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import assert from 'node:assert/strict';
const base=process.env.EXHIBIT_URL||'http://127.0.0.1:4318',out='runtime/workstation-review';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)}),errors=[],views=[];
const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('.apparatus-panel[data-desktop-frame]');
for(const [width,height] of [[1440,1050],[1920,1080],[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/dashboard-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const ids=await page.locator('.apparatus-panel,.connected-views>section').evaluateAll(es=>es.map(e=>[e.dataset.runId,e.dataset.modelStep]));assert(ids.every(v=>JSON.stringify(v)===JSON.stringify(ids[0])));
  await page.getByRole('button',{name:'Expand station'}).click();await page.screenshot({path:`${out}/expanded-${width}.png`});await page.keyboard.press('Escape');
  assert.equal(await page.locator('.station-expanded').count(),0);views.push({width,height,overflow:false,fourViewsMatch:true,expandedAndEscape:true});
}
await page.setViewportSize({width:1659,height:1080});
// Optical QA renders actual captured desktops through the production shader;
// its separate canvas never modifies the live session.
const calibration=JSON.parse(readFileSync('runtime/desktop-optics/calibration.json','utf8')),optical=[];
for(const record of calibration.records){
  const data='data:image/png;base64,'+readFileSync('runtime/desktop-optics/'+record.path).toString('base64');
  const result=await page.evaluate(async data=>{
    const {createApparatusRenderer}=await import('/src/render/apparatus.ts');
    const canvas=document.createElement('canvas');canvas.width=1659;canvas.height=948;const renderer=createApparatusRenderer(canvas);
    const load=src=>new Promise(r=>{const image=new Image();image.onload=()=>r(image);image.src=src;});
    renderer.bench(await load('/assets/apparatus-master-v3-labelled.png'));renderer.draw(await load(data));const png=canvas.toDataURL();renderer.dispose();return png;
  },data);
  const bytes=Buffer.from(result.split(',')[1],'base64');writeFileSync(`${out}/composite-${record.theme}.png`,bytes);
  const composed=PNG.sync.read(bytes),source=PNG.sync.read(readFileSync('public/assets/apparatus-master-v3-labelled.png'));let changedOutside=0;
  const {homography,invert3,project,screenPlacement:P}=await import('../src/render/screen-placement.ts');const inverse=invert3(homography(P.corners));
  for(let y=0;y<948;y++)for(let x=0;x<1659;x++){
    const [u,v]=project(inverse,x+.5,y+.5);if(u>=-.003&&u<=1.003&&v>=-.003&&v<=1.003)continue;
    const i=(y*1659+x)*4;if([0,1,2].some(c=>Math.abs(source.data[i+c]-composed.data[i+c])>1))changedOutside++;
  }
  assert.equal(changedOutside,0,'The bezel and scene outside the display must remain unchanged');optical.push({theme:record.theme,changedOutside});
}
writeFileSync('docs/results/workstation-ui.json',JSON.stringify({checkedAt:new Date().toISOString(),views,optical,errors},null,2));await browser.close();assert.equal(errors.length,0);console.log({views,optical,errors});
