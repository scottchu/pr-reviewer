import packet from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/request-unit-test-evidence-v1.json' with {type:'json'};
import {minimalGraph as original, type GraphEntity, type GraphRelation} from './minimal-graph.ts';
const e=packet.evidence;const origin='pinned_git';const repository=original.data.evidence.comparison.repository;
const evidence=(key:keyof typeof e)=>({...e[key],repository,origin,retainedSnapshotAdmission:'not established for this supplementary source'});
const occurrence=(key:keyof typeof e)=>{const ref=evidence(key);return{side:ref.side,anchor:ref};};
const fileOccurrence=(key:keyof typeof e)=>{const ref=evidence(key);return{repository,path:ref.path,side:ref.side,commit:ref.commit,sourceHash:ref.sourceSha256,gitBlob:ref.gitBlob};};
const status=(value:string,basis:string)=>({comparisonStatus:value,comparisonBasis:basis});
const loc=(id:string,from:string,to:string,key:keyof typeof e):GraphRelation=>{const ref=evidence(key);return{id,from,to,version:ref.side==='base'?'before':'after',relation:'located_in',data:{commit:ref.commit,range:{startLine:ref.startLine,endLine:ref.endLine},sourceHash:ref.sourceSha256,sourceEvidence:ref}};};
const pairedLocation=(id:string,from:string,to:string,before:keyof typeof e,after:keyof typeof e):GraphRelation=>({id,from,to,version:'comparison',relation:'located_in',data:{comparisonStatus:'no change',basis:'Same pinned Git blob and exact definition/assertion range hash in both revisions',witnesses:[loc(id+':base',from,to,before),loc(id+':head',from,to,after)]}});
const appBasis='Both revisions have the same Git blob and definition/variant/assertion text hashes; unchanged source, not executed behavior';
const applicationTest:GraphEntity={id:'application-credential-test',kind:'test',data:{name:packet.application.nameTemplate,variants:packet.application.variants,scope:'Explicit-credential Bearer · indirect source chain',execution:'not run',...status('no change',appBasis),occurrences:[occurrence('application-base-definition'),occurrence('application-head-definition')],variantEvidence:[evidence('application-base-variants'),evidence('application-head-variants')]}};
const applicationAssertion:GraphEntity={id:'application-credential-assertion',kind:'assertion',data:{name:'Asserts explicit credentials retain Bearer',value:["Bearer fresh-credential"],execution:'not run',...status('no change',appBasis),occurrences:[occurrence('application-base-assertion'),occurrence('application-head-assertion')]}};
const applicationFile:GraphEntity={id:'application-test-file',kind:'file',data:{repository,path:e['application-head-definition'].path,...status('no change',appBasis),occurrences:[fileOccurrence('application-base-definition'),fileOccurrence('application-head-definition')]}};
const gatewayTest:GraphEntity={id:'gateway-owner-policy-test',kind:'test',data:{name:packet.gateway.name,scope:'Server HTTP policy · not client helper coverage',execution:'not run',...status('add','Named definition absent from full pinned Base file; native diff adds Head90–114'),occurrences:[occurrence('gateway-head-definition')]}};

