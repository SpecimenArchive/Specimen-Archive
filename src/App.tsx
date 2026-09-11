import { useEffect, useState } from 'react';
import type { Circuit } from '../shared/types';
import { useStream } from './useStream';
import { SpecimenView } from './SpecimenView';
import { NetworkView } from './NetworkView';
import { ExperimentFeed } from './ExperimentFeed';
import { useReplay } from './useReplay';
import { BrowserEvidence,BrowserViewport } from './BrowserEvidence';
import { NeuronTrace } from './NeuronTrace';
import type { BrowserLive,BrowserDecision } from '../shared/browser';
const clock=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${(s%60).toFixed(1).padStart(4,'0')}`;
export function App(){
  const stream=useStream(),replay=useReplay();
  const [browserReplay,setBrowserReplay]=useState<{live:BrowserLive;frames:BrowserDecision['samples']}|null>(null),[field,setField]=useState<'browser'|'specimen'>('browser');
  const browser=browserReplay?.live??stream.browser,s=browserReplay?.live.snapshot??replay.snapshot??stream.snapshot,health=browserReplay||replay.data?'replay':stream.browser?.state==='completed'?'complete':stream.health;
  function inspectDecision(d:BrowserDecision,intervention:BrowserLive['intervention']){replay.close();setBrowserReplay({live:{state:'executed',runId:d.runId,decision:d.decision,intervention,image:`${d.runId}/${d.imageAfter}`,input:d.input,snapshot:d.samples.at(-1)!,motor:d.motor,command:d.command,events:d.executed.events},frames:d.samples});setField('browser');window.scrollTo({top:0,behavior:'smooth'});}
  const [circuit,setCircuit]=useState<Circuit|null>(null),[selected,setSelected]=useState('6743'),[anatomy,setAnatomy]=useState(false);
  useEffect(()=>{fetch('/api/circuit').then(r=>r.json()).then(setCircuit);},[]);
  const cell=circuit?.nodes.find(n=>n.id===selected),i=circuit?.nodes.findIndex(n=>n.id===selected)??-1;
  const motorMean=((s?.motor.left??0)+(s?.motor.right??0))/2,motorContrast=(s?.activity[circuit?.nodes.findIndex(n=>n.id==='1732111')??-1]??0)-(s?.activity[circuit?.nodes.findIndex(n=>n.id==='359142')??-1]??0);
  return <div className="app-shell">
    <header className="masthead"><a href="/" className="archive-mark"><span className="logo-mark">✳</span><span>SPECIMEN<br/><b>ARCHIVE</b></span></a><span className="edition">AN OBSERVATION SERIES <span>/</span> 001</span><span className="top-status"><i className={`status-dot ${health}`}/>{health==='live'?'RECEIVING SIGNAL':health.toUpperCase()}</span></header>
    <main>
      <div className="page-heading"><div><div className="eyebrow">DIGITAL BIOLOGY / CONTINUOUS OBSERVATION</div><h1>Specimen <span>01</span><small>$LARVA</small></h1></div><div className="species"><i>Platynereis dumerilii</i><span>MARINE ANNELID · 72 HPF</span></div></div>
      <div className="workbench">
        <section className="observation panel"><div className="panel-heading"><span><b className="panel-number">01</b> OBSERVATION FIELD</span>{browser&&<div className="field-tabs"><button aria-pressed={field==='browser'} onClick={()=>setField('browser')}>Browser</button><button aria-pressed={field==='specimen'} onClick={()=>setField('specimen')}>Specimen</button></div>}<span className="live-label"><i className={`status-dot ${health}`}/>{health.toUpperCase()}</span></div>
          {browser&&field==='browser'?<BrowserViewport live={browser} health={health}/>:<div className="microscope"><SpecimenView snapshot={s} circuit={circuit} anatomy={anatomy}/><div className="field-label"><span>SPECIMEN 01 / DORSOVENTRAL STUDY</span><b>72 hpf</b></div><button className="field-toggle" onClick={()=>setAnatomy(!anatomy)} aria-pressed={anatomy}>Anatomy {anatomy?'−':'+'}</button><span className="field-mode">{replay.data?'RECONSTRUCTED REPLAY':'TRACKING OPTICS'} <span>·</span> {browser?'BROWSER MODEL STATE':'0.5× TIME'}</span>{!replay.data&&!browserReplay&&health!=='live'&&health!=='complete'&&<div className="signal-overlay">{s?'Signal interrupted · last received state':'Establishing observation signal'}</div>}</div>}
          {browserReplay&&<div className="replay-controls"><b>RECORDED BROWSER REPLAY · NO ACTIONS EXECUTED</b><button onClick={()=>setBrowserReplay(null)}>Return to live</button></div>}
          {replay.data&&<div className="replay-controls"><button onClick={()=>replay.setPlaying(!replay.playing)}>{replay.playing?'Pause replay':'Play replay'}</button><input aria-label="Replay model time" type="range" min={replay.data.frames[0].modelTime} max={replay.data.frames.at(-1)!.modelTime} step=".01" value={replay.time} onChange={e=>{replay.setPlaying(false);replay.setTime(Number(e.target.value));}}/><span>{replay.data.verification.exact?'Exact replay verified':'Replay differs from record'}</span><button onClick={replay.close}>Return to live</button></div>}
          <div className="observation-readouts"><div><label>MODEL TIME</label><strong>{clock(s?.modelTime||0)}<small> s</small></strong></div><div><label>{browser?'MOTOR MEAN · M':'CILIARY TRANSLATION'}</label><strong>{browser?motorMean.toFixed(4):(s?.motor.forward||0).toFixed(1)}<small>{browser?' activity':' μm/s'}</small></strong></div><div><label>{browser?'MOTOR CONTRAST · D':'ANGULAR VELOCITY'}</label><strong>{browser?motorContrast.toFixed(4):(s?.motor.turn||0).toFixed(3)}<small>{browser?' activity':' rad/s'}</small></strong></div><div><label>{browser?'INTEGRATION / IMAGE':'ILLUMINATION'}</label><strong>{browser?'6.00':((s?.environment.intensity||0)*100).toFixed(0)}<small>{browser?' model s':'%'}</small></strong></div></div>
        </section>
        <aside className="neural panel"><div className="panel-heading"><span><b className="panel-number">02</b> NEURAL CIRCUIT</span><span className="muted">{circuit?.nodes.length||'—'} CELLS</span></div><div className="neural-title"><h2>{browser?'From pixels to actions.':'From light to motion.'}</h2><p>Published connections. Computed activity.</p></div>{circuit&&<NetworkView circuit={circuit} snapshot={s} selected={selected} onSelect={setSelected}/>}<div className="node-inspector"><label>SELECTED NEURON <span>↗</span></label><select aria-label="Inspect neuron" value={selected} onChange={e=>setSelected(e.target.value)}>{circuit?.nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select><div className="node-details"><span>#{cell?.id} · {cell?.category}</span><b>{((s?.activity[i]||0)*100).toFixed(1)}<small> %</small></b></div><div className="activity-meter"><span style={{width:`${(s?.activity[i]||0)*100}%`}}/></div></div>{circuit&&<NeuronTrace circuit={circuit} selected={selected} frames={browserReplay?.frames??replay.data?.frames??stream.history.current}/>}<div className="neural-foot">161 directed connections <span>·</span> functional layout</div></aside>
      </div>
      <section className="event-strip panel"><div className="event-heading"><span className="panel-number">03</span><b>OBSERVATION LOG</b><span>FROM THIS RUN</span></div><div className="events">{browser?(browser.history??(browser.command?[{decision:browser.decision,modelStep:s?.seq??0,command:browser.command,events:browser.events}]:[])).slice(-3).reverse().map(h=><div className="event" key={h.decision}><time>D{h.decision+1} / {h.modelStep}</time><span className="event-kind response">{h.command.kind}</span><p>{h.command.dx?`${h.command.dx>0?'+':''}${h.command.dx} px · `:''}{h.events.map(e=>e.type).join(' → ')||'No browser event'} · M {h.command.motorMean.toFixed(4)} / D {h.command.motorContrast.toFixed(4)}</p></div>):s?.events.slice(-3).reverse().map(e=><div className="event" key={e.id}><time>{clock(e.t)}</time><span className={`event-kind ${e.kind}`}>{e.kind}</span><p>{e.message}</p></div>)}</div></section>
      {replay.error&&<p role="alert" className="replay-error">{replay.error}</p>}
      <BrowserEvidence live={browser} onReplay={inspectDecision}/>
      {!stream.browser&&<ExperimentFeed onReplay={id=>{setBrowserReplay(null);void replay.open(id);}}/>}
      <footer><span>SPECIMEN ARCHIVE <span>/</span> OBSERVATION 001</span><span>{s?`${s.runId} · SEQ ${s.seq}`:'LOCAL ENGINE'} <span>·</span> VIEW ONLY</span></footer>
    </main>
  </div>;
}
