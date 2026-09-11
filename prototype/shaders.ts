export const fullScreenVertex=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;

export const deformation=`
uniform float uRoll;
uniform float uHeading;
uniform float uBend;
uniform vec2 uMotor;
uniform float uTime;
mat2 rotate2(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float trunk(float y){return clamp((56.-y)/153.,0.,1.);}
vec3 bodyToWorld(vec3 q){
  float t=trunk(q.y);
  // Distinct inner/outer strain follows the measured model motor drive. This is
  // a declared illustrative rig, not a fitted biomechanical animal model.
  float inner=1.-smoothstep(12.,32.,abs(q.x));
  float contraction=(uMotor.x+uMotor.y)*.5*.038;
  q.y=56.+(q.y-56.)*(1.-contraction*t);
  q.x+=uBend*64.*t*t+(uMotor.y-uMotor.x)*7.*t*inner;
  q.z+=uBend*7.*sin(t*3.14159)*inner;
  q.xz=rotate2(uRoll)*q.xz;
  q.xy=rotate2(uHeading)*q.xy;
  return q;
}
vec3 worldToBody(vec3 p){
  p.xy=rotate2(-uHeading)*p.xy;
  p.xz=rotate2(-uRoll)*p.xz;
  float t=trunk(p.y);
  float contraction=(uMotor.x+uMotor.y)*.5*.038;
  p.y=56.+(p.y-56.)/max(.9,1.-contraction*t);
  t=trunk(p.y);
  p.x-=uBend*64.*t*t;
  float inner=1.-smoothstep(12.,32.,abs(p.x));
  p.x-=(uMotor.y-uMotor.x)*7.*t*inner;
  p.z-=uBend*7.*sin(t*3.14159)*inner;
  return p;
}
`;

export const volumeFragment=`
precision highp float;
precision highp sampler3D;
uniform sampler3D uVolume;
uniform vec2 uHalfSize;
uniform vec2 uResolution;
uniform float uFocus;
varying vec2 vUv;
${deformation}
vec4 tissue(vec3 p,float lod){
  vec3 q=worldToBody(p)/vec3(128.,240.,96.)+.5;
  if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return vec4(0.);
  return textureLod(uVolume,q,lod);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 pos=(vUv-.5)*2.*uHalfSize;
  vec3 background=vec3(.886,.888,.866);
  background+=.023*(1.-dot(vUv-.5,vUv-.5));
  // Fixed optical grain. Its coordinates do not fabricate model activity.
  float grain=(hash(gl_FragCoord.xy)-.5)*.006;
  if(length(pos)>135.){gl_FragColor=vec4(background+grain,1.);return;}
  float absorption=0.,phaseA=0.,phaseB=0.,pigment=0.,occupancy=0.;
  const int STEPS=72;
  const float stepSize=144./float(STEPS);
  vec2 shear=vec2(.54,.44);
  for(int i=0;i<STEPS;i++){
    float z=72.-(float(i)+.5)*stepSize;
    float lod=clamp((abs(z-uFocus)-9.)/14.,0.,2.8);
    vec4 s=tissue(vec3(pos,z),lod);
    absorption+=s.r*stepSize;
    pigment+=s.b*stepSize;
    occupancy+=s.a*stepSize;
    // Opposed optical paths give DIC-like phase-gradient contrast. Depth-based
    // mip selection models a finite focal plane without flat contour strokes.
    phaseA+=tissue(vec3(pos+shear,z),lod).g*stepSize;
    phaseB+=tissue(vec3(pos-shear,z),lod).g*stepSize;
  }
  float contrast=tanh((phaseA-phaseB)*.20);
  vec3 transmittance=exp(-vec3(.0182,.0186,.0201)*absorption-vec3(.94,1.13,1.23)*pigment);
  vec3 col=background*transmittance;
  col+=contrast*.32*clamp(occupancy/6.,0.,1.);
  // Soft forward scattering retains detail in optically dense overlapping tissue.
  col=mix(col,col*.92+vec3(.052,.052,.048),clamp(absorption/60.,0.,.6));
  gl_FragColor=vec4(clamp(col+grain,0.,1.),1.);
}
`;

export const hairVertex=`
attribute vec3 aRoot;
attribute vec3 aDirection;
attribute float aAlong;
attribute float aPhase;
attribute float aKind;
attribute float aRegion;
attribute float aLength;
uniform vec2 uHalfSize;
uniform float uCiliaPhase;
varying float vDepth;
varying float vKind;
varying float vAlong;
${deformation}
void main(){
  float t=aAlong;
  vec3 p=aRoot;
  if(aKind<.5){
    // Six distinct regions, each with a fixed metachronal phase offset. All
    // phase comes from the model oscillator; regional speed/amplitude mappings
    // are explicit animation assumptions, not independently recorded neurons.
    float phase=uCiliaPhase-aPhase+aRegion*.72;
    float beat=sin(phase),recovery=sin(phase+1.1);
    p+=aDirection*aLength*t;
    p.y-=aLength*(.28*t+.48*t*t*beat);
    p.xz+=vec2(-aDirection.z,aDirection.x)*aLength*.26*recovery*t*t;
  }else{
    float side=sign(aRoot.x);
    float spread=.035+(side<0.?uMotor.x:uMotor.y)*.10;
    p+=aDirection*aLength*t;
    p.y-=aLength*(.18*t+.39*t*t);
    p.x+=side*aLength*spread*t;
    p.z+=sin(t*3.14159)*aLength*.05;
  }
  p=bodyToWorld(p);vDepth=p.z;vKind=aKind;vAlong=t;
  gl_Position=vec4(p.x/uHalfSize.x,p.y/uHalfSize.y,0.,1.);
}
`;

export const hairFragment=`
precision highp float;
uniform sampler3D uVolume;
uniform vec2 uHalfSize;
uniform vec2 uResolution;
uniform float uFocus;
varying float vDepth;
varying float vKind;
varying float vAlong;
${deformation}
void main(){
  vec2 pos=(gl_FragCoord.xy/uResolution-.5)*2.*uHalfSize;
  float transmission=1.;
  for(int i=0;i<12;i++){
    float z=mix(vDepth,64.,(float(i)+.5)/12.);
    vec3 q=worldToBody(vec3(pos,z))/vec3(128.,240.,96.)+.5;
    if(all(greaterThanEqual(q,vec3(0.)))&&all(lessThanEqual(q,vec3(1.)))){
      transmission*=exp(-textureLod(uVolume,q,1.).r*(64.-vDepth)/12.*.03);
    }
  }
  float focus=exp(-abs(vDepth-uFocus)*.035);
  float a=mix(.11,.55,focus)*transmission*(1.-vAlong*.55);
  vec3 color=vKind>.5?vec3(.27,.28,.23):vec3(.33,.35,.31);
  gl_FragColor=vec4(color,a);
}
`;
