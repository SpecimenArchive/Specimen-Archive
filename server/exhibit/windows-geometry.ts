import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
/** Setup-only pixel calibration. Its result cannot enter the neural encoder. */
export const WINDOWS_CALIBRATION='<body style="margin:0;width:640px;height:360px;display:grid;grid-template:1fr 1fr/1fr 1fr"><div style="background:rgb(211,31,53)"></div><div style="background:rgb(29,197,73)"></div><div style="background:rgb(43,67,223)"></div><div style="background:rgb(239,193,37)"></div></body>';
export function locateWindowsViewport(desktop:PNG,input:PNG,scale=2){
  assert.equal(input.width,640);assert.equal(input.height,360);assert.equal(desktop.width,1600);assert.equal(desktop.height,900);
  const same=(x:number,y:number,px:number,py:number)=>[0,1,2].every(c=>desktop.data[(y*desktop.width+x)*4+c]===input.data[(py*input.width+px)*4+c]);
  let location:{x:number;y:number;scale:number}|undefined;
  for(let y=60;y<=160&&!location;y++)for(let x=100;x<=200;x++){
    if(![[0,0],[639,0],[0,359],[639,359],[318,178],[321,181]].every(([px,py])=>same(x+px*scale,y+py*scale,px,py)))continue;
    let exact=true;
    for(let py=0;py<360&&exact;py++)for(let px=0;px<640;px++)for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++)if(!same(x+px*scale+dx,y+py*scale+dy,px,py)){exact=false;break;}
    if(exact){location={x,y,scale};break;}
  }
  assert(location,'Windows desktop must contain the complete 640 x 360 viewport at exactly 2x presentation scale');return location;
}
