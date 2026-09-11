import {EventEmitter} from 'node:events';
import {mkdirSync,readdirSync,readFileSync,writeFileSync,renameSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
/** Ordered, bounded messages over the Sandbox's project-only mapped folder. */
export class FileTransport extends EventEmitter {
  constructor(root,role){
    super();this.closed=false;this.sequence=0;this.expected=1;
    this.input=join(root,role==='host'?'to-host':'to-guest');this.output=join(root,role==='host'?'to-guest':'to-host');
    for(const dir of [this.input,this.output])mkdirSync(dir,{recursive:true});
    this.timer=setInterval(()=>this.poll(),10);
  }
  send(message){
    if(this.closed)throw new Error('Windows station transport is closed');
    const bytes=JSON.stringify(message);if(bytes.length>24*1024*1024)throw new Error('Windows station message exceeds 24 MB');
    if(readdirSync(this.output).length>512)throw new Error('Windows station transport backpressure limit');
    const path=join(this.output,String(++this.sequence).padStart(12,'0')+'.json');
    writeFileSync(path+'.tmp',bytes);renameSync(path+'.tmp',path);
  }
  poll(){
    if(this.closed)return;
    try{for(const name of readdirSync(this.input).filter(n=>/^\d{12}\.json$/.test(n)).sort()){
      if(Number(name.slice(0,12))!==this.expected)break;
      const path=join(this.input,name),message=JSON.parse(readFileSync(path,'utf8'));unlinkSync(path);this.expected++;this.emit('message',message);
    }}catch(error){this.close();this.emit('error',error);}
  }
  close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);}
}
