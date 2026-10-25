import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import diffs from '../diffs.json' with {type:'json'};
import paths from '../paths.json' with {type:'json'};
import {buildTree} from '../tree.ts';
import {detailTransition,detailTree,nearbyFile} from '../detail.ts';
test('all native Git hunk rows and both side hashes are the pinned source, including actual red removals',()=>{
 assert.equal(diffs.files.length,50);let added=0,removed=0;
 for(const f of diffs.files){for(const side of ['before','after'] as const){if(!f[side].available)continue;const source=execFileSync('git',['show',`${f[side].commit}:${f.path}`],{encoding:'utf8'});assert.equal(createHash('sha256').update(source).digest('hex'),f[side].hash);const lines=source.split('\n');for(const h of f.hunks)for(const r of h.rows){const line=side==='before'?r.beforeLine:r.afterLine;if(line!==null)assert.equal(r.text,lines[line-1]);}}
  for(const h of f.hunks)for(const r of h.rows){added+=r.kind==='added'?1:0;removed+=r.kind==='removed'?1:0;}
 }assert.equal(added,492);assert.equal(removed,192);assert.ok(diffs.files.find(f=>f.path==='scripts/dev.ts')!.hunks.some(h=>h.rows.some(r=>r.kind==='removed'&&r.text.includes('node:fs'))));
});
test('semantic zoom expands one nearby identity with hysteresis, collapses on zoom out and does not choose a distant file',()=>{
 const tree=buildTree(paths.paths,paths.changes),file=tree.nodes.find(n=>n.id==='file:src/application/review.ts')!;
 assert.equal(nearbyFile(tree,{x:file.x+10,y:file.y+10},40),file.path);assert.equal(nearbyFile(tree,{x:-900,y:-900},40),null);
 let s={expanded:null as string|null,lastZoom:1};s=detailTransition(s,{type:'zoom',zoom:1.4,focal:file.path});assert.equal(s.expanded,file.path);s=detailTransition(s,{type:'zoom',zoom:1.35,focal:null});assert.equal(s.expanded,file.path);s=detailTransition(s,{type:'zoom',zoom:1.05,focal:null});assert.equal(s.expanded,null);
 s=detailTransition(s,{type:'focus',path:file.path});s=detailTransition(s,{type:'zoom',zoom:1.05,focal:null});assert.equal(s.expanded,file.path);
});
test('in-place file detail keeps the same origin/ID and all50 files while reserving neighbor space',()=>{
 const tree=buildTree(paths.paths,paths.changes),file=tree.nodes.find(n=>n.id==='file:src/application/review.ts')!,expanded=detailTree(tree,file.path,false),n=expanded.nodes.find(n=>n.id===file.id)!;
 assert.equal(n.x,file.x);assert.equal(n.y,file.y);assert.equal(n.width,760);assert.equal(expanded.nodes.filter(n=>n.kind==='file').length,50);assert.deepEqual(expanded.edges,tree.edges);
 for(const other of expanded.nodes){if(other.id===n.id)continue;assert.ok(n.x+n.width<=other.x||other.x+other.width<=n.x||n.y+n.height<=other.y||other.y+other.height<=n.y);}
 assert.deepEqual(detailTree(tree,null,false),tree);
});
