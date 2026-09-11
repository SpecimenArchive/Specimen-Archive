import { mkdirSync,readFileSync,readdirSync,existsSync,rmSync } from 'node:fs';
import { resolve,join,sep } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Circuit } from '../../shared/types';
import type { ExhibitLive,ExhibitRecord,ExhibitDecision } from '../../shared/exhibit';
import { ExperimentStore,recordHash,type Publication } from '../experiment-store';
import { SpecimenRecorder,GitHubCLI } from '../recorder';
import { EXHIBIT_CONFIG as C } from './config';
import { runEpisode } from './runner';
import { replayEpisode } from './replay';
export class ExhibitService {
  readonly sessionId=`session_${Date.now()}_${randomUUID().slice(0,8)}`;
  readonly root:string;readonly store:ExperimentStore<ExhibitRecord>;readonly recorder:SpecimenRecorder;
  live:ExhibitLive|null=null;readonly abort=new AbortController();private work?:Promise<void>;private sequence=0;private episodes=0;private failures=0;
  constructor(runtime:string,readonly circuit:Circuit,readonly emit:(live:ExhibitLive)=>void){
    this.root=resolve(runtime,'exhibit');mkdirSync(this.root,{recursive:true});this.store=new ExperimentStore<ExhibitRecord>(resolve(runtime,'exhibit-publications'));
    this.recorder=new SpecimenRecorder(this.store,new GitHubCLI(this.store.root),process.env.RECORDER_REPOSITORY,process.env.RECORDER_ENABLED==='1');
  }
  private update(live:ExhibitLive){this.live={...live,packetSeq:++this.sequence,metrics:{...live.metrics,episodes:this.episodes,failures:this.failures,rssMB:Math.round(process.memoryUsage().rss/1048576)}};this.emit(this.live);}
  start(){this.work=this.run();return this.work;}
  async stop(){this.abort.abort(new Error('Operator shutdown'));await this.work;}
  private async run(){
    while(!this.abort.signal.aborted){
      const episode=this.episodes,signal=AbortSignal.any([this.abort.signal,AbortSignal.timeout(process.env.EXHIBIT_DESKTOP==='windows'?540000:240000)]);
      try{
        const {record,directory}=await runEpisode(this.circuit,{root:this.root,sessionId:this.sessionId,episode,seed:C.continuousSeeds[episode%C.continuousSeeds.length],layout:'standard',intervention:'intact',signal,
          faultAfter:episode===0&&process.env.EXHIBIT_FAULT_AFTER?Number(process.env.EXHIBIT_FAULT_AFTER):undefined,onUpdate:live=>this.update(live)});
        if(record.outcome!=='error')try{record.replay=await replayEpisode(directory,this.circuit);}catch(e){record.outcome='error';record.error=`Replay verification: ${(e as Error).message}`;}
        this.store.save(record);this.episodes++;if(record.outcome==='error')this.failures++;
        void this.recorder.tick();this.prune();
        if(this.live)this.update({...this.live,state:record.outcome==='error'?'recovering':'complete',outcome:record.outcome,notice:record.error||`Episode ${episode+1} complete. Recorded supervisor reset; next intact episode follows.`});
      }catch(e){this.failures++;this.episodes++;if(this.live)this.update({...this.live,state:'recovering',notice:`Supervisor recovery: ${(e as Error).message}`});}
      if(!this.abort.signal.aborted)await delay(C.recoveryDelayMs,undefined,{signal:this.abort.signal}).catch(()=>{});
    }
  }
  file(id:string,name:string){
    if(!/^exhibit_[A-Za-z0-9_-]+$/.test(id)||!/^(?:(?:frame|desktop)-\d+\.png|browser\.webm|record\.json|trace\.json\.gz|decision-\d+\.json\.gz)$/.test(name))return null;
    const candidates=[join(this.root,id,name),resolve(this.root,'../exhibit-validation',id,name),resolve('docs/evidence/exhibit',id,name)];return candidates.find(p=>existsSync(p))??null;
  }
  records(){
    const all=this.store.records(),exported=resolve('docs/evidence/exhibit');
    if(existsSync(exported))for(const id of readdirSync(exported)){if(!/^exhibit_[A-Za-z0-9_-]+$/.test(id)||all.some(r=>r.id===id))continue;const file=join(exported,id,'record.json');if(existsSync(file))all.push(JSON.parse(readFileSync(file,'utf8')));}
    return all.sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  }
  record(id:string){return this.records().find(r=>r.id===id)??null;}
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
