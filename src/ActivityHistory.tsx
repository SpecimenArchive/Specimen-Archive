import { useEffect,useRef } from 'react';
import type { Circuit,Snapshot } from '../shared/types';
export function ActivityHistory({frames,circuit,selected,onSelect}:{frames:Snapshot[];circuit:Circuit;selected:string;onSelect:(id:string)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.fillStyle='#152023';ctx.fillRect(0,0,480,188);frames.slice(-240).forEach((s,x)=>s.activity.forEach((a,y)=>{ctx.fillStyle=`rgb(${25+a*110},${42+a*155},${44+a*139})`;ctx.fillRect(x*2,y*4,2,4);}));ctx.strokeStyle='#e0c283';ctx.strokeRect(0,circuit.nodes.findIndex(n=>n.id===selected)*4,480,4);},[frames.length,frames.at(-1)?.seq,circuit,selected]);
  return <div className="activity-history"><div><label>47 CELLS · ACTIVITY 0–1</label><span>{frames.slice(-240)[0]?.modelTime.toFixed(1)??'0'} → {frames.at(-1)?.modelTime.toFixed(1)??'0'} s</span></div><canvas ref={canvas} width="480" height="188" aria-label="Full circuit activity history" onClick={e=>{const r=e.currentTarget.getBoundingClientRect(),i=Math.min(46,Math.floor((e.clientY-r.top)/r.height*47));onSelect(circuit.nodes[i].id);}}/><small>Rows follow source neuron order. Click to inspect.</small></div>;
}
