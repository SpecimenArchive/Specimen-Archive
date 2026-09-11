import { createHash } from 'node:crypto';
import type { LightCondition, Pose } from '../shared/types';
import { Engine } from './model/engine';
import { MODEL_CONFIG as M } from './model/config';
import { decodeMotor } from './model/motor';

export const CONDITIONS: Record<'left'|'right'|'dark',LightCondition> = {
  left:{key:'left',label:'Selected light · left',angle:-Math.PI/2,intensity:.85},
  right:{key:'right',label:'Selected light · right',angle:Math.PI/2,intensity:.85},
  dark:{key:'dark',label:'No threshold · dark',angle:0,intensity:0},
};
export const EXPERIMENT_CONFIG = Object.freeze({
  version:'motor-integral-v1', recoverySeconds:16, integrationSeconds:8, responseSeconds:8,
  cycleSeconds:120, threshold:.05, units:'dimensionless activity × simulated seconds',
  rule:'D = integral(R - L) dt. D >= 0.05 selects right; D <= -0.05 selects left; otherwise no threshold reached, execute dark.',
  integrationMethod:'right-rectangle sum of post-step motor outputs, fixed dt=0.01 s',
  probe:{key:'probe-left',label:'Selection probe · left',angle:-Math.PI/2,intensity:.85},
  conditions:CONDITIONS,
});
export const CONFIG_HASH=createHash('sha256').update(JSON.stringify(EXPERIMENT_CONFIG)).digest('hex');
export function selectCondition(leftIntegral:number,rightIntegral:number){
  const difference=rightIntegral-leftIntegral;
  const key=difference>=EXPERIMENT_CONFIG.threshold?'right':difference<=-EXPERIMENT_CONFIG.threshold?'left':'dark';
  return {difference,thresholdReached:key!=='dark',condition:CONDITIONS[key]};
}
export interface ExperimentOrigin {runId:string;sourceRevision:string;sourceDirty:boolean;dataVersion:string;dataSha256:string;modelVersion:string}
export interface ModelInitial {ticks:number;pose:Pose;activity:number[]}
interface Accumulator {samples:number;left:number;right:number;neurons:number[];forward:number;turn:number}
export interface ExperimentRecord {
  schemaVersion:1; id:string; recorder:'Specimen Recorder'; origin:ExperimentOrigin;
  config:typeof EXPERIMENT_CONFIG; configSha256:string; startedAt:string;completedAt:string;
  initial:ModelInitial; motorCells:{id:string;name:string;side:string}[];
  integration:{modelStart:number;modelEnd:number;sampleCount:number;leftIntegral:number;rightIntegral:number;neuronIntegrals:number[]};
  selection:ReturnType<typeof selectCondition>;
  response:{modelStart:number;modelEnd:number;sampleCount:number;leftMean:number;rightMean:number;neuronMeans:number[];forwardMean:number;turnMean:number;distance:number;finalActivity:number[];finalPose:Pose};
  outcome:'condition-executed'|'no-threshold-dark-executed';
}
export interface ExperimentState {
  version:string; origin:ExperimentOrigin; startTick:number; startedAt:string; initial:ModelInitial;
  integration:Accumulator;response:Accumulator;selection?:ReturnType<typeof selectCondition>;
  responseDistance?:number;completed?:ExperimentRecord;
}
function empty(n:number):Accumulator{return {samples:0,left:0,right:0,neurons:Array(n).fill(0),forward:0,turn:0};}
export function initialState(engine:Engine):ModelInitial{return {ticks:engine.ticks,pose:{...engine.pose},activity:Array.from(engine.network.activity)};}
export function restoreInitial(engine:Engine,initial:ModelInitial){
  engine.restore({...engine.checkpoint(),...structuredClone(initial),events:[],eventCounter:0,epoch:-1,responded:false,moving:false,condition:undefined});
}
export class Experiment {
  readonly motorIndices:number[];
  state:ExperimentState;
  constructor(readonly engine:Engine,origin:ExperimentOrigin,saved?:ExperimentState){
    this.motorIndices=engine.circuit.nodes.flatMap((n,i)=>n.category==='motor'?[i]:[]);
    this.state=saved??{version:EXPERIMENT_CONFIG.version,origin,startTick:engine.ticks,startedAt:new Date().toISOString(),initial:initialState(engine),integration:empty(this.motorIndices.length),response:empty(this.motorIndices.length)};
  }
  get elapsed(){return (this.engine.ticks-this.state.startTick)*M.dt;}
  get phase(){return this.state.completed?'complete':this.elapsed<EXPERIMENT_CONFIG.recoverySeconds?'recovery':this.elapsed<EXPERIMENT_CONFIG.recoverySeconds+EXPERIMENT_CONFIG.integrationSeconds?'integration':'response';}
  private accumulate(target:Accumulator){
    const motor=decodeMotor(this.engine.circuit,this.engine.network.activity);
    target.samples++;target.left+=motor.left*M.dt;target.right+=motor.right*M.dt;
    target.forward+=motor.forward*M.dt;target.turn+=motor.turn*M.dt;
    this.motorIndices.forEach((i,j)=>target.neurons[j]+=this.engine.network.activity[i]*M.dt);
  }
  step():ExperimentRecord|undefined {
    const {state,engine}=this;
    if(state.completed){engine.condition=undefined;engine.step();return;}
    // Integer step boundaries prevent round-off from losing integration samples.
    const tick=engine.ticks-state.startTick,recovery=Math.round(EXPERIMENT_CONFIG.recoverySeconds/M.dt),endIntegration=recovery+Math.round(EXPERIMENT_CONFIG.integrationSeconds/M.dt),endResponse=endIntegration+Math.round(EXPERIMENT_CONFIG.responseSeconds/M.dt);
    const stage=tick<recovery?'recovery':tick<endIntegration?'integration':'response';
    const condition=stage==='recovery'?{...CONDITIONS.dark,label:'Feedback trial · dark recovery'}:stage==='integration'?EXPERIMENT_CONFIG.probe:state.selection!.condition;
    engine.condition={...condition,epoch:100000+state.startTick*3+(stage==='recovery'?0:stage==='integration'?1:2)};
    engine.step();
    if(stage==='integration')this.accumulate(state.integration);
    if(stage==='response')this.accumulate(state.response);
    if(tick+1===endIntegration){
      state.selection=selectCondition(state.integration.left,state.integration.right);state.responseDistance=engine.pose.distance;
      engine.event('response',`Motor-integral selection: ${state.selection.condition.key}; D=${state.selection.difference.toFixed(5)}${state.selection.thresholdReached?'':' · threshold not reached'}`);
    }
    if(tick+1===endResponse){
      const r=state.response,seconds=r.samples*M.dt,start=state.startTick*M.dt;
      state.completed={schemaVersion:1,id:`${state.origin.runId}_t${state.startTick}`,recorder:'Specimen Recorder',origin:state.origin,
        config:EXPERIMENT_CONFIG,configSha256:CONFIG_HASH,startedAt:state.startedAt,completedAt:new Date().toISOString(),initial:state.initial,
        motorCells:this.motorIndices.map(i=>{const n=engine.circuit.nodes[i];return {id:n.id,name:n.name,side:n.side};}),
        integration:{modelStart:start+recovery*M.dt,modelEnd:start+endIntegration*M.dt,sampleCount:state.integration.samples,leftIntegral:state.integration.left,rightIntegral:state.integration.right,neuronIntegrals:state.integration.neurons},
        selection:state.selection!,response:{modelStart:start+endIntegration*M.dt,modelEnd:start+endResponse*M.dt,sampleCount:r.samples,leftMean:r.left/seconds,rightMean:r.right/seconds,neuronMeans:r.neurons.map(v=>v/seconds),forwardMean:r.forward/seconds,turnMean:r.turn/seconds,distance:engine.pose.distance-state.responseDistance!,finalActivity:Array.from(engine.network.activity),finalPose:{...engine.pose}},
        outcome:state.selection!.thresholdReached?'condition-executed':'no-threshold-dark-executed'};
      engine.event('response',`Feedback trial completed · ${state.completed.outcome}`);
      return state.completed;
    }
  }
  summary(){return {id:`${this.state.origin.runId}_t${this.state.startTick}`,phase:this.phase,elapsed:this.elapsed,rule:EXPERIMENT_CONFIG.rule,integral:this.state.integration.right-this.state.integration.left,selection:this.state.selection??null,completed:this.state.completed?.id??null};}
}
