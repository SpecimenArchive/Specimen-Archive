import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const bootstrap=()=>{const code=readFileSync(new URL('./public/observer-start.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');return {code,name:'observer-start-'+createHash('sha256').update(code).digest('hex').slice(0,12)+'.js'};};
export default defineConfig({ plugins: [react(),{
  name:'versioned-observer-start',
  transformIndexHtml:{order:'pre',handler(html){
    // Content-address the early loader so CDN caches cannot outlive its schema.
    // Keep it external to respect the deployed self-only script CSP.
    return html.replace('<script src="/observer-start.js"></script>','<script src="/'+bootstrap().name+'"></script>');
  }},
  generateBundle(){const {code,name}=bootstrap();this.emitFile({type:'asset',fileName:name,source:code});},
  configureServer(server){server.middlewares.use((req,res,next)=>{const {code,name}=bootstrap();if(req.url?.split('?')[0]!=='/'+name)return next();res.setHeader('Content-Type','text/javascript');res.end(code);});},
}], optimizeDeps: { entries: ['index.html'] }, build: { target: 'es2022' } });
