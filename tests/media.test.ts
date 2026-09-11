import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serveVideo } from '../server/media';
test('recording playback serves bounded ranges, suffixes, HEAD and invalid seeks',async()=>{
  const root=mkdtempSync(join(tmpdir(),'specimen-media-')),path=join(root,'fixture.webm');writeFileSync(path,'0123456789');
  const server=createServer((req,res)=>serveVideo(req,res,path));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  try{
    const part=await fetch(url,{headers:{Range:'bytes=3-6'}});assert.equal(part.status,206);assert.equal(part.headers.get('Content-Range'),'bytes 3-6/10');assert.equal(await part.text(),'3456');
    assert.equal(await(await fetch(url,{headers:{Range:'bytes=-2'}})).text(),'89');
    const head=await fetch(url,{method:'HEAD'});assert.equal(head.headers.get('Content-Length'),'10');assert.equal(await head.text(),'');
    assert.equal((await fetch(url,{headers:{Range:'bytes=99-'}})).status,416);
  }finally{await new Promise<void>(r=>server.close(()=>r()));rmSync(root,{recursive:true,force:true});}
});
