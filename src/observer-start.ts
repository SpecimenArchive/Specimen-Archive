import type {ExhibitLive} from '../shared/exhibit';
export interface DecodedPresentation {key:string;live:ExhibitLive;desktop:HTMLImageElement|null;input:HTMLImageElement|null}
interface ObserverStart {cached:{live:ExhibitLive;savedAt:number;serverNow:number;desktop:string;input:string|null}|null;current:ExhibitLive|null;decoded:Map<string,HTMLImageElement>;image:(path:string)=>Promise<HTMLImageElement>;ready:Promise<ExhibitLive|null>}
declare global {interface Window {__specimenStart?:ObserverStart}}
export const startup=()=>window.__specimenStart;
let clock:{serverTime:number;received:number}|null=null;
export function recordObserverClock(serverTime:number,received=performance.now()){clock={serverTime,received};}
export const desktopPath=(live:ExhibitLive)=>live.display?`${live.display.runId}/${live.display.path}`:live.desktop?`${live.runId}/${live.desktop.path}`:null;
export const presentationKey=(live:ExhibitLive|null)=>live?`${live.sessionId}|${live.runId}|${desktopPath(live)??live.browserFrame??''}|${live.inputFrame??''}`:'';
const images=new Map<string,Promise<HTMLImageElement>>(),decoded=new Map<string,HTMLImageElement>();
export function captureImage(path:string){
 const start=startup();if(start)return start.image(path);
 const cached=images.get(path);if(cached)return cached;
 const loading=new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>i.decode().then(()=>{if(images.has(path))decoded.set(path,i);resolve(i);},reject);i.onerror=()=>reject(new Error('Capture unavailable'));i.src='/api/exhibit/artifacts/'+path;});
 images.set(path,loading);if(images.size>24){const old=images.keys().next().value!;images.delete(old);decoded.delete(old);}void loading.catch(()=>images.delete(path));return loading;
}
export function availablePresentation(live:ExhibitLive|null):DecodedPresentation|null {
 if(!live)return null;const p=desktopPath(live),cache=startup()?.decoded??decoded,desktop=p?cache.get(p):null;if(!desktop)return null;
 return {key:presentationKey(live),live,desktop,input:live.inputFrame?cache.get(live.inputFrame)??null:null};
}
/** A tab-local held frame makes refresh/navigation immediate. It never sets
 * transport health to live; original source paths, timestamps and state survive. */
export function savePresentation(pair:DecodedPresentation|null){
 if(!pair?.desktop||!pair.live.snapshot)return;
 try {const encode=(image:HTMLImageElement|null)=>{if(!image)return null;const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d')!.drawImage(image,0,0);return c.toDataURL('image/png');};
  if(!clock)return;
  sessionStorage.setItem('specimen-observer-frame-v1',JSON.stringify({savedAt:Date.now(),serverNow:clock.serverTime+Math.max(0,performance.now()-clock.received),live:pair.live,desktop:encode(pair.desktop),input:encode(pair.input)}));
 }catch{/* Storage can be unavailable/full. Fresh station capture remains primary. */}
}
