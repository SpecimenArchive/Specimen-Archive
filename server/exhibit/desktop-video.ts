import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import type {DisplayFrame} from '../../shared/observation';
import {sha256} from '../browser/evidence';

// Minimal Matroska MJPEG transport. Source timestamps are milliseconds; each
// independently decodable JPEG gets its own cluster. No synthetic frames.
// Element definitions: https://www.matroska.org/technical/elements.html
const uint=(n:number)=>{if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid unsigned integer');let hex=n.toString(16);if(hex.length%2)hex='0'+hex;return Buffer.from(hex,'hex');};
export function sizeVint(n:number){for(let bytes=1;bytes<=7;bytes++)if(n<2**(7*bytes)-1){const out=Buffer.alloc(bytes);let v=BigInt(n)|(1n<<BigInt(bytes*7));for(let i=bytes-1;i>=0;i--){out[i]=Number(v&255n);v>>=8n;}return out;}throw new Error('Element too large');}
const element=(id:number,data:Buffer)=>Buffer.concat([uint(id),sizeVint(data.length),data]);
const number=(id:number,n:number)=>element(id,uint(n));
const string=(id:number,s:string)=>element(id,Buffer.from(s));
const master=(id:number,...children:Buffer[])=>element(id,Buffer.concat(children));
export function videoHeader(width:number,height:number){return Buffer.concat([
 master(0x1A45DFA3,number(0x4286,1),number(0x42F7,1),number(0x42F2,4),number(0x42F3,8),string(0x4282,'matroska'),number(0x4287,4),number(0x4285,2)),
 uint(0x18538067),Buffer.from('01ffffffffffffff','hex'),
 master(0x1549A966,number(0x2AD7B1,1000000),string(0x4D80,'Specimen Archive'),string(0x5741,'Specimen Archive')),
 master(0x1654AE6B,master(0xAE,number(0xD7,1),number(0x73C5,1),number(0x83,1),number(0x9C,0),string(0x86,'V_MJPEG'),master(0xE0,number(0xB0,width),number(0xBA,height))))
]);}
export function jpegCluster(bytes:Buffer,timestampMs:number){return master(0x1F43B675,number(0xE7,timestampMs),element(0xA3,Buffer.concat([Buffer.from([0x81,0,0,0x80]),bytes])));}
export function ffmpegPath(){
 if(process.env.SPECIMEN_FFMPEG)return process.env.SPECIMEN_FFMPEG;
 const root=process.env.PLAYWRIGHT_BROWSERS_PATH||join(process.env.LOCALAPPDATA||'', 'ms-playwright');
 const dir=readdirSync(root).filter(n=>/^ffmpeg-\d+$/.test(n)).sort().at(-1);if(!dir)throw new Error('Install the project Playwright FFmpeg dependency');
 const file=join(root,dir,process.platform==='win32'?'ffmpeg-win64.exe':'ffmpeg-linux');if(!existsSync(file))throw new Error('FFmpeg binary missing');return file;
}
export async function encodeDesktop(directory:string,frames:DisplayFrame[]){
 if(frames.length<2)throw new Error('Fewer than two genuine desktop frames were captured');
 const first=frames[0],start=Date.parse(first.capturedAt);let previous=-1,error='';
 const child=spawn(ffmpegPath(),['-y','-hide_banner','-loglevel','warning','-f','matroska','-i','pipe:0','-an','-vsync','vfr','-c:v','libvpx','-deadline','realtime','-cpu-used','8','-b:v','1200k','-threads','1',join(directory,'browser.webm')],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 const completed=new Promise<void>((ok,fail)=>{child.once('error',fail);child.once('exit',code=>code===0?ok():fail(new Error(`Desktop video: ${code}: ${error.slice(-1200)}`)));});
 // Handle early FFmpeg exits while a write is pending, and bound finalization.
 child.stderr.on('data',b=>{error=(error+b.toString()).slice(-2000);});child.stdin.on('error',()=>{});
 const timer=setTimeout(()=>child.kill(),90000);const write=async(b:Buffer)=>{if(child.stdin.destroyed)throw new Error('Video encoder input closed');if(!child.stdin.write(b))await Promise.race([once(child.stdin,'drain'),completed.then(()=>{throw new Error('Video encoder exited early');})]);};
 try{await write(videoHeader(first.width,first.height));for(const frame of frames){const time=Date.parse(frame.capturedAt)-start;if(time<=previous||!/^view-\d+\.jpg$/.test(frame.path))throw new Error('Invalid desktop frame order/path');const bytes=readFileSync(join(directory,frame.path));if(sha256(bytes)!==frame.sha256)throw new Error('Desktop frame hash changed');previous=time;await write(jpegCluster(bytes,time));}child.stdin.end();await completed;}finally{clearTimeout(timer);if(child.exitCode===null)child.kill();}
}
