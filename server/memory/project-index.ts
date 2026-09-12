import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {KnowledgeNote} from '../../shared/memory';
// Fixed public source allowlist; never read environment files or credentials.
export function projectNotes(revision:string):KnowledgeNote[]{
 const files=[
  ['server/model/config.ts','Implemented dynamics','Actual model configuration; rate dynamics and gains are engineering assumptions.'],
  ['server/exhibit/external-policy.ts','Permitted exploration','The supervisor selects approved public pages. Neural outputs determine wheel proposals.'],
  ['docs/MEMORY_EXPERIMENT.md','Memory and adaptation protocol','Persistent experience and a bounded retry-budget adapter are separate from the larval circuit.']
 ];
 return files.flatMap(([file,title,note])=>{try{const text=readFileSync(file,'utf8'),sha256=createHash('sha256').update(text).digest('hex');return [{id:'project-'+sha256.slice(0,16),title,terms:['specimen','configuration'],source:`https://github.com/SpecimenArchive/Specimen-Archive/blob/${revision}/${file}`,retrievedAt:new Date().toISOString(),support:text.replace(/\s+/g,' ').slice(0,180),note:`${note} Source SHA-256: ${sha256}`,creator:'configuration-index' as const,revision}];}catch{return [];}});
}
