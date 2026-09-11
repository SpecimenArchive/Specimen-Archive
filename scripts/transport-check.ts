import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { WebSocket } from 'ws';
import type { Snapshot } from '../shared/types';
import { circuit } from './science';
import { decodeMotor } from '../server/model/motor';
const origin=process.env.TEST_URL||'http://127.0.0.1:4317',wsUrl=origin.replace('http','ws')+'/stream';
const a=new WebSocket(wsUrl),b=new WebSocket(wsUrl);
const left=new Map<number,Snapshot>(),right=new Map<number,Snapshot>();let bytes=0,firstType='',started=performance.now();
await Promise.all([new Promise<void>((resolve,reject)=>{a.once('open',resolve);a.once('error',reject);}),new Promise<void>((resolve,reject)=>{b.once('open',resolve);b.once('error',reject);})]);
a.on('message',raw=>{const packet=raw.toString();const p=JSON.parse(packet);if(!firstType)firstType=p.type;left.set(p.snapshot.seq,p.snapshot);bytes+=Buffer.byteLength(packet);});
b.on('message',raw=>{const p=JSON.parse(raw.toString());right.set(p.snapshot.seq,p.snapshot);});
// Ten seconds measures real pacing, with the engine continuing independently.
await new Promise(r=>setTimeout(r,10000));
const elapsed=(performance.now()-started)/1000;const shared=[...left.keys()].filter(seq=>right.has(seq));assert(shared.length>80);
for(const seq of shared){assert.deepEqual(left.get(seq),right.get(seq));const s=left.get(seq)!;assert.deepEqual(s.motor,decodeMotor(circuit,Float64Array.from(s.activity)));}
const snapshots=[...left.values()];for(let i=1;i<snapshots.length;i++)assert(snapshots[i].seq>snapshots[i-1].seq);
a.close();b.close();
const reconnected=await new Promise<{type:string;snapshot:Snapshot}>((resolve,reject)=>{const ws=new WebSocket(wsUrl);ws.once('message',raw=>{resolve(JSON.parse(raw.toString()));ws.close();});ws.once('error',reject);});
assert.equal(reconnected.type,'resync');assert(reconnected.snapshot.seq>=(snapshots.at(-1)?.seq||0));
const response=await fetch(origin+'/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pause:true})});assert.equal(response.status,405);
const mutationClose=await new Promise<number>((resolve,reject)=>{const ws=new WebSocket(wsUrl);ws.once('open',()=>ws.send('mutate'));ws.once('close',code=>resolve(code));ws.once('error',reject);});assert.equal(mutationClose,1008);
const results={measuredAt:new Date().toISOString(),origin,wallSeconds:elapsed,snapshots:snapshots.length,actualSnapshotsPerSecond:snapshots.length/elapsed,receivedBytes:bytes,actualBytesPerSecond:bytes/elapsed,matchingClientSnapshots:shared.length,motorAgreement:true,monotonicSequence:true,reconnectResync:true,httpMutationRejected:405,webSocketMutationRejected:mutationClose,modelSecondsAdvanced:snapshots.at(-1)!.modelTime-snapshots[0].modelTime};
writeFileSync('docs/results/transport.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
