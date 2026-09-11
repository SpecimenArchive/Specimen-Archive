import { replayBrowser } from '../server/browser/evidence';
import { loadCircuit } from '../server/browser/runner';
import { readdirSync,existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
const root=resolve(process.argv[2]||'docs/evidence/browser');
const directories=existsSync(join(root,'record.json'))?[root]:readdirSync(root).filter(n=>n.startsWith('browser_')).map(n=>join(root,n));
if(!directories.length)throw new Error('No recorded trials found');
for(const directory of directories)console.log(JSON.stringify({directory,...await replayBrowser(directory,loadCircuit())}));
