import { mkdirSync,readFileSync,readdirSync,existsSync,rmSync } from 'node:fs';
import { resolve,join,sep } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import {readdir,readFile,stat} from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type { Circuit } from '../../shared/types';
import type { ExhibitLive,ExhibitRecord,ExhibitDecision } from '../../shared/exhibit';
import { ExperimentStore,recordHash,type Publication } from '../experiment-store';
import { SpecimenRecorder,GitHubCLI } from '../recorder';
import { EXHIBIT_CONFIG as C } from './config';
import { runEpisode } from './runner';
import { replayEpisode } from './replay';
import {ObservationJournal} from './journal';
import {GitRecordPublisher} from '../git-record-publisher';
export class ExhibitService {
  readonly sessionId=`session_${Date.now()}_${randomUUID().slice(0,8)}`;
  readonly journal=new ObservationJournal(this.sessionId);
  readonly root:string;readonly store:ExperimentStore<ExhibitRecord>;readonly recorder:SpecimenRecorder;
  live:ExhibitLive|null=null;readonly abort=new AbortController();private work?:Promise<void>;private publicationTimer?:ReturnType<typeof setInterval>;private sequence=0;private episodes=0;private failures=0;
  private archiveAt=0;private archiveValue:{records:ExhibitRecord[];publications:Publication[]}|undefined;private archivePending?:Promise<{records:ExhibitRecord[];publications:Publication[]}>;
  private archiveFiles=new Map<string,{stamp:string;record:ExhibitRecord}>();
  constructor(runtime:string,readonly circuit:Circuit,readonly emit:(live:ExhibitLive)=>void){
    this.root=resolve(runtime,'exhibit');mkdirSync(this.root,{recursive:true});this.store=new ExperimentStore<ExhibitRecord>(resolve(runtime,'exhibit-publications'));
    const publisher=process.env.SPECIMEN_PUBLISHER_CONFIG?JSON.parse(readFileSync(process.env.SPECIMEN_PUBLISHER_CONFIG,'utf8')):null;
    if(publisher&&(publisher.repository!=='SpecimenArchive/Specimen-Archive'||publisher.isolation!=='remote-vm'))throw new Error('Unexpected VM recorder configuration.');
    this.recorder=new SpecimenRecorder(this.store,new GitHubCLI(this.store.root),publisher?.repository??process.env.RECORDER_REPOSITORY,publisher?publisher.enabled===true:process.env.RECORDER_ENABLED==='1',publisher?new GitRecordPublisher(publisher.objectDirectory,{sshCommand:publisher.sshCommand}):undefined);
  }
  private update(live:ExhibitLive){this.live={...live,packetSeq:++this.sequence,metrics:{...live.metrics,episodes:this.episodes,failures:this.failures,rssMB:Math.round(process.memoryUsage().rss/1048576)}};this.emit(this.live);}
  start(){if(process.env.SPECIMEN_EXTERNAL_RECORDER!=='1')this.publicationTimer=setInterval(()=>void this.recorder.tick(),30000);this.work=this.run();return this.work;}
  async stop(){clearInterval(this.publicationTimer);this.abort.abort(new Error('Operator shutdown'));await this.work;}
  private async run(){
    while(!this.abort.signal.aborted){
      const episode=this.episodes,signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(process.env.EXHIBIT_DESKTOP==='windows'?540000:240000)]);
      try{
        const {record,directory}=await runEpisode(this.circuit,{root:this.root,sessionId:this.sessionId,episode,seed:C.continuousSeeds[episode%C.continuousSeeds.length],layout:'standard',intervention:'intact',signal,
          faultAfter:episode===0&&process.env.EXHIBIT_FAULT_AFTER?Number(process.env.EXHIBIT_FAULT_AFTER):undefined,journal:this.journal,onUpdate:live=>this.update(live)});
        if(record.outcome!=='error')try{record.replay=await replayEpisode(directory,this.circuit);}catch(e){record.outcome='error';record.error=`Replay verification: ${(e as Error).message}`;}
        this.store.save(record);this.episodes++;if(record.outcome==='error')this.failures++;
        if(process.env.SPECIMEN_EXTERNAL_RECORDER!=='1')void this.recorder.tick();this.prune();
        if(this.live)this.update({...this.live,state:record.outcome==='error'?'recovering':'complete',outcome:record.outcome,notice:record.error||`Episode ${episode+1} complete. Recorded supervisor reset; next intact episode follows.`});
      }catch(e){this.failures++;this.episodes++;if(this.live)this.update({...this.live,state:'recovering',notice:`Supervisor recovery: ${(e as Error).message}`});}
      if(!this.abort.signal.aborted)await delay(C.recoveryDelayMs,undefined,{signal:this.abort.signal}).catch(()=>{});
    }
  }
  file(id:string,name:string){
    if(!/^exhibit_[A-Za-z0-9_-]+$/.test(id)||!/^(?:(?:frame|desktop)-\d+\.png|(?:browser|reference|worksheet)\.webm|record\.json|trace\.json\.gz|decision-\d+\.json\.gz)$/.test(name))return null;
    const candidates=[join(this.root,id,name),resolve(this.root,'../exhibit-validation',id,name),resolve('docs/evidence/exhibit',id,name)];return candidates.find(p=>existsSync(p))??null;
  }
  records(){
    const all=this.store.records(),exported=resolve('docs/evidence/exhibit');
    if(existsSync(exported))for(const id of readdirSync(exported)){if(!/^exhibit_[A-Za-z0-9_-]+$/.test(id)||all.some(r=>r.id===id))continue;const file=join(exported,id,'record.json');if(existsSync(file))all.push(JSON.parse(readFileSync(file,'utf8')));}
    return all.sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  }
  record(id:string){if(!/^exhibit_[A-Za-z0-9_-]+$/.test(id))return null;const stored=this.store.read(id);if(stored)return stored;const file=resolve('docs/evidence/exhibit',id,'record.json');try{return JSON.parse(readFileSync(file,'utf8')) as ExhibitRecord;}catch{return null;}}
  /** Shared asynchronous archive reads never block live integration/heartbeats.
   * Immutable records reuse parsed bytes; mutable receipts refresh every 5 s. */
  archive(){
    if(this.archiveValue&&Date.now()-this.archiveAt<5000)return Promise.resolve(this.archiveValue);
    if(this.archivePending)return this.archivePending;
    this.archivePending=(async()=>{
      const exported=resolve('docs/evidence/exhibit'),localNames=await readdir(this.store.root),exportedNames=await readdir(exported).catch(()=>[]);
      const paths=localNames.filter(n=>/^exhibit_[A-Za-z0-9_-]+\.record\.json$/.test(n)).map(n=>join(this.store.root,n));
      paths.push(...exportedNames.filter(n=>/^exhibit_[A-Za-z0-9_-]+$/.test(n)).map(n=>join(exported,n,'record.json')));
      const records:ExhibitRecord[]=[];
      for(let start=0;start<paths.length;start+=16){
        const batch=await Promise.all(paths.slice(start,start+16).map(async file=>{try{const info=await stat(file),stamp=`${info.mtimeMs}:${info.size}`,prior=this.archiveFiles.get(file);if(prior?.stamp===stamp)return prior.record;const record=JSON.parse(await readFile(file,'utf8')) as ExhibitRecord;this.archiveFiles.set(file,{stamp,record});return record;}catch{return null;}}));
        for(const r of batch)if(r&&!records.some(prior=>prior.id===r.id))records.push(r);
      }
      const present=new Set(paths);for(const file of this.archiveFiles.keys())if(!present.has(file))this.archiveFiles.delete(file);
      records.sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
      const publications:Publication[]=[];
      for(let start=0;start<records.length;start+=16){
        publications.push(...await Promise.all(records.slice(start,start+16).map(async record=>{
          try{return JSON.parse(await readFile(join(this.store.root,record.id+'.publication.json'),'utf8')) as Publication;}catch{}
          try{const p=JSON.parse(await readFile(join(exported,record.id,'publication.json'),'utf8')) as Publication;if(p.id===record.id&&p.state==='published'&&p.recordSha256===recordHash(record)&&p.url===`https://github.com/${p.repository}/commit/${p.commit}`)return p;}catch{}
          return {id:record.id,state:'pending' as const,updatedAt:record.completedAt,attempts:0,recordSha256:recordHash(record),reason:'Recorder receipt not yet written'};
        })));
      }
      this.archiveValue={records,publications};this.archiveAt=Date.now();return this.archiveValue;
    })().finally(()=>{this.archivePending=undefined;});
    return this.archivePending;
  }
  publications(){
    const receipts=this.store.publications();
    for(const record of this.records()){
      if(receipts.some(p=>p.id===record.id))continue;
      const path=resolve('docs/evidence/exhibit',record.id,'publication.json');if(!existsSync(path))continue;
      const p=JSON.parse(readFileSync(path,'utf8')) as Publication;
      if(p.id===record.id&&p.state==='published'&&p.recordSha256===recordHash(record)&&p.url===`https://github.com/${p.repository}/commit/${p.commit}`)receipts.push(p);
    }
    return receipts;
  }
  decision(id:string,index:number){const path=this.file(id,`decision-${index}.json.gz`);return path?JSON.parse(gunzipSync(readFileSync(path)).toString()) as ExhibitDecision:null;}
  private prune(){
    const dirs=readdirSync(this.root).filter(n=>/^exhibit_[A-Za-z0-9_-]+$/.test(n)).sort().reverse();
    for(const name of dirs.slice(C.rawRunsRetained)){
      const target=resolve(this.root,name);
      // Resolved absolute target must stay inside this exact raw-run directory.
      if(!target.startsWith(this.root+sep)||target===this.root)throw new Error('Invalid retention target');
      rmSync(target,{recursive:true,force:true});
    }
    for(const r of this.store.records().slice(C.compactRunsRetained))for(const suffix of ['.record.json','.publication.json']){
      const target=resolve(this.store.root,r.id+suffix);if(target.startsWith(this.store.root+sep))rmSync(target,{force:true});
    }
  }
}