const gatewayAssertions:GraphEntity={id:'gateway-policy-assertions',kind:'assertion',data:{name:'Asserts local-owner HTTP policy',value:['No Authorization: owner reads and writes','Invalid explicit credentials: HTTP401'],execution:'not run',...status('add','Assertions are inside the newly added test definition'),occurrences:[occurrence('gateway-head-reads'),occurrence('gateway-head-writes-readback'),occurrence('gateway-head-invalid-credentials')]}};
const gatewayFile:GraphEntity={id:'gateway-test-file',kind:'file',data:{repository,path:e['gateway-head-definition'].path,...status('change','Pinned Base and Head source hashes differ; native diff adds this test'),occurrences:[{repository,path:packet.gateway.baseSource.path,side:'base',commit:packet.base,sourceHash:packet.gateway.baseSource.sourceSha256,gitBlob:packet.gateway.baseSource.gitBlob},fileOccurrence('gateway-head-definition')]}};
const policy:GraphEntity={id:'owner-http-policy',kind:'behavior',data:{name:'Local-owner HTTP policy',value:['No Bearer: owner reads/writes','Explicit invalid credentials: HTTP401','Source-declared expectations · not executed'],sourceEvidence:[evidence('gateway-head-no-header-helper'),evidence('gateway-head-reads'),evidence('gateway-head-writes-readback'),evidence('gateway-head-invalid-credentials')],comparisonApplicability:'source-declared behavior expectation, not a compared code occurrence'}};
const gatewayChange: GraphEntity = {
 id: 'gateway-policy-test-change',
 kind: 'change',
 data: {
  name: 'Added gateway policy test',
  ...status('add', 'Native added test definition; checked Base absence is provenance, not an entity'),
  absenceEvidence: packet.gateway.baseSource,
  nativeDiff: packet.gateway.nativeDiff,
 },
 nodes: [gatewayTest, gatewayAssertions],
 edges: [
  {
   id: 'gateway-test:after', from: 'gateway-policy-test-change', to: gatewayTest.id,
   version: 'after', relation: 'after', data: {sourceEvidence: evidence('gateway-head-definition')},
  },
  {
   id: 'gateway-test:contains', from: gatewayTest.id, to: gatewayAssertions.id,
   version: 'after', relation: 'contains', data: {sourceEvidence: gatewayAssertions.data.occurrences},
  },
 ],
};
const chainKeys:readonly(keyof typeof e)[]=['application-head-capture','application-head-login','head-public-export','head-login-refresh','head-refresh-request','head-request-fetch','helper-head-definition'];
const edges:GraphRelation[]=[
 pairedLocation('application-test:location',applicationTest.id,applicationFile.id,'application-base-definition','application-head-definition'),
 pairedLocation('application-assertion:location',applicationAssertion.id,applicationFile.id,'application-base-assertion','application-head-assertion'),
 {id:'application-test:contains',from:applicationTest.id,to:applicationAssertion.id,version:'comparison',relation:'contains',data:{comparisonStatus:'no change',sourceEvidence:[evidence('application-base-assertion'),evidence('application-head-assertion')]}},
 {id:'application-test:verifies-change',from:applicationTest.id,to:'change',version:'comparison',relation:'verifies',data:{verificationKind:'credential-preservation',basis:packet.application.relation,sourceChain:chainKeys.map(evidence),assertionEvidence:[evidence('application-base-assertion'),evidence('application-head-assertion')],execution:'not run'}},
 loc('gateway-test:location',gatewayTest.id,gatewayFile.id,'gateway-head-definition'),
 ...(['gateway-head-reads','gateway-head-writes-readback','gateway-head-invalid-credentials'] as const).map(key=>loc('gateway-assertions:'+key,gatewayAssertions.id,gatewayFile.id,key)),
 {id:'gateway-test:verifies-policy',from:gatewayTest.id,to:policy.id,version:'after',relation:'verifies_policy',data:{basis:packet.gateway.relation,sourceEvidence:policy.data.sourceEvidence,execution:'not run'}},
 {id:'change:related-policy',from:'change',to:policy.id,version:'comparison',relation:'related_policy',data:{basis:'Source-derived shared local-owner policy context; no HTTP/client call or proven goal outcome',sourceEvidence:[evidence('head-request-fetch'),evidence('helper-head-definition'),evidence('gateway-head-no-header-helper')],certainty:'inference'}},
];
export const preparedTests={id:'prepared-test-coverage-v2',kind:'graph',data:{packet,scope:packet.scope,selection:'Existing request seed: public-entrypoint credential assertion + explicitly asserted HTTP policy; runtime/recovery frontier recorded, not whole coverage'},nodes:[applicationTest,applicationAssertion,applicationFile,gatewayChange,gatewayFile,policy],edges};
