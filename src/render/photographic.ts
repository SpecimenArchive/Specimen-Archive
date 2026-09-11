import * as THREE from 'three';
import type { Circuit, Snapshot } from '../../shared/types';

/** Fixed-view photographic rig. Hand-registered artistic regions of the
 * synthetic asset are neither measured anatomy nor neuron positions. */
export const PHOTO_RIG = {
  version: 'photo-rig-v3-root-stable', asset: '/assets/specimen-photographic-base-v2.png',
  scale: .84, viewport: [1002, 470], bendGain: 2.1,
  maximumViewAngle: .035, referenceHeading: -.18,
} as const;

export function photographicControls(s: Snapshot, circuit: Circuit) {
  const cell = (type: string, side: string) => {
    const indices = circuit.nodes.flatMap((n, i) => n.type === type && n.side === side ? [i] : []);
    return indices.length ? indices.reduce((v, i) => v + s.activity[i], 0) / indices.length : 0;
  };
  // Regional geometry, envelopes and phase offsets are presentation assumptions.
  return {
    bend: Math.max(-.18, Math.min(.18, s.pose.bend * PHOTO_RIG.bendGain)),
    viewAngle: PHOTO_RIG.maximumViewAngle * Math.tanh(s.pose.heading - PHOTO_RIG.referenceHeading),
    phase: s.pose.ciliaPhase,
    headLeft: cell('celltype84', 'L'), headRight: cell('celltype84', 'R'),
    trunkLeft: cell('celltype85', 'L'), trunkRight: cell('celltype85', 'R'),
    left: s.motor.left, right: s.motor.right,
  };
}

const fragment = /* glsl */`
precision highp float;
uniform sampler2D photograph;
uniform float bend, viewAngle, phase, headLeft, headRight, trunkLeft, trunkRight, left, right;
uniform float subjectScale;
uniform float viewportAspect;
varying vec2 vUv;
const float aspect = 1832.0 / 859.0;
float ellipse(vec2 p, vec2 c, vec2 r) {
  return 1.0-smoothstep(.72,1.0,length((p-c)/r));
}
float region(vec2 p, vec2 c, vec2 r) {
  float d=dot((p-c)/r,(p-c)/r);
  return pow(max(0.0,1.0-d),3.0);
}
float rootProtection(vec2 p) {
  // Six registered chaetal attachments. Roots are tissue, not beating cilia.
  float a=ellipse(p,vec2(.445,.371),vec2(.025,.043));
  a=max(a,ellipse(p,vec2(.565,.331),vec2(.025,.043)));
  a=max(a,ellipse(p,vec2(.461,.533),vec2(.025,.043)));
  a=max(a,ellipse(p,vec2(.580,.512),vec2(.025,.043)));
  a=max(a,ellipse(p,vec2(.487,.707),vec2(.025,.043)));
  a=max(a,ellipse(p,vec2(.586,.690),vec2(.025,.043)));
  return a;
}
vec3 tex(vec2 p) { return texture2D(photograph, vec2(p.x,1.0-p.y)).rgb; }
// Low-frequency transmitted-light plate fitted to clear water in the asset.
// Analytic interpolation avoids stretching source-camera grain into stripes.
vec3 water(vec2 p) {
  float slope=-.018*p.y+.003*cos(p.x*4.0+p.y*2.0);
  return vec3(.754,.750,.728)+slope;
}
// Anatomical matte includes the chaetal fans and excludes empty water specks.
float matte(vec2 p) {
  float a=ellipse(p,vec2(.499,.214),vec2(.108,.176));
  a=max(a,ellipse(p,vec2(.521,.53),vec2(.078,.31)));
  a=max(a,ellipse(p,vec2(.546,.818),vec2(.046,.139)));
  a=max(a,ellipse(p,vec2(.419,.443),vec2(.062,.15)));
  a=max(a,ellipse(p,vec2(.590,.397),vec2(.073,.105)));
  a=max(a,ellipse(p,vec2(.430,.642),vec2(.057,.15)));
  a=max(a,ellipse(p,vec2(.608,.620),vec2(.065,.13)));
  a=max(a,ellipse(p,vec2(.470,.802),vec2(.055,.14)));
  a=max(a,ellipse(p,vec2(.603,.810),vec2(.047,.125)));
  return a;
}
vec2 unbend(vec2 p) {
  // Constant-curvature approximation below the neck. Second-order longitudinal
  // correction preserves length; no global vertical stretching.
  float t=max(0.0,p.y-.30);
  p.x-=bend*t*t/aspect;
  p.y+=2.0*bend*bend*t*t*t/3.0;
  return p;
}
vec2 appendages(vec2 p) {
  vec2 q=p;
  float freeRoot=1.0-rootProtection(p);
  // Root-fixed passive chaetal splay driven by local bending, not a gait.
  for(int i=0;i<3;i++) {
    float y=.34+float(i)*.185;
    float centre=.503+float(i)*.014;
    float side=sign(p.x-centre);
    float distal=smoothstep(.052,.13,abs(p.x-centre));
    float fan=exp(-pow((p.y-y-.064)/.115,4.0))*distal;
    q.y-=freeRoot*fan*bend*side*.022*(1.0+float(i)*.13);
    q.x-=freeRoot*fan*bend*.017;
  }
  // Local fields share the unwrapped authoritative oscillator. Phase gradients
  // illustrate metachronal waves; they are not additional neural telemetry.
  // The old broad ciliary masks crossed the cephalic tissue and pigment cups,
  // making the head ripple at beat frequency. This registered head exclusion
  // is independent of phase: only fine structure outside the tissue hull moves.
  float headExterior=smoothstep(1.04,1.13,length((p-vec2(.500,.211))/vec2(.091,.153)));
  float crown=ellipse(p,vec2(.502,.064),vec2(.080,.032))*headExterior;
  float flankL=ellipse(p,vec2(.414,.236),vec2(.018,.080))*headExterior;
  float flankR=ellipse(p,vec2(.587,.210),vec2(.018,.080))*headExterior;
  q.x-=crown*.0007*sin(phase+p.x*125.0)*(.35+headLeft+headRight);
  q.y-=crown*.0010*cos(phase+p.x*125.0)*(.35+headLeft+headRight);
  q.y-=flankL*.0017*sin(phase+p.y*98.0)*(.35+headLeft);
  q.y-=flankR*.0017*sin(phase+p.y*98.0+1.7)*(.35+headRight);
  for(int i=0;i<3;i++) {
    float y=.39+float(i)*.186,off=float(i)*1.71;
    float a=ellipse(p,vec2(.456+float(i)*.011,y),vec2(.014,.044));
    float b=ellipse(p,vec2(.579+float(i)*.008,y-.008),vec2(.014,.044));
    q.y-=freeRoot*a*.0013*sin(phase+off+p.y*150.0)*(.3+trunkLeft);
    q.y-=freeRoot*b*.0013*sin(phase+off+2.1+p.y*150.0)*(.3+trunkRight);
  }
  return q;
}
vec3 tissue(vec2 p) {
  vec2 q=p;
  // Cubic falloff has zero displacement and derivative at each boundary.
  // Internal optical texture cannot migrate between compartments.
  float a=region(p,vec2(.512,.421),vec2(.049,.10));
  float b=region(p,vec2(.523,.601),vec2(.047,.08));
  float c=region(p,vec2(.543,.778),vec2(.028,.10));
  q.x-=(a*.0024-b*.0018+c*.0013)*(left+right)+bend*(a-b)*.009;
  q.y-=(a-b*.75+c*.50)*bend*.017;
  // Focus varies in anatomical coordinates, preserving sharp pigment and
  // selected near tissue while softening deep material and strong joints.
  float deep=region(p,vec2(.493,.197),vec2(.064,.11))*.9
            +region(p,vec2(.510,.445),vec2(.057,.115))
            +region(p,vec2(.555,.744),vec2(.055,.16))*.85;
  float joint=(exp(-pow((p.y-.491)/.018,2.0))
             +exp(-pow((p.y-.654)/.02,2.0)))*ellipse(p,vec2(.523,.57),vec2(.075,.24));
  vec2 radius=vec2(1.0/1832.0,1.0/859.0)*(1.0+deep*3.3+joint*3.0);
  vec3 sharp=tex(q);
  vec3 soft=(tex(q+radius)+tex(q-radius)+tex(q+radius*vec2(-1,1))+tex(q+radius*vec2(1,-1)))*.25;
  return mix(sharp,soft,clamp(deep*.67+joint*.75,0.0,.80));
}
void main() {
  vec2 uv=vec2(vUv.x,1.0-vUv.y);
  // No time uniform: illumination and water never follow the deformation.
  vec3 bg=water(uv);
  vec2 p=(uv-.5)/subjectScale;
  p.x*=viewportAspect/aspect;
  p.x*=aspect;
  float co=cos(viewAngle),si=sin(viewAngle);
  p=mat2(co,-si,si,co)*p;
  p.x/=aspect;p+=.5;
  p=appendages(unbend(p));
  vec3 foreground=tissue(p)-water(p);
  gl_FragColor=vec4(bg+foreground*matte(p),1.0);
}
`;

