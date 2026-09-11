import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync, appendFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { SessionInfo, Snapshot } from '../shared/types';
import { Engine } from './model/engine';
import { MODEL_CONFIG } from './model/config';
import type { ExperimentState } from './experiment';
export class Storage {
  readonly root: string;
  session: SessionInfo;
  constructor(root:string,runId:string,startedAt:string){this.root=resolve(root);mkdirSync(this.root,{recursive:true});this.session={id:runId,startedAt,frames:0,duration:0,seed:MODEL_CONFIG.seed};this.writeMeta();}
  private path(name:string){return join(this.root,name);}
  private atomic(name:string,value:unknown){writeFileSync(this.path(name+'.tmp'),JSON.stringify(value));renameSync(this.path(name+'.tmp'),this.path(name));}
  writeMeta(){this.atomic(this.session.id+'.meta.json',this.session);}
  record(snapshot:Snapshot){appendFileSync(this.path(this.session.id+'.jsonl'),JSON.stringify(snapshot)+'\n');this.session.modelStart??=snapshot.modelTime;this.session.modelEnd=snapshot.modelTime;this.session.lastRecordedAt=snapshot.timestamp;this.session.frames++;this.session.duration=snapshot.modelTime-this.session.modelStart;}
  checkpoint(engine:Engine,experiment?:ExperimentState){this.atomic('checkpoint.json',{savedAt:new Date().toISOString(),modelVersion:MODEL_CONFIG.version,datasetVersion:engine.circuit.version,state:engine.checkpoint(),experiment});this.writeMeta();}
  restore(engine:Engine):ExperimentState|undefined {const file=this.path('checkpoint.json');if(!existsSync(file))return;try{const c=JSON.parse(readFileSync(file,'utf8'));if(c.modelVersion!==MODEL_CONFIG.version||c.datasetVersion!==engine.circuit.version||c.state.activity.length!==engine.network.activity.length)throw new Error('Incompatible checkpoint');engine.restore(c.state);this.session.recovered=true;engine.event('session',`Recovered checkpoint; wall-time gap ${Math.max(0,(Date.now()-Date.parse(c.savedAt))/1000).toFixed(1)} s · no catch-up`);return c.experiment;}catch(e){engine.event('session',`Checkpoint unavailable: ${String(e).slice(0,90)}`);}}
  list(){return readdirSync(this.root).filter(f=>f.endsWith('.meta.json')).map(f=>{try{return JSON.parse(readFileSync(this.path(f),'utf8')) as SessionInfo;}catch{return null;}}).filter((s):s is SessionInfo=>!!s).sort((a,b)=>b.startedAt.localeCompare(a.startedAt));}
  read(id:string){if(!/^[a-zA-Z0-9_-]{1,90}$/.test(id))return null;const file=this.path(id+'.jsonl');if(!existsSync(file))return null;return readFileSync(file,'utf8').trim().split('\n').slice(-1500).flatMap(line=>{try{return [JSON.parse(line) as Snapshot];}catch{return [];}});}
  close(){this.session.endedAt=new Date().toISOString();this.writeMeta();}
  markInterrupted(){for(const session of this.list())if(session.id!==this.session.id&&!session.endedAt&&!session.interrupted){session.interrupted=true;this.atomic(session.id+'.meta.json',session);}}
  prune(){const old=this.list().slice(12);for(const session of old){if(session.id===this.session.id)continue;for(const suffix of ['.meta.json','.jsonl']){const file=this.path(session.id+suffix);if(existsSync(file))unlinkSync(file);}}}
}
