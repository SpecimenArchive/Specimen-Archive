import type { Snapshot } from './types';
import type { ExhibitInput,ExhibitCommand } from '../server/exhibit/controller';
import type { MotorReadout } from '../server/browser/decoder';
import type { BrowserIntervention } from '../server/browser/config';
import type { PublishableRecord } from '../server/experiment-store';
import type { EXHIBIT_CONFIG,TaskLayout } from '../server/exhibit/config';
import type { MODEL_CONFIG } from '../server/model/config';
import type { ObservationState,ObservationEvent } from './observation';
export interface ExecutedEvent {type:string;timestamp:string;pageTimeMs:number;url:string;x?:number;y?:number;deltaY?:number;trusted?:boolean;commandId:string|null}
export interface DesktopCapture {
  path:string;pageFrame:string;pageCapturedAt:string;capturedAt:string;completedAt:string;
  width:number;height:number;sha256:string;cursor:{x:number;y:number};captureMs:number;roundTripMs:number;pageLagMs:number;
  source:'x11-root'|'windows-gdi';cursorSource:'recorded-page-pointer'|'not-present';
  sourceCapturedAt?:string;timestampBasis?:'backend-midpoint-estimate'|'native-clock';clockUncertaintyMs?:number;
  station?:{os:'Windows 11';osBuild:string;isolation:'windows-sandbox'|'remote-vm';id:string;bootId?:string;timeZone:string;dpi:number;viewport:{x:number;y:number;scale:number};window:unknown;taskbar:unknown};
}
export interface ExhibitDecision {
  memory?:{storedId:string;recallId?:string;retrievedIds:string[];usedIds:string[];retryBudget:number;adapterCheckpoint:string;mode:string};
  receipt?:import('./observation').ActionReceipt;
  sensoryProfile?:import('../server/exhibit/observation-encoder').ObservationProfile;page?:{id:string;label:string;url:string};
  context:Pick<ExhibitLive,'sourceRevision'|'sourceDirty'|'configSha256'|'dataVersion'|'intervention'|'episode'|'seed'|'layout'>;
  sessionId:string;runId:string;commandId:string;decision:number;modelStartStep:number;modelEndStep:number;
  imageBefore:string;imageAfter:string;imageSha256:string;afterSha256:string;capturedAt:string;completedAt:string;
  input:ExhibitInput;motor:MotorReadout;command:ExhibitCommand;samples:Snapshot[];
  desktopBefore?:DesktopCapture;desktopAfter?:DesktopCapture;
  executed:{startedAt:string;completedAt:string;from:{x:number;y:number};to:{x:number;y:number};events:ExecutedEvent[];nativeInput?:{version:'windows-view-v2';coordinateScale:number;wheelScale:1;wheelEventScale:number;scrollBefore?:number;scrollAfter?:number}};
}
export interface ExhibitRecord extends PublishableRecord {
  externalConfig?:typeof import('../server/exhibit/external-policy').EXTERNAL_POLICY;
  initialCheckpoint?:ReturnType<import('../server/model/engine').Engine['checkpoint']>;
  displayFrames?:import('./observation').DisplayFrame[];
  incompleteAction?:{commandId:string;receipt:import('./observation').ActionReceipt;events:ExecutedEvent[]};
  memoryConfig?:{version:string;mode:string;initialAdapter:string};
  observationConfig?:{retina:typeof import('../server/exhibit/observation-encoder').OBSERVATION_RETINA|typeof import('../server/exhibit/observation-encoder').OBSERVATION_RETINA_V1;schedule:typeof import('../server/exhibit/observation-runner').OBSERVATION_SCHEDULE};
  observationEvents?:ObservationEvent[];stages?:{execution:'completed'|'failed';recording:'saved'|'failed'|'unavailable';recordingError?:string};
  schemaVersion:1;kind:'continuous-browser-episode';recorder:'Specimen Recorder';sessionId:string;startedAt:string;
  config:typeof EXHIBIT_CONFIG;model:typeof MODEL_CONFIG;seed:number;layout:TaskLayout;intervention:BrowserIntervention;
  execution?:{paced:boolean;minimumWindowWallMs:number;nodeVersion:string;faultAfterWindow?:number};
  coverage:{neuronIds:string[];edges:number;synapses:number};setup:{note:string;events:ExecutedEvent[]};browserVersion:string;
  decisions:Omit<ExhibitDecision,'samples'>[];evaluator:{navigated:boolean;activated:boolean;activationCount:number};
  artifacts:{path:string;bytes:number;sha256:string}[];error?:string;replay?:{exact:boolean;samples:number;decisions:number};
  orchestration?:{actor:'supervisor';action:string;tab:string;timestamp:string;detail:string}[];
  stationSchedule?:{version:string;dashboardUrl:string;dashboardSeconds:number;readingUrl:string};
}
export interface ExhibitLive {
  display?:import('./observation').DisplayFrame|null;receipt?:import('./observation').ActionReceipt;
  lastAction?:{runId:string;decision:number;commandId:string;input:ExhibitInput;motor:MotorReadout;command:ExhibitCommand;receipt:import('./observation').ActionReceipt};
  observation?:ObservationState;
  sessionId:string;runId:string;packetSeq:number;timestamp:string;state:'starting'|'integrating'|'executed'|'complete'|'recovering'|'idle';
  episode:number;decision:number;intervention:BrowserIntervention;layout:TaskLayout;seed:number;
  sourceRevision:string;sourceDirty:boolean;configSha256:string;dataVersion:string;
  inputFrame:string|null;browserFrame:string|null;capturedAt:string|null;snapshot:Snapshot|null;
  desktop?:DesktopCapture|null;
  input:ExhibitInput|null;motor:MotorReadout|null;command:ExhibitCommand|null;commandId:string|null;
  history:{commandId:string;runId:string;decision:number;modelStep:number;kind:string;detail:string;timestamp:string}[];
  notice:string;outcome?:string;metrics:{episodes:number;failures:number;rssMB:number;windowWallMs:number;modelSecondsPerWindow:number};
}
