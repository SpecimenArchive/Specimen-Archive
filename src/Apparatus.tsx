import { useEffect,useLayoutEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
import { createApparatusRenderer } from './render/apparatus';
import { screenPlacement } from './render/screen-placement';
export function Apparatus({live,desktopImage,health,opening=false}:{live:ExhibitLive|null;desktopImage:HTMLImageElement|null;health?:string;opening?:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<ReturnType<typeof createApparatusRenderer>|null>(null),latest=useRef(desktopImage),[ready,setReady]=useState(false),[expanded,setExpanded]=useState(false),[error,setError]=useState(''),revealed=useRef(false);
  latest.current=desktopImage;
  // The bench is revealed with its first desktop, never as an empty monitor first. Once shown it stays.
  if((ready&&!opening)||error)revealed.current=true;
  useEffect(()=>{
    let disposed=false;const bench=new Image();
    try{renderer.current=createApparatusRenderer(canvas.current!);}catch(e){setError((e as Error).message);return;}
    bench.onload=()=>{if(disposed)return;renderer.current!.bench(bench);renderer.current!.draw(latest.current);setReady(true);};bench.src=screenPlacement.asset;
    return()=>{disposed=true;renderer.current?.dispose();renderer.current=null;};
  },[]);
  useLayoutEffect(()=>{if(ready)renderer.current?.draw(desktopImage);},[desktopImage,ready]);
  useEffect(()=>{
    if(!ready||!canvas.current)return;
    const redraw=()=>renderer.current?.draw(latest.current),resize=new ResizeObserver(redraw);
    resize.observe(canvas.current);window.addEventListener('resize',redraw);
    return()=>{resize.disconnect();window.removeEventListener('resize',redraw);};
  },[ready]);
  useEffect(()=>{if(!expanded)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[expanded]);
  return <section className={`apparatus-panel ${expanded?'station-expanded':''}`} data-run-id={live?.runId} data-model-step={live?.snapshot?.seq} data-desktop-frame={(live?.display??live?.desktop)?.path}>
    <div className="apparatus-heading"><span><b>A</b> LABORATORY OBSERVATION</span><button aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Close station ×':'Expand station ↗'}</button></div>
    <div className="apparatus-body"><div className={'apparatus-image'+(revealed.current?'':' awaiting-capture')} aria-busy={!revealed.current}><canvas width={screenPlacement.width} height={screenPlacement.height} ref={canvas} aria-label="Laboratory workstation: the Windows desktop capture appears in the apparatus monitor"/>{!revealed.current&&<span className="station-opening">Opening the station…</span>}{error&&<p role="alert">{error}</p>}</div>
    <div className="apparatus-note"><div className="stage-crop" role="img" aria-label="Detail of the same microscope stage"/><div><label>CAMERA / CHAMBER / WORKSTATION</label><p>One bench.<br/> One shared observation.</p><small>{live?.desktop?`${health==='replay'?'Recorded':health==='live'&&live.state!=='complete'&&live.state!=='recovering'?'Captured':'Held'} ${live.desktop.source==='windows-gdi'?'Windows 11':'Linux'} desktop`:live?.browserFrame?'Desktop capture unavailable for this recording':'Opening the workstation session'}</small>{expanded&&live?.desktop&&<small>Capture {live.desktop.roundTripMs.toFixed(0)} ms · page offset {live.desktop.pageLagMs} ms</small>}</div><a href="/docs/WORKSHEET.html" target="_blank" rel="noreferrer">Assessment companion ↗</a></div></div>
  </section>;
}
