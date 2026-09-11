import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
const root=resolve('.'),git=args=>execFileSync('git',['-c',`safe.directory=${root.replace(/\\/g,'/')}`,...args],{encoding:'utf8',maxBuffer:32*1024*1024});
const textExtensions=new Set(['.ts','.tsx','.js','.mjs','.json','.md','.txt','.html','.css','.py','.yml','.yaml','.toml','.example','.ps1','.cs','.mts']);
const textPath=p=>textExtensions.has(extname(p))||['LICENSE','.gitignore','.gitattributes'].includes(p);
const rules=[
 ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
 ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,})\b/g],
 ['openai-key',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}\b/g],
 ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ['credential-url',/https?:\/\/[^\s/:]+:[^\s/@]+@[^\s/]+/g],
];
const findings=[];
function scan(text,location){for(const [kind,rule] of rules){rule.lastIndex=0;for(const match of text.matchAll(rule))findings.push({kind,location,line:text.slice(0,match.index).split('\n').length,value:'[REDACTED]'});}}
const working=git(['ls-files','--cached','--others','--exclude-standard']).trim().split('\n').filter(Boolean);
let workingTextFiles=0;for(const path of new Set(working))if(textPath(path)&&existsSync(path)){scan(readFileSync(path,'utf8'),path);workingTextFiles++;}
const historical=git(['rev-list','--objects','--all']).trim().split('\n');let historicalTextBlobs=0;
for(const entry of historical){const split=entry.indexOf(' ');if(split<0)continue;const sha=entry.slice(0,split),path=entry.slice(split+1);if(!textPath(path))continue;scan(git(['cat-file','blob',sha]),`history:${sha}:${path}`);historicalTextBlobs++;}
const suspiciousTracked=git(['ls-files']).trim().split('\n').filter(p=>/(^|\/)(?:\.env(?!\.example)|id_rsa|id_ed25519|credentials|hosts\.yml)(?:$|\.)/.test(p));
const result={checkedAt:new Date().toISOString(),head:git(['rev-parse','HEAD']).trim(),workingTextFiles,historicalTextBlobs,findings,suspiciousTracked,
 scope:'Known credential formats and credential filenames across Git history and non-ignored working source. Binary media is not searched. This is a bounded scan, not proof of absence of every possible secret.',
 licences:{originalCode:'MIT',derivedConnectome:'CC BY 4.0 with source/transform attribution',referenceFrames:'eLife Creative Commons Attribution; extracted frame attribution in THIRD_PARTY_NOTICES.md',generatedAssets:'Synthetic, provenance recorded; CC BY 4.0 to extent rights held',fonts:'SIL OFL 1.1 notices vendored'}};
writeFileSync('docs/results/release-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
if(findings.length||suspiciousTracked.length)process.exitCode=1;
