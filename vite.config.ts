import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';

export default defineConfig({ plugins: [react(),{
  name:'inline-observer-start',
  transformIndexHtml:{order:'pre',handler(html){
    // Keep the early loader in the same HTML response as the application entry.
    // A separately cached public script must not outlive its state-cache schema.
    const script=readFileSync(new URL('./public/observer-start.js',import.meta.url),'utf8').replace(/\r\n/g,'\n').replace(/<\/script/gi,'<\\/script');
    return html.replace('<script src="/observer-start.js"></script>',()=>'<script>'+script+'</script>');
  }},
}], optimizeDeps: { entries: ['index.html'] }, build: { target: 'es2022' } });
