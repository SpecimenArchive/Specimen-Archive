import { useEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
import type { Snapshot } from '../shared/types';
import {startup,recordObserverClock} from './observer-start';
export function useExhibit(){
  const cached=startup()?.cached,initial=startup()?.current??cached?.live??null;
  const [live,setLive]=useState<ExhibitLive|null>(initial),[health,setHealth]=useState('connecting');
  const history=useRef<Snapshot[]>([]),last=useRef<ExhibitLive|null>(initial),received=useRef(performance.now()),serverTime=useRef(initial===cached?.live&&cached?cached.serverNow+Math.max(0,Date.now()-cached.savedAt):initial?Date.parse(initial.timestamp):Date.now());
  useEffect(()=>{
    recordObserverClock(serverTime.current,received.current);
    let disposed=false,socket:WebSocket,retry:ReturnType<typeof setTimeout>,attempt=0,streamReceived=false;
    function accept(p:ExhibitLive,connected:boolean){
      if(connected){streamReceived=true;setHealth('live');attempt=0;}
      if(last.current?.sessionId===p.sessionId&&p.packetSeq<last.current.packetSeq)return;
      received.current=performance.now();serverTime.current=Date.parse(p.timestamp);recordObserverClock(serverTime.current,received.current);
      if(last.current?.runId!==p.runId)history.current=[];
      if(p.snapshot&&p.snapshot.seq!==history.current.at(-1)?.seq){history.current.push(p.snapshot);if(history.current.length>600)history.current.shift();}
      last.current=p;setLive(p);
    }
    void startup()?.ready.then(p=>{if(!disposed&&!streamReceived&&p)accept(p,false);});
    function connect(){
      if(disposed)return;socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/stream`);
      const connection=socket;
      socket.onmessage=e=>{try{
        if(connection!==socket)return;
        const p=JSON.parse(e.data).exhibit as ExhibitLive|null;if(!p)return;
        accept(p,true);
      }catch{setHealth('stale');}};
      socket.onclose=()=>{if(disposed)return;setHealth('disconnected');retry=setTimeout(connect,Math.min(8000,500*2**attempt++));};socket.onerror=()=>socket.close();
    }
    connect();const timer=setInterval(()=>{if(streamReceived&&performance.now()-received.current>5000)setHealth(socket?.readyState===WebSocket.OPEN?'stale':'disconnected');},500);
    return()=>{disposed=true;clearInterval(timer);clearTimeout(retry);socket?.close();};
  },[]);
  // Frame age uses the server timestamp plus monotonic time since receipt,
  // not a subtraction between independently configured home/VM clocks.
  return {live,health,history,serverNow:()=>serverTime.current+Math.max(0,performance.now()-received.current)};
}
