import type { Circuit, Snapshot } from '../shared/types';
import { Engine } from './model/engine';
import { MODEL_CONFIG } from './model/config';
import { Experiment, restoreInitial, CONFIG_HASH, type ExperimentRecord } from './experiment';
export function replayExperiment(record:ExperimentRecord,circuit:Circuit){
  if(record.origin.modelVersion!==MODEL_CONFIG.version||record.origin.dataVersion!==circuit.version||record.configSha256!==CONFIG_HASH)throw new Error('This record requires a different model, data or protocol version');
  const engine=new Engine(circuit);restoreInitial(engine,record.initial);
  const trial=new Experiment(engine,record.origin),frames:Snapshot[]=[];
  while(!trial.state.completed){
    trial.step();
    if((engine.ticks-record.initial.ticks)%10===0)frames.push(engine.snapshot(record.origin.runId,frames.length,record.startedAt,(engine.ticks-record.initial.ticks)*MODEL_CONFIG.dt/MODEL_CONFIG.timeScale));
  }
  const result=trial.state.completed;
  const exact=JSON.stringify(result.integration)===JSON.stringify(record.integration)&&JSON.stringify(result.selection)===JSON.stringify(record.selection)&&JSON.stringify(result.response)===JSON.stringify(record.response);
  return {record,frames,verification:{exact,sourceRevision:record.origin.sourceRevision,method:'Re-execute stored initial state with the current compatible model and protocol; compare integration, selection and response exactly. Playback timestamps are reconstruction metadata, not original wall-clock samples.'}};
}
