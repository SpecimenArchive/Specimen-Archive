import { mkdirSync,readFileSync,readdirSync,existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Circuit } from '../../shared/types';
import type { BrowserLive,BrowserDecision } from '../../shared/browser';
import { runBrowserTrial } from './runner';
import { BROWSER_CONFIG as C } from './config';
import type { BrowserRecord } from './evidence';
import { ExperimentStore,recordHash,type Publication } from '../experiment-store';
import { SpecimenRecorder,GitHubCLI } from '../recorder';
export class BrowserService {
  readonly root:string;readonly store:ExperimentStore<BrowserRecord>;readonly recorder:SpecimenRecorder;
  live:BrowserLive|null=null;stopping=false;private lastEmit=0;
  readonly abort=new AbortController();
  private work?:Promise<void>;
  constructor(runtime:string,readonly circuit:Circuit,readonly emit:(live:BrowserLive)=>void){
    this.root=resolve(runtime,'browser');mkdirSync(this.root,{recursive:true});
    this.store=new ExperimentStore<BrowserRecord>(resolve(runtime,'browser-publications'));
    this.recorder=new SpecimenRecorder(this.store,new GitHubCLI(this.store.root),process.env.RECORDER_REPOSITORY,process.env.RECORDER_ENABLED==='1');
  }
  private update(live:BrowserLive){
    const history=this.live?.runId===live.runId?this.live.history??[]:[];
    if(live.state==='executed'&&live.command&&!history.some(h=>h.decision===live.decision))history.push({decision:live.decision,modelStep:live.snapshot!.seq,command:live.command,events:live.events});
    this.live={...live,history};
    if(live.state!=='integrating'||performance.now()-this.lastEmit>=50){this.lastEmit=performance.now();this.emit(this.live);}
  }
  start(repeat=false){this.work=this.run(repeat);return this.work;}
  async stop(){this.stopping=true;this.abort.abort(new Error('Browser trial interrupted by operator shutdown'));await this.work;}
  private async run(repeat=false){
    do{
      for(const intervention of C.interventions)for(const seed of C.targetSeeds){
        if(this.stopping)return;
        const {record}=await runBrowserTrial(this.circuit,{root:this.root,seed,intervention,signal:this.abort.signal,onUpdate:live=>this.update(live)});
        this.store.save(record);void this.recorder.tick();
      }
    }while(repeat&&!this.stopping);
  }
  file(id:string,name:string){
    if(!/^browser_[A-Za-z0-9_-]+$/.test(id)||! /^(?:[A-Za-z0-9_-]+\.(?:png|webm|json)|trace\.json\.gz)$/.test(name))return null;
    const local=join(this.root,id,name),exported=resolve('docs/evidence/browser',id,name);
    return existsSync(local)?local:existsSync(exported)?exported:null;
  }
  trace(id:string){const path=this.file(id,'trace.json.gz');return path?JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as BrowserDecision[]:null;}
  records(){
    const records=this.store.records(),exported=resolve('docs/evidence/browser');
    if(existsSync(exported))for(const id of readdirSync(exported)){const path=this.file(id,'record.json');if(path&&!records.some(r=>r.id===id))records.push(JSON.parse(readFileSync(path,'utf8')));}
    return records.sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  }
  publications(){
    const receipts=this.store.publications();
    for(const record of this.records()){
      if(receipts.some(p=>p.id===record.id))continue;
      const path=this.file(record.id,'publication.json');if(!path)continue;
      const p=JSON.parse(readFileSync(path,'utf8')) as Publication;
      // A fresh clone has no private runtime receipts. Bundled receipts may
      // still identify actual publications when their record bytes match.
      if(p.id===record.id&&p.state==='published'&&p.recordSha256===recordHash(record)&&p.url===`https://github.com/${p.repository}/commit/${p.commit}`)receipts.push(p);
    }
    return receipts;
  }
}
