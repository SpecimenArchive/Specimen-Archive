import type { Snapshot } from '../../shared/types';

// These are drawing coordinates, in approximate virtual micrometres. They are
// reference-informed proportions, not measured skeleton or microscopy data.
const profile = [[-112,2],[-107,16],[-99,30],[-88,39],[-74,42],[-61,43],[-53,37],[-43,33],[-29,38],[-14,38],[0,35],[15,33],[28,32],[43,28],[57,25],[71,22],[84,18],[95,12],[103,3]];
function radius(y: number) {
  for (let i=1;i<profile.length;i++) if(y<=profile[i][0]){
    const [a,ra]=profile[i-1], [b,rb]=profile[i];
    const t=Math.max(0,Math.min(1,(y-a)/(b-a))); return ra+(rb-ra)*(t*t*(3-2*t));
  }
  return 0;
}
function seeded(seed: number) { return () => { seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296; }; }
const rand=seeded(7101);
const granules=Array.from({length:1550},()=>({y:-105+rand()*202,theta:rand()*Math.PI*2,r:Math.sqrt(rand())*.91,size:.3+rand()*1.5,tone:rand()}));
const vesicles=Array.from({length:105},()=>({y:-37+rand()*118,theta:rand()*Math.PI*2,r:Math.sqrt(rand())*.73,size:1.5+rand()*5,tone:rand()}));
const dust=Array.from({length:65},()=>({x:rand(),y:rand(),r:.4+rand()*1.4,opacity:rand()*.07}));
let tissue: HTMLImageElement | undefined;
export function loadTissue(){ const img=new Image(); img.onload=()=>{tissue=img;};img.src='/assets/tissue-texture.png'; }

