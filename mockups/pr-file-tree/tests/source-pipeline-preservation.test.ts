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

test('frozen canonical and default/20/40/hide projection with one explicit retired-policy-edge delta',async()=>{
 const prepared=await prepareReviewComparison('scottchu/pr-reviewer','b096826e31c0927190806de91ed70b8b64aa93d8','e3b270e5f49a9215452b0b86702946043e979059',facts=>sha(JSON.stringify(facts)));
 const bytes=JSON.stringify(prepared.facts);
 assert.equal(prepared.graph.provenance.inputArtifactHash,sha(bytes));
 assert.equal(prepared.graph.provenance.appCompilerHash,sha(readFileSync(new URL('../../../src/review-graph/preparation/pr25.ts',import.meta.url))));
 const facts=JSON.parse(bytes);delete facts.producer.sourceHashes;
 assert.equal(digest(facts),oracle.facts,'all source facts/hashes/anchors/coverage must stay equal');
 const compiled=JSON.parse(JSON.stringify(domainService.compare(prepared.facts,pr25Aliases)));
 // The full source-fact equality check above establishes this exact code-provenance dependency.
 compiled.provenance.producer.sourceHashes=oracle.sourceProducerHashes;
 assert.equal(digest(compiled),oracle.compiled,'all prepared IDs/references/correspondence must stay equal');
 const canonical=JSON.parse(JSON.stringify(prepared.graph));
 for(const key of oracle.excludedGraphModuleHashes)delete canonical.provenance[key];
 delete canonical.provenance.producer.sourceHashes;
 // Replace artifact identity only AFTER checking its full raw bytes and every non-producer fact.
 canonical.provenance.inputArtifactHash=oracle.originalInputArtifactHash;
 const retired=oracle.policyEdgeRemoval;
 assert.equal(retired.revision,2);
 assert.equal(retired.relation.relation,'verifies_policy');
 assert.equal(canonical.relations.some((edge:{relation:string})=>edge.relation==='verifies_policy'),false);
 assert.equal(digest(canonical),retired.canonical,'only the approved edge removal may change the canonical graph');
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
   entity.id==='header-value'?{title:'Authorization',rows:['remove','`Bearer ${captured}`']}:entity.ui.card,
   entity.ui.status]),edges:view.relations.map(edge=>[edge.id,edge.ui])};
 });
 assert.equal(digest(projections),retired.projection,'all remaining projection fields and source controls remain frozen');
 const restored=JSON.parse(JSON.stringify(projections));
 for(const [index,view] of restored.entries()){
  view.relations.splice(retired.projectionIndexes[index],0,retired.relation);
  view.edges.splice(retired.projectionIndexes[index],0,[retired.relation.id,retired.ui]);
 }
 assert.equal(digest(restored),oracle.projection,'restoring the exact frozen projected edge recovers every old view');
 const folder=new URL('../../../.decompozr/flow/run/source-pipeline/',import.meta.url);mkdirSync(folder,{recursive:true});
 writeFileSync(new URL('fresh-source-facts.json',folder),bytes);
 writeFileSync(new URL('fresh-preservation-report.json',folder),JSON.stringify({baseline:oracle.baseline,rawArtifactHash:sha(bytes),originalRawArtifactHash:oracle.originalInputArtifactHash,sourceFactsEqual:true,compiledEqual:true,canonicalEqualExceptRetiredPolicyEdge:true,default20More40HideProjectionEqualExceptRetiredPolicyEdge:true,retiredRelation:retired.relation.id,oracleRevision:retired.revision},null,2));
});
