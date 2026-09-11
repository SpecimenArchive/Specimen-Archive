import { useEffect,useState } from 'react';
import type { BrowserLive,BrowserDecision } from '../shared/browser';
import type { BrowserRecord } from '../server/browser/evidence';
import type { Publication } from '../server/experiment-store';
export const browserArtifact=(runId:string,name:string)=>`/api/browser/artifacts/${runId}/${name}`;
export function BrowserViewport({live}:{live:BrowserLive}){
  return <div className="browser-field" data-run-id={live.runId} data-decision={live.decision}>
    <div className="browser-caption"><span>{live.state.toUpperCase()} · {live.intervention}</span><span>DECISION {live.decision+1} / 16 · STEP {live.snapshot?.seq}</span></div>
    <img key={live.image} src={`/api/browser/artifacts/${live.image}`} width="640" height="360" alt={`Actual controlled browser viewport, run ${live.runId}, decision ${live.decision+1}`}/>
    <div className="browser-caption"><span>PNG → 21 PRCs → 20 INs → 6 MNs → PLAYWRIGHT</span><span>VIEW ONLY</span></div>
  </div>;
}
export function BrowserEvidence({live,onReplay}:{live:BrowserLive|null;onReplay:(d:BrowserDecision,intervention:BrowserLive['intervention'])=>void}){
  const [records,setRecords]=useState<BrowserRecord[]>([]),[receipts,setReceipts]=useState<Publication[]>([]),[error,setError]=useState('');
  const [trace,setTrace]=useState<BrowserDecision[]|null>(null),[index,setIndex]=useState(0);
  const [traceIntervention,setTraceIntervention]=useState<BrowserLive['intervention']>('intact');
  useEffect(()=>{let stopped=false;async function poll(){try{const [a,b]=await Promise.all([fetch('/api/browser/records'),fetch('/api/browser/publications')]);if(!a.ok||!b.ok)throw new Error('Browser evidence endpoint unavailable');const [r,p]=await Promise.all([a.json(),b.json()]);if(!stopped){setRecords(r);setReceipts(p);setError('');}}catch(e){if(!stopped)setError((e as Error).message);}}void poll();const timer=setInterval(poll,3000);return()=>{stopped=true;clearInterval(timer);};},[]);
  async function replay(id:string,intervention:BrowserLive['intervention']){try{const response=await fetch(`/api/browser/replay/${id}`);if(!response.ok)throw new Error('Recorded trace unavailable');const d=await response.json() as BrowserDecision[];setTrace(d);setTraceIntervention(intervention);setIndex(0);onReplay(d[0],intervention);}catch(e){setError((e as Error).message);}}
  return <section className="browser-evidence panel"><div className="panel-heading"><span><b className="panel-number">04</b> NEURAL BROWSER EVIDENCE</span><a href="/docs/BROWSER_CONTROLLER.md">Protocol & reproduction ↗</a></div>
    <div className="browser-rule"><div><h2>Pixels. Wiring. Actions.</h2><p>Every command is decoded from computed motor activity. The evaluator reads success after the fixed 16-decision budget.</p></div><dl><dt>MOVE GATE</dt><dd>M ≥ 0.500</dd><dt>ACTIVATION</dt><dd>M ≥ 0.593</dd><dt>DIRECTION</dt><dd>MN3_r − MN2_r ≥ 0.008 → right</dd></dl></div>
    {live&&<div className="browser-current"><span>RETINAL DRIVE <b>L {live.input?.left.toFixed(2)??'—'} / R {live.input?.right.toFixed(2)??'—'}</b></span><span>PIXEL OFFSET <b>{live.input?.horizontalErrorPx?.toFixed(1)??'—'} px</b></span><span>LAST COMMAND <b>{live.command?`${live.command.kind} ${live.command.dx||''}`:live.history?.at(-1)?.command.kind??'integrating'}</b></span></div>}
    {live?.history?.length? <div className="browser-events">{live.history.slice(-4).reverse().map(h=><div key={h.decision}><code>D{h.decision+1} / STEP {h.modelStep}</code><b>{h.command.kind}{h.command.dx?` ${h.command.dx>0?'+':''}${h.command.dx}px`:''}</b><span>M={h.command.motorMean.toFixed(4)} · D={h.command.motorContrast.toFixed(4)}</span><span>{h.events.map(e=>e.type).join(' → ')||'No browser event'}</span></div>)}</div>:null}
    {error&&<p role="alert">{error}</p>}
    {trace&&<div className="replay-controls"><label>RECORDED DECISION {index+1}</label><input aria-label="Browser replay decision" type="range" min="0" max={trace.length-1} value={index} onChange={e=>{const i=Number(e.target.value);setIndex(i);onReplay(trace[i],traceIntervention);}}/><span>Recorded PNG + exact neural sample</span></div>}
    <div className="browser-records">{records.slice(0,18).map(r=>{const p=receipts.find(p=>p.id===r.id);return <article key={r.id}><div><b>{r.intervention}</b><span>Seed {r.seed} · {r.outcome} · {r.replay?.exact?'exact replay verified':'verification unavailable'}</span><code>{r.id}</code></div><div className="record-actions"><button onClick={()=>void replay(r.id,r.intervention)}>Inspect trace</button><a href={browserArtifact(r.id,'browser.webm')}>Browser recording ↗</a><a href={browserArtifact(r.id,'record.json')}>Record JSON ↗</a>{p?.state==='published'?<a className="publication-published" href={p.url}>Published {p.commit?.slice(0,7)} ↗</a>:<span className={p?.state==='failed'?'publication-failed':'publication-pending'} title={p?.reason}>{p?.state??'local evidence'}{p?.reason?` · ${p.reason}`:''}</span>}</div></article>;})}</div>
    {!records.length&&<p className="muted">A completed trial will appear here with its measured outcome and publication receipt.</p>}
  </section>;
}
