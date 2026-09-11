import {EventEmitter} from 'node:events';
export class FileTransport extends EventEmitter {
  constructor(root:string,role:'host'|'guest');
  send(message:unknown):void;
  close():void;
}
