import test from 'node:test';import assert from 'node:assert/strict';
import {observerOrigins} from '../server/observer-origins';
test('observer stream allows configured forward origins and rejects lookalike or arbitrary origins',()=>{
 const origins=observerOrigins(4317,'http://127.0.0.1:4319,https://example.test');
 assert(origins.has('http://127.0.0.1:4317'));assert(origins.has('http://127.0.0.1:4319'));assert(origins.has('https://example.test'));
 for(const value of ['http://127.0.0.1:4320','https://example.test.attacker.invalid','null','*'])assert(!origins.has(value));
 const withCredentials=new URL('https://example.test');withCredentials.username='synthetic-test-user';withCredentials.password='synthetic-test-password';
 for(const value of ['https://example.test/path',withCredentials.href,'file:///tmp','*'])assert.throws(()=>observerOrigins(4317,value));
});
