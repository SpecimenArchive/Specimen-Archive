import { useEffect, useState } from 'react';
import type { Circuit } from '../shared/types';
import { useStream } from './useStream';
import { SpecimenView } from './SpecimenView';
import { NetworkView } from './NetworkView';
const clock=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(1).padStart(4,'0')}`;
export function App(){
  const stream=useStream(),s=stream.snapshot;
  const [circuit,setCircuit]=useState<Circuit|null>(null),[selected,setSelected]=useState('6743'),[anatomy,setAnatomy]=useState(false);
  useEffect(()=>{fetch('/api/circuit').then(r=>r.json()).then(setCircuit);},[]);
  const cell=circuit?.nodes.find(n=>n.id===selected),i=circuit?.nodes.findIndex(n=>n.id===selected)??-1;
  return <div className="app-shell">
    <header className="masthead"><a href="/" className="archive-mark"><span className="logo-mark">✳</span><span>SPECIMEN<br/><b>ARCHIVE</b></span></a><span className="edition">AN OBSERVATION SERIES <span>/</span> 001</span><span className="top-status"><i className={`status-dot ${stream.health}`}/>{stream.health==='live'?'RECEIVING SIGNAL':stream.health.toUpperCase()}</span></header>
    <main>
      <div className="page-heading"><div><div className="eyebrow">DIGITAL BIOLOGY / CONTINUOUS OBSERVATION</div><h1>Specimen <span>01</span><small>$LARVA</small></h1></div><div className="species"><i>Platynereis dumerilii</i><span>MARINE ANNELID · 72 HPF</span></div></div>
      <div className="workbench">
        <section className="observation panel"><div className="panel-heading"><span><b className="panel-number">01</b> OBSERVATION FIELD</span><span className="live-label"><i className={`status-dot ${stream.health}`}/>{stream.health.toUpperCase()}</span></div>
          <div className="microscope"><SpecimenView snapshot={s} anatomy={anatomy}/><div className="field-label"><span>SPECIMEN 01 / DORSOVENTRAL STUDY</span><b>72 hpf</b></div><button className="field-toggle" onClick={()=>setAnatomy(!anatomy)} aria-pressed={anatomy}>Anatomy {anatomy?'−':'+'}</button><span className="field-mode">TRACKING OPTICS <span>·</span> 0.5× TIME</span>{stream.health!=='live'&&<div className="signal-overlay">{s?'Signal interrupted · last received state':'Establishing observation signal'}</div>}</div>
          <div className="observation-readouts"><div><label>MODEL TIME</label><strong>{clock(s?.modelTime||0)}<small> s</small></strong></div><div><label>CILIARY TRANSLATION</label><strong>{(s?.motor.forward||0).toFixed(1)}<small> μm/s</small></strong></div><div><label>ANGULAR VELOCITY</label><strong>{(s?.motor.turn||0).toFixed(3)}<small> rad/s</small></strong></div><div><label>ILLUMINATION</label><strong>{((s?.environment.intensity||0)*100).toFixed(0)}<small>%</small></strong></div></div>
        </section>
        <aside className="neural panel"><div className="panel-heading"><span><b className="panel-number">02</b> NEURAL CIRCUIT</span><span className="muted">{circuit?.nodes.length||'—'} CELLS</span></div><div className="neural-title"><h2>From light to motion.</h2><p>Published connections. Live activity.</p></div>{circuit&&<NetworkView circuit={circuit} snapshot={s} selected={selected} onSelect={setSelected}/>}<div className="node-inspector"><label>SELECTED NEURON <span>↗</span></label><select aria-label="Inspect neuron" value={selected} onChange={e=>setSelected(e.target.value)}>{circuit?.nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select><div className="node-details"><span>#{cell?.id} · {cell?.category}</span><b>{((s?.activity[i]||0)*100).toFixed(1)}<small> %</small></b></div><div className="activity-meter"><span style={{width:`${(s?.activity[i]||0)*100}%`}}/></div></div><div className="neural-foot">161 directed connections <span>·</span> functional layout</div></aside>
      </div>
      <section className="event-strip panel"><div className="event-heading"><span className="panel-number">03</span><b>OBSERVATION LOG</b><span>FROM THIS RUN</span></div><div className="events">{s?.events.slice(-3).reverse().map(e=><div className="event" key={e.id}><time>{clock(e.t)}</time><span className={`event-kind ${e.kind}`}>{e.kind}</span><p>{e.message}</p></div>)}</div></section>
      <footer><span>SPECIMEN ARCHIVE <span>/</span> OBSERVATION 001</span><span>{s?`${s.runId} · SEQ ${s.seq}`:'LOCAL ENGINE'} <span>·</span> VIEW ONLY</span></footer>
    </main>
  </div>;
}
