import type { Circuit, Snapshot } from '../shared/types';
export function NetworkView({circuit,snapshot,selected,onSelect}:{circuit:Circuit;snapshot:Snapshot|null;selected:string;onSelect:(id:string)=>void}){
  const groups=['sensory','interneuron','motor'];
  const positions=new Map<string,[number,number]>();
  for(const [g,category]of groups.entries()){
    const nodes=circuit.nodes.filter(n=>n.category===category);
    nodes.forEach((n,i)=>{const t=(i+.5)/nodes.length;const angle=t*Math.PI*2;const r=category==='motor'?40:65;
      positions.set(n.id,[158+Math.cos(angle)*r*(n.side==='L'?.95:1.05),70+g*120+Math.sin(angle)*r*.6]);});
  }
  const index=new Map(circuit.nodes.map((n,i)=>[n.id,i]));
  return <svg viewBox="0 0 320 365" className="network-svg" data-run-id={snapshot?.runId} data-model-step={snapshot?.seq} role="img" aria-label="Published connectivity, arranged as a functional circuit layout">
    <defs><radialGradient id="node-glow"><stop stopColor="#8bdcd4" stopOpacity=".2"/><stop offset="1" stopColor="#8bdcd4" stopOpacity="0"/></radialGradient></defs>
    {[70,190,310].map(y=><g key={y}><circle cx="158" cy={y} r="76" fill="none" stroke="#283637" strokeDasharray="2 7"/><path d={`M 12 ${y} H 308`} stroke="#233033" strokeDasharray="2 7"/></g>)}
    {circuit.edges.map((e,i)=>{const a=positions.get(e.source)!,b=positions.get(e.target)!,v=snapshot?.activity[index.get(e.source)!]||0,highlight=selected===e.source||selected===e.target;return <path key={i} d={`M${a[0]},${a[1]} Q${(a[0]+b[0])/2+(i%2?10:-10)},${(a[1]+b[1])/2} ${b[0]},${b[1]}`} fill="none" stroke={highlight?'#b6e3db':'#72b9b5'} strokeOpacity={highlight?.6:.035+v*.17} strokeWidth={highlight?1:.3+Math.min(e.weight,12)*.045}/>;})}
    {circuit.nodes.map((n,i)=>{const [x,y]=positions.get(n.id)!,v=snapshot?.activity[i]||0;return <g key={n.id} role="button" tabIndex={0} aria-label={`Inspect ${n.name}`} onClick={()=>onSelect(n.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n.id);}}} className="network-node">
      <circle cx={x} cy={y} r={8+v*9} fill="url(#node-glow)"/><circle cx={x} cy={y} r={selected===n.id?6:2+v*2} fill={n.category==='motor'?'#d9b782':'#92d8d0'} fillOpacity={.25+v*.75} stroke={selected===n.id?'#e7f4ec':'none'}/><circle cx={x} cy={y} r="9" fill="transparent"/><title>{n.name} · {n.id} · {snapshot?`${(v*100).toFixed(1)}%`:"sample unavailable"}</title></g>;})}
    {['PHOTORECEPTORS','INTERNEURONS','MOTOR OUTPUT'].map((t,i)=><text key={t} x="12" y={17+i*120} fill="#90a7a6" fontSize="9" fontFamily="monospace" letterSpacing="1.1">{t}</text>)}
  </svg>;
}
