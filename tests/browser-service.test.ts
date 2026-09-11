import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BrowserService } from '../server/browser/service';
import { circuit } from '../scripts/science';
test('fresh runtime exposes exported compressed traces and verified publication links',()=>{
  const root=mkdtempSync(join(tmpdir(),'specimen-fresh-clone-'));
  try{
    const service=new BrowserService(root,circuit,()=>{}),id='browser_1789136368734_a23ceb7d';
    assert.equal(service.trace(id)?.length,16);
    assert.equal(service.file(id,'../record.json'),null);assert.equal(service.file('../browser_invalid','record.json'),null);
    const receipt=service.publications().find(p=>p.id===id);assert.equal(receipt?.state,'published');assert.equal(receipt?.commit,'a8f072a42cc405c3a2a988462fcac7828a0d64a8');
  }finally{if(!root.startsWith(join(tmpdir(),'specimen-fresh-clone-')))throw new Error('Unexpected temporary path');rmSync(root,{recursive:true,force:true});}
});
