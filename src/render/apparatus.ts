import { screenPlacement as P,homography,invert3 } from './screen-placement';
/** One inverse projective sample per fragment, with no mesh/triangle seams.
 * The source photograph is unchanged outside the measured glass polygon. */
export function createApparatusRenderer(canvas:HTMLCanvasElement){
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('WebGL 2 is required for the workstation display');
  gl.disable(gl.DITHER);
  function shader(type:number,source:string){const s=gl!.createShader(type)!;gl!.shaderSource(s,source);gl!.compileShader(s);if(!gl!.getShaderParameter(s,gl!.COMPILE_STATUS))throw new Error(gl!.getShaderInfoLog(s)||'Screen shader');return s;}
  const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec2 position; void main(){gl_Position=vec4(position.x*2.-1.,1.-position.y*2.,0.,1.);}');
  const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;
    out vec4 outputColor; uniform sampler2D bench; uniform sampler2D desktop;
    uniform mat3 inverse; uniform vec2 sourceSize; uniform vec2 desktopSize; uniform vec2 renderSize; uniform float available;
    void main(){
      vec2 uv=vec2(gl_FragCoord.x/renderSize.x,1.-gl_FragCoord.y/renderSize.y);
      vec3 photo=texture(bench,uv).rgb;
      vec3 projected=inverse*vec3(uv*sourceSize,1.);
      vec2 q=projected.xy/projected.z;
      // Coverage is measured in output pixels, including device pixel ratio.
      // The glass mask fades inward so no capture reaches the physical bezel.
      vec2 footprint=max(fwidth(q),vec2(.000001));
      vec2 glassDistance=min(q,1.-q)/footprint;
      float glass=smoothstep(0.,1.,min(glassDistance.x,glassDistance.y));
      float aspect=desktopSize.x/desktopSize.y;
      vec2 fit=aspect<1.77777778?vec2(aspect/1.77777778,1.):vec2(1.,1.77777778/aspect);
      vec2 source=(q-.5)/fit+.5;
      vec2 contentDistance=(fit*.5-abs(q-.5))/footprint;
      float content=smoothstep(-.5,.5,min(contentDistance.x,contentDistance.y));
      vec3 display=texture(desktop,clamp(source,vec2(0.),vec2(1.))).rgb;
      // Preserve the original unused glass instead of painting black side fills.
      // Fixed photographed reflection follows the glass; no full-display blur.
      display=display*.87+photo*.08+vec3(.004);
      outputColor=vec4(mix(photo,display,glass*content*available),1.);
    }`);
  const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Screen program');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const inverse=invert3(homography(P.corners));gl.uniformMatrix3fv(gl.getUniformLocation(program,'inverse'),false,new Float32Array([inverse[0],inverse[3],inverse[6],inverse[1],inverse[4],inverse[7],inverse[2],inverse[5],inverse[8]]));
  gl.uniform2f(gl.getUniformLocation(program,'sourceSize'),P.width,P.height);gl.uniform2f(gl.getUniformLocation(program,'desktopSize'),800,520);
  const textures=[gl.createTexture(),gl.createTexture()];
  textures.forEach((texture,index)=>{gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));gl.generateMipmap(gl.TEXTURE_2D);});
  gl.uniform1i(gl.getUniformLocation(program,'bench'),0);gl.uniform1i(gl.getUniformLocation(program,'desktop'),1);
  function upload(index:number,image:HTMLImageElement){gl!.activeTexture(gl!.TEXTURE0+index);gl!.bindTexture(gl!.TEXTURE_2D,textures[index]);gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,gl!.RGBA,gl!.UNSIGNED_BYTE,image);gl!.generateMipmap(gl!.TEXTURE_2D);}
  let uploaded:HTMLImageElement|null=null;
  function resize(){
    const rect=canvas.getBoundingClientRect(),aspect=P.width/P.height;
    const width=Math.min(rect.width,rect.height*aspect),ratio=window.devicePixelRatio||1;
    const pixels=Math.max(1,Math.round(width*ratio)),height=Math.max(1,Math.round(width/aspect*ratio));
    if(canvas.width!==pixels||canvas.height!==height){canvas.width=pixels;canvas.height=height;}
  }
  return {
    bench(image:HTMLImageElement){upload(0,image);},
    draw(image:HTMLImageElement|null){resize();if(image&&image!==uploaded){upload(1,image);uploaded=image;gl!.uniform2f(gl!.getUniformLocation(program,'desktopSize'),image.naturalWidth,image.naturalHeight);}gl!.uniform1f(gl!.getUniformLocation(program,'available'),image?1:0);gl!.uniform2f(gl!.getUniformLocation(program,'renderSize'),canvas.width,canvas.height);gl!.viewport(0,0,canvas.width,canvas.height);gl!.drawArrays(gl!.TRIANGLE_STRIP,0,4);},
    dispose(){textures.forEach(t=>gl!.deleteTexture(t));gl!.deleteBuffer(buffer);gl!.deleteProgram(program);gl!.deleteShader(vs);gl!.deleteShader(fs);},
  };
}
