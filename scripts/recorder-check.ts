import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ExperimentStore } from '../server/experiment-store';
import type { BrowserRecord } from '../server/browser/evidence';
import { GitHubCLI,SpecimenRecorder } from '../server/recorder';
const id=process.argv[2],repository=process.env.RECORDER_REPOSITORY;
if(!id||!repository)throw new Error('Provide a published run ID and RECORDER_REPOSITORY');
const store=new ExperimentStore<BrowserRecord>(resolve(process.env.RUNTIME_DIR||'runtime','browser-publications'));
const previous=store.publication(id);assert(previous?.state==='published'&&previous.commit,'Run must already have a verified publication');
const api=new GitHubCLI(store.root),endpoint=`repos/${repository}/commits?sha=specimen-records&path=experiments/${id}.json&per_page=100`;
const before=await api.call('GET',endpoint);
// Simulate loss of local receipt status, preserving the immutable result.
store.setPublication({...previous,state:'pending',reason:'Controlled receipt recovery verification'});
await new SpecimenRecorder(store,api,repository,true).tick();
const recovered=store.publication(id)!,after=await api.call('GET',endpoint);
assert.equal(recovered.state,'published');assert.equal(recovered.commit,previous.commit);assert.deepEqual(after.map((c:any)=>c.sha),before.map((c:any)=>c.sha));
const result={checkedAt:new Date().toISOString(),runId:id,repository,commit:recovered.commit,url:recovered.url,commitsBefore:before.length,commitsAfter:after.length,duplicateCreated:false,verifiedRemoteBytes:true,recoveredReceipt:true};
writeFileSync('docs/results/recorder-recovery.json',JSON.stringify(result,null,2)+'\n');console.log(result);
