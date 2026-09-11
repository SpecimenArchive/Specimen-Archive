import { createReadStream,statSync } from 'node:fs';
import type { IncomingMessage,ServerResponse } from 'node:http';
/** Read-only byte ranges let the browser seek actual recorded video. */
export function serveVideo(req:IncomingMessage,res:ServerResponse,path:string){
  const size=statSync(path).size,range=req.headers.range;let start=0,end=size-1;
  res.setHeader('Content-Type','video/webm');res.setHeader('Accept-Ranges','bytes');
  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(match&&(match[1]||match[2])){
      if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      else start=Math.max(0,size-Number(match[2]));
    }else start=size;
    if(start>=size||end<start||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
    res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
  }
  res.setHeader('Content-Length',Math.max(0,end-start+1));
  if(req.method==='HEAD'||size===0){res.end();return;}
  createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
}
