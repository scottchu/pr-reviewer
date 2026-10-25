import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import imports from '../imports.json' with {type:'json'};
import fixture from '../paths.json' with {type:'json'};
import {buildTree} from '../tree.ts';
import {projectImports} from '../imports.ts';
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
test('every import citation and resolved target hash belongs to its exact retained Git side',()=>{
 const cache=new Map<string,string>();const read=(commit:string,path:string)=>{const key=`${commit}:${path}`;if(!cache.has(key))cache.set(key,execFileSync('git',['show',key],{encoding:'utf8'}));return cache.get(key)!;};
 for(const r of imports.records){assert.equal(r.commit,r.side==='before'?fixture.base:fixture.head);const full=read(r.commit,r.from);assert.equal(digest(full),r.sourceHash);assert.equal(full.slice(r.startOffset+1,r.endOffset-1),r.specifier);assert.equal(full.slice(0,r.startOffset).split('\n').length,r.sourceLine);if(r.targetKind==='external'){assert.equal(r.target,r.specifier);assert.equal(r.targetHash,null);}else if(r.target)assert.equal(digest(read(r.commit,r.target)),r.targetHash);else assert.equal(r.targetHash,null);}
});
test('review selection distinguishes the added helper import, retained imports and unchanged one-hop context',()=>{
 const tree=buildTree(fixture.paths,fixture.changes);const view=projectImports(tree,imports,'src/application/review.ts');assert.equal(view.links.find(e=>e.targetPath==='src/application/local-access.ts')?.change,'added');assert.equal(view.links.find(e=>e.targetPath==='src/application/private-session.ts')?.change,'unchanged');assert.ok(view.contexts.some(n=>n.path==='src/application/public.ts'));assert.ok(view.contexts.some(n=>n.path==='src/domain/public.ts'));assert.equal(tree.nodes.filter(n=>n.kind==='file').length,50);
 for(const link of view.links){assert.ok(link.citations.length>0);assert.equal(link.kind,'imports');}assert.deepEqual(projectImports(tree,imports,null),{contexts:[],links:[],unresolved:[]});
});
test('an unresolved module never becomes an invented target or a confirmed leaf',()=>{
 const sample={...imports,records:[{from:'src/application/review.ts',side:'after',commit:fixture.head,sourceHash:'hash',sourceLine:1,startOffset:0,endOffset:10,specifier:'./missing.ts',target:null,targetHash:null}]};const view=projectImports(buildTree(fixture.paths),sample,'src/application/review.ts');assert.equal(view.links.length,0);assert.equal(view.contexts.length,0);assert.equal(view.unresolved.length,1);
});

test('the removed node:fs module is a red external identity with baseline citation and no fabricated repository hash',()=>{
 const view=projectImports(buildTree(fixture.paths,fixture.changes),imports,'scripts/dev.ts'),link=view.links.find(e=>e.targetPath==='node:fs')!;assert.equal(link.change,'deleted');assert.equal(link.targetKind,'external');assert.equal(link.citations[0]?.side,'before');assert.equal(link.citations[0]?.sourceLine,4);assert.equal(link.citations[0]?.targetHash,null);assert.equal(view.contexts.find(n=>n.id===link.target)?.kind,'external');
});
