import {z} from 'zod';
import type {Principal,Snapshot,SemanticAnchor} from './public.ts';
import {graphFiles,projectGraph} from './graph.ts';
import {semanticAnchorSchema} from './semantic.ts';
const id=z.string().min(1).max(128);
const revision=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const digest=z.string().regex(/^[a-f0-9]{64}$/);
const path=z.string().min(1).max(1024).refine(value=>!value.startsWith('/')&&!value.includes('\\')&&!value.includes('\0')&&!value.split('/').some(part=>part==='..'||part==='.'||!part));
const text=(max:number)=>z.string().min(1).max(max).refine(value=>value.trim().length>0);
const lineAnchor=z.object({snapshotId:id,side:z.enum(['base','head']),path,startLine:revision.refine(value=>value>0),endLine:revision.refine(value=>value>0)}).strict();
const snapshotReference=z.object({type:z.literal('snapshot_source'),anchor:lineAnchor,contentHash:digest}).strict();
const semanticReference=z.object({type:z.literal('semantic_source'),corpusId:digest,anchor:semanticAnchorSchema}).strict();
const staticReference=z.object({type:z.enum(['static_node','static_edge']),analysisId:digest,factId:id}).strict();
export const storyReferenceSchema=z.union([snapshotReference,semanticReference,staticReference,z.object({type:z.literal('capture'),captureId:id,contentHash:digest,start:revision.optional(),end:revision.optional()}).strict().refine(value=>(value.start===undefined)===(value.end===undefined)&& (value.start===undefined||value.end!>value.start)),z.object({type:z.literal('metadata'),field:z.enum(['title','prUrl','repository','prNumber','baseSha','headSha'])}).strict(),z.object({type:z.literal('clarification'),analysisId:digest,clarificationId:id,revision:revision.refine(value=>value>0)}).strict()]);
export type StoryReference=z.infer<typeof storyReferenceSchema>;
const sources=z.array(z.union([snapshotReference,semanticReference])).min(1).max(2).refine(items=>new Set(items.map(item=>item.anchor.side)).size===items.length);
export const storyFocusSchema=z.discriminatedUnion('type',[z.object({type:z.literal('none')}).strict(),z.object({type:z.literal('sources'),fileKey:text(4096),sources}).strict(),z.object({type:z.literal('structural'),fileKey:text(4096),hunkId:text(4096).optional()}).strict(),z.object({type:z.literal('semantic'),reference:staticReference,sources}).strict()]);
export const storyContentSchema=z.object({title:text(120),questionId:id.optional(),analysisId:digest.optional(),corpusId:digest.optional(),captureIds:z.array(id).max(16),chapters:z.array(z.object({id,title:text(120),why:id,what:id,how:id,example:z.object({scenarioKind:z.enum(['illustrative','source_derived']),input:id,before:id,after:id}).strict(),stepIds:z.array(id).min(1).max(32)}).strict()).min(1).max(8),steps:z.array(z.object({id,headline:text(120),claimIds:z.array(id).min(1).max(128),focus:storyFocusSchema}).strict()).min(1).max(32),claims:z.array(z.object({id,text:text(1200),basis:z.enum(['source_observation','static_relationship','supplied_rationale','inference','unknown']),references:z.array(storyReferenceSchema).max(8),attribution:z.literal('author').optional(),uncertainty:text(1200).optional()}).strict()).min(1).max(128),scope:z.array(z.discriminatedUnion('type',[z.object({type:z.literal('explained'),fileKey:text(4096),chapterId:id,explanation:text(400),references:z.array(storyReferenceSchema).min(1).max(8)}).strict(),z.object({type:z.literal('unexplained'),fileKey:text(4096),reason:text(400)}).strict()])).max(512),limitations:z.array(text(1200)).min(1).max(32)}).strict().refine(value=>(value.analysisId===undefined)===(value.corpusId===undefined));
export type StoryContent=z.infer<typeof storyContentSchema>;
const commandId=id.refine(value=>!['story-internal:','analysis-admit:','import-admit:','attach:'].some(prefix=>value.startsWith(prefix)));
const safeUrl=z.url().max(4096).refine(value=>{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}});
const captureInput=z.object({kind:z.enum(['Epic','Ticket','PR']),title:text(120),text:text(8192).refine(value=>new TextEncoder().encode(value).length<=8192),originUrl:safeUrl.optional(),supersedesCaptureId:id.optional()}).strict();
export const publishStorySchema=z.object({type:z.literal('PublishStory'),commandId,reviewId:id,snapshotId:id,expectedStoryRevision:revision,contextRevision:revision,story:storyContentSchema,replacesVersionId:id.optional()}).strict();
export const putStoryContextSchema=z.object({type:z.literal('PutStoryContext'),commandId,reviewId:id,snapshotId:id,expectedContextRevision:revision,action:z.discriminatedUnion('type',[z.object({type:z.literal('create'),capture:captureInput}).strict(),z.object({type:z.literal('select'),captureIds:z.array(id).max(16)}).strict()])}).strict();
export const storyCommandSchema=z.discriminatedUnion('type',[publishStorySchema,putStoryContextSchema]);
export type StoryCommand=z.infer<typeof storyCommandSchema>;
export const storyQuerySchema=z.object({reviewId:id,snapshotId:id,versionId:id.optional(),minimumStoryRevision:revision.optional(),minimumContextRevision:revision.optional()}).strict();
export const storyContextQuerySchema=z.object({reviewId:id,snapshotId:id,contextRevision:revision.optional(),captureId:id.optional()}).strict();
export const storyEvidenceQuerySchema=z.object({reviewId:id,snapshotId:id,analysisId:digest.optional(),corpusId:digest.optional(),references:z.array(storyReferenceSchema).max(256)}).strict().refine(value=>(value.analysisId===undefined)===(value.corpusId===undefined));
export type StoryQuery=z.infer<typeof storyQuerySchema>;
export type StoryContextQuery=z.infer<typeof storyContextQuerySchema>;
export type StoryEvidenceQuery=z.infer<typeof storyEvidenceQuerySchema>;
export type StoryAuthor=Exclude<Principal,{kind:'bootstrap'}>;
export type StoryCapture={captureId:string;kind:'Epic'|'Ticket'|'PR';title:string;text:string;originUrl?:string;supersedesCaptureId?:string;actorId:string;createdAt:string;contentHash:string;freshness:'captured'|'unknown'};
export type StoryVersion={reviewId:string;snapshotId:string;versionId:string;storyRevision:number;contextRevision:number;contentHash:string;author:StoryAuthor;createdAt:string;previousVersionId:string|null;story:StoryContent};
export type StoryVersionSummary=Omit<StoryVersion,'story'> & {title:string};
export type StoryError='invalid_request'|'unauthorized'|'stale_attachment'|'source_unavailable'|'command_conflict'|'story_reference_invalid'|'story_structure_invalid'|'story_scope_invalid'|'story_context_conflict'|'story_conflict'|'story_author_conflict'|'story_storage_limit'|'story_version_unavailable'|'story_context_unavailable'|'revision_unavailable';
export type StoryReceipt={commandId:string;actorId:string;state:'applied'|'rejected';reviewId:string;snapshotId:string;storyRevision:number;contextRevision:number;result:{versionId?:string;captureId?:string};error?:StoryError};
export type StoryEvidenceIssue={reference:StoryReference;reason:string};
export type StoryEvidence={reviewId:string;snapshotId:string;selectedAnalysisId:string|null;valid:StoryReference[];invalid:StoryEvidenceIssue[];facts:{reference:StoryReference;anchors:SemanticAnchor[];snapshotAnchors:Extract<StoryReference,{type:'snapshot_source'}>[]}[];basisUnavailable:boolean};
export type StoryView={reviewId:string;snapshotId:string;currentSnapshotId:string;currentAnalysisId:string|null;storyRevision:number;contextRevision:number;seriesAuthor:StoryAuthor|null;currentVersion:StoryVersionSummary|null;version:StoryVersion|null;versions:StoryVersionSummary[];newerVersion:boolean;newerContext:boolean;historicalAnalysis:boolean;staticNeighborhoodAvailable:boolean;basisUnavailable:boolean;brokenEvidence:StoryEvidenceIssue[]};
export type StoryContextView={reviewId:string;snapshotId:string;currentContextRevision:number;selectedRevision:number;selectedCaptureIds:string[];captures:StoryCapture[];missingKinds:('Epic'|'Ticket'|'PR')[]};
export const storyCanonical=(value:unknown):string=>{
 if(Array.isArray(value))return `[${value.map(storyCanonical).join(',')}]`;
 if(value!==null&&typeof value==='object')return `{${Object.entries(value).filter(([,value])=>value!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,value])=>`${JSON.stringify(key)}:${storyCanonical(value)}`).join(',')}}`;
 return JSON.stringify(value)??'null';
};
export const storyReferences=(story:StoryContent):StoryReference[]=>{
 const references=[...story.claims.flatMap(claim=>claim.references),...story.scope.flatMap(row=>row.type==='explained'?row.references:[]),...story.steps.flatMap(step=>step.focus.type==='sources'?step.focus.sources:step.focus.type==='semantic'?[step.focus.reference,...step.focus.sources]:[])];
 return [...new Map(references.map(reference=>[storyCanonical(reference),reference])).values()];
};
const fail=(error:StoryError):never=>{throw new Error(error);};
const unique=(values:readonly string[])=>new Set(values).size===values.length;
export const validateStoryStructure=(input:StoryContent,snapshot:Snapshot):void=>{
 const parsed=storyContentSchema.safeParse(input);if(!parsed.success)fail('invalid_request');const story=parsed.data!;
 const chapters=new Set(story.chapters.map(chapter=>chapter.id)),claims=new Map(story.claims.map(claim=>[claim.id,claim]));
 if(chapters.size!==story.chapters.length||claims.size!==story.claims.length||!unique(story.steps.map(step=>step.id))||!unique(story.captureIds))fail('story_structure_invalid');
 const steps=story.chapters.flatMap(chapter=>chapter.stepIds),usedClaims=new Set([...story.chapters.flatMap(chapter=>[chapter.why,chapter.what,chapter.how,chapter.example.input,chapter.example.before,chapter.example.after]),...story.steps.flatMap(step=>step.claimIds)]);
 if(!unique(steps)||steps.length!==story.steps.length||story.steps.some(step=>!steps.includes(step.id))||[...usedClaims].some(id=>!claims.has(id))||claims.size!==usedClaims.size)fail('story_structure_invalid');
 for(const step of story.steps){const stepRefs=new Set(step.claimIds.flatMap(id=>claims.get(id)?.references??[]).concat(step.focus.type==='sources'?step.focus.sources:step.focus.type==='semantic'?[step.focus.reference,...step.focus.sources]:[]).map(storyCanonical));if(stepRefs.size>8)fail('invalid_request');if(!unique(step.claimIds)||step.focus.type==='none'&&step.claimIds.some(id=>claims.get(id)?.basis!=='unknown'))fail('story_structure_invalid');}
 for(const claim of story.claims){const source=claim.references.some(ref=>ref.type==='snapshot_source'||ref.type==='semantic_source'),stat=claim.references.some(ref=>ref.type==='static_node'||ref.type==='static_edge');
  if(claim.basis==='source_observation'&&!source||claim.basis==='static_relationship'&&(!stat||!source)||claim.basis==='supplied_rationale'&&!claim.attribution&&!claim.references.some(ref=>ref.type==='capture')||claim.basis==='inference'&&(!claim.references.length||!claim.uncertainty)||claim.basis==='unknown'&&!claim.uncertainty)fail('story_structure_invalid');
 }
 const files=graphFiles(snapshot),keys=new Set(files.map(file=>file.key));
 if(files.length>512||story.scope.length!==files.length||!unique(story.scope.map(row=>row.fileKey))||story.scope.some(row=>!keys.has(row.fileKey)||row.type==='explained'&&(!chapters.has(row.chapterId)||!row.references.some(ref=>ref.type!=='clarification'))))fail('story_scope_invalid');
 let graph:ReturnType<typeof projectGraph>|undefined;
 for(const step of story.steps){const focus=step.focus;if(focus.type==='sources'){const file=files.find(file=>file.key===focus.fileKey);if(!file||focus.sources.some(ref=>ref.anchor.path!==(ref.anchor.side==='base'?file.oldPath:file.newPath)))fail('story_reference_invalid');}
  if(focus.type==='structural'){if(!keys.has(focus.fileKey))fail('story_reference_invalid');if(focus.hunkId){graph??=projectGraph(snapshot);const node=graph.nodes.find(node=>node.id===focus.hunkId&&node.kind==='hunk');const file=files.find(file=>file.key===focus.fileKey)!;if(!node||node.fileKey!==undefined&&node.fileKey!==focus.fileKey||node.path!==(node.side==='base'?file.oldPath:file.newPath))fail('story_reference_invalid');}}
 }
 if(storyReferences(story).length>256)fail('invalid_request');
};
export const validateStorySemanticFocus=(story:StoryContent,facts:ReadonlyMap<string,Pick<StoryEvidence['facts'][number],'anchors'|'snapshotAnchors'>>):void=>{
 const matches=(reference:Extract<StoryReference,{type:'snapshot_source'|'semantic_source'}>,fact:Pick<StoryEvidence['facts'][number],'anchors'|'snapshotAnchors'>):boolean=>{
  if(reference.type==='semantic_source')return fact.anchors.some(anchor=>anchor.snapshotId===reference.anchor.snapshotId&&anchor.side===reference.anchor.side&&anchor.path===reference.anchor.path&&anchor.contentHash===reference.anchor.contentHash&&reference.anchor.start>=anchor.start&&reference.anchor.end<=anchor.end);
  return fact.snapshotAnchors.some(source=>source.anchor.snapshotId===reference.anchor.snapshotId&&source.anchor.side===reference.anchor.side&&source.anchor.path===reference.anchor.path&&source.contentHash===reference.contentHash&&reference.anchor.startLine>=source.anchor.startLine&&reference.anchor.endLine<=source.anchor.endLine);
 };
 for(const claim of story.claims)if(claim.basis==='static_relationship')for(const reference of claim.references)if(reference.type==='static_node'||reference.type==='static_edge'){
  const fact=facts.get(storyCanonical(reference));
  if(!fact||!claim.references.some(source=>(source.type==='snapshot_source'||source.type==='semantic_source')&&matches(source,fact)))fail('story_reference_invalid');
 }
 for(const step of story.steps)if(step.focus.type==='semantic'){
  const focus=step.focus,fact=facts.get(storyCanonical(focus.reference));
  if(!fact||focus.sources.some(ref=>!matches(ref,fact)))fail('story_reference_invalid');
 }
};
