import { useEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
const images=new Map<string,Promise<HTMLImageElement>>();
const image=(path:string)=>{const cached=images.get(path);if(cached)return cached;const loading=new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>{i.decode().then(()=>resolve(i),reject);};i.onerror=reject;i.src='/api/exhibit/artifacts/'+path;});images.set(path,loading);if(images.size>20)images.delete(images.keys().next().value!);void loading.catch(()=>images.delete(path));return loading;};
/** Decoded page+desktop publish together. Neural packets reuse the pair.
 * Old requests cannot overwrite a newer episode or replay selection. */
export function usePresentation(live:ExhibitLive|null,suppressCaptures=false,paused=false){
  const key=(live?.display?`${live.display.runId}/${live.display.path}`:live?`${live.runId}/${live.browserFrame}/${live.desktop?.path??''}`:'')+'|'+(live?.inputFrame??''),requested=useRef('');requested.current=key;
  const [pair,setPair]=useState<{key:string;live:ExhibitLive;desktop:HTMLImageElement|null;input:HTMLImageElement|null}|null>(null),latest=useRef(live);latest.current=live;
  const displayed=useRef<{live:ExhibitLive;desktop:HTMLImageElement|null;input:HTMLImageElement|null}|null>(null);
  useEffect(()=>{
    if(suppressCaptures||!live||(!live.display&&!live.browserFrame)){setPair(null);return;}
    let cancelled=false;
    const load=live.display?image(`${live.display.runId}/${live.display.path}`):Promise.all([image(live.browserFrame!),live.desktop?image(`${live.runId}/${live.desktop.path}`):Promise.resolve(null)]).then(([,desktop])=>desktop);
    Promise.all([load,live.inputFrame?image(live.inputFrame):Promise.resolve(null)]).then(([desktop,input])=>{
      if(!cancelled&&requested.current===key&&latest.current)setPair({key,live:latest.current,desktop,input});
    }).catch(()=>{/* Retain the last complete pair; never mix independent captures. */});
    return()=>{cancelled=true;};
  },[key,suppressCaptures]);
  if(suppressCaptures||!live||(!live.display&&!live.browserFrame))return {live,desktopImage:null,inputImage:null,pending:false};
  // A decoded image arriving after disconnect must not advance the held model.
  if(paused)return {live:displayed.current?.live??null,desktopImage:displayed.current?.desktop??null,inputImage:displayed.current?.input??null,pending:!!live&&pair?.key!==key};
  if(pair?.key===key&&live)displayed.current={live,desktop:pair.desktop,input:pair.input};
  // While the next pair decodes, hold the most recently displayed neural
  // sample, not the old sample saved when the previous image first loaded.
  const sameRun=displayed.current?.live.runId===live?.runId;
  return {live:sameRun?displayed.current?.live??null:null,desktopImage:sameRun?displayed.current?.desktop??null:null,inputImage:sameRun?displayed.current?.input??null:null,pending:!!live&&pair?.key!==key};
}
