import type { Snapshot } from './types';
import type { RetinalInput } from '../server/browser/encoder';
import type { BrowserCommand, MotorReadout } from '../server/browser/decoder';
import type { BrowserIntervention } from '../server/browser/config';
export interface BrowserEvent {type:string;x:number;y:number;button?:number;trusted:boolean;pageTimeMs:number;timestamp:string}
export interface BrowserDecision {
  runId:string;decision:number;imageBefore:string;imageAfter:string;imageSha256:string;afterSha256:string;
  capturedAt:string;completedAt:string;modelStartStep:number;modelEndStep:number;input:RetinalInput;
  motor:MotorReadout;command:BrowserCommand;samples:Snapshot[];
  executed:{kind:BrowserCommand['kind'];from:{x:number;y:number};to:{x:number;y:number};startedAt:string;completedAt:string;events:BrowserEvent[]};
}
export interface BrowserLive {
  state:'starting'|'integrating'|'executed'|'completed'|'failed';runId:string;decision:number;
  intervention:BrowserIntervention;image:string;input:RetinalInput|null;snapshot:Snapshot|null;
  motor:MotorReadout|null;command:BrowserCommand|null;events:BrowserEvent[];error?:string;
  history?:{decision:number;modelStep:number;command:BrowserCommand;events:BrowserEvent[]}[];
}
