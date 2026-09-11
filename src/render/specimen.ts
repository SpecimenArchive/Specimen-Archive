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
const bristleVariation=Array.from({length:19},()=>({length:.84+rand()*.3,angle:(rand()-.5)*5,spacing:(rand()-.5)*2,focus:rand()}));
const ciliaVariation=Array.from({length:180},()=>({spacing:(rand()-.5)*.42,length:.72+rand()*.48,lean:(rand()-.5)*1.5}));
const dust=Array.from({length:65},()=>({x:rand(),y:rand(),r:.4+rand()*1.4,opacity:rand()*.07}));
let tissue: HTMLImageElement | undefined;
export function loadTissue(){ const img=new Image(); img.onload=()=>{tissue=img;};img.src='/assets/tissue-texture.png'; }

export interface RenderOptions { anatomy: boolean; trails: boolean; zoom: number; reducedMotion: boolean }
export function drawSpecimen(canvas: HTMLCanvasElement, snapshot: Snapshot, options: RenderOptions) {
  const context=canvas.getContext('2d'); if(!context)return;const ctx=context;
  const bounds=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  if(bounds.width<1||bounds.height<1)return;
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
  const ellipse=(x:number,y:number,rx:number,ry:number,fill:string|CanvasGradient,stroke?:string)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.35;ctx.stroke();}};
  const curve=(points:number[],color:string,width:number)=>{ctx.beginPath();ctx.moveTo(points[0],points[1]);ctx.bezierCurveTo(points[2],points[3],points[4],points[5],points[6],points[7]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  function bristles(back:boolean){
    for(const y0 of [-36,16,62])for(const side of [-1,1])for(let n=0;n<19;n++){
      const variation=bristleVariation[n];
      const theta=side>0?.23:Math.PI-.23;
      const radial=radius(y0), z=Math.sin(theta)*radial;
      const depth=-side*Math.sin(roll)+.25*Math.cos(roll);
      if((depth<0)!==back)continue;
      const [x,y]=point(side*radial*.94,y0+variation.spacing,z);
      const extent=(32+Math.sin(n*7.17)*7+n*.9)*(y0>50?.88:1)*variation.length;
      const endY=y+19+n*2.2+variation.angle;
      const sway=options.reducedMotion?0:Math.sin(pose.ciliaPhase*.06+n*.31)*.5;
      const [ex,ey]=point(side*(radial+extent),endY, z+10);
      // Depth is encoded in contrast/width; per-hair canvas blur would create
      // hundreds of compositing passes and destroy stream smoothness.
      curve([x,y,x+side*extent*.5,y+4,ex+side*2,ey-13,ex+sway,ey],`rgba(107,109,82,${.12+.23*(depth+1)/2})`,n%5===0?.56:.28);
      curve([x+.5,y,x+side*extent*.5+.7,y+3,ex+side*2+.7,ey-13,ex+sway+.4,ey],'rgba(255,255,242,.43)',.23);
      ctx.filter='none';
    }
  }
  bristles(true);
  // Continuous body envelope, with a refractive edge and translucent interior.
  const outline=new Path2D();
  for(let y=-112;y<=104;y+=2){const x=center(y)-radius(y);if(y===-112)outline.moveTo(x,y);else outline.lineTo(x,y);}
  for(let y=104;y>=-112;y-=2)outline.lineTo(center(y)+radius(y),y);outline.closePath();
  ctx.save();ctx.shadowColor='rgba(87,102,90,.09)';ctx.shadowBlur=7;ctx.shadowOffsetX=1;ctx.shadowOffsetY=2;ctx.fillStyle='rgba(158,166,134,.08)';ctx.fill(outline);ctx.restore();
  // DIC-like directional refraction: a soft halo is separate from the membrane.
  ctx.save();ctx.filter='blur(1.1px)';ctx.translate(-.4,.2);ctx.strokeStyle='rgba(91,112,92,.12)';ctx.lineWidth=1.1;ctx.stroke(outline);ctx.translate(.85,-.55);ctx.strokeStyle='rgba(255,255,241,.29)';ctx.lineWidth=1.2;ctx.stroke(outline);ctx.restore();
  ctx.save();ctx.clip(outline);
  const tissueFill=ctx.createLinearGradient(-46,-40,48,0);tissueFill.addColorStop(0,'rgba(116,131,111,.24)');tissueFill.addColorStop(.09,'rgba(253,252,224,.55)');tissueFill.addColorStop(.27,'rgba(214,210,164,.21)');tissueFill.addColorStop(.52,'rgba(246,238,203,.24)');tissueFill.addColorStop(.82,'rgba(246,247,226,.49)');tissueFill.addColorStop(1,'rgba(108,128,112,.29)');ctx.fillStyle=tissueFill;ctx.fill(outline);
  if(tissue){ctx.globalAlpha=.16;ctx.globalCompositeOperation='multiply';ctx.drawImage(tissue,-60,-120,120,240);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  // Yolk vesicles and paired longitudinal tissue: artistic microstructure only.
  for(const layer of [-1,1]){
    ctx.filter='none';
    for(const g of vesicles){
      const theta=g.theta+roll,z=Math.sin(theta);if((z<0?-1:1)!==layer)continue;
      const x=center(g.y)+Math.cos(theta)*radius(g.y)*g.r;
      const a=.09+Math.max(0,z)*.21;
      const gradient=ctx.createRadialGradient(x-g.size*.26,g.y-g.size*.3,.1,x,g.y,g.size);
      gradient.addColorStop(0,`rgba(249,239,177,${a+.10})`);gradient.addColorStop(.6,`rgba(196,175,106,${a})`);gradient.addColorStop(.84,`rgba(151,146,91,${a*.8})`);gradient.addColorStop(1,'rgba(242,239,194,0)');ellipse(x,g.y,g.size,g.size*.82,gradient);
      if(layer>0&&g.tone>.36){ctx.beginPath();ctx.ellipse(x,g.y,g.size*.84,g.size*.66,0,3.5,5.5);ctx.strokeStyle='rgba(253,255,222,.39)';ctx.lineWidth=.4;ctx.stroke();}
    }
  }
  ctx.filter='none';
  // Overlapping, softly focused internal tissue makes the optical plane legible.
  for(const side of [-1,1]){
    const [x,y]=point(side*13,-43,11);const bulb=ctx.createRadialGradient(x-3,y-3,1,x,y,11);bulb.addColorStop(0,'rgba(246,244,214,.2)');bulb.addColorStop(.65,'rgba(147,160,126,.06)');bulb.addColorStop(.9,'rgba(105,128,103,.17)');bulb.addColorStop(1,'rgba(244,244,217,0)');
    ellipse(x,y,11,14,bulb);
  }
  ctx.filter='none';
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side*(18+i*1.2);curve([x,-49,x+side*6,-13,center(42)+x*.8,48,center(91)+x*.3,91],'rgba(155,140,99,.115)',.45);
  }
  // A subtle developing gut column, visible through the trunk.
  curve([2,-33,center(3)-5,-10,center(49)+5,46,center(85),88],'rgba(183,160,111,.11)',8);
  curve([-1,-30,center(3)-5,-10,center(49)+4,46,center(85),88],'rgba(247,239,202,.21)',4);
  for(const layer of [-1,1]){
    ctx.filter='none';
    for(const g of granules){const theta=g.theta+roll,z=Math.sin(theta);if((z<0?-1:1)!==layer)continue;const x=center(g.y)+Math.cos(theta)*radius(g.y)*g.r;const alpha=.035+.10*Math.max(0,z);
      ellipse(x,g.y,g.size,g.size*.76,`rgba(${g.tone>.86?'126,113,67':'138,151,125'},${alpha})`,layer>0&&g.size>1?'rgba(248,247,221,.2)':undefined);
    }
  }
  ctx.filter='none';
  for(const y of [-49,-1,46,85]){curve([-radius(y),y-1,-15,y+5,16+center(y),y+5,radius(y)+center(y),y-1],'rgba(128,135,103,.14)',.9);curve([-radius(y),y-2,-15,y+3,16+center(y),y+3,radius(y)+center(y),y-2],'rgba(255,255,237,.26)',1.1);}
  // Four visual pigment cups plus the smaller lateral eyespots.
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const theta=(side>0?0:Math.PI)+(i===2?.1:.55);
    const y=-91+i*10, radial=radius(y)*.77;
    const [x,py]=point(Math.cos(theta)*radial,y,Math.sin(theta)*radial);
    const z=-Math.cos(theta)*Math.sin(roll)+Math.sin(theta)*Math.cos(roll);
    const opacity=.24+.66*(z+1)/2;
    ellipse(x,py,i===2?1.7:2.9,i===2?1.5:2.6,`rgba(116,67,40,${opacity*.68})`);
    for(let j=0;j<13;j++){const theta=j*2.4,spread=(i===2?1:1.8)*Math.sqrt((j+.5)/13);ellipse(x+Math.cos(theta)*spread,py+Math.sin(theta)*spread,.43+(j%3)*.14,.5,`rgba(115,60,34,${opacity*.38})`);}
    ellipse(x-.6,py-.7,i===2?.3:.8,i===2?.3:.7,'rgba(240,190,122,.24)');ctx.filter='none';
  }
  // Prototroch pigment traces and head microstructure.
  for(let i=0;i<70;i++){const theta=i/70*Math.PI*2+roll;const x=Math.cos(theta)*43;const y=-60+Math.sin(theta)*4;ellipse(x,y,.8+(i%3)*.23,.8,`rgba(139,133,81,${.1+Math.max(0,Math.sin(theta))*.18})`);}
  ctx.restore();
  // Vary refraction continuously along the stable envelope instead of drawing
  // an equally dark outline. Focus follows depth, never random frame noise.
  for(const side of [-1,1])for(let y=-108;y<101;y+=3){
    const focus=.45+.55*Math.cos((y+30)/58+side*.5),a=.05+.2*Math.max(0,focus);
    ctx.beginPath();ctx.moveTo(center(y)+side*radius(y),y);ctx.lineTo(center(y+3)+side*radius(y+3),y+3);ctx.strokeStyle=side<0?`rgba(97,120,98,${a})`:`rgba(255,255,244,${a*2})`;ctx.lineWidth=.65+.3*(1-focus);ctx.stroke();
  }
  ctx.filter='none';
  // Paired parapodial lobes with thin supporting acicula.
  for(const y of [-36,16,62])for(const side of [-1,1]){
    const [x,py]=point(side*radius(y)*.91,y,4);ellipse(x,py,4.1,6,'rgba(211,204,160,.26)','rgba(142,147,113,.24)');
    const [ex,ey]=point(side*(radius(y)+17),y+14,4);curve([x-side*8,py-2,x,py,ex,ey-3,ex,ey],'rgba(154,130,76,.46)',.65);
  }
  bristles(false);
  // Metachronal ciliary bands. Phase advances only with authoritative state.
  for(const [y0,radiusFactor,count,length] of [[-59,1.02,180,9],[0,1,70,4.4],[46,1,62,4.3],[91,1.2,40,4.8]]){
    const r=radius(y0)*radiusFactor;
    for(let i=0;i<count;i++){
      const variation=ciliaVariation[i],theta=(i+variation.spacing)/count*Math.PI*2+roll;const z=Math.sin(theta);const x=center(y0)+Math.cos(theta)*r,y=y0+z*3;
      const phase=options.reducedMotion?0:Math.sin(pose.ciliaPhase-i*.44);
      const dx=Math.cos(theta)*(length*variation.length+phase*1.2),dy=z*3+3+phase*1.5+variation.lean;
      curve([x,y,x+dx*.35,y+dy*.1,x+dx*.8+phase,y+dy*.6,x+dx,y+dy],`rgba(116,133,110,${.10+Math.max(0,z)*.23})`,.27);
      if(z>.3)curve([x+.35,y-.3,x+dx*.35+.3,y+dy*.1,x+dx*.8+phase+.3,y+dy*.6,x+dx+.3,y+dy],'rgba(255,255,242,.37)',.21);
      ctx.filter='none';
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
