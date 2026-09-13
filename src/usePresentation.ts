import {useEffect,useRef,useState} from 'react';
import type {ExhibitLive} from '../shared/exhibit';
import {availablePresentation,captureImage,desktopPath,presentationKey,savePresentation,startup,type DecodedPresentation} from './observer-start';
/** Show the first decoded desktop without waiting for the larger sensory PNG.
 * Each displayed image keeps its own matching packet; a missing sensory image
 * stays empty until that exact packet's image decodes. Never cancel a useful
 * first frame merely because the next capture arrived over the network. */
export function usePresentation(live:ExhibitLive|null,suppressCaptures=false,paused=false){
 const key=presentationKey(live),latest=useRef(live),held=useRef(paused),active=useRef(true);
 latest.current=live;held.current=paused;
 const [pair,setPair]=useState<DecodedPresentation|null>(()=>availablePresentation(live)),displayed=useRef<DecodedPresentation|null>(pair);
 useEffect(()=>{active.current=true;const save=()=>savePresentation(displayed.current);window.addEventListener('pagehide',save);return()=>{active.current=false;window.removeEventListener('pagehide',save);};},[]);
 useEffect(()=>{
  // The eager HTTP capture can finish ahead of the WebSocket's newer image.
  // Use it only to fill an empty display, with its own matching packet.
  void startup()?.ready.then(async first=>{const path=first&&desktopPath(first);if(!first||!path||displayed.current||suppressCaptures)return;await captureImage(path);const decoded=availablePresentation(first);if(active.current&&!held.current&&!displayed.current&&latest.current?.sessionId===first.sessionId&&latest.current?.runId===first.runId&&decoded)setPair(current=>current??decoded);}).catch(()=>{});
 },[suppressCaptures]);
 useEffect(()=>{
  if(suppressCaptures||!live||(!live.display&&!live.browserFrame)||paused)return;
  const candidate=live,candidateKey=key,path=desktopPath(candidate);let input:HTMLImageElement|null=null;
  const eligible=()=>active.current&&!held.current&&latest.current?.sessionId===candidate.sessionId&&latest.current?.runId===candidate.runId;
  const inputLoad=candidate.inputFrame?captureImage(candidate.inputFrame):Promise.resolve(null);
  void inputLoad.then(image=>{input=image;if(!eligible())return;setPair(current=>current?.key===candidateKey?{...current,input:image}:current);}).catch(()=>{});
  const load=path?captureImage(path):candidate.browserFrame?captureImage(candidate.browserFrame).then(()=>null):Promise.resolve(null);
  void load.then(desktop=>{
   if(!eligible())return;
   const current=latest.current!,packet=presentationKey(current)===candidateKey?current:candidate;
   setPair(previous=>{
    if(previous&&previous.live.sessionId===packet.sessionId&&previous.live.packetSeq>packet.packetSeq)return previous;
    return {key:candidateKey,live:packet,desktop,input};
   });
  }).catch(()=>{/* Keep the last received capture during a failed image request. */});
 },[key,suppressCaptures,paused]);
 if(suppressCaptures){displayed.current=null;return {live,desktopImage:null,inputImage:null,pending:false};}
 if(!paused&&pair){displayed.current=pair.key===key&&live?{...pair,live}:pair;}
 const shown=displayed.current;
 return {live:shown?.live??null,desktopImage:shown?.desktop??null,inputImage:shown?.input??null,pending:!!live&&shown?.key!==key};
}
