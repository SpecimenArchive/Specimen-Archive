import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ExhibitService} from '../server/exhibit/service';
import {loadCircuit} from '../server/browser/runner';
test('fresh runtime lists compact held-out controls with verified actual publication receipts',()=>{
  const root=mkdtempSync(join(tmpdir(),'specimen-exhibit-test-'));
  try{const s=new ExhibitService(root,loadCircuit(),()=>{}),records=s.records();assert.equal(records.length,9);assert.equal(records.filter(r=>r.intervention==='intact').length,3);assert.equal(s.publications().length,9);assert(s.publications().every(p=>p.state==='published'&&p.url?.startsWith('https://github.com/SpecimenArchive/Specimen-Archive/commit/')));assert.equal(s.file('../secrets','record.json'),null);assert.equal(s.decision(records[0].id,9999),null);}finally{rmSync(root,{recursive:true,force:true});}
});

test('concurrent observer archive reads share a snapshot and refresh external publication receipts',async()=>{
  const root=mkdtempSync(join(tmpdir(),'specimen-archive-observers-'));
  try{
    const s=new ExhibitService(root,loadCircuit(),()=>{}),record=s.records()[0],verified=s.publications().find(p=>p.id===record.id)!;
    s.store.save(record);
    const first=s.archive(),second=s.archive();assert.equal(first,second);
    const pending=await first;assert.equal(pending.records.length,9);assert.equal(pending.publications.find(p=>p.id===record.id)?.state,'pending');
    assert.equal(s.record(record.id)?.id,record.id);assert.equal(s.record('../secrets'),null);
    s.store.setPublication(verified);
    await new Promise(r=>setTimeout(r,5100));
    const refreshed=await s.archive();assert.equal(refreshed.publications.find(p=>p.id===record.id)?.commit,verified.commit);assert.equal(refreshed.publications.find(p=>p.id===record.id)?.state,'published');
  }finally{rmSync(root,{recursive:true,force:true});}
});
