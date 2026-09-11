import test from 'node:test';import assert from 'node:assert/strict';
import {ObservationJournal} from '../server/exhibit/journal';import {collapseWaits,eventSentence,observationHealth} from '../shared/observation';
test('accepted queue is consumed once, actual execution counts exclude blocked or waiting commands',()=>{
 const j=new ObservationJournal('session'),page={id:'dashboard',label:'Dashboard',url:'/'};
 const queued=j.event('run',{source:'neural',kind:'scroll',status:'queued',page:'Dashboard',summary:'accepted'});assert.equal(j.state(page,'integrating','current').queue.length,1);
 j.finish(queued,{status:'completed',result:{trustedInputs:1,scrollBefore:5,scrollAfter:53},parameters:{wheelY:48}});j.decision(200,250,100,6,true,true);j.decision(300,350,250,6,true,false);
 const state=j.state(page,'sensing','current');assert.equal(state.queue.length,0);assert.equal(state.events.length,1);assert.equal(state.metrics.executedActions,1);assert.equal(state.metrics.attemptedActions,2);assert.match(eventSentence(state.events[0]),/48 px down/);
 const interrupted=j.event('run',{source:'neural',kind:'scroll',status:'queued',page:'Dashboard',summary:'accepted'});j.finish(interrupted,{status:'executing'});j.cancelRun('run','Capture interrupted');assert.equal(j.runEvents('run').at(-1)?.status,'failed');
});
test('repetitive waits collapse without losing the latest inspectable decision; missing frames are never live',()=>{
 const j=new ObservationJournal('session');for(let i=0;i<3;i++)j.event('run',{source:'neural',kind:'wait',status:'completed',page:'Dashboard',summary:'wait',reason:'motor gate closed',decision:i});
 const rows=collapseWaits(j.runEvents('run'));assert.equal(rows.length,1);assert.equal(rows[0].count,3);assert.equal(rows[0].event.decision,2);
 assert.equal(observationHealth('live',undefined,20000,'integrating'),'connecting');assert.equal(observationHealth('live',new Date(0).toISOString(),20000,'integrating'),'stale');assert.equal(observationHealth('disconnected',new Date(20000).toISOString(),20001,'integrating'),'disconnected');
});
