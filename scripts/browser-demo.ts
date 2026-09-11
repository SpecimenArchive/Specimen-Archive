import { mkdirSync,writeFileSync,cpSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { runBrowserTrial,loadCircuit } from '../server/browser/runner';
import { BROWSER_CONFIG as C } from '../server/browser/config';
import { ExperimentStore } from '../server/experiment-store';
import { SpecimenRecorder,GitHubCLI } from '../server/recorder';
import type { BrowserRecord } from '../server/browser/evidence';
const root=resolve(process.env.RUNTIME_DIR||'runtime','browser'),circuit=loadCircuit();
mkdirSync(root,{recursive:true});
const suite=process.argv.includes('--suite'),records:BrowserRecord[]=[];
const store=new ExperimentStore<BrowserRecord>(resolve(process.env.RUNTIME_DIR||'runtime','browser-publications'));
const recorder=new SpecimenRecorder(store,new GitHubCLI(store.root),process.env.RECORDER_REPOSITORY,process.env.RECORDER_ENABLED==='1');
for(const intervention of suite?C.interventions:['intact'] as const)for(const seed of suite?C.targetSeeds:[C.targetSeeds[0]]){
  const {record,directory}=await runBrowserTrial(circuit,{root,seed,intervention,fast:process.argv.includes('--fast')});records.push(record);
  store.save(record);
  console.log(JSON.stringify({runId:record.id,seed,intervention,outcome:record.outcome,error:record.error,replay:record.replay,commands:record.decisions.map(d=>d.command.kind==='move'?d.command.dx:d.command.kind)}));
  if(process.argv.includes('--export'))cpSync(directory,join('docs/evidence/browser',record.id),{recursive:true,errorOnExist:true,force:false});
}
const summary={version:C.version,createdAt:new Date().toISOString(),trials:records.map(r=>({runId:r.id,source:r.origin,seed:r.seed,targetX:r.setup.targetX,intervention:r.intervention,outcome:r.outcome,error:r.error,replay:r.replay,decisions:r.decisions.length,clicks:r.decisions.filter(d=>d.command.kind==='click').length})),
  results:C.interventions.map(intervention=>{const group=records.filter(r=>r.intervention===intervention);return {intervention,trials:group.length,activated:group.filter(r=>r.outcome==='activated').length,errors:group.filter(r=>r.outcome==='error').length};})};
writeFileSync(join(root,'latest-suite.json'),JSON.stringify(summary,null,2)+'\n');
if(process.argv.includes('--export'))writeFileSync('docs/evidence/browser/summary.json',JSON.stringify(summary,null,2)+'\n');
await recorder.tick();
if(records.some(r=>r.outcome==='error')||suite&&records.some(r=>r.intervention==='intact'?r.outcome!=='activated':r.outcome!=='not-activated'))process.exitCode=1;
