import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';import {join,resolve} from 'node:path';
import type {Circuit} from '../../shared/types';import type {ExhibitRecord} from '../../shared/exhibit';
import {artifactManifest} from '../browser/evidence';import {encodeDesktop} from './desktop-video';import {replayEpisode} from './replay';import {ExperimentStore} from '../experiment-store';
import {gzipSync} from 'node:zlib';
const directory=resolve(process.argv[2]),storeRoot=resolve(process.argv[3]);
if(!/^exhibit_[A-Za-z0-9_-]+$/.test(directory.split(/[\\/]/).at(-1)!))throw new Error('Invalid finalization directory');
const record=JSON.parse(readFileSync(join(directory,'pending-record.json'),'utf8')) as ExhibitRecord;
try{await encodeDesktop(directory,record.displayFrames??[]);record.stages!.recording='saved';}catch(e){record.stages!.recording='failed';record.stages!.recordingError=(e as Error).message;}
writeFileSync(join(directory,'display-timing.json.gz'),gzipSync(JSON.stringify(record.displayFrames??[])));delete record.displayFrames;
// Exact PNGs and trace are causal evidence; JPEG display frames are recorded in
// their timestamp/hash manifest, while the bounded video is a presentation.
record.artifacts=artifactManifest(directory);writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2));
try{record.replay=await replayEpisode(directory,JSON.parse(readFileSync('data/processed/circuit.json','utf8')) as Circuit);}catch(e){record.error=[record.error,`Replay verification: ${(e as Error).message}`].filter(Boolean).join('; ');record.outcome='error';}
writeFileSync(join(directory,'record.json'),JSON.stringify(record,null,2)+'\n');new ExperimentStore<ExhibitRecord>(storeRoot).save(record);unlinkSync(join(directory,'pending-record.json'));process.send?.({id:record.id,outcome:record.outcome,recording:record.stages?.recording,replay:record.replay,error:record.error});
