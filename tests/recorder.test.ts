import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExperimentStore } from '../server/experiment-store';
import { SpecimenRecorder, type RepositoryAPI } from '../server/recorder';
import { Experiment } from '../server/experiment';
import { Engine } from '../server/model/engine';
import { circuit } from '../scripts/science';
// This transport double never connects to GitHub or appears in product records.
class MockGitHub implements RepositoryAPI {
  branch=false;files=new Map<string,string>();puts=0;loseReceipt=false;authenticationError=false;
  async call(method:string,path:string,body?:any):Promise<any>{
    if(this.authenticationError)throw Object.assign(new Error('GitHub authentication required'),{status:401});
    if(path.includes('/git/ref/')){if(!this.branch)throw {status:404};return {object:{sha:'a'.repeat(40)}};}
    if(path.endsWith('/git/refs')){this.branch=true;return {};}
    if(path.includes('/commits?'))return [{sha:'b'.repeat(40),html_url:'https://github.com/fixture/recorder-test/commit/'+'b'.repeat(40)}];
    const file=path.split('/contents/')[1].split('?')[0];
    if(method==='GET'){if(!this.files.has(file))throw {status:404};return {content:this.files.get(file)};}
    assert.equal(method,'PUT');assert.equal(body.author.name,'Specimen Archive');assert.equal(body.committer.name,'Specimen Archive');assert.match(body.message,/^Specimen Recorder:/);assert(!body.sha);
    if(this.files.has(file))throw {status:422};this.files.set(file,body.content);this.puts++;
    if(this.loseReceipt){this.loseReceipt=false;throw {status:503};}
    return {commit:{sha:'b'.repeat(40),html_url:'https://github.com/fixture/recorder-test/commit/'+'b'.repeat(40)}};
  }
}
function fixture(){const root=mkdtempSync(join(tmpdir(),'specimen-recorder-')),store=new ExperimentStore(root),trial=new Experiment(new Engine(circuit),{runId:'mock-transport-test',sourceRevision:'a'.repeat(40),sourceDirty:false,dataVersion:circuit.version,dataSha256:'test',modelVersion:'rate-v1'});while(!trial.state.completed)trial.step();store.save(trial.state.completed);return {root,store,id:trial.state.completed.id};}
test('mock GitHub: lost commit receipt is recovered without duplicate publication',async()=>{
  const {root,store,id}=fixture();try{const api=new MockGitHub();api.loseReceipt=true;const r=new SpecimenRecorder(store,api,'fixture/recorder-test',true);
    await r.tick();assert.equal(store.publication(id)!.state,'failed');assert.equal(api.puts,1);
    store.setPublication({...store.publication(id)!,updatedAt:new Date(0).toISOString()});await r.tick();assert.equal(store.publication(id)!.state,'published');assert.equal(api.puts,1);
    await r.tick();assert.equal(api.puts,1);assert(store.publication(id)!.url?.includes('/commit/'));
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('mock GitHub: concurrent recorder workers create only one immutable record',async()=>{
  const {root,store,id}=fixture();try{const api=new MockGitHub();await Promise.all([new SpecimenRecorder(store,api,'fixture/recorder-test',true).tick(),new SpecimenRecorder(store,api,'fixture/recorder-test',true).tick()]);assert.equal(api.puts,1);assert.equal(store.publication(id)!.state,'published');}finally{rmSync(root,{recursive:true,force:true});}
});
test('disabled publishing and authentication failure are never shown as completed',async()=>{
  const {root,store,id}=fixture();try{const api=new MockGitHub();await new SpecimenRecorder(store,api,'fixture/recorder-test',false).tick();assert.equal(store.publication(id)!.state,'pending');assert.equal(api.puts,0);api.authenticationError=true;await new SpecimenRecorder(store,api,'fixture/recorder-test',true).tick();assert.equal(store.publication(id)!.state,'failed');assert.equal(store.publication(id)!.url,undefined);}finally{rmSync(root,{recursive:true,force:true});}
});
test('locked receipt storage cannot reject the background recorder tick or publish falsely',async()=>{
  const {root,store,id}=fixture();try{
    const api=new MockGitHub(),recorder=new SpecimenRecorder(store,api,'fixture/recorder-test',false),save=store.setPublication.bind(store);
    store.setPublication=()=>{throw new Error('EPERM: historical receipt is locked');};
    await assert.doesNotReject(()=>recorder.tick());assert.match(recorder.lastError!,/EPERM/);assert.equal(api.puts,0);assert.equal(store.publication(id)!.state,'pending');
    store.setPublication=save;await recorder.tick();assert.equal(recorder.lastError,null);assert.equal(store.publication(id)!.reason,'Public recorder not enabled');
  }finally{rmSync(root,{recursive:true,force:true});}
});
