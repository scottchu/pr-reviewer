import { test, expect } from 'bun:test';
import { projectGraph, sourceViews } from '../src/domain/public.ts';
import type { Snapshot } from '../src/domain/public.ts';
const snapshot: Snapshot = { snapshotId:'s', repository:'r',prUrl:'url',prNumber:20,baseSha:'a',headSha:'b',sources:[
 {side:'base',path:'a.md',content:'# A\nold\n',hash:'h',lineCount:2},
 {side:'head',path:'a.md',content:'# A\n[new](b.md)\n',hash:'h',lineCount:2},
 {side:'head',path:'b.md',content:'# B\n',hash:'h',lineCount:1}
], changedFiles:[{status:'modified',oldPath:'a.md',newPath:'a.md',dispositions:[{side:'base',path:'a.md',state:'prepared',reason:'verified blob'},{side:'head',path:'a.md',state:'prepared',reason:'verified blob'}]}, {status:'added',oldPath:null,newPath:'b.md',dispositions:[{side:'head',path:'b.md',state:'prepared',reason:'verified blob'}]}], documentReferences:[{destination:'b.md',source:{snapshotId:'s',side:'head',path:'a.md',startLine:2,endLine:2}, target:{snapshotId:'s',side:'head',path:'b.md',startLine:1,endLine:1},method:'inline_markdown_link',reason:null}]};
test('02-G: deterministic graph carries exact evidence, missing sides and no semantic leaf claims',()=>{
 const graph=projectGraph(snapshot);
 expect(projectGraph(snapshot)).toEqual(graph);
 expect(graph.nodes.filter(n=>n.kind==='file')).toHaveLength(3);
 expect(graph.edges.filter(e=>e.kind==='comparison')).toHaveLength(1);
 expect(graph.edges.find(e=>e.kind==='document_reference')?.anchors).toEqual([snapshot.documentReferences![0]!.source,snapshot.documentReferences![0]!.target!]);
 expect(graph.nodes.filter(n=>n.kind==='hunk')).toHaveLength(3);
 expect(graph.unknowns.join(' ')).toContain('Callers/callees not analyzed');
 expect(sourceViews(snapshot).find(s=>s.path==='b.md')?.lines[0]?.status).toBe('added');
});
test('02-G: forged references never become edges and unsupported material stays visible',()=>{
 const graph=projectGraph({...snapshot,documentReferences:[{...snapshot.documentReferences![0]!,target:{...snapshot.documentReferences![0]!.target!,snapshotId:'other'}}],changedFiles:[...snapshot.changedFiles!,{status:'added',oldPath:null,newPath:'large.bin',dispositions:[{side:'head',path:'large.bin',state:'unsupported',reason:'binary'}]}]});
 expect(graph.edges.some(e=>e.kind==='document_reference')).toBe(false);
 expect(graph.unresolved.some(r=>r.reason?.includes('invalid'))).toBe(true);
 expect(graph.dispositions.some(d=>d.path==='large.bin'&&d.reason==='binary')).toBe(true);
});

test('02-G: valid-looking invented link provenance does not become a graph assertion',()=>{
 const forged=projectGraph({...snapshot,documentReferences:[{...snapshot.documentReferences![0]!,destination:'invented.md'}]});
 expect(forged.edges.filter(e=>e.kind==='document_reference')).toHaveLength(0);
 expect(forged.unresolved[0]?.reason).toContain('invalid');
});
