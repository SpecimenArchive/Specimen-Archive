import { chromium } from '@playwright/test';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.EXHIBIT_URL||'http://127.0.0.1:4317',out=process.env.WORKSTATION_REVIEW_DIR||'runtime/workstation-review',report=process.env.WORKSTATION_REVIEW_REPORT||`${out}/recording.json`;mkdirSync(out,{recursive:true});
// Observe an early live movement window; never drive/reset the controller.
const deadline=Date.now()+240000;let live;
do{live=await(await fetch(base+'/api/exhibit/live')).json();if(live.decision>=7&&live.decision<=10)break;if(Date.now()>deadline)throw new Error('No early live window before recording deadline');await new Promise(r=>setTimeout(r,1000));}while(true);
const provenance={sourceRevision:live.sourceRevision,sourceDirty:live.sourceDirty,sessionId:live.sessionId,runId:live.runId,configSha256:live.configSha256,dataVersion:live.dataVersion};
if(process.env.WORKSTATION_REQUIRE_CLEAN==='1')assert.equal(provenance.sourceDirty,false,'Review requires a clean executed source revision');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
const context=await browser.newContext({viewport:{width:1440,height:1050},recordVideo:{dir:out,size:{width:1440,height:1050}}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);await page.waitForSelector('.apparatus-panel[data-desktop-frame]');await page.getByRole('button',{name:'Expand station'}).click();const video=page.video(),start=Date.now(),states=[];let last='';
while(Date.now()-start<55000){
  live=await(await fetch(base+'/api/exhibit/live')).json();
  assert.equal(live.sourceRevision,provenance.sourceRevision);assert.equal(live.sessionId,provenance.sessionId);
  if(live.browserFrame!==last){last=live.browserFrame;states.push({elapsedMs:Date.now()-start,runId:live.runId,decision:live.decision,desktop:live.desktop,history:live.history});await page.screenshot({path:`${out}/sequence-${String(states.length).padStart(2,'0')}.png`});}
  await new Promise(r=>setTimeout(r,200));
}
const elapsedMs=Date.now()-start;await context.close();await video.saveAs(`${out}/workstation-55s.webm`);await video.delete();await browser.close();
const events=[...new Map(states.flatMap(s=>s.history).map(e=>[e.commandId,e])).values()].filter(e=>Date.parse(e.timestamp)>=start);
const videoBytes=readFileSync(`${out}/workstation-55s.webm`);
const result={...provenance,startedAt:new Date(start).toISOString(),elapsedMs,video:{file:`${out}/workstation-55s.webm`,bytes:videoBytes.length,sha256:createHash('sha256').update(videoBytes).digest('hex')},events,states,errors};writeFileSync(report,JSON.stringify(result,null,2));console.log({provenance,elapsedMs,video:result.video,events:events.map(e=>[e.kind,e.detail]),errors});assert.equal(errors.length,0);assert(events.some(e=>e.kind==='move'));assert(events.some(e=>e.kind==='scroll'));assert(events.some(e=>e.detail.includes('navigation')));
