import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
/** Setup-only pixel calibration. Its result cannot enter the neural encoder. */
export const WINDOWS_CALIBRATION='<body style="margin:0;width:640px;height:360px;display:grid;grid-template:1fr 1fr/1fr 1fr"><div style="background:rgb(211,31,53)"></div><div style="background:rgb(29,197,73)"></div><div style="background:rgb(43,67,223)"></div><div style="background:rgb(239,193,37)"></div></body>';
export function locateWindowsViewport(desktop:PNG,input:PNG,scale=2){
  assert.equal(input.width,640);assert.equal(input.height,360);
  assert((desktop.width===1600&&desktop.height===900&&scale===2)||(desktop.width===1280&&desktop.height===800&&scale===1.5),'Unconfigured Windows display geometry');
  const same=(x:number,y:number,px:number,py:number)=>[0,1,2].every(c=>desktop.data[(y*desktop.width+x)*4+c]===input.data[(py*input.width+px)*4+c]);
  let location:{x:number;y:number;scale:number}|undefined;
  for(let y=60;y<=160&&!location;y++)for(let x=0;x<=200;x++){
    if(![[0,0],[639,0],[0,359],[639,359],[318,178],[321,181]].every(([px,py])=>same(x+Math.floor(px*scale),y+Math.floor(py*scale),px,py)))continue;
    let exact=true;
    for(let dy=0;dy<360*scale&&exact;dy++)for(let dx=0;dx<640*scale;dx++)if(!same(x+dx,y+dy,Math.floor(dx/scale),Math.floor(dy/scale))){exact=false;break;}
    if(exact){location={x,y,scale};break;}
  }
  if(!location){
    const colors=[[0,0],[639,0],[0,359],[639,359]].map(([px,py])=>Array.from(input.data.subarray((py*640+px)*4,(py*640+px)*4+3)));
    const regions=colors.map(color=>{let left=desktop.width,top=desktop.height,right=-1,bottom=-1,count=0;for(let y=0;y<desktop.height;y++)for(let x=0;x<desktop.width;x++){const i=(y*desktop.width+x)*4;if(color.every((v,c)=>desktop.data[i+c]===v)){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;}}return {left,top,right,bottom,count};});
    assert.fail(`Windows desktop must contain the complete 640 x 360 viewport at exactly ${scale}x presentation scale; calibration regions ${JSON.stringify(regions)}`);
  }
  return location;
}
