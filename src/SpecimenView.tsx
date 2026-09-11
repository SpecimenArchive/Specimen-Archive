import { useEffect, useRef } from 'react';
import type { Snapshot } from '../shared/types';
import { drawSpecimen, loadTissue, type RenderOptions } from './render/specimen';
export function SpecimenView({snapshot,anatomy=false,zoom=1}:{snapshot:Snapshot|null;anatomy?:boolean;zoom?:number}){
  const canvas=useRef<HTMLCanvasElement>(null),state=useRef(snapshot),old=useRef(snapshot),arrival=useRef(performance.now()),opts=useRef<RenderOptions>({anatomy,trails:false,zoom,reducedMotion:false});
  useEffect(()=>{old.current=state.current;state.current=snapshot;arrival.current=performance.now();},[snapshot]);
  useEffect(()=>{opts.current={anatomy,trails:false,zoom,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};},[anatomy,zoom]);
  useEffect(()=>{loadTissue();let frame:number;
    const render=()=>{const s=state.current,p=old.current;if(canvas.current&&s){
      let rendered=s;
      // One snapshot of interpolation delay. Never extrapolate past received state.
      if(p&&p.runId===s.runId&&s.seq>=p.seq&&s.modelTime-p.modelTime<.3){const a=Math.min(1,(performance.now()-arrival.current)/60);const pose={...s.pose};for(const key of Object.keys(pose) as (keyof typeof pose)[])pose[key]=p.pose[key]+(s.pose[key]-p.pose[key])*a;rendered={...s,pose};}
      drawSpecimen(canvas.current,rendered,opts.current);
    }frame=requestAnimationFrame(render);};frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame);
  },[]);
  return <canvas ref={canvas} className="specimen-canvas" aria-label="Live rendered three-day-old Platynereis specimen, tracking the streamed pose"/>;
}
