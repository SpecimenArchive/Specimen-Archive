import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RateNetwork } from '../server/model/network';
import { fixtureCircuit } from './fixtures/circuit';

test('synthetic fixture: synchronous propagation cannot skip connection steps',()=>{
  const network=new RateNetwork(fixtureCircuit);
  network.step(1,0);assert(network.activity[0]>0);assert.equal(network.activity[1],0);assert.equal(network.activity[2],0);
  network.step(1,0);assert(network.activity[1]>0);assert.equal(network.activity[2],0);
  network.step(1,0);assert(network.activity[2]>0);
});
test('synthetic fixture: large positive input remains finite and bounded',()=>{
  const network=new RateNetwork(fixtureCircuit);for(let i=0;i<10000;i++)network.step(1e6,1e6);
  assert(Array.from(network.activity).every(v=>Number.isFinite(v)&&v>=0&&v<=1));
});
