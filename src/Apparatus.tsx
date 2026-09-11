import { useEffect,useRef } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
const corners=[[890,174],[1515,184],[1497,537],[876,481]];
// Projective homography: unit square to the measured four bezel corners.
function point(u:number,v:number){
  const [p0,p1,p2,p3]=corners,dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dx3=p0[0]-p1[0]+p2[0]-p3[0],dy3=p0[1]-p1[1]+p2[1]-p3[1],det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
  return [0,1].map(i=>((p1[i]-p0[i]+g*p1[i])*u+(p3[i]-p0[i]+h*p3[i])*v+p0[i])/(g*u+h*v+1));
}
function triangle(ctx:CanvasRenderingContext2D,source:HTMLCanvasElement,s:number[][],d:number[][]){
  const [x0,y0]=s[0],[x1,y1]=s[1],[x2,y2]=s[2],den=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
  const coefficients=(k:number)=>[(d[0][k]*(y1-y2)+d[1][k]*(y2-y0)+d[2][k]*(y0-y1))/den,(d[0][k]*(x2-x1)+d[1][k]*(x0-x2)+d[2][k]*(x1-x0))/den,(d[0][k]*(x1*y2-x2*y1)+d[1][k]*(x2*y0-x0*y2)+d[2][k]*(x0*y1-x1*y0))/den];
  // Expand only the clip by 0.7 px to remove antialias seams between opaque
  // triangles. The outer monitor polygon clips the final texture boundary.
  const centre=[0,1].map(k=>(d[0][k]+d[1][k]+d[2][k])/3),clip=d.map(p=>{const length=Math.hypot(p[0]-centre[0],p[1]-centre[1]);return p.map((v,k)=>v+(v-centre[k])*.7/length);});
  const a=coefficients(0),b=coefficients(1);ctx.save();ctx.beginPath();ctx.moveTo(clip[0][0],clip[0][1]);ctx.lineTo(clip[1][0],clip[1][1]);ctx.lineTo(clip[2][0],clip[2][1]);ctx.closePath();ctx.clip();ctx.transform(a[0],b[0],a[1],b[1],a[2],b[2]);ctx.drawImage(source,0,0);ctx.restore();
}
export function Apparatus({live}:{live:ExhibitLive|null}){
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(live);useEffect(()=>{latest.current=live;},[live]);
  useEffect(()=>{
    const bench=new Image(),frame=new Image(),screen=document.createElement('canvas');screen.width=640;screen.height=360;bench.src='/assets/apparatus-master-v1.png';let path='',disposed=false;
    const draw=()=>{
      if(disposed||!bench.complete||!bench.naturalWidth||!canvas.current?.closest('details')?.open)return;
      const l=latest.current,ctx=canvas.current?.getContext('2d'),s=screen.getContext('2d');if(!ctx||!s)return;
      if(l?.browserFrame&&path!==l.browserFrame){path=l.browserFrame;frame.src='/api/exhibit/artifacts/'+path;}
      s.fillStyle='#152328';s.fillRect(0,0,640,360);if(frame.complete&&frame.naturalWidth)s.drawImage(frame,0,36,640,324);
      s.fillStyle='#a5c4be';s.font='13px monospace';s.fillText(`01 / ${l?.state.toUpperCase()??'CONNECTING'}    STEP ${l?.snapshot?.seq??0}    M ${(((l?.snapshot?.motor.left??0)+(l?.snapshot?.motor.right??0))/2).toFixed(3)}`,16,23);
      ctx.clearRect(0,0,1659,948);ctx.drawImage(bench,0,0,1659,948);
      ctx.save();ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip();
      for(let y=0;y<8;y++)for(let x=0;x<16;x++){const u=x/16,v=y/8,u1=(x+1)/16,v1=(y+1)/8;triangle(ctx,screen,[[u*640,v*360],[u1*640,v*360],[u1*640,v1*360]],[point(u,v),point(u1,v),point(u1,v1)]);triangle(ctx,screen,[[u*640,v*360],[u1*640,v1*360],[u*640,v1*360]],[point(u,v),point(u1,v1),point(u,v1)]);}ctx.restore();
      ctx.fillStyle='rgba(184,198,208,.045)';ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();
    };
    const timer=setInterval(draw,100);bench.onload=draw;frame.onload=draw;return()=>{disposed=true;clearInterval(timer);};
  },[]);
  return <details className="apparatus-panel" data-run-id={live?.runId} data-model-step={live?.snapshot?.seq}><summary><span><b>A</b> APPARATUS CONTEXT</span><span>Camera / chamber / workstation <em>Expand station ↗</em></span></summary><div className="apparatus-image"><canvas width="1659" height="948" ref={canvas} aria-label="Fixed generated apparatus with actual session browser and telemetry composited into the monitor"/></div><div className="apparatus-note"><div className="stage-crop" role="img" aria-label="Detail of the same microscope stage"/><p>One fixed bench. One shared observation.<br/><small>Stage detail from the same master. Equipment and magnified tissue are exhibit imagery; the screen displays the active controller.</small></p><a href="/docs/WORKSHEET.html" target="_blank" rel="noreferrer">Companion worksheet ↗</a></div></details>;
}
