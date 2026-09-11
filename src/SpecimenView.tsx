import { useEffect, useRef, useState } from 'react';
import type { Snapshot, Circuit } from '../shared/types';
import { PhotographicRenderer } from './render/photographic';
export function SpecimenView({snapshot,circuit,anatomy=false}:{snapshot:Snapshot|null;circuit:Circuit|null;anatomy?:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null),state=useRef(snapshot),old=useRef(snapshot),arrival=useRef(performance.now());
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{old.current=state.current;state.current=snapshot;arrival.current=performance.now();},[snapshot]);
  useEffect(()=>{
    if(!circuit||!canvas.current)return;
    let disposed=false,frame=0,ready=false,lastDraw=0,renderCount=0,renderer:PhotographicRenderer;
    try{renderer=new PhotographicRenderer(canvas.current,circuit);}catch{setError('WebGL unavailable — photographic still');return;}
    const resize=new ResizeObserver(([entry])=>renderer.resize(entry.contentRect.width,entry.contentRect.height));resize.observe(canvas.current);
    renderer.ready.then(()=>{ready=true;}).catch(()=>setError('Specimen asset could not be loaded'));
    function render(now:number){
      if(disposed)return;
      const s=state.current,p=old.current;
      if(ready&&s&&now-lastDraw>=1000/60){
        const period=1000/60;lastDraw+=Math.floor((now-lastDraw)/period)*period;let shown=s;
        // Interpolate every model-dependent renderer input. Never extrapolate
        // beyond the authoritative newest state, including after signal loss.
        if(p&&p.runId===s.runId&&s.seq>=p.seq&&s.modelTime>=p.modelTime&&s.modelTime-p.modelTime<.3){
          const a=Math.min(1,(now-arrival.current)/60),mix=(x:number,y:number)=>x+(y-x)*a;
          const pose={...s.pose};for(const key of Object.keys(pose) as (keyof typeof pose)[])pose[key]=mix(p.pose[key],s.pose[key]);
          shown={...s,pose,activity:s.activity.map((v,i)=>mix(p.activity[i],v)),motor:{left:mix(p.motor.left,s.motor.left),right:mix(p.motor.right,s.motor.right),forward:mix(p.motor.forward,s.motor.forward),turn:mix(p.motor.turn,s.motor.turn)}};
        }
        renderer.draw(shown);
        // Presentation diagnostic only, never sent to the neural engine.
        canvas.current!.dataset.renderCount=String(++renderCount);
      }
      frame=requestAnimationFrame(render);
    }
    frame=requestAnimationFrame(render);
    return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();renderer.dispose();};
  },[circuit]);
  return <><canvas ref={canvas} className="specimen-canvas" aria-label="Photographic three-day Platynereis specimen, with local movement driven by the streamed model"/>{error&&<div className="renderer-error"><img src="/assets/specimen-photographic-base-v2.png" alt="Static photographic specimen"/><span>{error}</span></div>}{anatomy&&<div className="anatomy-key"><b>ANATOMICAL FIELD GUIDE</b><span>Rounded head · dark pigment cups</span><span>Three trunk regions · paired chaetal fans</span><span>Short ciliary fields · tapered posterior</span></div>}</>;
}