export class PhotographicRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: THREE.ShaderMaterial;
  readonly ready: Promise<void>;
  constructor(readonly canvas: HTMLCanvasElement, readonly circuit: Circuit) {
    this.renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(PHOTO_RIG.viewport[0], PHOTO_RIG.viewport[1], false);
    const uniforms: Record<string, THREE.IUniform> = {photograph: {value: null}, subjectScale: {value: PHOTO_RIG.scale},viewportAspect:{value:1002/470}};
    for (const name of ['bend','viewAngle','phase','headLeft','headRight','trunkLeft','trunkRight','left','right']) uniforms[name]={value:0};
    this.material = new THREE.ShaderMaterial({uniforms, vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}', fragmentShader:fragment});
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.ready = new THREE.TextureLoader().loadAsync(PHOTO_RIG.asset).then(texture => {
      // Unlit source display RGB: no scene lights or invented volume.
      texture.colorSpace=THREE.NoColorSpace;
      texture.minFilter=THREE.LinearFilter; texture.magFilter=THREE.LinearFilter;
      this.material.uniforms.photograph.value=texture;
    });
  }
  draw(s: Snapshot) {
    const controls=photographicControls(s, this.circuit);
    for(const [key,value] of Object.entries(controls)) this.material.uniforms[key].value=value;
    this.renderer.render(this.scene,this.camera);
    return controls;
  }
  resize(width:number,height:number){
    if(width<1||height<1)return;
    this.renderer.setSize(Math.round(width),Math.round(height),false);
    this.material.uniforms.viewportAspect.value=width/height;
  }
  dispose(){this.material.uniforms.photograph.value?.dispose();this.material.dispose();this.renderer.dispose();}
}
