import { readFileSync } from 'node:fs';
import type { Circuit } from '../shared/types';
import { Engine } from '../server/model/engine';
import type { Intervention } from '../server/model/config';
export const circuit=JSON.parse(readFileSync(new URL('../data/processed/circuit.json',import.meta.url),'utf8')) as Circuit;
export function probe(intervention: Intervention, input: 'left'|'right'|'dark'='left'){
  const e=new Engine(circuit,intervention);
  let responseTime:number|null=null;
  for(let i=0;i<1400;i++){
    const lit=i>=200;
    e.step({left:lit&&input==='left'?.85:0,right:lit&&input==='right'?.85:0});
    const motor=e.snapshot('probe',i,'fixed',0).motor;
    if(lit&&responseTime===null&&(motor.left+motor.right)/2>.05)responseTime=e.time-2;
  }
  const snapshot=e.snapshot('probe',1400,'fixed',0);
  return {intervention,input,responseTime,motor:snapshot.motor,pose:snapshot.pose,activity:snapshot.activity};
}
