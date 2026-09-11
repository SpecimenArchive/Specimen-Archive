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
