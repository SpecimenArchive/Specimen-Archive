import { useEffect,useRef,useState } from 'react';
import type { ExhibitLive } from '../shared/exhibit';
import type { Snapshot } from '../shared/types';
export function useExhibit(){
  const [live,setLive]=useState<ExhibitLive|null>(null),[health,setHealth]=useState('connecting');
  const history=useRef<Snapshot[]>([]),last=useRef<ExhibitLive|null>(null),received=useRef(0);
  useEffect(()=>{
    let disposed=false,socket:WebSocket,retry:ReturnType<typeof setTimeout>,attempt=0;
    function connect(){
      if(disposed)return;socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/stream`);
      const connection=socket;
      socket.onmessage=e=>{try{
        if(connection!==socket)return;
        const p=JSON.parse(e.data).exhibit as ExhibitLive|null;if(!p)return;
        if(last.current?.sessionId===p.sessionId&&p.packetSeq<=last.current.packetSeq)return;
        received.current=performance.now();setHealth('live');attempt=0;
        if(last.current?.runId!==p.runId)history.current=[];
        if(p.snapshot&&p.snapshot.seq!==history.current.at(-1)?.seq){history.current.push(p.snapshot);if(history.current.length>600)history.current.shift();}
        last.current=p;setLive(p);
      }catch{setHealth('stale');}};
      socket.onclose=()=>{if(disposed)return;setHealth('disconnected');retry=setTimeout(connect,Math.min(8000,500*2**attempt++));};socket.onerror=()=>socket.close();
    }
    connect();const timer=setInterval(()=>{if(received.current&&performance.now()-received.current>5000)setHealth(socket?.readyState===WebSocket.OPEN?'stale':'disconnected');},500);
    return()=>{disposed=true;clearInterval(timer);clearTimeout(retry);socket?.close();};
  },[]);
  // Frame age uses the server timestamp plus monotonic time since receipt,
  // not a subtraction between independently configured home/VM clocks.
  return {live,health,history,serverNow:()=>last.current?Date.parse(last.current.timestamp)+Math.max(0,performance.now()-received.current):Date.now()};
}
