import { mkdirSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runEpisode } from '../server/exhibit/runner';
import { replayEpisode } from '../server/exhibit/replay';
import { loadCircuit } from '../server/browser/runner';
import { EXHIBIT_CONFIG as C,type TaskLayout } from '../server/exhibit/config';
import { ExperimentStore } from '../server/experiment-store';
import type { ExhibitRecord } from '../shared/exhibit';
const circuit=loadCircuit(),root=resolve('runtime/exhibit-validation'),sessionId=`validation_${Date.now()}`,rows=[];
const store=new ExperimentStore<ExhibitRecord>(resolve('runtime/exhibit-validation-publications'));
const development=process.argv.includes('--development');
const cases=development?[{seed:101,layout:'standard' as TaskLayout}]:[{seed:C.heldOutSeeds[0],layout:'standard' as TaskLayout},{seed:C.heldOutSeeds[1],layout:'offset' as TaskLayout},{seed:C.heldOutSeeds[2],layout:'low-contrast' as TaskLayout}];
for(const intervention of development?['intact' as const]:['intact','clamp-all-motors','disconnect-photoreceptors'] as const)for(const [episode,t] of cases.entries()){
  const {record,directory}=await runEpisode(circuit,{root,sessionId,episode,...t,intervention,fast:true});
  if(record.outcome!=='error')try{record.replay=await replayEpisode(directory,circuit);}catch(e){record.error=(e as Error).message;record.outcome='error';}
  writeFileSync(resolve(directory,'record.json'),JSON.stringify(record,null,2)+'\n');store.save(record);
  const row={id:record.id,sourceRevision:record.origin.sourceRevision,sourceDirty:record.origin.sourceDirty,seed:t.seed,layout:t.layout,intervention,outcome:record.outcome,events:record.decisions.reduce((s,d)=>s+d.executed.events.length,0),actions:Object.fromEntries(['move','scroll','click','wait'].map(k=>[k,record.decisions.filter(d=>d.command.kind===k).length])),evaluator:record.evaluator,replay:record.replay,error:record.error};rows.push(row);console.log(JSON.stringify(row));
}
mkdirSync('docs/results',{recursive:true});writeFileSync(development?'runtime/exhibit-development.json':'docs/results/exhibit-heldout.json',JSON.stringify({createdAt:new Date().toISOString(),sessionId,config:C,protocol:development?'Development layout, excluded from held-out results':'Frozen profile evaluated once on three previously unused cases; same cases under both interventions. Failures retained.',rows},null,2)+'\n');
if(rows.some(r=>r.error||!r.replay?.exact||r.intervention!=='intact'&&r.events!==0))process.exitCode=1;
