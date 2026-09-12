export interface ObservationPage {id:string;label:string;url:string}
export interface ObservationEvent {
  id:string;sessionId:string;runId:string;source:'neural'|'orchestration';kind:string;
  status:'queued'|'executing'|'completed'|'blocked'|'failed'|'cancelled';
  createdAt:string;startedAt?:string;completedAt?:string;page:string;summary:string;reason?:string;
  commandId?:string;decision?:number;modelStep?:number;inputFrame?:string;
  parameters?:{wheelY?:number;dx?:number;durationSeconds?:number;destination?:string};
  result?:{trustedInputs:number;scrollBefore?:number;scrollAfter?:number;changedPage?:boolean};
}
export interface ObservationState {
  profile:string;sessionStartedAt:string;activePage:ObservationPage;operation:string;
  sensory:'current'|'previous-decision'|'not-sampling';events:ObservationEvent[];queue:ObservationEvent[];
  metrics:{executedActions:number;attemptedActions:number;actionsPerMinute:number;captureFPS:number|null;decisionIntervalMs:number|null;captureToActionMs:number|null;modelWallRatio:number|null};
}
export const ACTIVE_UNIT_THRESHOLD=.1;
export function collapseWaits(events:ObservationEvent[]){
  const groups:{event:ObservationEvent;count:number;firstAt:string;lastAt:string}[]=[];
  for(const event of events){const previous=groups.at(-1);if(event.kind==='wait'&&previous?.event.kind==='wait'&&event.reason===previous.event.reason&&event.page===previous.event.page&&event.runId===previous.event.runId){previous.count++;previous.lastAt=event.completedAt??event.createdAt;previous.event=event;}else groups.push({event,count:1,firstAt:event.createdAt,lastAt:event.completedAt??event.createdAt});}
  return groups;
}
export function eventSentence(event:ObservationEvent){
  if(event.source==='orchestration')return event.summary;
  if(event.status==='failed'||event.status==='cancelled')return `${event.kind} ${event.status}: ${event.reason??event.summary}`;
  if(event.kind==='wait')return event.reason??'The recorded motor output did not open the action gate.';
  if(event.kind==='scroll'){const change=event.result?.scrollAfter!==undefined&&event.result.scrollBefore!==undefined?event.result.scrollAfter-event.result.scrollBefore:null;return change===null?event.summary:change===0?`The decoder sent a ${event.parameters?.wheelY} px wheel command; the page stayed at its scroll boundary.`:`The motor outputs requested ${event.parameters?.wheelY} px; ${event.page} moved ${Math.abs(change).toFixed(0)} px ${change>0?'down':'up'}.`;}
  return event.summary;
}
export function observationHealth(transport:string,frameAt:string|undefined,now:number,state:string|undefined){
  if(transport!=='live')return transport;
  if(state==='recovering')return 'error';
  if(state==='starting')return 'connecting';
  if(state==='idle'||state==='complete')return 'idle';
  if(!frameAt)return 'connecting';
  if(now-Date.parse(frameAt)>12000)return 'stale';
  return 'live';
}
