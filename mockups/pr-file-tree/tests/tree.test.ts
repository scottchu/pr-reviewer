import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fixture from '../paths.json' with {type:'json'};
import {buildTree} from '../tree.ts';
test('all 50 immutable PR25 paths become independent files with one containment parent',()=>{
 const raw=execFileSync('git',['diff','--name-only','-z',fixture.base,fixture.head]);assert.equal(createHash('sha256').update(raw).digest('hex'),fixture.pathListSha256);assert.deepEqual(raw.toString().split('\0').filter(Boolean),fixture.paths);
 const tree=buildTree(fixture.paths);const files=tree.nodes.filter(n=>n.kind==='file');assert.equal(files.length,50);assert.deepEqual(files.map(n=>n.path).sort(),[...fixture.paths].sort());
 assert.equal(new Set(tree.nodes.map(n=>n.id)).size,tree.nodes.length);assert.equal(tree.edges.length,tree.nodes.length-1);
 for(const n of tree.nodes){if(n.id==='directory:.')continue;const edge=tree.edges.filter(e=>e.target===n.id);assert.equal(edge.length,1);assert.equal(edge[0]?.kind,'contains');assert.equal(edge[0]?.source,`directory:${n.path.includes('/')?n.path.slice(0,n.path.lastIndexOf('/')):'.'}`);}
});
test('duplicate basenames and directory-prefix lookalikes never merge identities',()=>{
 const tree=buildTree(['src/a/public.ts','src/ab/public.ts','tests/public.ts','src/a/public.ts']);assert.equal(tree.nodes.filter(n=>n.name==='public.ts').length,3);assert.equal(tree.nodes.filter(n=>n.kind==='file').length,3);
 assert.equal(tree.edges.find(e=>e.target==='file:src/ab/public.ts')?.source,'directory:src/ab');assert.equal(tree.edges.find(e=>e.target==='file:src/a/public.ts')?.source,'directory:src/a');
});
test('layout is deterministic, single-line and leaves text rectangles separate',()=>{
 const a=buildTree(fixture.paths),b=buildTree([...fixture.paths].reverse());assert.deepEqual(a,b);
 for(const n of a.nodes){assert.equal(n.height,n.kind==='file'?26:22);assert.ok(n.width<300);assert.equal(n.name,n.path==='.'?'pr-reviewer':n.path.split('/').at(-1));}
 for(let i=0;i<a.nodes.length;i++)for(let j=i+1;j<a.nodes.length;j++){const x=a.nodes[i]!,y=a.nodes[j]!;assert.ok(x.x+x.width<=y.x||y.x+y.width<=x.x||x.y+x.height<=y.y||y.y+y.height<=x.y,`${x.id} overlaps ${y.id}`);}
});
test('invalid paths cannot create disguised branches; empty input remains an honest root',()=>{
 for(const path of ['/abs.ts','a//b.ts','../b.ts','a/./b.ts',''])assert.throws(()=>buildTree([path]));assert.deepEqual(buildTree([]).nodes.map(n=>n.id),['directory:.']);
});

test('Git status marks exactly four added and forty-six modified files without inventing deletions',()=>{
 const tree=buildTree(fixture.paths,fixture.changes);assert.equal(tree.nodes.filter(n=>n.kind==='file'&&n.change==='added').length,4);assert.equal(tree.nodes.filter(n=>n.kind==='file'&&n.change==='modified').length,46);assert.equal(tree.nodes.filter(n=>n.change==='deleted').length,0);
 const raw=execFileSync('git',['diff','--name-status','-z',fixture.base,fixture.head]);assert.equal(createHash('sha256').update(raw).digest('hex'),fixture.changeListSha256);
});
