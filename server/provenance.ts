import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { MODEL_CONFIG } from './model/config';
import type { ExperimentOrigin } from './experiment';
const root=fileURLToPath(new URL('../',import.meta.url));
export function executionOrigin(runId:string):ExperimentOrigin {
  const git=(args:string[])=>execFileSync('git',['-c',`safe.directory=${root.replace(/\\/g,'/').replace(/\/$/,'')}`,...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  let sourceRevision='unversioned',sourceDirty=true;
  try{sourceRevision=git(['rev-parse','HEAD']);sourceDirty=!!git(['status','--porcelain','--untracked-files=normal','--','server','shared','scripts','src','data/processed','package.json','package-lock.json']);}catch{/* Unversioned local runs work, but cannot publish. */}
  const bytes=readFileSync(resolve(root,'data/processed/circuit.json'));
  return {runId,sourceRevision,sourceDirty,dataVersion:JSON.parse(bytes.toString('utf8')).version,dataSha256:createHash('sha256').update(bytes).digest('hex'),modelVersion:MODEL_CONFIG.version};
}
