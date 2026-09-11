import { PNG } from 'pngjs';
import { Engine } from '../model/engine';
import { encodeViewport } from '../browser/encoder';
import { motorReadout,type MotorReadout } from '../browser/decoder';
import type { Circuit,Snapshot } from '../../shared/types';
import type { BrowserIntervention } from '../browser/config';
import { EXHIBIT_CONFIG as C,type Phase } from './config';

export interface ExhibitCommand {kind:'move'|'click'|'scroll'|'wait';dx:number;dy:number;wheelY:number;reason:string;motorMean:number;motorContrast:number;phase:Phase}
// Inputs: captured pixels and a fixed, target-independent alternating phase.
export function encodeExhibit(png:Buffer,phase:Phase){
  const retina=encodeViewport(png);
  const valid=retina.targetPixels>=400&&retina.cursorPixels>=20;
  const verticalError=valid?retina.targetCentroid!.y-retina.cursorCentroid!.y:null;
  let encoding:string='no-signal',left=0,right=0,guidePixels=0;
  if(phase==='point'&&valid&&Math.abs(verticalError!)<=C.verticalTolerance){({encoding,left,right}=retina);}
  if(phase==='scroll'){
    if(valid&&Math.abs(verticalError!)>C.verticalTolerance){encoding=verticalError!>0?'down':'up';}
    if(!valid){
      const {width,height,data}=PNG.sync.read(png);
      for(let y=Math.floor(height*.8);y<height;y++)for(let x=0;x<width;x++){
        const p=(y*width+x)*4;if(data[p]>210&&data[p+1]>125&&data[p+1]<205&&data[p+2]<95)guidePixels++;
      }
      if(guidePixels>=C.guideMinimumPixels)encoding='down-guide';
    }
    if(encoding==='up'){left=.65;right=.15;}
    if(encoding==='down'||encoding==='down-guide'){left=.15;right=.65;}
  }
  return {...retina,version:C.version,phase,verticalError,guidePixels,encoding,left,right};
}
export type ExhibitInput=ReturnType<typeof encodeExhibit>;
// No image, page, target, seed, success signal or DOM can reach this decoder.
export function decodeExhibit(m:MotorReadout,phase:Phase):ExhibitCommand{
  const base={dx:0,dy:0,wheelY:0,motorMean:m.mean,motorContrast:m.contrast,phase};
  if(m.mean<C.motorGate)return {...base,kind:'wait',reason:'M < 0.500: motor gate closed'};
  if(phase==='scroll')return {...base,kind:'scroll',wheelY:m.contrast>=C.rightContrast?C.scrollPixels:-C.scrollPixels,reason:'Scroll phase: motor contrast selects wheel direction'};
  if(m.mean>=C.activationMean)return {...base,kind:'click',reason:'Point phase: M ≥ 0.593 activates at current cursor'};
  return {...base,kind:'move',dx:m.contrast>=C.rightContrast?C.movePixels:-C.movePixels,reason:'Point phase: motor contrast selects horizontal direction'};
}
export class ExhibitController {
  readonly engine:Engine;
  constructor(circuit:Circuit,readonly runId:string,readonly startedAt:string,intervention:BrowserIntervention='intact'){this.engine=new Engine(circuit,intervention);}
  async observe(png:Buffer,decision:number,onSample?:(s:Snapshot,input:ExhibitInput)=>Promise<void>){
    const phase=C.phaseOrder[decision%C.phaseOrder.length],input=encodeExhibit(png,phase),samples:Snapshot[]=[],modelStartStep=this.engine.ticks;
    this.engine.condition={key:'pixels',label:`${phase}: ${input.encoding}`,intensity:(input.left+input.right)/2,angle:0,epoch:decision};
    for(let i=0;i<C.modelSteps;i++){
      this.engine.step({left:input.left,right:input.right});
      if((i+1)%C.sampleEvery===0){const s=this.engine.snapshot(this.runId,this.engine.ticks,this.startedAt,(Date.now()-Date.parse(this.startedAt))/1000);samples.push(s);await onSample?.(s,input);}
    }
    const motor=motorReadout(this.engine.circuit,this.engine.network.activity);
    return {input,samples,motor,command:decodeExhibit(motor,phase),modelStartStep,modelEndStep:this.engine.ticks};
  }
}
