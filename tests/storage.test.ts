import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Storage } from '../server/storage';
import { Engine } from '../server/model/engine';
import { fixtureCircuit as circuit } from './fixtures/circuit';
test('recorded snapshots round-trip, corrupt trailing frames are isolated, traversal is rejected',()=>{
  const root=mkdtempSync(join(tmpdir(),'specimen-storage-'));
  try{const storage=new Storage(root,'test','2026-01-01T00:00:00Z'),engine=new Engine(circuit);engine.step();const s=engine.snapshot('test',1,'2026-01-01T00:00:00Z',0);storage.record(s);storage.checkpoint(engine);assert.deepEqual(storage.read('test'),[s]);assert.equal(storage.read('../checkpoint'),null);writeFileSync(join(root,'test.jsonl'),'bad trailing row\n',{flag:'a'});assert.equal(storage.read('test')?.length,1);const restored=new Engine(circuit);const next=new Storage(root,'test_next','2026-01-02T00:00:00Z');next.restore(restored);assert.deepEqual(Array.from(restored.network.activity),Array.from(engine.network.activity));assert.deepEqual(restored.pose,engine.pose);next.markInterrupted();assert(next.list().find(s=>s.id==='test')?.interrupted);}finally{rmSync(root,{recursive:true,force:true});}
});
