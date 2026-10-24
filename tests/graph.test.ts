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

test('unavailable comparison is not a pure addition or a changed-span assertion',()=>{
 const value:Snapshot={...snapshot,sources:[snapshot.sources[1]!],changedFiles:[{status:'modified',oldPath:'a.md',newPath:'a.md',dispositions:[{side:'base',path:'a.md',state:'unsupported',reason:'binary'},{side:'head',path:'a.md',state:'prepared',reason:'text'}]}],documentReferences:[]};
 expect(sourceViews(value)[0]?.lines.every(l=>l.status==='not_analyzed')).toBe(true);
 expect(projectGraph(value).nodes.filter(n=>n.kind==='hunk')).toHaveLength(0);
 expect(projectGraph(value).unknowns.join(' ')).toContain('Comparison unavailable');
});
test('inline links in longer fences, mismatched fences, inline and indented code are not document facts',async()=>{
 const {inlineDocumentLinks}=await import('../src/domain/public.ts');
 const content=['````md','```','[fake](b.md)','~~~','[also-fake](b.md)','````','`[inline](b.md)`','    [indented](b.md)','[real](b.md)'].join('\n');
 expect(inlineDocumentLinks(content)).toEqual([{destination:'b.md',line:9}]);
 const forged=projectGraph({...snapshot,sources:[{...snapshot.sources[1]!,content,lineCount:9},snapshot.sources[2]!],documentReferences:[{...snapshot.documentReferences![0]!,source:{...snapshot.documentReferences![0]!.source,startLine:3,endLine:3}}]});
 expect(forged.edges.filter(e=>e.kind==='document_reference')).toHaveLength(0);
});

test('encoded hash is a literal repository path, and fragment target identity is checked',async()=>{
 const {resolveDocumentDestination}=await import('../src/domain/public.ts');
 expect(resolveDocumentDestination('docs/a.md','b%23section')).toEqual({path:'docs/b#section',fragment:null});
 expect(resolveDocumentDestination('docs/a.md','b.md#section')).toEqual({path:'docs/b.md',fragment:'section'});
 const value:Snapshot={...snapshot,sources:[{...snapshot.sources[1]!,content:'[real](b%23section)',lineCount:1},{...snapshot.sources[2]!,path:'b',content:'# section',lineCount:1}],documentReferences:[{destination:'b%23section',method:'inline_markdown_link',reason:null,source:{snapshotId:'s',side:'head',path:'a.md',startLine:1,endLine:1},target:{snapshotId:'s',side:'head',path:'b',startLine:1,endLine:1}}]};
 expect(projectGraph(value).edges.filter(edge=>edge.kind==='document_reference')).toHaveLength(0);
});

test('quoted fence text does not close an outer fence and code headings cannot resolve fragments',async()=>{
 const {inlineDocumentLinks,documentHeadingLine}=await import('../src/domain/public.ts');
 expect(inlineDocumentLinks('````\n> ````\n[fake](b.md)\n````\n[real](b.md)')).toEqual([{destination:'b.md',line:5}]);
 expect(()=>documentHeadingLine('```md\n# Fake\n```','fake')).toThrow('unresolved');
});
