import { useEffect,useLayoutEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
import { createApparatusRenderer } from './render/apparatus';
import { screenPlacement } from './render/screen-placement';
export function Apparatus({live,desktopImage}:{live:ExhibitLive|null;desktopImage:HTMLImageElement|null}){
  const canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<ReturnType<typeof createApparatusRenderer>|null>(null),latest=useRef(desktopImage),[ready,setReady]=useState(false),[expanded,setExpanded]=useState(false),[error,setError]=useState('');
  latest.current=desktopImage;
  useEffect(()=>{
    let disposed=false;const bench=new Image();
    try{renderer.current=createApparatusRenderer(canvas.current!);}catch(e){setError((e as Error).message);return;}
    bench.onload=()=>{if(disposed)return;renderer.current!.bench(bench);renderer.current!.draw(latest.current);setReady(true);};bench.src=screenPlacement.asset;
    return()=>{disposed=true;renderer.current?.dispose();renderer.current=null;};
  },[]);
  useLayoutEffect(()=>{if(ready)renderer.current?.draw(desktopImage);},[desktopImage,ready]);
  useEffect(()=>{if(!expanded)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[expanded]);
  return <section className={`apparatus-panel ${expanded?'station-expanded':''}`} data-run-id={live?.runId} data-model-step={live?.snapshot?.seq} data-desktop-frame={live?.desktop?.path}>
    <div className="apparatus-heading"><span><b>A</b> APPARATUS CONTEXT</span><button aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Close station ×':'Expand station ↗'}</button></div>
    <div className="apparatus-body"><div className="apparatus-image"><canvas width={screenPlacement.width} height={screenPlacement.height} ref={canvas} aria-label="Laboratory workstation with the actual isolated desktop captured inside its photographed monitor"/>{error&&<p role="alert">{error}</p>}</div>
    <div className="apparatus-note"><div className="stage-crop" role="img" aria-label="Detail of the same microscope stage"/><div><label>CAMERA / CHAMBER / WORKSTATION</label><p>One bench.<br/> One shared observation.</p><small>{live?.desktop?'Live desktop · same controlled browser':live?.browserFrame?'Desktop capture unavailable for this recording':'Opening the workstation session'}</small>{expanded&&live?.desktop&&<small>Capture {live.desktop.roundTripMs.toFixed(0)} ms · page offset {live.desktop.pageLagMs} ms</small>}</div><a href="/docs/WORKSHEET.html" target="_blank" rel="noreferrer">Companion worksheet ↗</a></div></div>
  </section>;
}
