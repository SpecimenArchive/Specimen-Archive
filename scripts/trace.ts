import { mkdirSync, writeFileSync } from 'node:fs';
import { circuit } from './science';
import { Engine } from '../server/model/engine';
import { MODEL_CONFIG } from '../server/model/config';
const engine=new Engine(circuit),path=['6743','37580','57553','108826'];
const indices=path.map(id=>circuit.nodes.findIndex(n=>n.id===id));
const pathEdges=path.slice(1).map((id,i)=>{const e=circuit.edges.find(e=>e.source===path[i]&&e.target===id);if(!e)throw new Error('Source path no longer exists');return e;});
const frames=[];
for(let i=0;i<3200;i++){engine.step();if(i%10===9&&engine.time>=14&&engine.time<=25){const s=engine.snapshot('reproducible-trace',i,'reproduced',0);frames.push({t:s.modelTime,environment:s.environment,sensory:s.sensory,neurons:indices.map((index,j)=>({id:path[j],name:circuit.nodes[index].name,activity:s.activity[index],incoming:engine.network.edges.filter(e=>e.target===index).map(e=>({sourceId:circuit.nodes[e.source].id,weightNormalized:e.gain,activity:s.activity[e.source]}))})),allActivity:s.activity,motor:s.motor,pose:s.pose});}}
const result={schemaVersion:1,config:MODEL_CONFIG,dataset:circuit.version,command:'npm run trace',description:'Actual deterministic closed-loop episode around the automatic light onset at 16 simulated seconds. No recorded wall timestamps are invented. Per-neuron values are rate-model activation.',path:path.map((id,i)=>({id,name:circuit.nodes[indices[i]].name})),pathEdges,causalCaution:'This is a direct anatomical path, not an attribution of total causal contribution. Other incoming edges contribute. The IN1 to INsn shortcut remains when INton is disconnected.',activityOrder:circuit.nodes.map(n=>n.id),frames};
mkdirSync('docs/results',{recursive:true});writeFileSync('docs/results/sample-trace.json',JSON.stringify(result,null,2)+'\n');
const header='t,left_input,right_input,'+path.join(',')+',motor_left,motor_right,speed_um_s,turn_rad_s,x_um,y_um';
const rows=frames.map(f=>[f.t,f.sensory.left,f.sensory.right,...f.neurons.map(n=>n.activity),f.motor.left,f.motor.right,f.motor.forward,f.motor.turn,f.pose.x,f.pose.y].join(','));
writeFileSync('docs/results/sample-trace.csv',[header,...rows].join('\n')+'\n');console.log(`${frames.length} trace frames; ${path.map((id,i)=>circuit.nodes[indices[i]].name+' #'+id).join(' -> ')}`);
