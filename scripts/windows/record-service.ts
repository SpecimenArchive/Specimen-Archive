import {existsSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';import {join,dirname} from 'node:path';
import {ExperimentStore} from '../../server/experiment-store';import {SpecimenRecorder} from '../../server/recorder';import {GitRecordPublisher} from '../../server/git-record-publisher';
if(process.platform!=='win32'||!process.env.SPECIMEN_RECORD_SERVICE_CONFIG)throw new Error('Dedicated Windows record service configuration required');
const c=JSON.parse(readFileSync(process.env.SPECIMEN_RECORD_SERVICE_CONFIG,'utf8').replace(/^\uFEFF/,''));
if(c.repository!=='SpecimenArchive/Specimen-Archive'||c.isolation!=='remote-vm'||c.enabled!==true||c.branch!=='specimen-records')throw new Error('Record service destination or approval missing');
const store=new ExperimentStore(c.recordsRoot),publisher=new GitRecordPublisher(c.objectDirectory,{sshCommand:c.sshCommand});
const recorder=new SpecimenRecorder(store,{call:async()=>{throw new Error('API publication is disabled in the isolated recorder');}},c.repository,true,publisher);
let current:Promise<void>|undefined,closing=false;
function tick(){if(closing||current)return;current=(async()=>{await recorder.tick();writeFileSync(join(c.statusDirectory,'publisher-service-status.json'),JSON.stringify({at:new Date().toISOString(),repository:c.repository,branch:recorder.branch,credentialIsolation:'SYSTEM-only ACL; controller has no key access',error:recorder.lastError,published:store.publications().filter(p=>p.state==='published').length})+'\n');})().finally(()=>{current=undefined;});}
const stopFile=join(dirname(process.env.SPECIMEN_RECORD_SERVICE_CONFIG),'stop-publisher'),timer=setInterval(tick,30000);
const stopTimer=setInterval(()=>{if(closing||!existsSync(stopFile))return;closing=true;clearInterval(timer);clearInterval(stopTimer);void (async()=>{await current;unlinkSync(stopFile);process.exit(0);})();},1000);
tick();
