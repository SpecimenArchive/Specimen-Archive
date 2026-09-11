import type { Circuit } from '../../shared/types';
import { BROWSER_CONFIG as C } from './config';
export interface MotorReadout {cells:{id:string;name:string;activity:number}[];mean:number;contrast:number}
export interface BrowserCommand {kind:'move'|'click'|'wait';dx:number;dy:0;reason:string;motorMean:number;motorContrast:number;activation:boolean}
export function motorReadout(circuit:Circuit,activity:ArrayLike<number>):MotorReadout {
  const cells=circuit.nodes.flatMap((n,i)=>n.category==='motor'?[{id:n.id,name:n.name,activity:activity[i]}]:[]);
  const plus=cells.find(n=>n.id===C.decoder.contrastPositiveId),minus=cells.find(n=>n.id===C.decoder.contrastNegativeId);
  if(cells.length!==6||!plus||!minus)throw new Error('Decoder requires the documented six-motor circuit');
  return {cells,mean:cells.reduce((s,n)=>s+n.activity,0)/cells.length,contrast:plus.activity-minus.activity};
}
// A decoder sees motor values only. There are no pixels or target coordinates.
export function decodeBrowser(motor:MotorReadout):BrowserCommand {
  const base={dx:0,dy:0 as const,motorMean:motor.mean,motorContrast:motor.contrast,activation:motor.mean>=C.decoder.activationMean};
  if(motor.mean<C.decoder.motorMeanGate)return {...base,kind:'wait',reason:'Motor population below movement gate'};
  if(base.activation)return {...base,kind:'click',reason:'Motor population reached activation threshold'};
  return {...base,kind:'move',dx:motor.contrast>=C.decoder.rightContrastThreshold?C.decoder.movePixels:-C.decoder.movePixels,reason:'MN3_r minus MN2_r contrast selects direction'};
}
