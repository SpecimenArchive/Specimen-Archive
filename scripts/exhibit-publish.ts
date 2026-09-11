import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {ExperimentStore} from '../server/experiment-store';
import {SpecimenRecorder,GitHubCLI} from '../server/recorder';
import type {ExhibitRecord} from '../shared/exhibit';
const store=new ExperimentStore<ExhibitRecord>(resolve('runtime/exhibit-validation-publications'));
const recorder=new SpecimenRecorder(store,new GitHubCLI(store.root),process.env.RECORDER_REPOSITORY||'SpecimenArchive/Specimen-Archive',true);
await recorder.tick();
const published=[];
for(const record of store.records().filter(r=>!r.origin.sourceDirty)){
  const receipt=store.publication(record.id);if(receipt?.state!=='published'){console.error(record.id,receipt);process.exitCode=1;continue;}
  const directory=resolve('docs/evidence/exhibit',record.id);mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');writeFileSync(join(directory,'publication.json'),JSON.stringify(receipt,null,2)+'\n');published.push(receipt);
}
if(published.length){copyFileSync('docs/results/exhibit-heldout.json','docs/evidence/exhibit/summary.json');writeFileSync('docs/evidence/exhibit/publications.json',JSON.stringify(published,null,2)+'\n');}
console.log(published.map(p=>({id:p.id,commit:p.commit,url:p.url})));
