import type { Snapshot } from '../../shared/types';
export function interpolateFrame(a:Snapshot,b:Snapshot,fraction:number):Snapshot {
  const f=Math.max(0,Math.min(1,fraction)),mix=(x:number,y:number)=>x+(y-x)*f,pose={...a.pose};
  for(const key of Object.keys(pose) as (keyof typeof pose)[])pose[key]=mix(a.pose[key],b.pose[key]);
  return {...a,modelTime:mix(a.modelTime,b.modelTime),pose,activity:a.activity.map((v,i)=>mix(v,b.activity[i])),motor:{left:mix(a.motor.left,b.motor.left),right:mix(a.motor.right,b.motor.right),forward:mix(a.motor.forward,b.motor.forward),turn:mix(a.motor.turn,b.motor.turn)}};
}
export function frameAtTime(frames:Snapshot[],time:number){
  const next=frames.findIndex(s=>s.modelTime>=time);
  if(next<=0)return next===0?frames[0]:frames[frames.length-1];
  const a=frames[next-1],b=frames[next];return interpolateFrame(a,b,(time-a.modelTime)/(b.modelTime-a.modelTime));
}
