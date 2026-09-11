import type { Snapshot } from '../shared/types';
import { VolumeSpecimenRenderer } from './renderer';

const canvas=document.querySelector<HTMLCanvasElement>('#prototype')!;
const stamp=document.querySelector('#stamp')!,readout=document.querySelector('#readout')!;
let renderer:VolumeSpecimenRenderer;
let frames:Snapshot[]=[];
let frameId=0,start=performance.now();
const metrics={frames:0,drawMs:[] as number[],intervals:[] as number[]};
declare global {interface Window {prototypeStudy?:{renderer:VolumeSpecimenRenderer;frames:Snapshot[];metrics:typeof metrics;freeze:(index:number)=>void;resume:()=>void}}}
try{
  frames=await fetch('/docs/results/prototype-episode.json').then(r=>{if(!r.ok)throw new Error('Recorded episode missing');return r.json();});
  renderer=new VolumeSpecimenRenderer(canvas);document.querySelector('#loading')!.remove();
  document.querySelector('#mode')!.textContent='RECORDED MODEL EPISODE · 0.5×';
  let last=0;
  function render(){
    const now=performance.now();if(last)metrics.intervals.push(now-last);last=now;
    const duration=(frames.at(-1)!.modelTime-frames[0].modelTime)*2000;
    const elapsed=(now-start)%duration,target=frames[0].modelTime+elapsed/2000;
    let index=frames.findIndex(f=>f.modelTime>=target);if(index<1)index=1;
    const previous=frames[index-1],next=frames[index],a=(target-previous.modelTime)/(next.modelTime-previous.modelTime);
    const s={...next,modelTime:target,pose:{...next.pose},motor:{...next.motor}};
    for(const k of Object.keys(s.pose) as (keyof Snapshot['pose'])[])s.pose[k]=previous.pose[k]+(next.pose[k]-previous.pose[k])*a;
    for(const k of Object.keys(s.motor) as (keyof Snapshot['motor'])[])s.motor[k]=previous.motor[k]+(next.motor[k]-previous.motor[k])*a;
    const before=performance.now();renderer.render(s);metrics.drawMs.push(performance.now()-before);metrics.frames++;
    if(metrics.intervals.length>1800)metrics.intervals.shift();if(metrics.drawMs.length>1800)metrics.drawMs.shift();
    stamp.textContent=`${s.modelTime.toFixed(2)} SIM S · RECORDED`;
    readout.textContent=`${s.environment.label} / MOTOR L ${s.motor.left.toFixed(3)} · R ${s.motor.right.toFixed(3)} / BEND ${s.pose.bend.toFixed(3)} / ${s.runId}`;
    frameId=requestAnimationFrame(render);
  }
  window.prototypeStudy={renderer,frames,metrics,freeze:(index:number)=>{cancelAnimationFrame(frameId);renderer.render(frames[index]);stamp.textContent=`${frames[index].modelTime.toFixed(2)} SIM S · RECORDED STILL`;},resume:()=>{cancelAnimationFrame(frameId);start=performance.now();last=0;frameId=requestAnimationFrame(render);}};
  document.querySelector('#replay')!.addEventListener('click',()=>window.prototypeStudy!.resume());
  start=performance.now();render();
  window.addEventListener('beforeunload',()=>{cancelAnimationFrame(frameId);renderer.dispose();});
}catch(error){document.querySelector('#error')!.textContent=String(error);console.error(error);}
