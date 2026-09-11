import type { Circuit, Snapshot } from '../../shared/types';
import { PhotographicRenderer, photographicControls } from '../render/photographic';

export function interpolateEpisode(frames:Snapshot[], time:number): Snapshot {
  const next=frames.findIndex(s=>s.modelTime>=time);
  if(next<=0)return next===0?frames[0]:frames[frames.length-1];
  const a=frames[next-1],b=frames[next],f=(time-a.modelTime)/(b.modelTime-a.modelTime);
  const mix=(x:number,y:number)=>x+(y-x)*f;
  const pose={...a.pose};
  for(const key of Object.keys(pose) as (keyof Snapshot['pose'])[])pose[key]=mix(a.pose[key],b.pose[key]);
  return {...a, modelTime:time, pose, activity:a.activity.map((v,i)=>mix(v,b.activity[i])),
    motor:{left:mix(a.motor.left,b.motor.left),right:mix(a.motor.right,b.motor.right),forward:mix(a.motor.forward,b.motor.forward),turn:mix(a.motor.turn,b.motor.turn)}};
}
const frames: Snapshot[]=await fetch('/docs/results/prototype-episode.json').then(r=>r.json());
const circuit: Circuit=await fetch('/api/circuit').then(r=>r.json());
const canvas=document.querySelector<HTMLCanvasElement>('#photographic-canvas')!;
const renderer=new PhotographicRenderer(canvas,circuit);await renderer.ready;
let playing=false, elapsed=0, last=performance.now(), lastDraw=last, lastRendered=last, lastState=frames[0];
const duration=19.5, start=frames[0].modelTime;
const button=document.querySelector<HTMLButtonElement>('#play-study')!;
const slider=document.querySelector<HTMLInputElement>('#study-time')!;
const text=document.querySelector('#readout')!;
const timings:number[]=[];
function renderAt(seconds:number){
  elapsed=Math.max(0,Math.min(duration,seconds));
  lastState=interpolateEpisode(frames,start+elapsed*.5);
  renderer.draw(lastState);slider.value=String(elapsed);
  text.textContent=`${elapsed.toFixed(1)} / ${duration.toFixed(1)} s  ·  Model ${lastState.modelTime.toFixed(2)} s  ·  L ${lastState.motor.left.toFixed(3)} / R ${lastState.motor.right.toFixed(3)}  ·  Bend ${lastState.pose.bend.toFixed(4)}`;
  document.querySelector('#stimulus')!.textContent=lastState.environment.intensity?'LATERAL LIGHT / LEFT':'DARK ADAPTATION';
  return lastState;
}
button.onclick=()=>{if(elapsed>=duration)elapsed=0;playing=!playing;button.textContent=playing?'Pause study':'Play motion study';};
slider.oninput=()=>{playing=false;button.textContent='Play motion study';renderAt(Number(slider.value));};
function loop(now:number){
  const dt=(now-last)/1000;last=now;
  if(playing){
    elapsed=Math.min(duration,elapsed+dt);
    const period=1000/60;
    if(now-lastDraw>=period||elapsed>=duration){
      lastDraw+=Math.floor((now-lastDraw)/period)*period;
      timings.push(now-lastRendered);lastRendered=now;renderAt(elapsed);
    }
    if(elapsed>=duration){playing=false;button.textContent='Replay study';}
  }else{lastDraw=now;lastRendered=now;}
  requestAnimationFrame(loop);
}
renderAt(8);requestAnimationFrame(loop);
// Read-only deterministic capture API. No mutation of the running engine.
Object.assign(window,{photoStudy:{ready:true,canvas,frames,circuit,duration,start,timings,
  renderAt, controls:()=>photographicControls(lastState,circuit),
  play:()=>{elapsed=0;playing=true;button.textContent='Pause study';},
  pause:()=>{playing=false;button.textContent='Play motion study';}}});
