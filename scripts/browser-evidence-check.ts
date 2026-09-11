import { mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { replayBrowser } from '../server/browser/evidence';
import { loadCircuit,runBrowserTrial } from '../server/browser/runner';
const input=process.argv[2];if(!input)throw new Error('Pass a recorded trial directory');
const root=mkdtempSync(join(tmpdir(),'specimen-evidence-check-')),copy=join(root,'copy');
try{
  cpSync(input,copy,{recursive:true});const path=join(copy,'record.json'),record=JSON.parse(readFileSync(path,'utf8'));
  const exact=await replayBrowser(copy,loadCircuit());assert(exact.exact);
  record.decisions[0].command.dx+=1;writeFileSync(path,JSON.stringify(record));await assert.rejects(replayBrowser(copy,loadCircuit()),/Compact decisions differ/);
  const abort=new AbortController();let samples=0;
  const interrupted=await runBrowserTrial(loadCircuit(),{root,seed:11,intervention:'intact',signal:abort.signal,onUpdate:()=>{if(++samples===3)abort.abort(new Error('Controlled shutdown test'));}});
  assert.equal(interrupted.record.outcome,'error');assert.match(interrupted.record.error!,/Controlled shutdown test/);
  assert.equal(interrupted.record.decisions.length,0,'Shutdown cannot execute a partial-window action');
  console.log({exact,mutatedCommandRejected:true,shutdownClosedBrowser:true,partialWindowActions:0});
}finally{
  // Only the unique temporary directory created above is removed.
  if(!root.startsWith(join(tmpdir(),'specimen-evidence-check-')))throw new Error('Unexpected temporary path');rmSync(root,{recursive:true,force:true});
}
