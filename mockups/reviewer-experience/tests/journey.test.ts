import test from 'node:test';
import assert from 'node:assert/strict';
import {initialJourney,transition,codeAnchor,proseAnchor} from '../journey.ts';

test('reading preserves the first exact story frame and an independent held draft through evidence and Resume',()=>{
 let s=transition(initialJourney(),{type:'step',step:1});
 s=transition(s,{type:'inspect',source:'helper'});
 const anchor=codeAnchor('helper','after',0,20);
 s=transition(s,{type:'select',anchor});s=transition(s,{type:'comment'});
 s=transition(s,{type:'draft',text:'What prevents an invalid credential becoming owner?'});
 s=transition(s,{type:'inspect',source:'gateway'});s=transition(s,{type:'inspect',source:'test'});
 s=transition(s,{type:'back'});assert.equal(s.frame.focus,'gateway');
 s=transition(s,{type:'resume'});
 assert.deepEqual(s.frame,{step:1,focus:'request'});assert.equal(s.returnFrame,null);
 assert.equal(s.draft.text,'What prevents an invalid credential becoming owner?');assert.deepEqual(s.draft.anchor,anchor);assert.equal(s.playing,false);
});
test('code selection retains exact commit/hash/side/UTF16 quote and refuses out of range',()=>{
 const a=codeAnchor('helper','after',0,6);assert.equal(a.quote,'// Non');assert.equal(a.kind,'code');
 if(a.kind==='code'){assert.equal(a.startLine,1);assert.equal(a.startOffset,0);assert.equal(a.endOffset,6);assert.equal(a.commit.length,40);assert.equal(a.contentHash.length,64);}
 assert.throws(()=>codeAnchor('helper','after',-1,5));assert.throws(()=>codeAnchor('helper','before',0,1));
});
test('a new selected quote cannot silently replace a dirty anchored draft',()=>{
 let s=transition(initialJourney(),{type:'select',anchor:codeAnchor('helper','after',0,6)});s=transition(s,{type:'comment'});s=transition(s,{type:'draft',text:'Held'});
 const original=s.draft.anchor;s=transition(s,{type:'select',anchor:proseAnchor(0,10)});s=transition(s,{type:'comment'});
 assert.equal(s.conflict,true);assert.deepEqual(s.draft.anchor,original);s=transition(s,{type:'keepDraft'});assert.equal(s.draft.text,'Held');
 s=transition(s,{type:'closeThread'});assert.equal(s.threadOpen,false);assert.equal(s.draft.text,'Held');
});
test('prose identity contains immutable local content/version/hash and exact range',()=>{
 const a=proseAnchor(0,10);assert.equal(a.kind,'prose');if(a.kind==='prose'){assert.equal(a.contentId,'pr25-local-review-account');assert.equal(a.version,1);assert.equal(a.contentHash.length,64);assert.equal(a.endOffset,10);}
});
test('missing source never changes the valid frame or makes a fabricated selection',()=>{
 let s=transition(initialJourney(),{type:'step',step:1});const old=s.frame;s=transition(s,{type:'missing'});assert.deepEqual(s.frame,old);assert.equal(s.unavailable,true);assert.equal(s.selection,null);
});
test('source-only mode has no fabricated story, Resume, playing or implicit delivery',()=>{
 let s=transition(initialJourney(),{type:'sourceOnly'});assert.equal(s.story,false);assert.equal(s.playing,false);assert.equal(s.returnFrame,null);
 s=transition(s,{type:'inspect',source:'request'});assert.equal(s.returnFrame,null);s=transition(s,{type:'unknown'});assert.equal(s.delivery,'unknown');assert.equal(s.draft.text,'');
});
