import type {ObservationEvent,ObservationPage,ObservationState} from '../../shared/observation';
/** Operational telemetry only. This journal cannot provide a neural input. */
export class ObservationJournal {
  private serial=0;private entries:ObservationEvent[]=[];private pending=new Map<string,ObservationEvent>();
  private actionTimes:number[]=[];private captureTimes:number[]=[];private decisionTimes:number[]=[];
  private executed=0;private attempted=0;private latency:number|null=null;private ratio:number|null=null;
  readonly startedAt=new Date().toISOString();
  constructor(readonly sessionId:string){}
  event(runId:string,event:Omit<ObservationEvent,'id'|'sessionId'|'runId'|'createdAt'>&{id?:string;createdAt?:string}){
    const entry={...event,id:event.id??`${runId}:e${++this.serial}`,createdAt:event.createdAt??new Date().toISOString(),sessionId:this.sessionId,runId};
    if(entry.status==='queued')this.pending.set(entry.id,entry);
    else {this.pending.delete(entry.id);const at=this.entries.findIndex(e=>e.id===entry.id);if(at>=0)this.entries[at]=entry;else this.entries.push(entry);this.entries=this.entries.slice(-100);}
    return entry;
  }
  finish(entry:ObservationEvent,patch:Partial<ObservationEvent>){return this.event(entry.runId,{...entry,...patch});}
  capture(at=Date.now()){this.captureTimes.push(at);this.captureTimes=this.captureTimes.filter(t=>at-t<=10000);}
  decision(start:number,end:number,captureAt:number,modelSeconds:number,attempted:boolean,executed:boolean){
    this.decisionTimes.push(end);this.decisionTimes=this.decisionTimes.slice(-20);this.latency=start-captureAt;this.ratio=modelSeconds/((end-captureAt)/1000);
    if(attempted)this.attempted++;if(executed){this.executed++;this.actionTimes.push(end);}this.actionTimes=this.actionTimes.filter(t=>end-t<=60000);
  }
  cancelRun(runId:string,reason:string){for(const e of [...this.pending.values(),...this.entries.filter(e=>e.status==='executing')])if(e.runId===runId)this.finish(e,{status:e.status==='executing'?'failed':'cancelled',completedAt:new Date().toISOString(),reason});}
  runEvents(runId:string){return [...this.entries,...this.pending.values()].filter(e=>e.runId===runId);}
  state(page:ObservationPage,operation:string,sensory:ObservationState['sensory']):ObservationState{
    const rate=(times:number[])=>times.length>1?(times.length-1)*1000/(times.at(-1)!-times[0]):null;
    return {profile:'observation-contrast-v2',sessionStartedAt:this.startedAt,activePage:page,operation,sensory,events:[...this.entries],queue:[...this.pending.values()],metrics:{executedActions:this.executed,attemptedActions:this.attempted,actionsPerMinute:this.actionTimes.filter(t=>Date.now()-t<=60000).length,captureFPS:rate(this.captureTimes),decisionIntervalMs:this.decisionTimes.length>1?(this.decisionTimes.at(-1)!-this.decisionTimes[0])/(this.decisionTimes.length-1):null,captureToActionMs:this.latency,modelWallRatio:this.ratio}};
  }
}
