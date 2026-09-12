import {createHash} from 'node:crypto';import type {AdapterCheckpoint,AdapterCell} from '../../shared/memory';
export const ADAPTER=Object.freeze({version:'boundary-budget-v1' as const,minimumExamples:5,maximumExamples:200,baseline:3,high:.75,medium:.55});
export const adapterContext=(kind:string,encoding:string,wheelY:number)=>`${kind}|${encoding}|${Math.sign(wheelY)}`;
export function checkpoint(cells:Record<string,AdapterCell>={},revision=0,trainingEvents=0):AdapterCheckpoint{const body={version:ADAPTER.version,revision,updatedAt:new Date().toISOString(),cells,trainingEvents};return {...body,sha256:createHash('sha256').update(JSON.stringify(body)).digest('hex')};}
export function retryBudget(state:AdapterCheckpoint,context:string){const c=state.cells[context];if(!c||c.boundary+c.moved<ADAPTER.minimumExamples)return ADAPTER.baseline;const probability=(1+c.boundary)/(2+c.boundary+c.moved);return probability>=ADAPTER.high?1:probability>=ADAPTER.medium?2:ADAPTER.baseline;}
export function learn(state:AdapterCheckpoint,context:string,outcome:string,memoryId:string){
 if(!['boundary','moved'].includes(outcome))return state;
 const cells=structuredClone(state.cells),cell=cells[context]??{boundary:0,moved:0,evidenceIds:[]};
 cell[outcome as 'boundary'|'moved']++;if(cell.boundary+cell.moved>ADAPTER.maximumExamples){const scale=ADAPTER.maximumExamples/(cell.boundary+cell.moved);cell.boundary*=scale;cell.moved*=scale;}
 cell.evidenceIds=[...new Set([...cell.evidenceIds,memoryId])].slice(-12);cells[context]=cell;
 return checkpoint(cells,state.revision+1,state.trainingEvents+1);
}
