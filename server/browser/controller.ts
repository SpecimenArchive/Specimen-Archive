import { Engine } from '../model/engine';
import { BROWSER_CONFIG as C, type BrowserIntervention } from './config';
import { encodeViewport } from './encoder';
import { decodeBrowser, motorReadout } from './decoder';
import type { Circuit, Snapshot } from '../../shared/types';
export class BrowserController {
  readonly engine:Engine;
  constructor(circuit:Circuit,readonly runId:string,readonly startedAt:string,intervention:BrowserIntervention){this.engine=new Engine(circuit,intervention);}
  async observe(png:Buffer,decision:number,onSample?:(snapshot:Snapshot,input:ReturnType<typeof encodeViewport>)=>Promise<void>){
    const input=encodeViewport(png),samples:Snapshot[]=[],modelStartStep=this.engine.ticks;
    this.engine.condition={key:'pixels',label:`Browser pixels: ${input.encoding}`,intensity:(input.left+input.right)/2,angle:0,epoch:decision};
    for(let i=0;i<C.modelStepsPerDecision;i++){
      this.engine.step({left:input.left,right:input.right});
      if((i+1)%C.neuralSampleEvery===0){
        const snapshot=this.engine.snapshot(this.runId,this.engine.ticks,this.startedAt,(Date.now()-Date.parse(this.startedAt))/1000);
        samples.push(snapshot);await onSample?.(snapshot,input);
      }
    }
    const motor=motorReadout(this.engine.circuit,this.engine.network.activity),command=decodeBrowser(motor);
    return {input,motor,command,samples,modelStartStep,modelEndStep:this.engine.ticks};
  }
}
