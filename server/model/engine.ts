import type { Circuit, ModelEvent, Pose, Snapshot } from '../../shared/types';
import { RateNetwork } from './network';
import { environmentAt } from './environment';
import { advancePose, decodeMotor } from './motor';
import { MODEL_CONFIG as C, type Intervention } from './config';

export class Engine {
  readonly network: RateNetwork;
  ticks=0; eventCounter=0;
  pose: Pose={x:0,y:0,heading:-.18,roll:.23,bend:0,ciliaPhase:0,distance:0};
  events: ModelEvent[]=[];
  private epoch=-1; private responded=false; private moving=false;
  constructor(readonly circuit: Circuit, intervention: Intervention='intact') {this.network=new RateNetwork(circuit,intervention);}
  get time(){return this.ticks*C.dt;}
  event(kind:ModelEvent['kind'],message:string){this.events.push({id:`e${++this.eventCounter}`,t:this.time,kind,message});if(this.events.length>80)this.events.shift();}
  step(override?:{left:number;right:number}){
    const env=environmentAt(this.time,this.pose);
    if(env.epoch!==this.epoch){this.epoch=env.epoch;this.responded=false;this.event('environment',env.label);}
    this.network.step(override?.left??env.lightLeft,override?.right??env.lightRight);
    const motor=decodeMotor(this.circuit,this.network.activity);
    if(!this.responded&&env.intensity>0&&(motor.left+motor.right)/2>.08){this.responded=true;this.event('response',`Motor activity crossed 0.08 · L ${motor.left.toFixed(3)} / R ${motor.right.toFixed(3)}`);}
    const moving=Math.abs(motor.turn)>.035;
    if(moving&&!this.moving)this.event('movement',`Bending response · ${motor.turn.toFixed(3)} rad/s`);
    this.moving=moving;advancePose(this.pose,motor);this.ticks++;
  }
  snapshot(runId:string,seq:number,startedAt:string,wallElapsed:number): Snapshot {
    const environment=environmentAt(this.time,this.pose);
    return {version:1,runId,seq,timestamp:new Date().toISOString(),startedAt,modelTime:this.time,wallElapsed,
      pose:{...this.pose},environment,activity:Array.from(this.network.activity),motor:decodeMotor(this.circuit,this.network.activity),
      sensory:{left:environment.lightLeft,right:environment.lightRight},events:this.events.slice(-16)};
  }
  checkpoint(){return {ticks:this.ticks,pose:this.pose,activity:Array.from(this.network.activity),events:this.events,eventCounter:this.eventCounter,epoch:this.epoch,responded:this.responded,moving:this.moving};}
  restore(c:ReturnType<Engine['checkpoint']>){this.ticks=c.ticks;this.pose={...c.pose};this.network.activity.set(c.activity);this.events=c.events.slice(-80);this.eventCounter=c.eventCounter;this.epoch=c.epoch;this.responded=c.responded;this.moving=c.moving;}
}
