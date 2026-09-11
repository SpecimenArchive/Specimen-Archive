import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { circuit, probe } from '../scripts/science';
import { Engine } from '../server/model/engine';
import { environmentAt } from '../server/model/environment';
import { decodeMotor } from '../server/model/motor';

test('published counts, categories and byte-level scientific checksums are consistent',()=>{
  const manifest=JSON.parse(readFileSync('data/processed/manifest.json','utf8'));
  assert.equal(manifest.importedCounts.nodes,2675);assert.equal(manifest.importedCounts.edges,14066);assert.equal(manifest.importedCounts.synapses,26881);assert.equal(manifest.importedCounts.fragment,467);
  assert.equal(manifest.importedCounts.sensory+manifest.importedCounts.interneuron+manifest.importedCounts.motor,1627);
  assert.notEqual(1627,manifest.sourceStudyCounts.classifiedNeurons);
  for(const out of manifest.outputs)assert.equal(createHash('sha256').update(readFileSync(out.file)).digest('hex'),out.sha256);
  assert(circuit.nodes.every(n=>['sensory','interneuron','motor'].includes(n.category)&&n.type!=='not_celltype'));
  const ids=new Set(circuit.nodes.map(n=>n.id));assert.equal(ids.size,circuit.nodes.length);assert(circuit.edges.every(e=>ids.has(e.source)&&ids.has(e.target)&&Number.isInteger(e.weight)&&e.weight>0));
});
test('fixed input propagates through the circuit and sensory disconnection abolishes its motor response',()=>{
  const intact=probe('intact'),cut=probe('disconnect-photoreceptors'),dark=probe('intact','dark');
  assert(intact.motor.left>.1&&intact.motor.right>.1);assert(intact.responseTime!>0);assert.equal(cut.motor.left+cut.motor.right,0);assert.equal(dark.motor.left+dark.motor.right,0);assert(intact.pose.distance>cut.pose.distance);
});
test('input direction and pathway intervention change measured response',()=>{
  const a=probe('intact'),b=probe('intact','right'),c=probe('disconnect-inton');
  assert(Math.abs(a.motor.turn-b.motor.turn)>.001);assert(c.responseTime!>a.responseTime!);assert(Math.abs(a.motor.forward-c.motor.forward)>1);
});
test('deterministic episodes and restored checkpoints have identical future states',()=>{
  const a=new Engine(circuit),b=new Engine(circuit);for(let i=0;i<1733;i++){a.step();b.step();}assert.deepEqual(a.checkpoint(),b.checkpoint());
  const restored=new Engine(circuit);restored.restore(JSON.parse(JSON.stringify(a.checkpoint())));for(let i=0;i<971;i++){a.step();restored.step();}assert.deepEqual(a.checkpoint(),restored.checkpoint());
});
test('long episode remains bounded and snapshot motor and pose agree with the authoritative engine',()=>{
  const engine=new Engine(circuit);for(let i=0;i<40000;i++)engine.step();
  const s=engine.snapshot('test',1,'test',0);assert.deepEqual(s.pose,engine.pose);assert.deepEqual(s.motor,decodeMotor(circuit,engine.network.activity));assert(s.activity.every(v=>Number.isFinite(v)&&v>=0&&v<=1));assert(Math.abs(s.pose.x)<=1000&&Math.abs(s.pose.y)<=1000);assert(engine.events.length<=80);assert(engine.events.filter(e=>e.kind==='environment').length>=12);
});
test('sensory encoding closes the loop over heading, roll and position',()=>{
  const e=new Engine(circuit),p=e.pose;const a=environmentAt(17,p);const b=environmentAt(17,{...p,heading:p.heading+1.1});const c=environmentAt(17,{...p,x:800});const d=environmentAt(17,{...p,roll:p.roll+2});
  assert.notEqual(a.lightLeft,b.lightLeft);assert.notEqual(a.lightLeft,c.lightLeft);assert.notEqual(a.lightLeft,d.lightLeft);
});
