import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { circuit } from './science';
import { Engine } from '../server/model/engine';
import { MODEL_CONFIG, type Intervention } from '../server/model/config';
import { Experiment, restoreInitial, type ExperimentOrigin, type ExperimentRecord } from '../server/experiment';
import { executionOrigin } from '../server/provenance';

const origin:ExperimentOrigin=executionOrigin('controlled-feedback-validation');
export function runFeedback(intervention:Intervention='intact',initial?:ExperimentRecord['initial']){
  const engine=new Engine(circuit,intervention);if(initial)restoreInitial(engine,initial);
  const trial=new Experiment(engine,origin);
  while(!trial.state.completed)trial.step();
  return trial.state.completed;
}
const intact=runFeedback(),rightClamp=runFeedback('clamp-right-motors',intact.initial),allClamp=runFeedback('clamp-all-motors',intact.initial),replay=runFeedback('intact',intact.initial);
assert.deepEqual(replay.integration,intact.integration);assert.deepEqual(replay.selection,intact.selection);assert.deepEqual(replay.response,intact.response);
assert.equal(intact.selection.condition.key,'right');assert.equal(rightClamp.selection.condition.key,'left');assert.equal(allClamp.selection.condition.key,'dark');
assert.equal(allClamp.integration.leftIntegral+allClamp.integration.rightIntegral,0);
const results={measuredAt:new Date().toISOString(),protocol:'Same initial 47-neuron state and probe environment. Clamp listed motor neurons to zero after every synchronous update; all other rules unchanged. Pose-dependent sensory feedback remains active.',model:MODEL_CONFIG.version,
  replay:{exactIntegration:true,exactSelection:true,exactResponse:true},
  trials:[{intervention:'intact',record:intact},{intervention:'clamp-right-motors',record:rightClamp},{intervention:'clamp-all-motors',record:allClamp}]};
writeFileSync('docs/results/feedback-validation.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({replay:results.replay,trials:results.trials.map(t=>({intervention:t.intervention,integral:t.record.selection.difference,condition:t.record.selection.condition.key,threshold:t.record.selection.thresholdReached,neurons:t.record.motorCells,samples:t.record.integration.sampleCount,response:t.record.response.leftMean+t.record.response.rightMean}))},null,2));
