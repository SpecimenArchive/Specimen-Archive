import {useLayoutEffect,useRef,useState} from 'react';
import type {ExhibitLive} from '../shared/exhibit';
export function DirectDesktop({live,desktopImage,health}:{live:ExhibitLive|null;desktopImage:HTMLImageElement|null;health:string}){
 const canvas=useRef<HTMLCanvasElement>(null),[expanded,setExpanded]=useState(false),capture=live?.display??live?.desktop,r=live?.receipt;
 useLayoutEffect(()=>{if(!desktopImage||!canvas.current)return;const c=canvas.current;c.width=desktopImage.naturalWidth;c.height=desktopImage.naturalHeight;c.getContext('2d')!.drawImage(desktopImage,0,0);},[desktopImage]);
 const visible=!!r?.dispatchedAt&&r.trustedEvents>0&&!!capture&&!!r.observedAt&&Math.abs(Date.parse(capture.capturedAt)-Date.parse(r.observedAt))<2500&&['live','replay'].includes(health);
 const point=r?{x:r.viewport.x+r.cursor.x*r.viewport.scale,y:r.viewport.y+r.cursor.y*r.viewport.scale}:null;
 return <section className={`direct-desktop panel ${expanded?'desktop-expanded':''}`} data-run-id={live?.runId} data-model-step={live?.snapshot?.seq} data-desktop-frame={capture?.path}>
  <div className="panel-heading"><span>B / WINDOWS 11 · DIRECT VIEW</span><button className="quiet-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Close ×':'Expand ↗'}</button></div>
  <div className="desktop-containment"><div className="desktop-pixels" style={{aspectRatio:capture?`${capture.width}/${capture.height}`:'1280/800'}}>
   <canvas ref={canvas} width="1280" height="800" aria-label="Genuine Windows desktop, the same decoded capture as the apparatus monitor"/>
   {visible&&point&&<svg viewBox={`0 0 ${capture!.width} ${capture!.height}`} className="action-annotation" aria-label={`Acknowledged wheel ${live?.command?.wheelY} pixels; ${r!.reason}`}><g transform={`translate(${point.x} ${point.y})`}><circle r="12"/><path d={live?.command?.wheelY!>0?'M0 -30 V30 M-7 23 L0 30 L7 23':'M0 30 V-30 M-7 -23 L0 -30 L7 -23'}/><text x="20" y="4">{r!.status==='boundary'?'NO DISPLACEMENT':`${r!.scrollAfter-r!.scrollBefore} px`}</text></g></svg>}
  </div>{!desktopImage&&<p className="desktop-wait">Awaiting a verified desktop capture</p>}</div>
  <div className="desktop-foot"><span>{health==='replay'?'RECORDED':health==='live'?'CAPTURED':'HELD'} · {capture?.capturedAt.slice(11,23)??'—'} UTC</span><span>{capture?`${capture.width} × ${capture.height}`:'WINDOWS CAPTURE'}</span></div>
 </section>;
}
