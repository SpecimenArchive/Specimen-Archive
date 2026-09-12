import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {artifactManifest} from '../server/browser/evidence';
test('unfinished videos cannot change the accepted evidence manifest',()=>{
 const dir=mkdtempSync(join(tmpdir(),'specimen-artifacts-'));
 try{
  writeFileSync(join(dir,'frame-0000.png'),'verified frame');writeFileSync(join(dir,'browser.webm'),'finished video');writeFileSync(join(dir,'page@pending.webm'),'partial');
  const include=(p:string)=>!p.endsWith('.webm')||p==='browser.webm',before=artifactManifest(dir,include);
  writeFileSync(join(dir,'page@pending.webm'),'partial recording still growing');
  assert.deepEqual(artifactManifest(dir,include),before);assert.deepEqual(before.map(a=>a.path),['browser.webm','frame-0000.png']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
