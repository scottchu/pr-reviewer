import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import oracle from './source-pipeline-oracle.json' with {type:'json'};
import {prepareReviewComparison} from '../../../src/review-graph/preparation/run.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import {pr25Aliases} from '../../../src/review-graph/preparation/pr25-aliases.ts';
import type {UIEntity} from '../../../src/review-graph/ui/types.ts';
const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,value])=>[key,stable(value)])):value;
const sha=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const digest=(value:unknown)=>sha(JSON.stringify(stable(value)));

// Undo only the accepted R1 deltas when comparing against the retained historical
// oracle. New correctness tests independently require the corrected values.
const historicalProjection = (value: unknown): unknown => {
 if (typeof value === 'string') return value.startsWith('constructs:') ? value.replace(/:(before|after)$/, '') : value;
 if (Array.isArray(value)) return value.map(historicalProjection);
 if (!value || typeof value !== 'object') return value;
 const output: Record<string, unknown> = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, historicalProjection(item)]));
 const data = output.data as Record<string, unknown> | undefined;
 if (data && ['reason', 'goal'].includes(String(output.id)) && Array.isArray(data.sourceRefs)) {
  data.sourceRefs = data.sourceRefs.map(ref => {
   const {repository, commit, contentHash, ...original} = ref as Record<string, unknown>;
   return original;
  });
 }
 if (data && output.id === 'owner-http-policy') delete data.sourceRefs;
 const oldAssertions: Readonly<Record<string, string>> = {
  "expect(page.getByLabel('Local access token')).toHaveCount(0)": 'No local access token field',
  "expect(page.getByRole('button',{name:'Log out',exact:true})).toHaveCount(0)": 'No Log out button',
  "expect(ownerRequests.every(value=>value==='')).toBe(true)": 'Asserts API requests omit Authorization',
 };
 if (typeof output.title === 'string' && oldAssertions[output.title] && Array.isArray(output.rows)) {
  output.rows = output.rows.map(row => typeof row === 'string' ? oldAssertions[row] ?? row : row);
 }
 if (output.title === 'related policy' && Array.isArray(output.provenance)) {
  output.provenance = ['Source provenance unavailable'];
  output.rows = [output.explanation, ...(output.scope as readonly string[]), 'Source provenance unavailable'];
 }
 return output;
};

test('frozen source/canonical/projection with explicit policy cleanup and raw correctness deltas',async()=>{
 const prepared=await prepareReviewComparison('scottchu/pr-reviewer','b096826e31c0927190806de91ed70b8b64aa93d8','e3b270e5f49a9215452b0b86702946043e979059',facts=>sha(JSON.stringify(facts)));
 const bytes=JSON.stringify(prepared.facts);
 assert.equal(prepared.graph.provenance.inputArtifactHash,sha(bytes));
 assert.equal(prepared.graph.provenance.appCompilerHash,sha(readFileSync(new URL('../../../src/review-graph/preparation/pr25.ts',import.meta.url))));
 const facts=JSON.parse(bytes);delete facts.producer.sourceHashes;
 assert.equal(digest(facts),oracle.facts,'all source facts/hashes/anchors/coverage must stay equal');
 const compiled=JSON.parse(JSON.stringify(domainService.compare(prepared.facts,pr25Aliases)));
 // The full source-fact equality check above establishes this exact code-provenance dependency.
 compiled.provenance.producer.sourceHashes=oracle.sourceProducerHashes;
 assert.equal(digest(historicalProjection(compiled)),oracle.compiled,'all prepared IDs/references/correspondence must stay equal');
 const canonical=JSON.parse(JSON.stringify(historicalProjection(prepared.graph)));
 for(const key of oracle.excludedGraphModuleHashes)delete canonical.provenance[key];
 delete canonical.provenance.producer.sourceHashes;
 // Replace artifact identity only AFTER checking its full raw bytes and every non-producer fact.
 canonical.provenance.inputArtifactHash=oracle.originalInputArtifactHash;
 const retired=oracle.policyEdgeRemoval;
 assert.equal(retired.revision,2);
 assert.equal(retired.relation.relation,'verifies_policy');
 assert.equal(canonical.relations.some((edge:{relation:string})=>edge.relation==='verifies_policy'),false);
 assert.equal(digest(canonical),retired.canonical,'only documented relation identity and attributed-reference deltas accompany the retired edge removal');
 // Restore the exact frozen edge at its original slot to prove every other field
 // still equals the original full-graph oracle, rather than ignoring edge kinds.
 canonical.relations.splice(retired.canonicalIndex,0,retired.relation);
 assert.equal(digest(canonical),oracle.canonical,'restoring the one retired edge must recover the entire old graph');
 const raw=(entity:UIEntity):unknown=>{const {ui,nodes,...identity}=entity;return {...identity,...(nodes?{nodes:nodes.map(raw)}:{})};};
 const state=experienceService.openComparison(prepared.graph);
 const projections=[{}, {'review-file':20},{'review-file':40},{}].map(limits=>{
  const view=projectExperience({...state,limits});
  // The adopted header-card delta remains independently checked. Keep the
  // frozen pre-correction oracle; header-occurrence.test.ts checks its new copy
  // and exact Before identity independently. All other fields remain frozen.
  return {limits,nodes:view.nodes.map(raw),relations:view.relations.map(({ui,...edge})=>edge),cards:view.nodes.map(entity=>[entity.id,
   entity.id==='header-value'?{title:'Authorization',rows:['remove','`Bearer ${captured}`']}:
   entity.kind==='assertion' && Array.isArray(entity.data.value) ? {...entity.ui.card,
    // Invert only the accepted exact title/value duplicate removal. Distinct rows
    // and canonical source fields remain under the original frozen oracle.
    rows:[...entity.ui.card.rows,...entity.data.value.map(String).filter(value=>value===entity.ui.card.title)]} : entity.ui.card,
   entity.ui.status]),edges:view.relations.map(edge=>[edge.id,edge.ui])};
 });
 assert.equal(digest(historicalProjection(projections)),retired.projection,'all remaining projection fields and source controls remain frozen');
 const restored=JSON.parse(JSON.stringify(historicalProjection(projections)));
 for(const [index,view] of restored.entries()){
  view.relations.splice(retired.projectionIndexes[index],0,retired.relation);
  view.edges.splice(retired.projectionIndexes[index],0,[retired.relation.id,retired.ui]);
 }
 assert.equal(digest(restored),oracle.projection,'restoring the exact frozen projected edge recovers every old view');
 const folder=new URL('../../../.decompozr/flow/run/source-pipeline/',import.meta.url);mkdirSync(folder,{recursive:true});
 writeFileSync(new URL('fresh-source-facts.json',folder),bytes);
 writeFileSync(new URL('fresh-preservation-report.json',folder),JSON.stringify({baseline:oracle.baseline,rawArtifactHash:sha(bytes),originalRawArtifactHash:oracle.originalInputArtifactHash,sourceFactsEqual:true,compiledEqual:true,canonicalEqualExceptRetiredPolicyEdge:true,default20More40HideProjectionEqualExceptRetiredPolicyEdge:true,retiredRelation:retired.relation.id,oracleRevision:retired.revision},null,2));
});
