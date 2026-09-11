import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { ExhibitController,decodeExhibit } from '../server/exhibit/controller';
import { loadCircuit } from '../server/browser/runner';
const circuit=loadCircuit();
function viewport(target:{x:number;y:number}|null,guide=false){const p=new PNG({width:640,height:360});for(let i=0;i<p.data.length;i+=4){p.data.set([20,32,36,255],i);}function rect(x:number,y:number,w:number,h:number,c:number[]){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)p.data.set(c,(j*640+i)*4);}if(target)rect(target.x-40,target.y-20,80,40,[54,186,106,255]);rect(315,211,10,10,[0,255,255,255]);if(guide)rect(600,325,5,10,[237,181,71,255]);return PNG.sync.write(p);}
test('same computed motor readout decodes horizontal and scroll phases explicitly',async()=>{
  const e=new ExhibitController(circuit,'test','2026-09-11T00:00:00Z');const d=await e.observe(viewport({x:440,y:216}),0);
  assert.equal(d.command.kind,'move');assert.equal(d.command.dx,24);const scroll=decodeExhibit(d.motor,'scroll');assert.equal(scroll.kind,'scroll');assert.equal(scroll.wheelY,48);
});
test('visible scroll guide traverses published circuit; motor and PRC interventions abolish commands',async()=>{
  for(const intervention of ['intact','clamp-all-motors','disconnect-photoreceptors'] as const){const e=new ExhibitController(circuit,'test','2026-09-11T00:00:00Z',intervention);const d=await e.observe(viewport(null,true),1);assert.equal(d.input.encoding,'down-guide');assert.equal(d.command.kind,intervention==='intact'?'scroll':'wait');assert.equal(d.samples.length,60);assert.equal(d.samples[0].activity.length,47);}
});
test('pixels outside cursor lane cannot request point activation; a centred image can',async()=>{
  const e=new ExhibitController(circuit,'test','2026-09-11T00:00:00Z');const distant=await e.observe(viewport({x:320,y:300}),0);assert.equal(distant.command.kind,'wait');const aligned=await e.observe(viewport({x:320,y:216}),2);assert.equal(aligned.command.kind,'click');
});
test('controller and decoder have no harness, DOM, navigation or evaluator import',()=>{
  const code=readFileSync('server/exhibit/controller.ts','utf8');assert(!/from ['"].*(task|runner|playwright|executor)/.test(code));assert(!/page\.(evaluate|locator|mouse)|targetForSeed|placement\(/.test(code));
});
