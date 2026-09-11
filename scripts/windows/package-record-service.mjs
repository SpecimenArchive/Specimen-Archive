import {build} from 'esbuild';
await build({entryPoints:['scripts/windows/record-service.ts'],bundle:true,platform:'node',format:'esm',target:'node22',outfile:'runtime/upgrade/record-service.mjs'});
console.log('Packaged the isolated record service; no project modules will be loaded at runtime.');
