import assert from 'node:assert/strict';
import {writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {ExhibitService} from '../server/exhibit/service';
import {loadCircuit} from '../server/browser/runner';
process.env.RECORDER_ENABLED='0';process.env.EXHIBIT_FAULT_AFTER='2';
const states:{runId:string;episode:number;state:string;step:number;notice:string}[]=[],startedAt=new Date().toISOString();
const service=new ExhibitService(resolve('runtime',`recovery-${Date.now()}`),loadCircuit(),live=>{
  const last=states.at(-1);if(last?.state!==live.state||last?.runId!==live.runId)states.push({runId:live.runId,episode:live.episode,state:live.state,step:live.snapshot?.seq??0,notice:live.notice});
  if(live.episode===1&&(live.snapshot?.seq??0)>=30)service.abort.abort(new Error('Recovery verifier completed after observing the next intact episode'));
});
await service.start();
const records=service.store.records().reverse();assert.equal(records.length,2);assert.equal(records[0].outcome,'error');assert.equal(records[0].decisions.length,2);assert(states.some(s=>s.state==='recovering'));assert(states.some(s=>s.episode===1&&s.state==='integrating'));assert.equal(records[1].decisions.length,0);assert.notEqual(records[0].id,records[1].id);assert.equal(records[0].sessionId,records[1].sessionId);assert(existsSync(resolve(service.root,records[0].id,'browser.webm')),'Fault recording must remain accessible');
const result={startedAt,completedAt:new Date().toISOString(),sessionId:service.sessionId,explicitFault:'Close controlled browser before decision 2; publication disabled',recovered:true,noPartialWindowAction:true,states,records:records.map(r=>({id:r.id,origin:r.origin,outcome:r.outcome,error:r.error,decisions:r.decisions.length,execution:r.execution}))};
writeFileSync('docs/results/exhibit-recovery.json',JSON.stringify(result,null,2)+'\n');console.log(result);
