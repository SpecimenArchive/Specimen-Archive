import { writeFileSync } from 'node:fs';
import { Engine } from '../server/model/engine';
import { circuit } from './science';
import { motorReadout,decodeBrowser } from '../server/browser/decoder';
import { BROWSER_CONFIG as C } from '../server/browser/config';
const probes=[];
for(const [name,left,right] of [['left',.65,.15],['right',.15,.65],['aligned',.85,.85],['dark',0,0]] as const){
  const e=new Engine(circuit);
  for(let window=1;window<=3;window++){
    for(let step=0;step<C.modelStepsPerDecision;step++)e.step({left,right});
    const motor=motorReadout(circuit,e.network.activity);probes.push({name,left,right,modelTime:e.time,motor,command:decodeBrowser(motor)});
  }
}
const result={createdAt:new Date().toISOString(),purpose:'Independent constant-input engineering probes; no browser target positions or task outcomes used.',decoder:C.decoder,probes};
writeFileSync('docs/results/browser-calibration.json',JSON.stringify(result,null,2)+'\n');console.log(probes.map(p=>({name:p.name,t:p.modelTime,mean:p.motor.mean,contrast:p.motor.contrast,command:p.command.kind,dx:p.command.dx})));
