import type { Circuit,Snapshot } from '../shared/types';
export function NeuronTrace({circuit,selected,frames}:{circuit:Circuit;selected:string;frames:Snapshot[]}){
  const index=circuit.nodes.findIndex(n=>n.id===selected),last=frames.at(-1),recent=frames.filter(s=>s.runId===last?.runId).slice(-180),first=recent[0];
  const span=Math.max(.01,(last?.modelTime??0)-(first?.modelTime??0));
  const points=recent.map(s=>`${8+(s.modelTime-first.modelTime)/span*284},${61-(s.activity[index]??0)*54}`).join(' ');
  const incoming=circuit.edges.filter(e=>e.target===selected),total=incoming.reduce((sum,e)=>sum+e.weight,0),map=new Map(circuit.nodes.map((n,i)=>[n.id,i]));
  return <div className="neuron-trace"><label>ACTUAL ACTIVITY · DIMENSIONLESS 0–1</label><svg viewBox="0 0 300 78" aria-label="Selected neuron activity over model time"><path d="M8 7 V61 H292" fill="none" stroke="#405055"/><polyline points={points} fill="none" stroke="#9adcd0" strokeWidth="1.5"/><text x="8" y="75">{first?.modelTime.toFixed(1)} s</text><text x="248" y="75">{last?.modelTime.toFixed(1)} s</text></svg><details><summary>{incoming.length} incoming published connections</summary>{incoming.map(e=><div className="edge-term" key={e.source}><span>{circuit.nodes[map.get(e.source)!].name} #{e.source}</span><b>{e.weight} syn.</b><span>weighted input {((last?.activity[map.get(e.source)!]??0)*e.weight/Math.max(1,total)).toFixed(5)}</span></div>)}<p>Weight = synapses / target incoming total. Source activities are from this sample; the synchronous update uses the preceding integration step.</p></details></div>;
}
