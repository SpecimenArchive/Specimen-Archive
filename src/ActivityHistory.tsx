import { useEffect,useRef } from 'react';
import type { Circuit,Snapshot } from '../shared/types';
export function ActivityHistory({frames,circuit,selected,onSelect}:{frames:Snapshot[];circuit:Circuit;selected:string;onSelect:(id:string)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.fillStyle='#152023';ctx.fillRect(0,0,480,circuit.nodes.length*4);frames.slice(-240).forEach((s,x)=>s.activity.forEach((a,y)=>{ctx.fillStyle=`rgb(${25+a*110},${42+a*155},${44+a*139})`;ctx.fillRect(x*2,y*4,2,4);}));ctx.strokeStyle='#e0c283';ctx.strokeRect(0,circuit.nodes.findIndex(n=>n.id===selected)*4,480,4);},[frames.length,frames.at(-1)?.seq,circuit,selected]);
  return <div className="activity-history"><div><label>{circuit.nodes.length} CELLS · ACTIVITY 0–1</label><span>{frames.slice(-240)[0]?.modelTime.toFixed(1)??'—'} → {frames.at(-1)?.modelTime.toFixed(1)??'—'} model s</span></div><canvas ref={canvas} width="480" height={circuit.nodes.length*4} aria-label="Full circuit activity history" onClick={e=>{const r=e.currentTarget.getBoundingClientRect(),i=Math.min(circuit.nodes.length-1,Math.floor((e.clientY-r.top)/r.height*circuit.nodes.length));onSelect(circuit.nodes[i].id);}}/><small>Last 240 received samples. Rows follow circuit order; select a cell to inspect.</small></div>;
}
