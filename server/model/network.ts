import type { Circuit } from '../../shared/types';
import { MODEL_CONFIG as C, type Intervention } from './config';

export class RateNetwork {
  activity: Float64Array;
  private next: Float64Array;
  readonly edges: { source: number; target: number; gain: number }[];
  readonly index: Map<string, number>;
  readonly clamped: number[];
  constructor(readonly circuit: Circuit, intervention: Intervention = 'intact') {
    this.activity = new Float64Array(circuit.nodes.length); this.next = new Float64Array(circuit.nodes.length);
    this.index = new Map(circuit.nodes.map((n,i)=>[n.id,i]));
    this.clamped=circuit.nodes.flatMap((n,i)=>n.category==='motor'&&(intervention==='clamp-all-motors'||intervention==='clamp-left-motors'&&n.side==='L'||intervention==='clamp-right-motors'&&n.side==='R')?[i]:[]);
    const totals = new Float64Array(circuit.nodes.length);
    let seed=C.seed;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const targets=circuit.edges.map(e=>this.index.get(e.target)!);
    if(intervention==='shuffled')for(let i=targets.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[targets[i],targets[j]]=[targets[j],targets[i]];}
    circuit.edges.forEach((e,i)=>{totals[targets[i]]+=e.weight;});
    this.edges=circuit.edges.map((e,i)=>({source:this.index.get(e.source)!,target:targets[i],gain:e.weight / Math.max(1,totals[targets[i]])})).filter(e=>{
      const n=circuit.nodes[e.source];
      return !(intervention==='disconnect-photoreceptors' && n.category==='sensory') && !(intervention==='disconnect-inton' && n.type==='celltype3');
    });
  }
  step(left: number, right: number) {
    this.next.fill(0);
    for(const e of this.edges)this.next[e.target]+=e.gain*this.activity[e.source];
    for(let i=0;i<this.activity.length;i++){
      const node=this.circuit.nodes[i];
      const sensory=node.category==='sensory';
      const input=sensory?C.sensoryGain*(node.side==='L'?left:node.side==='R'?right:(left+right)/2):C.gain*this.next[i];
      const tau=sensory?C.sensoryTau:node.category==='motor'?C.motorTau:C.interTau;
      // All effective signs are positive modelling assumptions. This is a
      // bounded non-spiking activity model, not measured membrane voltage.
      this.next[i]=this.activity[i]+C.dt/tau*(Math.tanh(input)-this.activity[i]);
    }
    for(const i of this.clamped)this.next[i]=0;
    [this.activity,this.next]=[this.next,this.activity];
  }
}
