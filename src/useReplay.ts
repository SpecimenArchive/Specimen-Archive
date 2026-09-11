import { useEffect, useState } from 'react';
import type { Snapshot } from '../shared/types';
import type { ExperimentRecord } from '../server/experiment';
import { frameAtTime } from './render/interpolate';
export interface Replay {record:ExperimentRecord;frames:Snapshot[];verification:{exact:boolean;method:string;sourceRevision:string}}
export function useReplay(){
  const [data,setData]=useState<Replay|null>(null),[time,setTime]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState<string|null>(null);
  async function open(id:string){
    setError(null);
    try{const response=await fetch(`/api/experiments/${encodeURIComponent(id)}/replay`);const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Replay unavailable');setData(payload);setTime(payload.frames[0].modelTime);setPlaying(false);}
    catch(e){setError((e as Error).message);}
  }
  useEffect(()=>{
    if(!playing||!data)return;let last=performance.now();
    const timer=setInterval(()=>{const now=performance.now(),dt=(now-last)/1000*.5;last=now;setTime(t=>{const next=Math.min(data.frames.at(-1)!.modelTime,t+dt);if(next>=data.frames.at(-1)!.modelTime)setPlaying(false);return next;});},50);
    return()=>clearInterval(timer);
  },[playing,data]);
  return {data,time,playing,error,open,close:()=>{setData(null);setPlaying(false);},setTime,setPlaying,snapshot:data?frameAtTime(data.frames,time):null};
}
