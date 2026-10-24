import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {WorkerRequest,WorkerEnvelope} from './contract.ts';
import type {Anchor,FunctionNode} from '../source-analysis/public.ts';

export const CEILINGS={timeoutMs:20000,inputBytes:32*1024*1024,outputBytes:16*1024*1024,stderrBytes:64*1024} as const;
const text=z.string().max(2*1024*1024),id=z.string().min(1).max(1024),hash=z.string().regex(/^[a-f0-9]{64}$/),commit=z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
const count=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),side=z.enum(['base','head']),role=z.enum(['changed','context','declaration-only']);
const path=id.refine(v=>!/[\\\0:]/.test(v)&&!v.startsWith('/')&&v.split('/').every(p=>p!==''&&p!=='.'&&p!=='..'));
const anchor=z.strictObject({snapshotId:id,side,path,contentHash:hash,start:count,end:count,startLine:count.min(1),endLine:count.min(1)});
const seed=anchor.omit({snapshotId:true,startLine:true,endLine:true});
const source=z.strictObject({side,path,commit,role,selected:z.boolean(),source:z.strictObject({content:z.string().max(4*1024*1024),contentHash:hash,objectId:commit.optional()}).optional(),exclusion:z.enum(['excluded','missing','unsupported']).optional()});
const corpusSide=z.strictObject({commit,inventory:z.enum(['changed-only','selected-context','repository-enumeration']),acquisition:id});
const corpus=z.strictObject({base:corpusSide,head:corpusSide});
const budgetMax={inventoryPathsPerSide:4096,inventoryBytes:2097152,filesPerSide:128,fileBytes:262144,totalBytes:4194304,seeds:64,astNodes:200000,invocationSites:10000,outputNodes:2000,outputSites:4000,aliasPatterns:32,aliasTargets:4,reExportLinks:32};
const budgets=z.strictObject(Object.fromEntries(Object.entries(budgetMax).map(([k,v])=>[k,count.max(v)])) as {[K in keyof typeof budgetMax]:z.ZodNumber});
const inputShape={contract:z.literal('source-neighborhood-v1'),snapshotId:id,change:z.strictObject({repository:id,provider:id,changeId:id}),commits:z.strictObject({base:commit,head:commit}),corpus,sources:z.array(source).max(8192),profile:z.strictObject({name:z.literal('repository-static-v1'),configuration:z.strictObject({source:anchor,paths:z.record(z.string(),z.array(z.string()).max(4)),extends:z.array(z.string()).optional(),packageImports:z.boolean().optional(),packageExports:z.boolean().optional()}).optional()}),budgets};
export const requestSchema=z.discriminatedUnion('phase',[
 z.strictObject({protocol:z.literal('analysis-worker-v1'),invocationId:id,phase:z.literal('inventory'),input:z.strictObject(inputShape)}),
 z.strictObject({protocol:z.literal('analysis-worker-v1'),invocationId:id,phase:z.literal('compute'),input:z.strictObject({...inputShape,seeds:z.array(seed).max(64)})}),
]);
const coverage=z.strictObject({side,path,role,selected:z.boolean(),prepared:z.boolean(),parseStatus:z.enum(['not_parsed','parsed','failed']),status:z.enum(['not_selected','excluded','missing','unsupported','pending','parse_failed','scanned','budget_exceeded']),examined:count.nullable(),resolved:count.nullable(),unresolved:count.nullable(),reason:text.optional()});
const diagnostic=z.strictObject({side,path,start:count,code:text,message:text});
const observed=z.strictObject({bytes:count,inventoryBytes:count,astNodes:count,invocationSites:count});
const metadata={parser:z.literal('typescript@6.0.3'),snapshotId:id,corpusDigest:hash,corpus,coverage:z.array(coverage).max(8192),diagnostics:z.array(diagnostic).max(200000)};
const unavailable={status:z.literal('unavailable'),reason:z.enum(['invalid_identity','invalid_input','budget_exceeded','parser_failure']),detail:text,limit:z.enum(Object.keys(budgetMax) as [keyof typeof budgetMax,...(keyof typeof budgetMax)[]]).optional(),triggeringSource:z.strictObject({side,path}).optional()};
const nodeShape={id:hash,name:text,declaration:anchor,body:anchor,role};
const node=z.strictObject({...nodeShape,kind:z.enum(['function','const-arrow','const-function','module','callback'])});
const declaration=z.strictObject({...nodeShape,kind:z.enum(['function','const-arrow','const-function'])});
const edge=z.strictObject({id:hash,caller:hash,callee:hash,target:anchor,sites:z.array(z.strictObject({anchor,conditional:z.boolean(),linkage:z.array(anchor).max(64),signatures:z.array(anchor).max(2000)})).min(1).max(4000),method:z.literal('ts-static-binding-v1'),certainty:z.literal('resolved_static')});
const unresolved=z.strictObject({id:hash,caller:hash,anchor,syntax:id,reason:z.enum(['unsupported_dispatch','dynamic_invocation','mutable_binding','missing_module','external_module','alias_configuration_gap','declaration_only','ambiguous_implementation','parse_obstruction','semantic_obstruction','excluded_source','missing_binding','unsupported_binding','cyclic_resolution','reexport_limit']),candidates:z.array(anchor).max(2000)});
const neighborhood=z.strictObject({seed,nodeId:hash.nullable(),unresolvedSeed:z.enum(['source_unavailable','hash_mismatch','invalid_range','unsupported_or_absent']).nullable(),incoming:z.array(hash).max(4000),outgoing:z.array(hash).max(4000),unresolved:z.array(hash).max(4000),outgoingAssessment:z.enum(['No explicit invocation sites in this function body under the supported syntax scan.','invocations_present','not_fully_analyzed']),incomingAssessment:z.enum(['No resolved callers found in these supplied files','resolved_callers_found']),incomingScope:z.literal('supplied_files_only'),limitations:z.array(id).max(16)});
const inventoryMetadata={...metadata,inventory:z.literal('source-declarations-v1.0.0'),inventoryId:hash,observed:observed.extend({declarations:count})};
const analysisMetadata={...metadata,analyzer:z.literal('source-neighborhood-v1.0.1'),analysisId:hash,observed};
const inventoryResult=z.discriminatedUnion('status',[z.strictObject({...inventoryMetadata,status:z.literal('available'),declarations:z.array(declaration).max(2000)}),z.strictObject({...inventoryMetadata,...unavailable})]);
const analysisResult=z.discriminatedUnion('status',[z.strictObject({...analysisMetadata,status:z.literal('analyzed'),nodes:z.array(node).max(2000),edges:z.array(edge).max(4000),unresolved:z.array(unresolved).max(4000),neighborhoods:z.array(neighborhood).max(64)}),z.strictObject({...analysisMetadata,...unavailable})]);
const envelopeSchema=z.discriminatedUnion('phase',[z.strictObject({protocol:z.literal('analysis-worker-v1'),invocationId:id,inputFingerprint:hash,phase:z.literal('inventory'),result:inventoryResult}),z.strictObject({protocol:z.literal('analysis-worker-v1'),invocationId:id,inputFingerprint:hash,phase:z.literal('compute'),result:analysisResult})]);

