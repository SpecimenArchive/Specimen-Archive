import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
import {ExperimentStore} from '../../server/experiment-store';import {SpecimenRecorder} from '../../server/recorder';import {GitRecordPublisher} from '../../server/git-record-publisher';
if(process.platform!=='win32'||!process.env.SPECIMEN_RECORD_SERVICE_CONFIG)throw new Error('Dedicated Windows record service configuration required');
const c=JSON.parse(readFileSync(process.env.SPECIMEN_RECORD_SERVICE_CONFIG,'utf8').replace(/^\uFEFF/,''));
if(c.repository!=='SpecimenArchive/Specimen-Archive'||c.isolation!=='remote-vm'||c.enabled!==true||c.branch!=='specimen-records')throw new Error('Record service destination or approval missing');
const store=new ExperimentStore(c.recordsRoot),publisher=new GitRecordPublisher(c.objectDirectory,{sshCommand:c.sshCommand});
const recorder=new SpecimenRecorder(store,{call:async()=>{throw new Error('API publication is disabled in the isolated recorder');}},c.repository,true,publisher);
async function tick(){await recorder.tick();writeFileSync(join(c.statusDirectory,'publisher-service-status.json'),JSON.stringify({at:new Date().toISOString(),repository:c.repository,branch:recorder.branch,credentialIsolation:'SYSTEM-only ACL; controller has no key access',error:recorder.lastError,published:store.publications().filter(p=>p.state==='published').length})+'\n');}
await tick();setInterval(()=>void tick(),30000);
