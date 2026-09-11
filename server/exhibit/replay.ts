import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import type { Circuit } from '../../shared/types';
import type { ExhibitRecord,ExhibitDecision } from '../../shared/exhibit';
import { ExhibitController } from './controller';
import { EXHIBIT_CONFIG as C } from './config';
import { MODEL_CONFIG } from '../model/config';
import { sha256 } from '../browser/evidence';
export async function replayEpisode(directory:string,circuit:Circuit){
  const r=JSON.parse(readFileSync(join(directory,'record.json'),'utf8')) as ExhibitRecord;
  assert.deepEqual(r.config,C);assert.equal(r.configSha256,sha256(JSON.stringify(C)));assert.deepEqual(r.model,MODEL_CONFIG);
  assert.equal(r.origin.dataSha256,sha256(readFileSync('data/processed/circuit.json')));
  for(const a of r.artifacts){const b=readFileSync(join(directory,a.path));assert.equal(b.length,a.bytes);assert.equal(sha256(b),a.sha256);}
  const trace=JSON.parse(gunzipSync(readFileSync(join(directory,'trace.json.gz'))).toString()) as ExhibitDecision[];
  assert.deepEqual(trace.map(({samples,...d})=>d),r.decisions);
  const controller=new ExhibitController(circuit,r.id,r.startedAt,r.intervention);let samples=0,previous:ExhibitDecision|undefined;
  for(const d of trace){
    const png=readFileSync(join(directory,d.imageBefore));assert.equal(sha256(png),d.imageSha256);assert.equal(sha256(readFileSync(join(directory,d.imageAfter))),d.afterSha256);
    for(const [capture,pageFrame,cursor] of [[d.desktopBefore,d.imageBefore,d.executed.from],[d.desktopAfter,d.imageAfter,d.executed.to]] as const){
      if(!capture)continue;
      assert(['x11-root','windows-gdi'].includes(capture.source));assert.equal(capture.pageFrame,pageFrame);assert.deepEqual(capture.cursor,cursor);
      if(capture.source==='windows-gdi'){assert.equal(capture.station?.os,'Windows 11');assert.equal(capture.station.dpi,96);assert((capture.width===1600&&capture.height===900&&capture.station.viewport.scale===2)||(capture.width===1280&&capture.height===800&&capture.station.viewport.scale===1.5));assert(capture.station.id);}
      assert.equal(sha256(readFileSync(join(directory,capture.path))),capture.sha256);
      assert.equal(capture.pageLagMs,Date.parse(capture.capturedAt)-Date.parse(capture.pageCapturedAt));assert(capture.pageLagMs>=0);
    }
    assert.equal(d.commandId,`${r.id}:c${String(d.decision).padStart(3,'0')}`);assert.equal(d.sessionId,r.sessionId);
    assert.equal(d.context.sourceRevision,r.origin.sourceRevision);assert.equal(d.context.configSha256,r.configSha256);assert.equal(d.context.intervention,r.intervention);
    if(previous){assert.equal(d.imageSha256,previous.afterSha256);assert.deepEqual(d.executed.from,previous.executed.to);assert.deepEqual(d.desktopBefore,previous.desktopAfter);}
    const calculated=await controller.observe(png,d.decision);
    for(const key of ['input','motor','command','modelStartStep','modelEndStep'] as const)assert.deepEqual(calculated[key],d[key]);
    assert.equal(calculated.samples.length,d.samples.length);
    calculated.samples.forEach((s,i)=>{for(const key of ['activity','sensory','motor','pose','modelTime','seq'] as const)assert.deepEqual(s[key],d.samples[i][key]);samples++;});
    const actual=d.executed.events;assert(actual.every(e=>e.commandId===d.commandId));
    const inputs=actual.filter(e=>e.type!=='navigation');assert(inputs.every(e=>e.trusted===true));
    if(d.command.kind==='wait'){assert.equal(inputs.length,0);assert.deepEqual(d.executed.from,d.executed.to);}
    if(d.command.kind==='move'){assert.equal(d.executed.to.x,Math.max(10,Math.min(C.width-10,d.executed.from.x+d.command.dx)));assert(inputs.some(e=>e.type==='mousemove'&&e.x===d.executed.to.x&&e.y===d.executed.to.y));}
    if(d.command.kind==='scroll')assert(inputs.some(e=>e.type==='wheel'&&e.deltaY===d.command.wheelY));
    if(d.command.kind==='click')for(const type of ['mousedown','mouseup','click'])assert(inputs.some(e=>e.type===type&&e.x===d.executed.from.x&&e.y===d.executed.from.y));
    previous=d;
  }
  return {exact:true,samples,decisions:trace.length};
}