export const frame=(value:unknown,maxBytes:number):Buffer=>{const body=Buffer.from(JSON.stringify(value));if(body.length>maxBytes)throw Error('analysis_worker_input_limit');const header=Buffer.alloc(4);header.writeUInt32BE(body.length);return Buffer.concat([header,body]);};
export const parseFrame=(bytes:Buffer,maxBytes:number):unknown=>{
 if(bytes.length<4)throw Error('analysis_worker_frame');const length=bytes.readUInt32BE(0);if(length>maxBytes)throw Error('analysis_worker_output_limit');if(bytes.length!==length+4)throw Error('analysis_worker_frame');
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(4)));}catch{throw Error('analysis_worker_json');}
};

const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const canonical=(value:unknown):string=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.entries(value).sort(([a],[b])=>compare(a,b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`:JSON.stringify(value)??'null';
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
const sourceKey=(value:{side:string;path:string})=>`${value.side}:${value.path}`;
const requireValid:(valid:unknown)=>asserts valid=(valid)=>{if(!valid)throw Error('analysis_worker_validation');};
export const validateRequest=(value:unknown):WorkerRequest=>{
 const parsed=requestSchema.safeParse(value);if(!parsed.success)throw Error('analysis_worker_request');const request=parsed.data as WorkerRequest,input=request.input;
 const seen=new Set<string>();for(const row of input.sources){requireValid(!seen.has(sourceKey(row)));seen.add(sourceKey(row));requireValid(row.commit===input.commits[row.side]);if(row.source){requireValid(createHash('sha256').update(row.source.content).digest('hex')===row.source.contentHash);requireValid(new TextDecoder('utf-8',{ignoreBOM:true}).decode(Buffer.from(row.source.content))===row.source.content);}}
 for(const side of ['base','head'] as const)requireValid(input.corpus[side].commit===input.commits[side]);return request;
};

export const validateEnvelope=(value:unknown,request:WorkerRequest):WorkerEnvelope=>{
 const parsed=envelopeSchema.safeParse(value);if(!parsed.success)throw Error('analysis_worker_schema');const envelope=parsed.data as WorkerEnvelope;
 requireValid(envelope.protocol===request.protocol&&envelope.invocationId===request.invocationId&&envelope.phase===request.phase&&envelope.inputFingerprint===digest(request.input));
 const input=request.input,result=envelope.result,sources=[...input.sources].sort((a,b)=>compare(sourceKey(a),sourceKey(b)));
 const sourceMetadata=sources.map(s=>({...s,source:s.source?{contentHash:s.source.contentHash,...(s.source.objectId?{objectId:s.source.objectId}:{})}:null}));
 const corpusDigest=digest({sources:sourceMetadata,corpus:input.corpus,profile:input.profile});
 const seeds=request.phase==='compute'?[...new Map(request.input.seeds.map(s=>[`${sourceKey(s)}:${s.contentHash}:${s.start}:${s.end}`,s])).values()].sort((a,b)=>compare(sourceKey(a),sourceKey(b))||a.start-b.start||a.end-b.end||compare(a.contentHash,b.contentHash)):[];
 const expectedId=request.phase==='inventory'?digest({inventory:'source-declarations-v1.0.0',parser:'typescript@6.0.3',contract:input.contract,snapshotId:input.snapshotId,change:input.change,commits:input.commits,corpus:input.corpus,sources:sourceMetadata,profile:input.profile,budgets:input.budgets}):digest({contract:input.contract,analyzer:'source-neighborhood-v1.0.1',parser:'typescript@6.0.3',snapshotId:input.snapshotId,change:input.change,commits:input.commits,corpusDigest,profile:input.profile,seeds,budgets:input.budgets});
 requireValid(result.snapshotId===input.snapshotId&&result.corpusDigest===corpusDigest&&canonical(result.corpus)===canonical(input.corpus));
 requireValid(('inventoryId' in result?result.inventoryId:result.analysisId)===expectedId);
 requireValid(result.coverage.length===sources.length&&result.coverage.every((row,i)=>{const s=sources[i]!;return row.side===s.side&&row.path===s.path&&row.role===s.role&&row.selected===s.selected&&row.prepared===!!s.source;}));
 requireValid(result.observed.bytes===sources.reduce((sum,s)=>sum+(s.source?Buffer.byteLength(s.source.content):0),0)&&result.observed.inventoryBytes===Buffer.byteLength(canonical(sourceMetadata)));
 const sourceMap=new Map(sources.map(s=>[sourceKey(s),s]));
 const line=(text:string,offset:number)=>{let n=1;for(let i=0;i<offset;i++){const c=text.charCodeAt(i);if(c===13){if(text.charCodeAt(i+1)===10){if(i+1<offset)n++;i++;}else n++;}else if(c===10||c===0x2028||c===0x2029)n++;}return n;};
 const checkAnchor=(a:Anchor)=>{const source=sourceMap.get(sourceKey(a));requireValid(source?.source&&a.snapshotId===input.snapshotId&&a.contentHash===source.source.contentHash&&a.end>=a.start&&a.end<=source.source.content.length);requireValid(a.startLine===line(source.source.content,a.start)&&a.endLine===line(source.source.content,Math.max(a.start,a.end-1)));};
 for(const d of result.diagnostics){const s=sourceMap.get(sourceKey(d));requireValid(s?.source&&d.start<=s.source.content.length);}
 if(result.status==='unavailable'){if(result.triggeringSource)requireValid(sourceMap.has(sourceKey(result.triggeringSource)));return envelope;}
 requireValid(result.observed.astNodes<=input.budgets.astNodes&&result.observed.invocationSites<=input.budgets.invocationSites);
 const nodes=result.status==='available'?result.declarations:result.nodes;
 requireValid(nodes.length<=input.budgets.outputNodes);const nodeMap=new Map<string,FunctionNode>();
 for(const n of nodes){checkAnchor(n.declaration);checkAnchor(n.body);const source=sourceMap.get(sourceKey(n.declaration))!;requireValid(!nodeMap.has(n.id)&&n.id===digest([input.snapshotId,n.declaration,n.kind])&&n.role===source.role&&sourceKey(n.body)===sourceKey(n.declaration)&&n.body.start>=n.declaration.start&&n.body.end<=n.declaration.end);nodeMap.set(n.id,n);}
 if(result.status==='available'){requireValid(result.observed.declarations===nodes.length);requireValid(result.coverage.every(c=>c.resolved===null&&c.unresolved===null));return envelope;}
 const edgeMap=new Map(result.edges.map(e=>[e.id,e])),unresolvedMap=new Map(result.unresolved.map(s=>[s.id,s]));requireValid(edgeMap.size===result.edges.length&&unresolvedMap.size===result.unresolved.length);
 let siteCount=result.unresolved.length;const sites=new Set<string>();
 const checkSite=(a:Anchor,caller:string)=>{checkAnchor(a);const n=nodeMap.get(caller);requireValid(n&&sourceKey(n.body)===sourceKey(a)&&a.start>=n.body.start&&a.end<=n.body.end);const key=canonical(a);requireValid(!sites.has(key));sites.add(key);};
 for(const e of result.edges){const caller=nodeMap.get(e.caller),callee=nodeMap.get(e.callee);requireValid(caller&&callee&&e.id===digest([e.caller,e.callee])&&canonical(e.target)===canonical(callee.declaration)&&caller.declaration.side===callee.declaration.side);checkAnchor(e.target);for(const s of e.sites){checkSite(s.anchor,e.caller);for(const a of [...s.linkage,...s.signatures]){checkAnchor(a);requireValid(a.side===s.anchor.side);}}siteCount+=e.sites.length;}
 for(const s of result.unresolved){checkSite(s.anchor,s.caller);requireValid(s.id===digest([s.caller,s.anchor,s.reason]));for(const a of s.candidates){checkAnchor(a);requireValid(a.side===s.anchor.side);}}
 requireValid(siteCount<=input.budgets.outputSites&&result.neighborhoods.length===seeds.length);
 for(let i=0;i<result.neighborhoods.length;i++){const n=result.neighborhoods[i]!;requireValid(canonical(n.seed)===canonical(seeds[i]));const member=n.nodeId?nodeMap.get(n.nodeId):null;
  requireValid(n.nodeId===null?!!n.unresolvedSeed:member&&n.unresolvedSeed===null&&sourceKey(member.declaration)===sourceKey(n.seed)&&member.declaration.contentHash===n.seed.contentHash&&member.declaration.start===n.seed.start&&member.declaration.end===n.seed.end&&member.kind!=='callback'&&member.kind!=='module');
  requireValid(canonical(n.incoming)===canonical(result.edges.filter(e=>e.callee===n.nodeId).map(e=>e.id))&&canonical(n.outgoing)===canonical(result.edges.filter(e=>e.caller===n.nodeId).map(e=>e.id))&&canonical(n.unresolved)===canonical(result.unresolved.filter(s=>s.caller===n.nodeId).map(s=>s.id)));
 }
 return envelope;
};
