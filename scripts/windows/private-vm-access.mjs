// Operator-only SSH transport for explicit VM checks. Never imported by the
// backend or browser controller. Connection details and keys remain outside Git.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const file=process.env.SPECIMEN_VM_CONNECTION??path.join(process.env.LOCALAPPDATA??'','SpecimenArchive/connection.json');
const c=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
if(process.argv[2]!=='run'||!process.argv[3]||!['address','userName','identityFile','knownHostsFile'].every(k=>typeof c[k]==='string'&&c[k].length)||!Number.isInteger(c.sshPort))throw Error('Use run <operator-script.ps1> with a private, pinned SSH connection configuration.');
const code=fs.readFileSync(process.argv[3],'utf8'),args=['-i',c.identityFile,'-o',`UserKnownHostsFile=${c.knownHostsFile}`,'-o','StrictHostKeyChecking=yes','-o','BatchMode=yes','-o','IPQoS=none','-o','ConnectTimeout=12','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=3','-p',String(c.sshPort),'-l',c.userName,c.address,'powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand '+Buffer.from(code,'utf16le').toString('base64')];
const child=spawn('C:/Program Files/Git/usr/bin/ssh.exe',args,{windowsHide:true,stdio:['ignore','pipe','pipe']}),clean=s=>s.split(c.address).join('[VM]').split(c.userName).join('[VM user]');
child.stdout.on('data',x=>process.stdout.write(clean(x.toString())));child.stderr.on('data',x=>process.stderr.write(clean(x.toString())));child.on('error',()=>{console.error('Private VM transport could not launch.');process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
