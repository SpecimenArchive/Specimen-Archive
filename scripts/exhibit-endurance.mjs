import {chromium} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const duration=Number(process.env.EXHIBIT_CHECK_SECONDS||600),base=process.env.EXHIBIT_URL||'http://127.0.0.1:4317';
mkdirSync('runtime/integrated-preview',{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
const errors=[],observations=[],startedAt=new Date().toISOString(),start=performance.now();let matchingPackets=0,reconnected=false,previewSaved=false;
async function observer(record=false){
  const context=await browser.newContext({viewport:{width:1440,height:1050},...(record?{recordVideo:{dir:'runtime/integrated-preview',size:{width:1440,height:1050}}}:{})});
  await context.addInitScript(()=>{
    window.__audit=[];window.__sockets=[];window.__frameTimes=[];
    const Base=window.WebSocket;window.WebSocket=class extends Base{constructor(...args){super(...args);window.__sockets.push(this);this.addEventListener('message',e=>{try{const p=JSON.parse(e.data).exhibit;if(!p)return;window.__audit.push({packet:p.packetSeq,session:p.sessionId,run:p.runId,step:p.snapshot?.seq,state:p.state,command:p.commandId,signature:JSON.stringify([p.snapshot?.activity,p.input,p.command,p.history])});if(window.__audit.length>600)window.__audit.shift();}catch{}});}};
    let last=0;function frame(t){if(last){window.__frameTimes.push(t-last);if(window.__frameTimes.length>2000)window.__frameTimes.shift();}last=t;requestAnimationFrame(frame)}requestAnimationFrame(frame);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForSelector('.session-line[data-model-step]');return {context,page};
}
let a=await observer(true),b=await observer();const video=a.page.video();const healthStart=await (await fetch(base+'/api/health')).json(),sessionId=healthStart.sessionId;
await a.page.locator('.apparatus-heading button').click();await a.page.locator('.apparatus-panel').scrollIntoViewIfNeeded();
let previewClosed=false,inspected=false,returned=false,lastCompared=0,freeze=null;
while((performance.now()-start)/1000<duration){
  const elapsed=(performance.now()-start)/1000;
  if(elapsed>7&&!previewClosed){await a.page.locator('.apparatus-panel').screenshot({path:'runtime/integrated-preview/apparatus.png'});await a.page.locator('.apparatus-heading button').click();await a.page.evaluate(()=>scrollTo(0,0));previewClosed=true;}
  if(elapsed>30&&!inspected){const actions=a.page.locator('.action-feed>button');if(await actions.count()){await actions.first().click();await a.page.waitForSelector('.causal-chain');await a.page.screenshot({path:'runtime/integrated-preview/causal-chain.png',fullPage:true});inspected=true;}}
  if(elapsed>37&&inspected&&!returned){await a.page.getByRole('button',{name:'Return to current session'}).click();await a.page.evaluate(()=>scrollTo(0,0));returned=true;}
  if(elapsed>45&&!previewSaved){await a.page.screenshot({path:'runtime/integrated-preview/connected-views.png',fullPage:true});await a.context.close();await video.saveAs('runtime/integrated-preview/integrated-45s.webm');await video.delete();a=await observer();previewSaved=true;}
  if(elapsed>Number(process.env.EXHIBIT_DISCONNECT_AT||90)&&!reconnected){
    await b.context.setOffline(true);await b.page.evaluate(()=>window.__sockets.forEach(s=>s.close()));await b.page.waitForTimeout(1000);
    const before=await b.page.locator('.specimen-canvas').evaluate(c=>({png:c.toDataURL(),step:document.querySelector('.session-line').dataset.modelStep,sockets:window.__sockets.map(s=>s.readyState)}));await b.page.waitForTimeout(1500);const after=await b.page.locator('.specimen-canvas').evaluate(c=>({png:c.toDataURL(),step:document.querySelector('.session-line').dataset.modelStep,sockets:window.__sockets.map(s=>s.readyState)}));freeze=before.png===after.png;writeFileSync('runtime/disconnect-diagnostic.json',JSON.stringify({before:{...before,png:undefined},after:{...after,png:undefined},freeze}));assert(freeze,'Specimen must freeze on lost signal');
    await b.context.setOffline(false);await b.page.waitForFunction(()=>document.querySelector('.exhibit-status')?.textContent==='LIVE',null,{timeout:15000});reconnected=true;
  }
  const [aa,bb]=await Promise.all([a.page,b.page].map(p=>p.evaluate(()=>window.__audit)));
  const bm=new Map(bb.map(p=>[p.packet,p]));for(const p of aa){if(p.packet<=lastCompared)continue;const q=bm.get(p.packet);if(q){assert.equal(p.session,q.session);assert.equal(p.run,q.run);assert.equal(p.step,q.step);assert.equal(p.signature,q.signature);matchingPackets++;lastCompared=p.packet;}}
  for(const p of [a.page,b.page]){const ids=await p.locator('.connected-views>section').evaluateAll(els=>els.map(e=>[e.getAttribute('data-run-id'),e.getAttribute('data-model-step')]));assert(ids.every(v=>JSON.stringify(v)===JSON.stringify(ids[0])),'All three primary views share a render packet');}
  const h=await (await fetch(base+'/api/health')).json();assert.equal(h.sessionId,sessionId);assert.equal(h.mode,'exhibit');
  observations.push({elapsed:+elapsed.toFixed(2),runId:h.runId,modelStep:h.seq,clients:h.clients,metrics:h.exhibit});
  if(observations.length%6===0)console.log(JSON.stringify({elapsed:Math.round(elapsed),matchingPackets,episodes:h.exhibit?.episodes,rssMB:h.exhibit?.rssMB}));
  await a.page.waitForTimeout(2000);
}
const frames=await b.page.evaluate(()=>window.__frameTimes);frames.sort((a,b)=>a-b);
const healthEnd=await (await fetch(base+'/api/health')).json(),result={startedAt,completedAt:new Date().toISOString(),durationSeconds:(performance.now()-start)/1000,sessionId,matchingPackets,reconnected,offlineSpecimenExact:freeze,previewSaved,inspected,errors,animationFrameCallbackIntervalMs:{definition:'requestAnimationFrame scheduling interval; not actual specimen draw cadence, which is capped at 60 Hz',median:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],sampleCount:frames.length},healthStart,healthEnd,observations};
writeFileSync(process.env.EXHIBIT_CHECK_REPORT||'docs/results/exhibit-endurance.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,observations:observations.length},null,2));
await browser.close();assert.equal(errors.length,0);if(duration>=600){assert(matchingPackets>1000);assert(reconnected);assert(healthEnd.exhibit.episodes>=3);}
