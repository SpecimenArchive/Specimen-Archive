import { useEffect, useRef, useState } from 'react';
import type { Snapshot, StreamPacket } from '../shared/types';
export function useStream(){
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[health,setHealth]=useState<'connecting'|'live'|'stale'|'offline'>('connecting');
  const latest=useRef<Snapshot|null>(null),previous=useRef<Snapshot|null>(null),received=useRef(0),history=useRef<Snapshot[]>([]);
  useEffect(()=>{
    let disposed=false,socket:WebSocket,retry:ReturnType<typeof setTimeout>,attempt=0;
    function connect(){
      if(disposed)return;socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/stream`);
      socket.onmessage=e=>{
        try{const p=JSON.parse(e.data) as StreamPacket;const s=p.snapshot;if(s?.version!==1||!Number.isFinite(s.modelTime)||s.activity.some(v=>!Number.isFinite(v)))return;
          if(latest.current?.runId===s.runId&&s.seq<=latest.current.seq)return;
          if(latest.current?.runId!==s.runId)history.current=[];
          previous.current=latest.current;latest.current=s;received.current=performance.now();history.current.push(s);if(history.current.length>600)history.current.shift();setSnapshot(s);setHealth('live');attempt=0;
        }catch{setHealth('stale');}
      };
      socket.onclose=()=>{if(disposed)return;setHealth('offline');retry=setTimeout(connect,Math.min(8000,500*2**attempt++));};socket.onerror=()=>socket.close();
    }
    connect();const monitor=setInterval(()=>{if(received.current&&performance.now()-received.current>1500)setHealth(socket?.readyState===WebSocket.OPEN?'stale':'offline');},250);
    return()=>{disposed=true;clearTimeout(retry);clearInterval(monitor);socket?.close();};
  },[]);
  return {snapshot,health,latest,previous,received,history};
}
