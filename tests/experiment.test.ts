import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circuit } from '../scripts/science';
import { Engine } from '../server/model/engine';
import { Experiment, restoreInitial, selectCondition, type ExperimentOrigin } from '../server/experiment';
const origin:ExperimentOrigin={runId:'test',sourceRevision:'test',sourceDirty:true,dataVersion:circuit.version,dataSha256:'test',modelVersion:'rate-v1'};
function run(engine:Engine){const e=new Experiment(engine,origin);while(!e.state.completed)e.step();return e.state.completed;}
test('published circuit motor integral controls the next executed light and exact replay',()=>{
  const a=run(new Engine(circuit));
  assert.equal(a.integration.sampleCount,800);assert.equal(a.response.sampleCount,800);
  assert.equal(a.selection.condition.key,'right');assert(a.selection.difference>=.05);
  assert.equal(a.response.modelStart,a.integration.modelEnd);
  const e=new Engine(circuit);restoreInitial(e,a.initial);const b=run(e);
  assert.deepEqual(a.integration,b.integration);assert.deepEqual(a.selection,b.selection);assert.deepEqual(a.response,b.response);
});
test('clamping relevant motor-neuron activities changes selection; no threshold is explicit',()=>{
  const a=run(new Engine(circuit,'clamp-right-motors'));assert.equal(a.selection.condition.key,'left');
  const b=run(new Engine(circuit,'clamp-all-motors'));assert.equal(b.selection.condition.key,'dark');assert.equal(b.selection.thresholdReached,false);assert.equal(b.outcome,'no-threshold-dark-executed');assert.equal(b.integration.leftIntegral+b.integration.rightIntegral,0);
});
test('mid-window checkpoint restoration neither drops nor duplicates integration samples',()=>{
  const a=new Engine(circuit),ta=new Experiment(a,origin);for(let i=0;i<1917;i++)ta.step();
  const b=new Engine(circuit);b.restore(structuredClone(a.checkpoint()));const tb=new Experiment(b,origin,structuredClone(ta.state));
  while(!ta.state.completed){ta.step();tb.step();}
  assert.deepEqual(ta.state.completed!.integration,tb.state.completed!.integration);assert.deepEqual(ta.state.completed!.response,tb.state.completed!.response);
});
test('selection boundary is inclusive and neutral values cannot silently choose a side',()=>{
  assert.equal(selectCondition(0,.05).condition.key,'right');assert.equal(selectCondition(.05,0).condition.key,'left');assert.equal(selectCondition(1,1).condition.key,'dark');
});
