import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import type { Circuit } from '../../shared/types';
import type { BrowserDecision } from '../../shared/browser';
import type { ExperimentOrigin } from '../experiment';
import { BROWSER_CONFIG as C, type BrowserIntervention } from './config';
import { MODEL_CONFIG } from '../model/config';
import { BrowserController } from './controller';
export const sha256=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
export interface BrowserRecord {
  schemaVersion:1;kind:'browser-controller';id:string;recorder:'Specimen Recorder';origin:ExperimentOrigin;
  config:typeof C;configSha256:string;model:typeof MODEL_CONFIG;intervention:BrowserIntervention;
  startedAt:string;completedAt:string;seed:number;browserVersion:string;nodeVersion:string;
  coverage:{neuronIds:string[];motorIds:string[];neurons:number;edges:number;synapses:number};
  setup:{targetX:number;cursor:{x:number;y:number};note:string;events:unknown[]};
  decisions:Omit<BrowserDecision,'samples'>[];outcome:'activated'|'not-activated'|'error';error?:string;
  evaluator:{activated:boolean;activationCount:number};
  artifacts:{path:string;sha256:string;bytes:number}[];
  replay?:{exact:boolean;decisions:number;states:number;events:number};
}
export function artifactManifest(directory:string){return readdirSync(directory).filter(f=>/\.(png|gz|webm)$/.test(f)).sort().map(path=>{const bytes=readFileSync(join(directory,path));return {path,sha256:sha256(bytes),bytes:bytes.length};});}
export async function replayBrowser(directory:string,circuit:Circuit){
  const record=JSON.parse(readFileSync(join(directory,'record.json'),'utf8')) as BrowserRecord;
  if(record.configSha256!==sha256(JSON.stringify(C)))throw new Error('Controller configuration mismatch');
  if(record.origin.dataSha256!==sha256(readFileSync(new URL('../../data/processed/circuit.json',import.meta.url))))throw new Error('Circuit data hash mismatch');
  const recorded=JSON.parse(gunzipSync(readFileSync(join(directory,'trace.json.gz'))).toString('utf8')) as BrowserDecision[];
  const controller=new BrowserController(circuit,record.id,record.startedAt,record.intervention);
  let states=0,events=0;
  for(const d of recorded){
    const png=readFileSync(join(directory,d.imageBefore));if(sha256(png)!==d.imageSha256)throw new Error(`Image hash mismatch at decision ${d.decision}`);
    if(sha256(readFileSync(join(directory,d.imageAfter)))!==d.afterSha256)throw new Error('Post-action image hash mismatch');
    const actual=await controller.observe(png,d.decision);
    for(const key of ['input','motor','command','modelStartStep','modelEndStep'] as const)if(JSON.stringify(actual[key])!==JSON.stringify(d[key]))throw new Error(`${key} replay differs at decision ${d.decision}`);
    if(actual.samples.length!==d.samples.length)throw new Error('Neural sample count differs');
    actual.samples.forEach((s,i)=>{if(JSON.stringify(s.activity)!==JSON.stringify(d.samples[i].activity)||JSON.stringify(s.pose)!==JSON.stringify(d.samples[i].pose)||s.seq!==d.samples[i].seq)throw new Error(`Neural state replay differs at ${d.decision}/${i}`);states++;});
    const ex=d.executed;if(ex.kind!==d.command.kind)throw new Error('Executed command differs from neural decision');
    if(d.command.kind==='move'){
      const expectedX=Math.max(10,Math.min(C.width-10,ex.from.x+d.command.dx));
      if(ex.to.x!==expectedX||ex.to.y!==ex.from.y)throw new Error('Cursor displacement is not decoded movement');
      if(ex.events.length!==1||ex.events[0].type!=='mousemove'||ex.events[0].x!==ex.to.x||ex.events[0].y!==ex.to.y)throw new Error('Mouse move event does not match command');
    }else if(d.command.kind==='click'){
      if(ex.events.map(e=>e.type).join(',')!=='mousedown,mouseup,click'||ex.events.some(e=>e.x!==ex.from.x||e.y!==ex.from.y))throw new Error('Activation event does not match command');
    }else if(ex.events.length)throw new Error('Wait produced browser events');
    if(ex.events.some(e=>!e.trusted))throw new Error('Synthetic JS event found');events+=ex.events.length;
  }
  return {exact:true,decisions:recorded.length,states,events};
}
