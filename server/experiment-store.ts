import { mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import type { ExperimentRecord } from './experiment';
export interface Publication {
  id:string;state:'pending'|'publishing'|'published'|'failed';updatedAt:string;attempts:number;
  recordSha256:string;reason?:string;commit?:string;url?:string;path?:string;repository?:string;
}
export interface PublishableRecord {id:string;origin:ExperimentRecord['origin'];configSha256:string;completedAt:string;outcome:string}
export const recordBytes=(record:PublishableRecord)=>JSON.stringify(record,null,2)+'\n';
export const recordHash=(record:PublishableRecord)=>createHash('sha256').update(recordBytes(record)).digest('hex');
export class ExperimentStore<T extends PublishableRecord=ExperimentRecord> {
  readonly root:string;
  constructor(runtime:string){this.root=resolve(runtime,'experiments');mkdirSync(this.root,{recursive:true});}
  private path(id:string,suffix:string){if(!/^[A-Za-z0-9_-]{1,180}$/.test(id))throw new Error('Invalid experiment ID');return join(this.root,id+suffix);}
  private atomic(path:string,value:unknown){writeFileSync(path+'.tmp',JSON.stringify(value,null,2)+'\n');renameSync(path+'.tmp',path);}
  save(record:T){
    const path=this.path(record.id,'.record.json');
    // Create-only record identity survives retries and a crash before checkpoint.
    if(existsSync(path)){
      const prior=this.read(record.id)!;
      if(prior.origin.sourceRevision!==record.origin.sourceRevision||prior.configSha256!==record.configSha256)throw new Error('Record identity conflict');
      return prior;
    }
    writeFileSync(path,recordBytes(record),{flag:'wx'});
    this.setPublication({id:record.id,state:'pending',updatedAt:new Date().toISOString(),attempts:0,recordSha256:recordHash(record),reason:'Awaiting Specimen Recorder publication'});
    return record;
  }
  read(id:string){try{return JSON.parse(readFileSync(this.path(id,'.record.json'),'utf8')) as T;}catch{return null;}}
  records(){return readdirSync(this.root).filter(n=>n.endsWith('.record.json')).map(n=>this.read(n.slice(0,-12))!).filter(Boolean).sort((a,b)=>b.completedAt.localeCompare(a.completedAt));}
  publication(id:string){try{return JSON.parse(readFileSync(this.path(id,'.publication.json'),'utf8')) as Publication;}catch{return null;}}
  publications(){return this.records().map(r=>this.publication(r.id)??{id:r.id,state:'pending',updatedAt:r.completedAt,attempts:0,recordSha256:recordHash(r),reason:'Recorder receipt not yet written'} as Publication);}
  setPublication(p:Publication){this.atomic(this.path(p.id,'.publication.json'),p);}
}
