import { chromium, type Video } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Circuit } from '../../shared/types';
import type { BrowserDecision, BrowserLive } from '../../shared/browser';
import { BROWSER_CONFIG as C, type BrowserIntervention } from './config';
import { BrowserController } from './controller';
import { BrowserExecutor } from './executor';
import { taskHTML,targetForSeed } from './task';
import { artifactManifest,sha256,replayBrowser,type BrowserRecord } from './evidence';
import { MODEL_CONFIG } from '../model/config';
import { executionOrigin } from '../provenance';
// Capture loaded-source provenance once. A later Git commit cannot relabel
// code already cached in this running Node process.
const LOADED_ORIGIN=executionOrigin('browser-process');
export interface RunOptions {root:string;seed:number;intervention:BrowserIntervention;fast?:boolean;signal?:AbortSignal;onUpdate?:(live:BrowserLive)=>void}
export async function runBrowserTrial(circuit:Circuit,options:RunOptions){
  const startedAt=new Date().toISOString(),runId=`browser_${Date.now()}_${randomUUID().slice(0,8)}`;
  const directory=resolve(options.root,runId);mkdirSync(directory,{recursive:true});
  const origin={...LOADED_ORIGIN,runId},decisions:BrowserDecision[]=[];
  // Only this harness knows the seed/target. The page is isolated on loopback.
  const fixture=createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(taskHTML(options.seed));});
  await new Promise<void>(r=>fixture.listen(0,'127.0.0.1',r));
  const address=fixture.address() as {port:number};
  const channel=process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'msedge':undefined);
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,context:Awaited<ReturnType<NonNullable<typeof browser>['newContext']>>|undefined,video:Video|null=null;
  const record:BrowserRecord={schemaVersion:1,kind:'browser-controller',id:runId,recorder:'Specimen Recorder',origin,
    config:C,configSha256:sha256(JSON.stringify(C)),model:MODEL_CONFIG,intervention:options.intervention,startedAt,completedAt:'',seed:options.seed,browserVersion:'',nodeVersion:process.version,
    coverage:{neuronIds:circuit.nodes.map(n=>n.id),motorIds:circuit.nodes.filter(n=>n.category==='motor').map(n=>n.id),neurons:circuit.nodes.length,edges:circuit.edges.length,synapses:circuit.edges.reduce((s,e)=>s+e.weight,0)},
    setup:{targetX:targetForSeed(options.seed),cursor:{...C.cursorStart},note:'Harness-only seeded target placement, navigation and initial cursor positioning. Excluded from controller decisions.',events:[]},decisions:[],outcome:'error',evaluator:{activated:false,activationCount:0},artifacts:[]};
  try{
    browser=await chromium.launch({channel,headless:true});record.browserVersion=browser.version();
    context=await browser.newContext({viewport:{width:C.width,height:C.height},deviceScaleFactor:1,recordVideo:{dir:directory,size:{width:C.width,height:C.height}}});
    const page=await context.newPage();await page.goto(`http://127.0.0.1:${address.port}/`);await page.mouse.move(C.cursorStart.x,C.cursorStart.y);
    record.setup.events=await page.evaluate(()=>(window as any).__events);
    video=page.video();const controller=new BrowserController(circuit,runId,startedAt,options.intervention),executor=new BrowserExecutor(page);
    let png=await page.screenshot({animations:'disabled'});writeFileSync(join(directory,'frame-000.png'),png);
    for(let decision=0;decision<C.decisions;decision++){
      const capturedAt=new Date().toISOString(),imageBefore=`frame-${String(decision).padStart(3,'0')}.png`,windowStart=performance.now();
      const calculation=await controller.observe(png,decision,async(snapshot,input)=>{
        options.signal?.throwIfAborted();
        if(!options.fast){const due=windowStart+(snapshot.seq-decision*C.modelStepsPerDecision)/C.modelStepsPerDecision*C.minimumWindowWallMs;await delay(Math.max(0,due-performance.now()),undefined,{signal:options.signal});}
        options.onUpdate?.({state:'integrating',runId,decision,intervention:options.intervention,image:`${runId}/${imageBefore}`,input,snapshot,motor:null,command:null,events:[]});
      });
      const executed=await executor.execute(calculation.command),after=await page.screenshot({animations:'disabled'}),imageAfter=`frame-${String(decision+1).padStart(3,'0')}.png`;
      writeFileSync(join(directory,imageAfter),after);
      const d:BrowserDecision={runId,decision,imageBefore,imageAfter,imageSha256:sha256(png),afterSha256:sha256(after),capturedAt,completedAt:new Date().toISOString(),...calculation,executed};
      decisions.push(d);png=after;
      options.onUpdate?.({state:'executed',runId,decision,intervention:options.intervention,image:`${runId}/${imageAfter}`,input:d.input,snapshot:d.samples.at(-1)!,motor:d.motor,command:d.command,events:executed.events});
      // Persist progress independently of the evaluator. Fixed action budget.
      writeFileSync(join(directory,'trace.json.gz'),gzipSync(JSON.stringify(decisions)));
    }
    // Success is read only AFTER the fixed action budget; never fed to control.
    record.evaluator=await page.evaluate(()=>(window as any).__outcome);
    record.outcome=record.evaluator.activated?'activated':'not-activated';
    await context.close();context=undefined;
  }catch(e){record.error=(e as Error).message;record.outcome='error';}
  finally{
    await context?.close();
    // Closing the context finalizes video; save while the browser connection
    // is still open. This path also retains interrupted-trial recordings.
    try{await video?.saveAs(join(directory,'browser.webm'));await video?.delete();}catch(e){record.outcome='error';record.error=[record.error,`Browser recording failed: ${(e as Error).message}`].filter(Boolean).join('; ');}
    await browser?.close();await new Promise<void>(r=>fixture.close(()=>r()));
  }
  record.completedAt=new Date().toISOString();record.decisions=decisions.map(({samples,...d})=>d);
  record.artifacts=artifactManifest(directory);writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');
  if(record.outcome!=='error'){
    try{record.replay=await replayBrowser(directory,circuit);}catch(e){record.outcome='error';record.error=`Evidence verification: ${(e as Error).message}`;}
  }
  writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');
  const last=decisions.at(-1);options.onUpdate?.({state:record.outcome==='error'?'failed':'completed',runId,decision:last?.decision??0,intervention:options.intervention,image:`${runId}/${last?.imageAfter??'frame-000.png'}`,input:last?.input??null,snapshot:last?.samples.at(-1)??null,motor:last?.motor??null,command:last?.command??null,events:last?.executed.events??[],error:record.error});
  return {record,directory};
}
export const loadCircuit=()=>JSON.parse(readFileSync(new URL('../../data/processed/circuit.json',import.meta.url),'utf8')) as Circuit;
