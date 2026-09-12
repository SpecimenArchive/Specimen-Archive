import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve,sep} from 'node:path';import {PNG} from 'pngjs';
import {ExperienceStore,visualDescriptor,visualDistance,canonicalPage} from '../server/memory/store';import {checkpoint,learn,retryBudget,adapterContext} from '../server/memory/adapter';import type {Circuit} from '../shared/types';import type {ExhibitDecision} from '../shared/exhibit';import type {Encounter} from '../shared/observation';
const circuit=JSON.parse(readFileSync('data/processed/circuit.json','utf8')) as Circuit;
test('Canonical research URLs survive reload; invalid stored state cannot silently overwrite prior evidence',()=>{
 const url='https://jekelylab.github.io/Platynereis_connectome/';assert.equal(canonicalPage(canonicalPage(url)),canonicalPage(url));
 const directory=mkdtempSync(join(tmpdir(),'specimen-memory-corrupt-')),root=join(directory,'memory');mkdirSync(root);writeFileSync(join(root,'memory.json'),'{broken');assert.throws(()=>new ExperienceStore(directory,circuit,'test','frozen'),/refusing to overwrite/);assert.equal(readFileSync(join(root,'memory.json'),'utf8'),'{broken');assert(directory.startsWith(resolve(tmpdir())+sep));rmSync(directory,{recursive:true,force:true});
});
test('New encounter details survive store restart; explicit retrieval differs from disabled retrieval and telemetry is aggregated',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'specimen-memory-')),png=new PNG({width:64,height:64});png.data.fill(150);const bytes=PNG.sync.write(png),at=new Date().toISOString(),url='https://www.ponsfamily.com/launchpad/0x'+'1'.repeat(40),encounter:Encounter={id:url,visitId:'visit-test',label:'A newly encountered page 84571',url,kind:'coin',enteredAt:at,source:'orchestration',tokenAddress:'0x'+'1'.repeat(40),runId:'exhibit_test',transitionId:'test-navigation'};
 const store=new ExperienceStore(directory,circuit,'test-source','train');assert.equal(store.find({url}).length,0);store.encounter(encounter,bytes,0);
 for(let i=0;i<30;i++){const d={runId:'exhibit_test',sessionId:'session_test',commandId:`exhibit_test:c${i}`,decision:i,completedAt:at,imageBefore:'frame-0000.png',input:{left:.65,right:.15,encoding:'upper-texture'},motor:{mean:.578,contrast:-.02},command:{kind:'scroll',wheelY:-48},receipt:{status:'boundary',scrollBefore:0,scrollAfter:0},context:{sourceRevision:'test-source',configSha256:'test-config'}} as ExhibitDecision;store.observe(encounter,d);}
 await store.flush();const restarted=new ExperienceStore(directory,circuit,'test-source','disabled');assert.equal(restarted.find({url},false).length,0);const found=restarted.find({url});assert.equal(found.length,1);assert.equal(found[0].title,encounter.label);assert.equal(found[0].outcomes.boundary,30);assert.equal(found[0].evidence.length,12);assert.equal(found[0].evidence[0].decision,0);
 const recall=restarted.encounter({...encounter,runId:'exhibit_after_restart'},bytes,0);assert.equal(recall.retrievedIds[0],found[0].id);assert(recall.matches[0].methods.includes('canonical-url'));assert(recall.matches[0].methods.includes('coarse-visual-similarity'));assert.equal(recall.usedIds.length,0);await restarted.flush();assert.equal(restarted.view().stored,1);
 assert(directory.startsWith(resolve(tmpdir())+sep));rmSync(directory,{recursive:true,force:true});
});
test('Engineering adapter learns from outcomes, preserves baseline and freezes without mutating model parameters',()=>{
 const context=adapterContext('coin','upper-texture',-48);let s=checkpoint();assert.equal(retryBudget(s,context),3);
 for(let i=0;i<5;i++)s=learn(s,context,'boundary','memory-a');assert.equal(retryBudget(s,context),1);const frozen=JSON.stringify(s);for(let i=0;i<20;i++)retryBudget(s,context);assert.equal(JSON.stringify(s),frozen);
 assert.equal(learn(s,context,'failed','bad'),s);assert.equal(learn(s,context,'policy-blocked','bad'),s);
 for(let i=0;i<20;i++)s=learn(s,context,'moved','memory-b');assert.equal(retryBudget(s,context),3);assert.equal(retryBudget(s,'unseen'),3);
 for(let i=0;i<500;i++)s=learn(s,context,'boundary','memory-c');assert(s.cells[context].boundary+s.cells[context].moved<=200.00001);assert.equal(s.cells[context].evidenceIds.length,3);
});
test('Visual similarity is explicit and distinct from URL lookup; private pages are rejected',()=>{
 const a=new PNG({width:64,height:64}),b=new PNG({width:64,height:64});a.data.fill(0);b.data.fill(255);assert.equal(visualDistance(visualDescriptor(PNG.sync.write(a)),visualDescriptor(PNG.sync.write(a))),0);assert.equal(visualDistance(visualDescriptor(PNG.sync.write(a)),visualDescriptor(PNG.sync.write(b))),15);
 const directory=mkdtempSync(join(tmpdir(),'specimen-memory-reject-')),store=new ExperienceStore(directory,circuit,'test','disabled');assert.throws(()=>store.find({url:'http://127.0.0.1:4317/admin'}));assert(directory.startsWith(resolve(tmpdir())+sep));rmSync(directory,{recursive:true,force:true});
});
