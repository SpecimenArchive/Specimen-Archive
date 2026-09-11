import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ExperimentStore, recordBytes, recordHash, type Publication, type PublishableRecord } from './experiment-store';
import type {RecordPublisher} from './git-record-publisher';
const exec=promisify(execFile);
export interface RepositoryAPI {call(method:string,path:string,body?:unknown):Promise<any>}
export class GitHubCLI implements RepositoryAPI {
  constructor(readonly temporaryDirectory:string){}
  async call(method:string,path:string,body?:unknown){
    const args=['api','--hostname','github.com','--method',method,path];let file:string|undefined;
    try{
      if(body){file=join(this.temporaryDirectory,`recorder-request-${randomUUID()}.json`);writeFileSync(file,JSON.stringify(body));args.push('--input',file);}
      const {stdout}=await exec('gh',args,{timeout:20000,windowsHide:true,maxBuffer:1024*1024});
      return stdout.trim()?JSON.parse(stdout):null;
    }catch(e){
      const stderr=String((e as {stderr?:string}).stderr||'');
      const status=Number(stderr.match(/HTTP (\d{3})/)?.[1]||0);
      throw Object.assign(new Error(status===401?'GitHub authentication required':status===403?'GitHub permission denied':`GitHub request failed${status?` (${status})`:''}`),{status});
    }finally{if(file)unlinkSync(file);}
  }
}
export class SpecimenRecorder {
  private busy=false;
  lastError:string|null=null;
  readonly branch='specimen-records';
  constructor(readonly store:ExperimentStore<PublishableRecord>,readonly api:RepositoryAPI,readonly repository:string|undefined,readonly enabled:boolean,readonly publisher?:RecordPublisher) {
    if(repository&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))throw new Error('RECORDER_REPOSITORY must be owner/repository');
  }
  private async existing(record:PublishableRecord,path:string){
    try{
      const found=await this.api.call('GET',`repos/${this.repository}/contents/${path}?ref=${this.branch}`);
      const bytes=Buffer.from(String(found.content).replace(/\s/g,''),'base64').toString('utf8');
      if(bytes!==recordBytes(record))throw new Error('Existing remote record has different content; refusing overwrite');
      const commits=await this.api.call('GET',`repos/${this.repository}/commits?sha=${this.branch}&path=${encodeURIComponent(path)}&per_page=1`);
      if(!commits[0]?.sha)throw new Error('Remote record commit could not be verified');
      return {sha:String(commits[0].sha),url:String(commits[0].html_url)};
    }catch(e){if((e as {status?:number}).status===404)return null;throw e;}
  }
  private async publish(record:PublishableRecord){
    if(this.publisher)return this.publisher.publish(record,this.repository!,this.branch);
    const path=`experiments/${record.id}.json`;
    // A separate records branch avoids local worktree/index mutations and keeps
    // generated result commits distinct from software-development history.
    try{await this.api.call('GET',`repos/${this.repository}/git/ref/heads/${this.branch}`);}
    catch(e){
      if((e as {status?:number}).status!==404)throw e;
      try{await this.api.call('POST',`repos/${this.repository}/git/refs`,{ref:`refs/heads/${this.branch}`,sha:record.origin.sourceRevision});}
      catch(createError){if((createError as {status?:number}).status!==422)throw createError;}
    }
    const prior=await this.existing(record,path);if(prior)return {...prior,path};
    // GitHub attribution belongs to the project account. Automated provenance
    // remains explicit in the commit message and record.recorder field.
    const identity={name:'Specimen Archive',email:'327975184+SpecimenArchive@users.noreply.github.com',date:new Date().toISOString()};
    try{
      const result=await this.api.call('PUT',`repos/${this.repository}/contents/${path}`,{
        message:`Specimen Recorder: ${record.id} / ${record.outcome}`,
        content:Buffer.from(recordBytes(record)).toString('base64'),branch:this.branch,author:identity,committer:identity,
      });
      if(!result.commit?.sha||!result.commit?.html_url)throw new Error('GitHub did not return a commit receipt');
      // Read back the stored bytes and commit. An HTTP success alone is not a
      // verified publication, and a lost receipt can be recovered on retry.
      const verified=await this.existing(record,path);if(!verified)throw new Error('Published record could not be verified');
      return {...verified,path};
    }catch(e){
      const status=(e as {status?:number}).status;
      if(status===409||status===422){const concurrent=await this.existing(record,path);if(concurrent)return {...concurrent,path};}
      throw e;
    }
  }
  async tick(){
    if(this.busy)return;this.busy=true;this.lastError=null;
    let remaining=4;
    try{for(const record of this.store.records()){
      const current=this.store.publication(record.id);if(current?.state==='published')continue;
      const pendingReason=!this.repository?'Repository destination not configured':!this.enabled?'Public recorder not enabled':record.origin.sourceDirty?'Executed source has uncommitted model changes':!/^[a-f0-9]{40}$/.test(record.origin.sourceRevision)?'Executed source revision is unavailable':undefined;
      const receipt:Publication={id:record.id,state:'pending',updatedAt:new Date().toISOString(),attempts:current?.attempts??0,recordSha256:recordHash(record),repository:this.repository};
      if(pendingReason){if(current?.state!=='pending'||current.reason!==pendingReason||current.recordSha256!==receipt.recordSha256||current.repository!==receipt.repository)this.store.setPublication({...receipt,reason:pendingReason});continue;}
      if(current?.state==='failed'&&(current.attempts>=5||Date.now()-Date.parse(current.updatedAt)<Math.min(900000,60000*2**Math.max(0,current.attempts-1))))continue;
      if(remaining--<=0)break;
      this.store.setPublication({...receipt,state:'publishing',attempts:receipt.attempts+1});
      try{const remote=await this.publish(record);this.store.setPublication({...receipt,state:'published',attempts:receipt.attempts+1,updatedAt:new Date().toISOString(),commit:remote.sha,url:remote.url,path:remote.path});}
      catch(e){this.store.setPublication({...receipt,state:'failed',attempts:receipt.attempts+1,updatedAt:new Date().toISOString(),reason:(e as Error).message});}
    }}catch(e){
      // Receipt storage is auxiliary. A locked historical receipt must never
      // terminate the neural session or imply that publication succeeded.
      this.lastError=(e as Error).message;
    }finally{this.busy=false;}
  }
}
