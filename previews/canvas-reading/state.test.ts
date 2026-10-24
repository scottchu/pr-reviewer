import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialScene,transition} from './state.ts';
const viewport={x:-42,y:83,zoom:0.78};
test('focus→neighbor→Back→Resume restores exact viewport, expansion, story and prior draft',()=>{
 let state=initialScene();state=transition(state,{type:'viewport',viewport});state=transition(state,{type:'expand'});state=transition(state,{type:'draft',text:'Keep my prior draft'});const original=structuredClone(state.frame);
 state=transition(state,{type:'focus',group:'request'});state=transition(state,{type:'select',anchor:{kind:'code',side:'head',path:'src/application/review.ts',startLine:30,endLine:30}});const focused=structuredClone(state.frame);
 state=transition(state,{type:'focus',group:'refresh'});state=transition(state,{type:'back'});assert.deepEqual(state.frame,focused);state=transition(state,{type:'resume'});assert.deepEqual(state.frame,original);assert.deepEqual(state.back,[]);assert.equal(state.resume,null);
});
test('reading and explicit code/prose commenting keep draft and existing anchors independent through lenses',()=>{
 let state=initialScene();const original=structuredClone(state.frame.draft);state=transition(state,{type:'focus',group:'request'});const code={kind:'code' as const,side:'head' as const,path:'src/application/review.ts',startLine:30,endLine:30};state=transition(state,{type:'select',anchor:code});assert.deepEqual(state.frame.draft,original);
 state=transition(state,{type:'comment',id:'new',anchor:code});state=transition(state,{type:'reply',threadId:'new',text:'A local unsaved question'});state=transition(state,{type:'focus',group:'access'});assert.deepEqual(state.threads.find(thread=>thread.id==='new')?.anchor,code);state=transition(state,{type:'resume'});assert.equal(state.threads.find(thread=>thread.id==='new')?.draft,'A local unsaved question');assert.deepEqual(state.frame.draft,original);
});

test('zoom disclosure captures its pre-gesture frame rather than the intermediate scaled card',()=>{let state=initialScene();const original=structuredClone(state.frame);state=transition(state,{type:'viewport',viewport:{x:17,y:22,zoom:1.3}});state=transition(state,{type:'focus',group:'request',origin:original});state=transition(state,{type:'resume'});assert.deepEqual(state.frame,original);});
test('prose mock anchor carries immutable version/hash and exact zero-based UTF16 selection',async()=>{const {selectedProseAnchor,explanation}=await import('./state.ts');const start=explanation.text.indexOf('header'),end=start+'header selection'.length,anchor=selectedProseAnchor(start,end);assert.equal(anchor?.contentId,explanation.id);assert.equal(anchor?.contentHash,explanation.contentHash);assert.equal(anchor?.quote,explanation.text.slice(start,end));assert.equal(selectedProseAnchor(-1,2),null);assert.equal(selectedProseAnchor(1,1),null);assert.equal(selectedProseAnchor(0,10000),null);});
