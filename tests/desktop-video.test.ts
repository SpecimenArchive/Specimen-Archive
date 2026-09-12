import {test} from 'node:test';import assert from 'node:assert/strict';import {sizeVint,jpegCluster,videoHeader} from '../server/exhibit/desktop-video';
test('Timestamped desktop transport preserves observed irregular frame timing',()=>{
 assert.equal(sizeVint(0).toString('hex'),'80');assert.equal(sizeVint(126).toString('hex'),'fe');assert.equal(sizeVint(127).toString('hex'),'407f');assert.equal(sizeVint(16383).toString('hex'),'203fff');
 const jpg=Buffer.from('ffd8ffd9','hex');assert(videoHeader(1280,800).includes(Buffer.from('V_MJPEG')));
 for(const time of [0,249,773,12000]){const b=jpegCluster(jpg,time);assert(b.subarray(-4).equals(jpg));const bytes=time<256?Buffer.from([time]):Buffer.from([time>>8,time&255]);assert(b.includes(Buffer.concat([Buffer.from([0xe7,0x80|bytes.length]),bytes])));}
 assert.throws(()=>jpegCluster(jpg,-1));
});
