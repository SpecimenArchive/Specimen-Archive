import type { Snapshot } from './types';
import type { ExhibitInput,ExhibitCommand } from '../server/exhibit/controller';
import type { MotorReadout } from '../server/browser/decoder';
import type { BrowserIntervention } from '../server/browser/config';
import type { PublishableRecord } from '../server/experiment-store';
import type { EXHIBIT_CONFIG,TaskLayout } from '../server/exhibit/config';
import type { MODEL_CONFIG } from '../server/model/config';
export interface ExecutedEvent {type:string;timestamp:string;pageTimeMs:number;url:string;x?:number;y?:number;deltaY?:number;trusted?:boolean;commandId:string|null}
export interface ExhibitDecision {
  context:Pick<ExhibitLive,'sourceRevision'|'sourceDirty'|'configSha256'|'dataVersion'|'intervention'|'episode'|'seed'|'layout'>;
  sessionId:string;runId:string;commandId:string;decision:number;modelStartStep:number;modelEndStep:number;
  imageBefore:string;imageAfter:string;imageSha256:string;afterSha256:string;capturedAt:string;completedAt:string;
  input:ExhibitInput;motor:MotorReadout;command:ExhibitCommand;samples:Snapshot[];
  executed:{startedAt:string;completedAt:string;from:{x:number;y:number};to:{x:number;y:number};events:ExecutedEvent[]};
}
export interface ExhibitRecord extends PublishableRecord {
  schemaVersion:1;kind:'continuous-browser-episode';recorder:'Specimen Recorder';sessionId:string;startedAt:string;
  config:typeof EXHIBIT_CONFIG;model:typeof MODEL_CONFIG;seed:number;layout:TaskLayout;intervention:BrowserIntervention;
  execution?:{paced:boolean;minimumWindowWallMs:number;nodeVersion:string;faultAfterWindow?:number};
  coverage:{neuronIds:string[];edges:number;synapses:number};setup:{note:string;events:ExecutedEvent[]};browserVersion:string;
  decisions:Omit<ExhibitDecision,'samples'>[];evaluator:{navigated:boolean;activated:boolean;activationCount:number};
  artifacts:{path:string;bytes:number;sha256:string}[];error?:string;replay?:{exact:boolean;samples:number;decisions:number};
}
export interface ExhibitLive {
  sessionId:string;runId:string;packetSeq:number;timestamp:string;state:'starting'|'integrating'|'executed'|'complete'|'recovering'|'idle';
  episode:number;decision:number;intervention:BrowserIntervention;layout:TaskLayout;seed:number;
  sourceRevision:string;sourceDirty:boolean;configSha256:string;dataVersion:string;
  inputFrame:string|null;browserFrame:string|null;capturedAt:string|null;snapshot:Snapshot|null;
  input:ExhibitInput|null;motor:MotorReadout|null;command:ExhibitCommand|null;commandId:string|null;
  history:{commandId:string;runId:string;decision:number;modelStep:number;kind:string;detail:string;timestamp:string}[];
  notice:string;outcome?:string;metrics:{episodes:number;failures:number;rssMB:number;windowWallMs:number;modelSecondsPerWindow:number};
}
