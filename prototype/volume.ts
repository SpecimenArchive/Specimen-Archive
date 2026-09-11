import * as THREE from 'three';

export const VOLUME_SIZE=[128,256,96] as const;
export const BOUNDS=[64,120,48] as const;
const shape=[[-112,1],[-106,16],[-98,29],[-87,39],[-73,43],[-60,43],[-51,36],[-41,32],[-27,36],[-12,37],[3,34],[19,32],[33,29],[48,26],[63,23],[77,20],[90,15],[101,5],[105,0]];
export function bodyRadius(y:number){const v=-y;for(let i=1;i<shape.length;i++)if(v<=shape[i][0]){const [a,ra]=shape[i-1],[b,rb]=shape[i],t=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return ra+(rb-ra)*t*t*(3-2*t);}return 0;}
export function rng(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/** Construct an illustrative 3D optical volume once. These are material voxels,
 * not research cells, measured anatomy or neural positions. RGBA carries optical
 * absorption, refractive phase structure, pigment and body occupancy. */
export function createTissueVolume(){
  const [nx,ny,nz]=VOLUME_SIZE,[bx,by,bz]=BOUNDS,total=nx*ny*nz;
  const density=new Float32Array(total),phase=new Float32Array(total),pigment=new Float32Array(total),occupancy=new Float32Array(total);
  const random=rng(7101),index=(x:number,y:number,z:number)=>x+nx*(y+ny*z);
  const sx=2*bx/nx,sy=2*by/ny,sz=2*bz/nz;
  for(let z=0;z<nz;z++){const wz=(z+.5)*sz-bz;for(let y=0;y<ny;y++){
    const wy=(y+.5)*sy-by,r=bodyRadius(wy);if(r<.1)continue;
    for(let x=0;x<nx;x++){const wx=(x+.5)*sx-bx;const ellipse=Math.sqrt(wx*wx+wz*wz/(.66*.66));
      const edge=r-ellipse;const inside=THREE.MathUtils.clamp(edge/1.4+.5,0,1);if(!inside)continue;const k=index(x,y,z);
      const rough=random();occupancy[k]=inside;
      density[k]=inside*(.11+.032*rough+.045*Math.exp(-edge*.35));
      phase[k]=inside*(.22+.032*rough);
    }
  }}
  function ellipsoid(cx:number,cy:number,cz:number,rx:number,ry:number,rz:number,d:number,p:number,pig=0,hollow=false){
    const x0=Math.max(0,Math.floor((cx-rx*1.3+bx)/sx)),x1=Math.min(nx-1,Math.ceil((cx+rx*1.3+bx)/sx));
    const y0=Math.max(0,Math.floor((cy-ry*1.3+by)/sy)),y1=Math.min(ny-1,Math.ceil((cy+ry*1.3+by)/sy));
    const z0=Math.max(0,Math.floor((cz-rz*1.3+bz)/sz)),z1=Math.min(nz-1,Math.ceil((cz+rz*1.3+bz)/sz));
    for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const k=index(x,y,z);if(!occupancy[k])continue;
      const q=((x+.5)*sx-bx-cx)**2/(rx*rx)+((y+.5)*sy-by-cy)**2/(ry*ry)+((z+.5)*sz-bz-cz)**2/(rz*rz);
      if(q>1.6)continue;const g=Math.exp(-q*3.5),rim=Math.exp(-((Math.sqrt(q)-.76)/.16)**2);
      if(hollow){density[k]=density[k]*(1-g*.62)+rim*d;phase[k]+=rim*p-g*.08;}
      else{density[k]+=g*d;phase[k]+=g*p;}
      pigment[k]+=g*pig;
    }
  }
  // Dense, overlapping fine optical structure, with variation in cellular scale.
  for(let i=0;i<4300;i++){
    const y=-99+random()*204,r=bodyRadius(y),theta=random()*Math.PI*2,dist=Math.sqrt(random())*.9;
    const x=Math.cos(theta)*r*dist,z=Math.sin(theta)*r*.66*dist;
    const size=.9+random()*2.4;
    ellipsoid(x,y,z,size,size*(.7+random()*.7),size*(.6+random()*.8),.15+random()*.27,.15+random()*.32);
  }
  // Lower-frequency overlapping tissue; not a repeated grid of outlined bubbles.
  for(let i=0;i<95;i++){
    const y=-88+random()*145,r=bodyRadius(y),theta=random()*Math.PI*2,dist=Math.sqrt(random())*.69;
    const size=3+random()*6;
    ellipsoid(Math.cos(theta)*r*dist,y,Math.sin(theta)*r*.6*dist,size,size*(.8+random()*.7),size*.85,.10+random()*.2,.18+random()*.2,0,i%4===0);
  }
  // A small number of optically clearer gland-like internal volumes. Their
  // geometry is illustrative; no reconstructed gland identity is assigned.
  ellipsoid(-12,30,7,10,13,9,.15,.30,0,true);
  ellipsoid(11,24,-9,11,14,10,.12,.25,0,true);
  ellipsoid(-4,62,-8,7,9,8,.06,.18,0,true);
  // Longitudinal fibre sheets occupy separate depths and shift under the rig.
  for(const side of [-1,1])for(let fiber=0;fiber<7;fiber++)for(let y=-86;y<46;y+=1.4){
    const r=bodyRadius(y),x=side*(r*.67+fiber*.5-2),z=-9+fiber*2.7;
    ellipsoid(x,y,z,.52,1.9,.48,.10,.18);
  }
  // Four eye pigment cups, plus smaller ventral eyespots, inside the 3D head.
  for(const side of [-1,1]){
    for(const [y,z,scale] of [[88,13,1],[76,17,.9],[68,-17,.55]]){
      const x=side*bodyRadius(y)*.78;
      ellipsoid(x,y,z,3.2*scale,4.2*scale,3.1*scale,.35,.25,1.3);
      for(let grain=0;grain<14;grain++)ellipsoid(x+(random()-.5)*5*scale,y+(random()-.5)*6*scale,z+(random()-.5)*4*scale,.8,.9,.75,.22,.1,1.5);
    }
  }
  // Small somatic pigment deposits around the prototroch, strongly restrained.
  for(let i=0;i<44;i++){const a=i/44*Math.PI*2;ellipsoid(Math.cos(a)*40,59+(i%2)*2,Math.sin(a)*26,.6,.9,.7,.1,.15,.16);}
  const data=new Uint8Array(total*4);
  for(let i=0;i<total;i++){data[i*4]=Math.min(255,Math.round(density[i]*255));data[i*4+1]=Math.min(255,Math.round(Math.max(0,phase[i])*255));data[i*4+2]=Math.min(255,Math.round(pigment[i]*255));data[i*4+3]=Math.round(occupancy[i]*255);}
  const texture=new THREE.Data3DTexture(data,nx,ny,nz);texture.format=THREE.RGBAFormat;texture.type=THREE.UnsignedByteType;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.unpackAlignment=1;texture.needsUpdate=true;
  return texture;
}
