import { Engine } from '../server/model/engine';
import { motorReadout } from '../server/browser/decoder';
import { loadCircuit } from '../server/browser/runner';
const circuit=loadCircuit();
const drives:[[number,number],...Array<[number,number]>]=[[0,0],[.01,.01],[.03,.03],[.05,.05],[.08,.08],[.1,.1],[.15,.15],[.2,.2],[.3,.3],[.5,.5],[.85,.85],[.65,.15],[.15,.65],[.3,.02],[.02,.3],[.12,.01],[.01,.12]];
for(const drive of drives){let rows=[];for(const initial of [[0,0],[.85,.85],[.65,.15],[.15,.65]]){const e=new Engine(circuit);for(let i=0;i<600;i++)e.step({left:initial[0],right:initial[1]});for(let i=0;i<600;i++)e.step({left:drive[0],right:drive[1]});const m=motorReadout(circuit,e.network.activity);rows.push([+m.mean.toFixed(6),+m.contrast.toFixed(6)]);}console.log(JSON.stringify({drive,range:rows}));}
