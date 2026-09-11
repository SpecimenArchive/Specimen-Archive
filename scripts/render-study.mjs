// Capture the renderer against one unmodified, recorded authoritative snapshot.
// This page-only observation harness cannot write experiment state.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
const mode=process.argv[2]||'before';
mkdirSync('docs/screenshots',{recursive:true});mkdirSync('docs/results',{recursive:true});
const stateFile='docs/results/render-study-state.json';
if(!existsSync(stateFile)){
  const records=readdirSync('runtime').filter(f=>f.endsWith('.jsonl')).sort();
  const frames=records.flatMap(f=>readFileSync('runtime/'+f,'utf8').trim().split('\n').flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}}));
  const s=frames.find(s=>s.modelTime>18&&s.modelTime<24)||frames[0];
  if(!s)throw new Error('No recorded frame to review');writeFileSync(stateFile,JSON.stringify(s,null,2)+'\n');
}
const state=JSON.parse(readFileSync(stateFile,'utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1000,height:650},deviceScaleFactor:2});
await page.goto('http://127.0.0.1:4317',{waitUntil:'networkidle'});
await page.evaluate(async s=>{
  document.getElementById('root').style.display='none';
  const canvas=document.createElement('canvas');canvas.id='study';canvas.style.cssText='width:1000px;height:650px;display:block';document.body.append(canvas);
  const renderer=await import('/src/render/specimen.ts');renderer.loadTissue();
  await new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src='/assets/tissue-texture.png';});
  renderer.drawSpecimen(canvas,s,{anatomy:false,trails:false,zoom:1,reducedMotion:false});
},state);
await page.locator('#study').screenshot({path:`docs/screenshots/specimen-${mode}.png`});
console.log(JSON.stringify({mode,state:{runId:state.runId,seq:state.seq,modelTime:state.modelTime,pose:state.pose},viewport:'1000x650 CSS px; DPR 2; unchanged scale'}));
await browser.close();
