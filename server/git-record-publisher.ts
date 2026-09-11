import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {mkdirSync,writeFileSync,existsSync,unlinkSync,rmdirSync} from 'node:fs';import {resolve,join} from 'node:path';import {randomUUID} from 'node:crypto';
import {recordBytes,type PublishableRecord} from './experiment-store';
const exec=promisify(execFile);
export interface RecordPublisher {publish(record:PublishableRecord,repository:string,branch:string):Promise<{sha:string;url:string;path:string}>}
/** Repository-scoped SSH publication from the VM. Uses its own bare object
 * store and temporary index; never touches the deployed source worktree. */
export class GitRecordPublisher implements RecordPublisher {
 readonly directory:string;
 constructor(directory:string,readonly options:{sshCommand?:string;localTestRemote?:string}={}){this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true});}
 async publish(record:PublishableRecord,repository:string,branch:string){
  if(!/^[\w.-]+\/[\w.-]+$/.test(repository)||branch!=='specimen-records'||!/^exhibit_[\w-]+$/.test(record.id))throw new Error('Invalid recorder repository, branch or record ID');
  const remote=this.options.localTestRemote??`git@github.com:${repository}.git`,path=`experiments/${record.id}.json`,lock=join(this.directory,'publisher.lock');
  try{mkdirSync(lock);}catch{throw new Error('Recorder object store is busy; bounded retry will follow.');}
  const temporary=[join(this.directory,`record-${randomUUID()}.json`),join(this.directory,`message-${randomUUID()}.txt`),join(this.directory,`index-${randomUUID()}`)];
  const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_SSH_COMMAND:this.options.sshCommand,GIT_AUTHOR_NAME:'Specimen Archive',GIT_COMMITTER_NAME:'Specimen Archive',GIT_AUTHOR_EMAIL:'327975184+SpecimenArchive@users.noreply.github.com',GIT_COMMITTER_EMAIL:'327975184+SpecimenArchive@users.noreply.github.com'};
  const git=async(args:string[],index=false)=>{try{return (await exec('git',['-c',`safe.directory=${this.directory.replace(/\\/g,'/')}`,...args],{cwd:this.directory,env:index?{...env,GIT_INDEX_FILE:temporary[2]}:env,windowsHide:true,timeout:45000,maxBuffer:4*1024*1024})).stdout.trimEnd();}catch(error){throw Object.assign(new Error('Recorder Git operation failed; check the repository-scoped SSH access or concurrent branch update.'),{code:(error as any).code});}};
  const fetchHead=async()=>{try{await git(['fetch','--no-tags',remote,branch]);}catch{await git(['fetch','--no-tags',remote,'master']);}return git(['rev-parse','FETCH_HEAD']);};
  const existing=async(head:string)=>{const found=await git(['ls-tree','--name-only',head,'--',path]);if(!found)return null;const bytes=await git(['show',`${head}:${path}`]);if(bytes+'\n'!==recordBytes(record))throw new Error('Existing remote record differs; refusing overwrite.');const sha=await git(['log','-1','--format=%H',head,'--',path]);if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('Cannot verify record commit.');return {sha,url:`https://github.com/${repository}/commit/${sha}`,path};};
  try{
   if(!existsSync(join(this.directory,'HEAD')))await git(['init','--bare','--initial-branch=specimen-records']);
   writeFileSync(temporary[0],recordBytes(record));writeFileSync(temporary[1],`Specimen Recorder: ${record.id} / ${record.outcome}\n`);
   for(let attempt=0;attempt<3;attempt++){
    const head=await fetchHead(),prior=await existing(head);if(prior)return prior;
    if(!/^[a-f0-9]{40}$/.test(record.origin.sourceRevision))throw new Error('Executed source revision is unavailable.');
    const blob=await git(['hash-object','-w',temporary[0]]);await git(['read-tree',head],true);await git(['update-index','--add','--cacheinfo',`100644,${blob},${path}`],true);
    const tree=await git(['write-tree'],true),commit=await git(['commit-tree',tree,'-p',head,'-F',temporary[1]]);
    try{await git(['push',remote,`${commit}:refs/heads/${branch}`]);}catch(error){if(attempt===2)throw error;continue;}
    const verified=await existing(await fetchHead());if(!verified)throw new Error('Pushed record could not be read back.');return verified;
   }
   throw new Error('Concurrent publication retry limit reached.');
  }finally{for(const file of temporary)if(existsSync(file))unlinkSync(file);rmdirSync(lock);}
 }
}
