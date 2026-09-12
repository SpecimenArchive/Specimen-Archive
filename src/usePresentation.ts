import { useEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
const image=(path:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>{i.decode().then(()=>resolve(i),reject);};i.onerror=reject;i.src='/api/exhibit/artifacts/'+path;});
/** Decoded page+desktop publish together. Neural packets reuse the pair.
 * Old requests cannot overwrite a newer episode or replay selection. */
export function usePresentation(live:ExhibitLive|null,suppressCaptures=false){
  const key=live?.display?`${live.display.runId}/${live.display.path}`:live?`${live.runId}/${live.browserFrame}/${live.desktop?.path??''}`:'',requested=useRef('');requested.current=key;
  const [pair,setPair]=useState<{key:string;live:ExhibitLive;desktop:HTMLImageElement|null}|null>(null),latest=useRef(live);latest.current=live;
  const displayed=useRef<{live:ExhibitLive;desktop:HTMLImageElement|null}|null>(null);
  useEffect(()=>{
    if(suppressCaptures||!live||(!live.display&&!live.browserFrame)){setPair(null);return;}
    let cancelled=false;
    const load=live.display?image(`${live.display.runId}/${live.display.path}`):Promise.all([image(live.browserFrame!),live.desktop?image(`${live.runId}/${live.desktop.path}`):Promise.resolve(null)]).then(([,desktop])=>desktop);
    load.then(desktop=>{
      if(!cancelled&&requested.current===key&&latest.current)setPair({key,live:latest.current,desktop});
    }).catch(()=>{/* Retain the last complete pair; never mix independent captures. */});
    return()=>{cancelled=true;};
  },[key,suppressCaptures]);
  if(suppressCaptures||!live||(!live.display&&!live.browserFrame))return {live,desktopImage:null,pending:false};
  if(pair?.key===key&&live)displayed.current={live,desktop:pair.desktop};
  // While the next pair decodes, hold the most recently displayed neural
  // sample, not the old sample saved when the previous image first loaded.
  const sameRun=displayed.current?.live.runId===live?.runId;
  return {live:sameRun?displayed.current?.live??null:null,desktopImage:sameRun?displayed.current?.desktop??null:null,pending:!!live&&pair?.key!==key};
}
