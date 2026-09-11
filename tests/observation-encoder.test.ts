import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {PNG} from 'pngjs';
import {encodeObservation} from '../server/exhibit/observation-encoder';import {ExhibitController} from '../server/exhibit/controller';import type {Circuit} from '../shared/types';
const circuit=JSON.parse(readFileSync('data/processed/circuit.json','utf8')) as Circuit;
function fixture(lower:boolean){const p=new PNG({width:640,height:360});for(let y=0;y<360;y++)for(let x=0;x<640;x++){const value=(lower?y>194:y<166)&&((x+y)%12<6)?220:25,i=(y*640+x)*4;p.data[i]=p.data[i+1]=p.data[i+2]=value;p.data[i+3]=255;}return PNG.sync.write(p);}
test('visible upper/lower contrast passes through the same circuit to opposite scroll commands',async()=>{
 const up=fixture(false),down=fixture(true);assert(encodeObservation(up).left>encodeObservation(up).right);assert(encodeObservation(down).right>encodeObservation(down).left);
 const commands=[];for(const png of [up,down]){const controller=new ExhibitController(circuit,'contrast','2026-01-01T00:00:00Z');const result=await controller.observe(png,0,undefined,'observation-contrast-v1');assert.equal(result.command.kind,'scroll');commands.push(result.command.wheelY);}
 assert.deepEqual(commands,[-48,48]);
 for(const intervention of ['clamp-all-motors','disconnect-photoreceptors'] as const){const controller=new ExhibitController(circuit,'control','2026-01-01T00:00:00Z',intervention);const result=await controller.observe(down,0,undefined,'observation-contrast-v1');assert.equal(result.command.kind,'wait');}
});
test('uniform image supplies no fabricated sensory drive',()=>{const p=new PNG({width:640,height:360});p.data.fill(255);const result=encodeObservation(PNG.sync.write(p));assert.equal(result.encoding,'low-contrast');assert.equal(result.left,0);assert.equal(result.right,0);});
