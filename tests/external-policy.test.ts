import {test} from 'node:test';import assert from 'node:assert/strict';
import {EncounterPlanner,EXTERNAL_POLICY as P,approvedPage,restrictionReason,RESEARCH_PAGES} from '../server/exhibit/external-policy';
test('External routes exclude self observation, wallets, writes, redirects and other sites',()=>{
 for(const url of [P.initial,P.initial+'/0x'+'a'.repeat(40),...RESEARCH_PAGES])assert(approvedPage(url),url);
 for(const url of ['http://127.0.0.1:4317','https://specimenarchive.com/','https://www.ponsfamily.com/launchpad/create','https://www.ponsfamily.com/launchpad?redirect=https://example.com','https://user:pass@www.ponsfamily.com/launchpad','https://www.ponsfamily.com/profile','https://www.ponsfamily.com/launchpad/0x123','javascript:alert(1)'])assert(!approvedPage(url),url);
 assert(restrictionReason(P.initial,'Verify you are human'));assert(restrictionReason(P.initial,'',429));assert(!restrictionReason(P.initial,'Explore tokens',200));
});
test('Coverage selection uses discovered pages and distinct visit history; research and restrictions are explicit orchestration',()=>{
 const planner=new EncounterPlanner();const a=P.initial+'/0x'+'a'.repeat(40),b=P.initial+'/0x'+'b'.repeat(40);
 planner.discover([{url:b,title:'B'},{url:a,title:'A'},{url:'https://specimenarchive.com',title:'unapproved'}]);assert.equal(planner.next(),P.initial);assert.equal(planner.next(P.initial),a);planner.entered(a);assert.equal(planner.next(a),P.initial);assert.equal(planner.next(P.initial),b);planner.entered(b);
 assert.equal(planner.coins.size,2);planner.entered(a);planner.entered(b);assert(RESEARCH_PAGES.includes(planner.next(b)));planner.ponsBlocked='Actual restriction';assert(RESEARCH_PAGES.includes(planner.next(P.initial)));
});