export interface RenderOptions { anatomy: boolean; trails: boolean; zoom: number; reducedMotion: boolean }
export function drawSpecimen(canvas: HTMLCanvasElement, snapshot: Snapshot, options: RenderOptions) {
  const ctx=canvas.getContext('2d'); if(!ctx)return;
  const bounds=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(bounds.width*dpr)||canvas.height!==Math.round(bounds.height*dpr)){ canvas.width=Math.round(bounds.width*dpr);canvas.height=Math.round(bounds.height*dpr); }
  const w=bounds.width,h=bounds.height;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const field=ctx.createRadialGradient(w*.49,h*.43,0,w*.5,h*.5,Math.max(w,h)*.7);
  field.addColorStop(0,'#f1efe5');field.addColorStop(.57,'#e9e8de');field.addColorStop(1,'#d9dcd4');ctx.fillStyle=field;ctx.fillRect(0,0,w,h);
  for(const p of dust){ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(84,101,97,${p.opacity})`;ctx.fill();}
  const scale=Math.min(w/360,h/290)*options.zoom;
  const pose=snapshot.pose;
  // Tracking microscopy keeps the organism central; the trajectory inset carries
  // authoritative global position. No invisible camera shake or random movement.
  ctx.save();ctx.translate(w*.5,h*.50);ctx.rotate(pose.heading+.24);ctx.scale(scale,scale);
  const roll=pose.roll, bend=pose.bend;
  const center=(y:number)=>bend*20*Math.pow((y+105)/210,2);
  const point=(x:number,y:number,z=0):[number,number]=>[center(y)+x*Math.cos(roll)+z*Math.sin(roll),y+z*.10];
  const ellipse=(x:number,y:number,rx:number,ry:number,fill:string,stroke?:string)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.35;ctx.stroke();}};
  const curve=(points:number[],color:string,width:number)=>{ctx.beginPath();ctx.moveTo(points[0],points[1]);ctx.bezierCurveTo(points[2],points[3],points[4],points[5],points[6],points[7]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  function bristles(back:boolean){
    for(const y0 of [-36,16,62])for(const side of [-1,1])for(let n=0;n<19;n++){
      const theta=side>0?.23:Math.PI-.23;
      const radial=radius(y0), z=Math.sin(theta)*radial;
      const depth=-side*Math.sin(roll)+.25*Math.cos(roll);
      if((depth<0)!==back)continue;
      const [x,y]=point(side*radial*.94,y0,z);
      const extent=(32+Math.sin(n*7.17)*7+n*.9)*(y0>50?.88:1);
      const endY=y+19+n*2.2;
      const sway=options.reducedMotion?0:Math.sin(pose.ciliaPhase*.06+n*.31)*.5;
      const [ex,ey]=point(side*(radial+extent),endY, z+10);
      curve([x,y,x+side*extent*.5,y+4,ex+side*2,ey-13,ex+sway,ey],back?'rgba(102,113,98,.17)':'rgba(112,105,77,.36)',n%5===0?.52:.29);
      curve([x+.5,y,x+side*extent*.5+.7,y+3,ex+side*2+.7,ey-13,ex+sway+.4,ey],'rgba(255,255,242,.43)',.23);
    }
  }
  bristles(true);
  // Continuous body envelope, with a refractive edge and translucent interior.
  const outline=new Path2D();
  for(let y=-112;y<=104;y+=2){const x=center(y)-radius(y);if(y===-112)outline.moveTo(x,y);else outline.lineTo(x,y);}
  for(let y=104;y>=-112;y-=2)outline.lineTo(center(y)+radius(y),y);outline.closePath();
  ctx.save();ctx.shadowColor='rgba(87,102,90,.12)';ctx.shadowBlur=4;ctx.shadowOffsetX=1;ctx.shadowOffsetY=2;ctx.fillStyle='rgba(158,166,134,.13)';ctx.fill(outline);ctx.restore();
  ctx.save();ctx.clip(outline);
  const tissueFill=ctx.createLinearGradient(-46,-40,48,0);tissueFill.addColorStop(0,'rgba(116,131,111,.32)');tissueFill.addColorStop(.09,'rgba(253,252,224,.68)');tissueFill.addColorStop(.27,'rgba(214,210,164,.29)');tissueFill.addColorStop(.52,'rgba(246,238,203,.32)');tissueFill.addColorStop(.82,'rgba(246,247,226,.66)');tissueFill.addColorStop(1,'rgba(108,128,112,.36)');ctx.fillStyle=tissueFill;ctx.fill(outline);
  if(tissue){ctx.globalAlpha=.16;ctx.globalCompositeOperation='multiply';ctx.drawImage(tissue,-60,-120,120,240);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  // Yolk vesicles and paired longitudinal tissue: artistic microstructure only.
  for(const g of vesicles){
    const theta=g.theta+roll;const x=center(g.y)+Math.cos(theta)*radius(g.y)*g.r, z=Math.sin(theta);const a=.13+Math.max(0,z)*.17;
    const gradient=ctx.createRadialGradient(x-g.size*.25,g.y-g.size*.3,.1,x,g.y,g.size);
    gradient.addColorStop(0,`rgba(249,239,177,${a+.17})`);gradient.addColorStop(.7,`rgba(192,176,110,${a})`);gradient.addColorStop(1,'rgba(142,147,97,.15)');ellipse(x,g.y,g.size,g.size*.82,gradient as unknown as string,'rgba(121,125,77,.14)');
  }
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side*(18+i*1.2);curve([x,-49,x+side*6,-13,center(42)+x*.8,48,center(91)+x*.3,91],'rgba(155,140,99,.115)',.45);
  }
  // A subtle developing gut column, visible through the trunk.
  curve([2,-33,center(3)-5,-10,center(49)+5,46,center(85),88],'rgba(183,160,111,.11)',8);
  curve([-1,-30,center(3)-5,-10,center(49)+4,46,center(85),88],'rgba(247,239,202,.21)',4);
  for(const g of granules){const theta=g.theta+roll;const z=Math.sin(theta);const x=center(g.y)+Math.cos(theta)*radius(g.y)*g.r;const alpha=.055+.07*(z+1)/2;
    ellipse(x,g.y,g.size,g.size*.76,`rgba(${g.tone>.86?'126,113,67':'138,151,125'},${alpha})`,g.size>1?'rgba(239,242,215,.16)':undefined);
  }
  for(const y of [-49,-1,46,85]){curve([-radius(y),y-1,-15,y+5,16+center(y),y+5,radius(y)+center(y),y-1],'rgba(128,135,103,.2)',.6);curve([-radius(y),y-2,-15,y+3,16+center(y),y+3,radius(y)+center(y),y-2],'rgba(255,255,237,.44)',.8);}
  // Four visual pigment cups plus the smaller lateral eyespots.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const theta=(side>0?0:Math.PI)+(i===2?.1:.55);
    const y=-91+i*10, radial=radius(y)*.77;
    const [x,py]=point(Math.cos(theta)*radial,y,Math.sin(theta)*radial);
    const z=-Math.cos(theta)*Math.sin(roll)+Math.sin(theta)*Math.cos(roll);
    const opacity=.24+.66*(z+1)/2;
    ellipse(x,py,i===2?1.7:3.0,i===2?1.5:2.7,`rgba(113,57,35,${opacity})`,'rgba(106,68,36,.33)');
    ellipse(x-.8,py-.6,i===2?.45:1.2,i===2?.4:1.1,'rgba(240,190,122,.43)');
  }
  // Prototroch pigment traces and head microstructure.
  for(let i=0;i<70;i++){const theta=i/70*Math.PI*2+roll;const x=Math.cos(theta)*43;const y=-60+Math.sin(theta)*4;ellipse(x,y,.8+(i%3)*.23,.8,`rgba(139,133,81,${.1+Math.max(0,Math.sin(theta))*.18})`);}
  ctx.restore();ctx.strokeStyle='rgba(112,127,106,.36)';ctx.lineWidth=.5;ctx.stroke(outline);ctx.translate(-.6,-.3);ctx.strokeStyle='rgba(255,255,241,.64)';ctx.lineWidth=.6;ctx.stroke(outline);ctx.translate(.6,.3);
  // Paired parapodial lobes with thin supporting acicula.
  for(const y of [-36,16,62])for(const side of [-1,1]){
    const [x,py]=point(side*radius(y)*.91,y,4);ellipse(x,py,4.1,6,'rgba(211,204,160,.26)','rgba(142,147,113,.24)');
    const [ex,ey]=point(side*(radius(y)+17),y+14,4);curve([x-side*8,py-2,x,py,ex,ey-3,ex,ey],'rgba(154,130,76,.46)',.65);
  }
  bristles(false);
  // Metachronal ciliary bands. Phase advances only with authoritative state.
  for(const [y0,radiusFactor,count,length] of [[-59,1.02,180,7],[0,1,70,4.4],[46,1,62,4.3],[91,1.2,40,4.8]]){
    const r=radius(y0)*radiusFactor;
    for(let i=0;i<count;i++){
      const theta=i/count*Math.PI*2+roll;const z=Math.sin(theta);const x=center(y0)+Math.cos(theta)*r,y=y0+z*3;
      const phase=options.reducedMotion?0:Math.sin(pose.ciliaPhase-i*.44);
      const dx=Math.cos(theta)*(length+phase*1.2),dy=z*3+3+phase*1.5;
      curve([x,y,x+dx*.35,y+dy*.1,x+dx*.8+phase,y+dy*.6,x+dx,y+dy],`rgba(125,139,115,${.13+Math.max(0,z)*.18})`,.28);
    }
  }
  // Apical tuft and short posterior cirri retain their identity across frames.
  for(let n=0;n<11;n++)curve([n*.8-4,-108,n*.7-3,-113,n-5,-120,n*1.1-6,-122+Math.sin(n)*2],'rgba(133,141,113,.34)',.3);
  for(const side of [-1,1])curve([center(97)+side*8,97,center(106)+side*12,103,center(112)+side*15,110,center(116)+side*11,120],'rgba(133,142,115,.35)',.7);
  ctx.restore();
  // Honest observation scale: virtual micrometres, calibrated to renderer scale.
  ctx.strokeStyle='#687976';ctx.fillStyle='#5c6d69';ctx.lineWidth=1.5;const sx=30,sy=h-30;ctx.beginPath();ctx.moveTo(sx,sy-3);ctx.lineTo(sx,sy);ctx.lineTo(sx+50*scale,sy);ctx.lineTo(sx+50*scale,sy-3);ctx.stroke();ctx.font='11px monospace';ctx.fillText('50 μm · virtual scale',sx,sy-12);
  if(options.anatomy){
    ctx.font='12px monospace';ctx.fillStyle='#526663';
    const labels=[['prototroch',-.25],['chaetae',.08],['pygidium',.34]] as const;
    for(const [label,f]of labels){const y=h*.5+h*f;ctx.beginPath();ctx.moveTo(w*.65,y);ctx.lineTo(w*.75,y-10);ctx.lineTo(w*.92,y-10);ctx.strokeStyle='rgba(88,110,104,.4)';ctx.lineWidth=.7;ctx.stroke();ctx.fillText(label,w*.76,y-16);}
  }
}
