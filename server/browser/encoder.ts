import { PNG } from 'pngjs';
import { BROWSER_CONFIG as C } from './config';
export interface RetinalInput {
  version:string;width:number;height:number;targetPixels:number;cursorPixels:number;
  targetCentroid:{x:number;y:number}|null;cursorCentroid:{x:number;y:number}|null;
  horizontalErrorPx:number|null;encoding:'left'|'right'|'aligned'|'no-signal';left:number;right:number;
}
// The only input is a captured PNG. No Page, locator, target seed or evaluator.
export function encodeViewport(bytes:Buffer):RetinalInput {
  const {width,height,data}=PNG.sync.read(bytes);let targets=0,tx=0,ty=0,cursors=0,cx=0,cy=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,r=data[i],g=data[i+1],b=data[i+2];
    if(g>C.encoder.targetGreenMin&&r<C.encoder.targetRedMax&&b<C.encoder.targetBlueMax&&g>r*C.encoder.targetGreenRedRatio){targets++;tx+=x;ty+=y;}
    if(b>C.encoder.cursorBlueMin&&g>C.encoder.cursorGreenMin&&r<C.encoder.cursorRedMax){cursors++;cx+=x;cy+=y;}
  }
  const targetCentroid=targets?{x:tx/targets,y:ty/targets}:null,cursorCentroid=cursors?{x:cx/cursors,y:cy/cursors}:null;
  const valid=targets>=C.encoder.minimumTargetPixels&&cursors>=C.encoder.minimumCursorPixels;
  const horizontalErrorPx=valid?targetCentroid!.x-cursorCentroid!.x:null;
  const encoding=!valid?'no-signal':Math.abs(horizontalErrorPx!)<=C.encoder.centreTolerancePx?'aligned':horizontalErrorPx!<0?'left':'right';
  const left=encoding==='no-signal'?0:encoding==='aligned'?C.encoder.alignedDrive:encoding==='left'?C.encoder.highDrive:C.encoder.lowDrive;
  const right=encoding==='no-signal'?0:encoding==='aligned'?C.encoder.alignedDrive:encoding==='right'?C.encoder.highDrive:C.encoder.lowDrive;
  return {version:C.encoder.version,width,height,targetPixels:targets,cursorPixels:cursors,targetCentroid,cursorCentroid,horizontalErrorPx,encoding,left,right};
}
