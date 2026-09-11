import { screenPlacement as P,homography,invert3 } from './screen-placement';
/** One inverse projective sample per fragment, with no mesh/triangle seams.
 * The source photograph is unchanged outside the measured glass polygon. */
export function createApparatusRenderer(canvas:HTMLCanvasElement){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('WebGL is required for the workstation display');
  function shader(type:number,source:string){const s=gl!.createShader(type)!;gl!.shaderSource(s,source);gl!.compileShader(s);if(!gl!.getShaderParameter(s,gl!.COMPILE_STATUS))throw new Error(gl!.getShaderInfoLog(s)||'Screen shader');return s;}
  const vs=shader(gl.VERTEX_SHADER,'attribute vec2 position; varying vec2 uv; void main(){uv=position;gl_Position=vec4(position.x*2.-1.,1.-position.y*2.,0.,1.);}');
  const fs=shader(gl.FRAGMENT_SHADER,`precision highp float;
    varying vec2 uv; uniform sampler2D bench; uniform sampler2D desktop;
    uniform mat3 inverse; uniform vec2 sourceSize; uniform vec2 desktopSize; uniform float available;
    void main(){
      vec3 photo=texture2D(bench,uv).rgb;
      vec3 projected=inverse*vec3(uv*sourceSize,1.);
      vec2 q=projected.xy/projected.z;
      float edge=min(min(q.x,1.-q.x)*620.,min(q.y,1.-q.y)*340.);
      float mask=smoothstep(0.,.7,edge)*available;
      vec2 safe=clamp(q,vec2(0.),vec2(1.));
      vec2 soft=vec2(.38)/desktopSize;
      vec3 display=texture2D(desktop,safe).rgb*.60;
      display+=(texture2D(desktop,safe+vec2(soft.x,0.)).rgb+texture2D(desktop,safe-vec2(soft.x,0.)).rgb+texture2D(desktop,safe+vec2(0.,soft.y)).rgb+texture2D(desktop,safe-vec2(0.,soft.y)).rgb)*.10;
      float grey=dot(display,vec3(.2126,.7152,.0722));
      display=mix(vec3(grey),display,.90);
      // Actual fixed glass reflection and black floor, with no invented glare.
      display=display*vec3(.79,.80,.81)+photo*.18+vec3(.018,.020,.022);
      gl_FragColor=vec4(mix(photo,display,mask),1.);
    }`);
  const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Screen program');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const inverse=invert3(homography(P.corners));gl.uniformMatrix3fv(gl.getUniformLocation(program,'inverse'),false,new Float32Array([inverse[0],inverse[3],inverse[6],inverse[1],inverse[4],inverse[7],inverse[2],inverse[5],inverse[8]]));
  gl.uniform2f(gl.getUniformLocation(program,'sourceSize'),P.width,P.height);gl.uniform2f(gl.getUniformLocation(program,'desktopSize'),800,520);
  const textures=[gl.createTexture(),gl.createTexture()];
  textures.forEach((texture,index)=>{gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));});
  gl.uniform1i(gl.getUniformLocation(program,'bench'),0);gl.uniform1i(gl.getUniformLocation(program,'desktop'),1);
  function upload(index:number,image:HTMLImageElement){gl!.activeTexture(gl!.TEXTURE0+index);gl!.bindTexture(gl!.TEXTURE_2D,textures[index]);gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,gl!.RGBA,gl!.UNSIGNED_BYTE,image);}
  return {
    bench(image:HTMLImageElement){upload(0,image);},
    draw(image:HTMLImageElement|null){if(image){upload(1,image);gl!.uniform2f(gl!.getUniformLocation(program,'desktopSize'),image.naturalWidth,image.naturalHeight);}gl!.uniform1f(gl!.getUniformLocation(program,'available'),image?1:0);gl!.viewport(0,0,canvas.width,canvas.height);gl!.drawArrays(gl!.TRIANGLE_STRIP,0,4);},
    dispose(){textures.forEach(t=>gl!.deleteTexture(t));gl!.deleteBuffer(buffer);gl!.deleteProgram(program);gl!.deleteShader(vs);gl!.deleteShader(fs);},
  };
}
