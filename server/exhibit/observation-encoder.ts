import {PNG} from 'pngjs';
import {encodeViewport} from '../browser/encoder';
export const OBSERVATION_RETINA=Object.freeze({version:'observation-contrast-v1' as const,x:[.08,.92],upper:[.12,.46],lower:[.54,.9],contrastScale:48,minimumContrast:3});
/** Actual visible pixels only: no DOM, URL, scroll offset or outcome. */
export function encodeObservation(png:Buffer){
 const {width,height,data}=PNG.sync.read(png);
 const band=(range:number[])=>{const bounds={x:Math.floor(width*.08),y:Math.floor(height*range[0]),width:Math.floor(width*.84),height:Math.floor(height*(range[1]-range[0]))};let count=0,sum=0,squared=0;
 for(let y=bounds.y;y<bounds.y+bounds.height;y+=2)for(let x=bounds.x;x<bounds.x+bounds.width;x+=2){const i=(y*width+x)*4,l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];count++;sum+=l;squared+=l*l;}
 const mean=sum/count,contrast=Math.sqrt(Math.max(0,squared/count-mean*mean));return {bounds,mean,contrast,samples:count};};
 const upper=band(OBSERVATION_RETINA.upper),lower=band(OBSERVATION_RETINA.lower),total=upper.contrast+lower.contrast;
 const valid=total>=OBSERVATION_RETINA.minimumContrast,strength=Math.min(1,total/OBSERVATION_RETINA.contrastScale);
 const left=valid?.15+.5*strength*upper.contrast/Math.max(upper.contrast,lower.contrast):0,right=valid?.15+.5*strength*lower.contrast/Math.max(upper.contrast,lower.contrast):0;
 return {...encodeViewport(png),version:OBSERVATION_RETINA.version,phase:'scroll' as const,verticalError:null,guidePixels:0,left,right,encoding:!valid?'low-contrast':Math.abs(upper.contrast-lower.contrast)<1?'balanced-texture':lower.contrast>upper.contrast?'lower-texture':'upper-texture',sampling:{kind:OBSERVATION_RETINA.version,upper,lower,strength}};
}
