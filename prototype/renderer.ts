import * as THREE from 'three';
import type { Snapshot } from '../shared/types';
import { bodyRadius, createTissueVolume, rng } from './volume';
import { fullScreenVertex, volumeFragment, hairVertex, hairFragment } from './shaders';

function createHairs(){
  const root:number[]=[],direction:number[]=[],along:number[]=[],phase:number[]=[],kind:number[]=[],region:number[]=[],length:number[]=[],position:number[]=[];
  const random=rng(7832);
  function hair(r:number[],d:number[],len:number,k:number,reg:number,ph:number){
    for(let s=0;s<7;s++)for(const t of [s/7,(s+1)/7]){root.push(...r);direction.push(...d);along.push(t);phase.push(ph);kind.push(k);region.push(reg);length.push(len);position.push(0,0,0);}
  }
  // Prototroch is a two-tier band. Trunk paratrochs are four spatial fields;
  // spaces between those fields are preserved instead of continuous rings.
  const bands=[{y:60,count:240,len:9,reg:0,fields:false},{y:57,count:200,len:10,reg:0,fields:false},{y:42,count:80,len:6,reg:1,fields:true},{y:0,count:125,len:6,reg:2,fields:true},{y:-46,count:110,len:6,reg:3,fields:true},{y:-90,count:90,len:7,reg:4,fields:false}];
  for(const band of bands)for(let i=0;i<band.count;i++){
    const a=(i+random()*.4)/band.count*Math.PI*2;
    if(band.fields&&Math.abs(Math.sin(a*2))<.38)continue;
    const r=bodyRadius(band.y),x=Math.cos(a)*r,z=Math.sin(a)*r*.66;
    hair([x,band.y+(random()-.5)*1.2,z],[Math.cos(a),0,Math.sin(a)],band.len*(.78+random()*.36),0,band.reg,a*22+random()*.6);
  }
  // Two akrotroch patches and small apical sensory tuft; no adult appendages.
  for(const side of [-1,1])for(let i=0;i<46;i++){
    const y=89+(random()-.5)*9,a=(side>0?0:Math.PI)+(random()-.5)*.5,r=bodyRadius(y);
    hair([Math.cos(a)*r,y,Math.sin(a)*r*.66],[Math.cos(a),.28,Math.sin(a)],5+random()*3,0,5,i*.46);
  }
  // Paired dorsal/ventral chaetal fans on exactly three chaetigerous segments.
  for(const y of [35,-17,-64])for(const side of [-1,1])for(const dorsal of [-1,1])for(let i=0;i<13;i++){
    const r=bodyRadius(y),a=(side>0?0:Math.PI)+dorsal*.30;
    const fan=(i/12-.5)*.36;
    hair([Math.cos(a)*r*.94,y+(random()-.5)*2,Math.sin(a)*r*.66],[side*(.68+fan),-.18-fan*.3,dorsal*(.24+fan*.5)],(40+random()*27)*(y<-50?.85:1),1,0,0);
  }
  for(let i=0;i<14;i++)hair([(random()-.5)*6,108,(random()-.5)*5],[(random()-.5)*.4,1,(random()-.5)*.4],7+random()*5,0,6,i*.5);
  const geometry=new THREE.BufferGeometry();
  for(const [name,array,size]of [['position',position,3],['aRoot',root,3],['aDirection',direction,3],['aAlong',along,1],['aPhase',phase,1],['aKind',kind,1],['aRegion',region,1],['aLength',length,1]] as const)geometry.setAttribute(name,new THREE.Float32BufferAttribute(array,size));
  geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),200);
  return geometry;
}

export class VolumeSpecimenRenderer {
  readonly renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();private camera=new THREE.Camera();
  private uniforms:Record<string,THREE.IUniform>;
  private volume:THREE.Data3DTexture;
  private materials:THREE.ShaderMaterial[]=[];
  private meshes:THREE.Object3D[]=[];
  constructor(readonly canvas:HTMLCanvasElement){
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
    this.volume=createTissueVolume();
    this.uniforms={uVolume:{value:this.volume},uHalfSize:{value:new THREE.Vector2(310,145)},uResolution:{value:new THREE.Vector2(1002,470)},uRoll:{value:0},uHeading:{value:0},uBend:{value:0},uMotor:{value:new THREE.Vector2()},uTime:{value:0},uCiliaPhase:{value:0},uFocus:{value:9}};
    const volumeMaterial=new THREE.ShaderMaterial({vertexShader:fullScreenVertex,fragmentShader:volumeFragment,uniforms:this.uniforms,depthTest:false,depthWrite:false});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),volumeMaterial);plane.frustumCulled=false;plane.renderOrder=0;this.scene.add(plane);this.materials.push(volumeMaterial);this.meshes.push(plane);
    const hairMaterial=new THREE.ShaderMaterial({vertexShader:hairVertex,fragmentShader:hairFragment,uniforms:this.uniforms,transparent:true,depthTest:false,depthWrite:false});
    const hairs=new THREE.LineSegments(createHairs(),hairMaterial);hairs.frustumCulled=false;hairs.renderOrder=1;this.scene.add(hairs);this.materials.push(hairMaterial);this.meshes.push(hairs);
  }
  render(s:Snapshot){
    const {width,height}=this.canvas.getBoundingClientRect();if(!width||!height)return;
    const dpr=this.renderer.getPixelRatio();if(this.canvas.width!==Math.round(width*dpr)||this.canvas.height!==Math.round(height*dpr))this.renderer.setSize(width,height,false);
    this.uniforms.uHalfSize.value.set(145*width/height,145);this.uniforms.uResolution.value.set(this.canvas.width,this.canvas.height);
    this.uniforms.uRoll.value=s.pose.roll;this.uniforms.uHeading.value=-s.pose.heading-.2;this.uniforms.uBend.value=s.pose.bend;
    this.uniforms.uMotor.value.set(s.motor.left,s.motor.right);this.uniforms.uTime.value=s.modelTime;this.uniforms.uCiliaPhase.value=s.pose.ciliaPhase;
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.volume.dispose();this.materials.forEach(m=>m.dispose());this.meshes.forEach(m=>{if(m instanceof THREE.Mesh||m instanceof THREE.LineSegments)m.geometry.dispose();});this.renderer.dispose();}
}
