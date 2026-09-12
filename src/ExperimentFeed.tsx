import { useEffect, useState } from 'react';
import type { ExperimentRecord } from '../server/experiment';
import type { Publication } from '../server/experiment-store';
interface TrialSummary {id:string;phase:string;elapsed:number;rule:string;integral:number;selection:ExperimentRecord['selection']|null;completed:string|null}
export function ExperimentFeed({onReplay}:{onReplay:(id:string)=>void}){
  const [trial,setTrial]=useState<TrialSummary|null>(null),[records,setRecords]=useState<ExperimentRecord[]>([]),[receipts,setReceipts]=useState<Publication[]>([]),[error,setError]=useState(false);
  useEffect(()=>{
    let disposed=false,pending=false;
    async function poll(){if(pending)return;pending=true;try{
      const results=await Promise.all(['/api/experiment','/api/experiments','/api/publications'].map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error('Unavailable');return r.json();}));
      if(!disposed){setTrial(results[0]);setRecords(results[1]);setReceipts(results[2]);setError(false);}
    }catch{if(!disposed)setError(true);}finally{pending=false;}}
    void poll();const interval=setInterval(()=>void poll(),2000);return()=>{disposed=true;clearInterval(interval);};
  },[]);
  return <section className="experiment-feed panel">
    <div className="panel-heading"><span><b className="panel-number">04</b> EXPERIMENT NOTEBOOK</span><a href="/docs/FEEDBACK_LOOP.md">Method & evidence ↗</a></div>
    <div className="trial-overview"><div><span className="eyebrow">MOTOR-DEPENDENT ILLUMINATION</span><h2>A measured response sets the next light.</h2><p>Eight seconds of bilateral motor activity. One fixed selection rule.</p></div><div className="trial-state"><label>{error?'SIGNAL UNAVAILABLE':trial?.phase.toUpperCase()||'CONNECTING'}</label><strong>{trial?.integral.toFixed(4)??'—'}<small> activity·s</small></strong><span>{trial?.selection?`${trial.selection.condition.key.toUpperCase()} · ${trial.selection.thresholdReached?'threshold reached':'threshold not reached'}`:'Integrating R − L'}</span></div></div>
    <div className="trial-rule">D ≥ +0.05 → right light <span>·</span> D ≤ −0.05 → left light <span>·</span> otherwise → dark, no threshold</div>
    <div className="experiment-records">{records.length?records.slice(0,5).map(record=>{
      const receipt=receipts.find(p=>p.id===record.id),published=receipt?.state==='published'&&receipt.url&&receipt.commit;
      return <article className="experiment-record" key={record.id}>
        <div className="record-title"><time>{new Date(record.completedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time><b>{record.selection.thresholdReached?`${record.selection.condition.key} light executed`:'No threshold reached · dark executed'}</b><span>D {record.selection.difference.toFixed(5)}</span></div>
        <div className="record-detail"><span>{record.integration.sampleCount} integrated steps · {record.response.sampleCount} response steps</span><button onClick={()=>onReplay(record.id)}>Replay response ↗</button><a href={`/api/experiments/${encodeURIComponent(record.id)}`} target="_blank" rel="noreferrer">Result JSON ↗</a></div>
        <div className={`publication-state ${receipt?.state||'pending'}`}><span>SPECIMEN RECORDER / {receipt?.state.toUpperCase()||'PENDING'}</span>{published?<a href={receipt.url} target="_blank" rel="noreferrer">GitHub commit {receipt.commit!.slice(0,7)} ↗</a>:<span>{receipt?.reason||'Awaiting publication receipt'}</span>}</div>
      </article>;
    }):<p className="empty-records">The first completed trial will appear here with its motor integral, chosen light and recorded response.</p>}</div>
    <details className="evidence-details"><summary>Why this is model-dependent</summary><p>The rule consumes outputs from six named motor neurons. It does not choose a condition on a timer alone. In the controlled test, the intact circuit selects right light (D = 0.10864); clamping the right motor neurons selects left (D = −1.12405); clamping all motors yields no threshold (D = 0). Exact replay reproduces the integral, selection and response. This fixed motor-to-illumination mapping and its controlled results remain in the methods register.</p><a href="/docs/results/feedback-validation.json" target="_blank" rel="noreferrer">Inspect controlled results and all six motor identities ↗</a></details>
  </section>;
}
