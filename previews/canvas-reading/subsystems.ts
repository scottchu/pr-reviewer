import {explanation,selectedProseAnchor} from './state.ts';
import type {ProseAnchor,Frame,Group} from './state.ts';
export type Scenario='canvas'|'story'|'discussion'|'tests'|'import'|'integrated';
export const scenarioNames:Record<Scenario,string>={canvas:'Canvas / diff',story:'Story / exploration',discussion:'Discussion / participants',tests:'Tests / evidence',import:'Import / history',integrated:'Connected review'};
export type StoryPreview=Readonly<{playing:boolean;step:number;condition:'ready'|'missing'|'stale';returnFrame:Frame|null;version:'preview-story-v1'}>;
export const storySteps:readonly Readonly<{group:Group;title:string;what:string;how:string;example:string;limit:string}>[]=[
 {group:'request',title:'Stop constructing an owner Bearer in every request',what:'The head request delegates header construction to accessHeaders.',how:'The changed call site is head review.ts:30.',example:'The local owner marker reaches the helper instead of being interpolated directly into Bearer.',limit:'Product motivation and live behavior are not proved by the source.'},
 {group:'access',title:'Keep explicit credentials explicit',what:'The new helper distinguishes the stable local marker from another credential.',how:'The ternary returns {} for local owner and Authorization: Bearer for other input.',example:'A participant credential still takes the explicit Bearer branch.',limit:'This static account does not prove an attachment, delivery or network boundary.'},
 {group:'refresh',title:'The unchanged caller still reads through request',what:'refresh still calls request for the pinned review.',how:'Its extracted body is byte-identical across base/head.',example:'The caller and its revision/read fences remain in the supplied source.',limit:'No runtime result or repository-wide caller completeness is shown.'}
];
export const initialStory=():StoryPreview=>({playing:false,step:0,condition:'ready',returnFrame:null,version:'preview-story-v1'});
export type StoryAction={type:'play'}|{type:'pause'}|{type:'step';step:number}|{type:'condition';condition:StoryPreview['condition']}|{type:'explore';frame:Frame}|{type:'resume'};
export const storyTransition=(state:StoryPreview,action:StoryAction):StoryPreview=>{
 switch(action.type){case 'play':return state.condition==='ready'&&!state.returnFrame?{...state,playing:true}:state;case 'pause':return {...state,playing:false};case 'step':return {...state,step:Math.max(0,Math.min(2,action.step)),playing:action.step>=3?false:state.playing};case 'condition':return {...state,condition:action.condition,playing:false};case 'explore':return {...state,playing:false,returnFrame:state.returnFrame??structuredClone(action.frame)};case 'resume':return state.condition==='ready'?{...state,playing:false,returnFrame:null}:state;}
};

export const newerExplanation={id:'auth-header-explanation',version:'mock-auth-account-v2',contentHash:'f4c5eaadcdd64b583896e699e524f2f5567c05704af49879a6da6659fcdc69c0',text:'This newer local account separates the source call from live delivery. accessHeaders changes request headers; attachment and notification evidence remain unavailable.'} as const;
export type DiscussionPreview=Readonly<{delivery:'not_attached'|'idle'|'unknown';prose:'current'|'newer'|'missing';viewingOriginal:boolean;originalUnavailable:boolean}>;
export const initialDiscussion=():DiscussionPreview=>({delivery:'not_attached',prose:'current',viewingOriginal:false,originalUnavailable:false});
export const resolveProseAnchor=(anchor:ProseAnchor)=>[explanation,newerExplanation].find(content=>content.id===anchor.contentId&&content.version===anchor.version&&content.contentHash===anchor.contentHash&&selectedProseAnchor(anchor.start,anchor.end,content)?.quote===anchor.quote)??null;
export type DiscussionAction={type:'delivery';delivery:DiscussionPreview['delivery']}|{type:'prose';prose:DiscussionPreview['prose']}|{type:'original'}|{type:'locate';anchor:ProseAnchor};
export const discussionTransition=(state:DiscussionPreview,action:DiscussionAction):DiscussionPreview=>{
 if(action.type==='delivery')return {...state,delivery:action.delivery};
 if(action.type==='prose')return {...state,prose:action.prose,viewingOriginal:false,originalUnavailable:action.prose==='missing'?true:action.prose==='current'?false:state.originalUnavailable};
 if(action.type==='original')return state.originalUnavailable?state:{...state,viewingOriginal:true};
 const content=resolveProseAnchor(action.anchor);if(!content)return state;
 return content.version===newerExplanation.version?{...state,prose:'newer',viewingOriginal:false}:{...state,prose:state.originalUnavailable?'missing':'current',viewingOriginal:false};
};

export type MockJobState='queued'|'preparing'|'running'|'cancel_requested'|'cancelled'|'passed'|'failed'|'unknown';
export type MockJob=Readonly<{jobId:string;jobRevision:number;commandId:string;invocationId:string;resultId:string|null;state:MockJobState;effectDisposition:'none'|'unresolved'|'quiescent';headSha:string;environment:string;provenance:'test_only_execution';counts:{passed:number;failed:number}|null}>;
export type TestsPreview=Readonly<{simulation:boolean;sequence:number;selected:string|null;jobs:readonly MockJob[]}>;
export const initialTests=():TestsPreview=>({simulation:false,sequence:0,selected:null,jobs:[]});
export const testsTransition=(state:TestsPreview,action:{type:'enable'}|{type:'request';head:string}|{type:'observe';state:MockJobState}|{type:'select';id:string}|{type:'history';head:string}):TestsPreview=>{
 if(action.type==='enable')return {...state,simulation:true};
 if(action.type==='select')return state.jobs.some(job=>job.jobId===action.id)?{...state,selected:action.id}:state;
 if(action.type==='request'||action.type==='history'){
  if(!state.simulation)return state;const sequence=state.sequence+1,jobId=`mock-job-${sequence}`,historical=action.type==='history';
  const job:MockJob={jobId,jobRevision:1,commandId:`mock-command-${sequence}`,invocationId:`mock-invocation-${sequence}`,resultId:historical?`mock-result-${sequence}`:null,state:historical?'passed':'queued',effectDisposition:historical?'quiescent':'none',headSha:action.head,environment:historical?'historical-fixture-environment':'current-fixture-environment',provenance:'test_only_execution',counts:historical?{passed:3,failed:0}:null};
  return {...state,sequence,selected:jobId,jobs:[...state.jobs,job]};
 }
 return {...state,jobs:state.jobs.map(job=>{if(job.jobId!==state.selected||['passed','failed','cancelled'].includes(job.state))return job;const terminal=['passed','failed','cancelled'].includes(action.state),result=action.state==='passed'||action.state==='failed';return {...job,jobRevision:job.jobRevision+1,state:action.state,effectDisposition:terminal?'quiescent':action.state==='queued'?'none':'unresolved',resultId:result?`mock-result-${job.jobId}`:null,counts:result?{passed:action.state==='passed'?3:2,failed:action.state==='failed'?1:0}:null};})};
};

export const importCandidates=[{id:'pr24',number:24,title:'Retained behavior neighborhood',head:'b096826e31c0927190806de91ed70b8b64aa93d8',prepared:false},{id:'pr25',number:25,title:'Single-owner workspace without manual credentials',head:'e3b270e5f49a9215452b0b86702946043e979059',prepared:true}] as const;
export type ImportPreview=Readonly<{path:string;phase:'empty'|'choosing'|'acquiring'|'ready'|'unavailable'|'failed'|'unknown';candidate:'pr24'|'pr25'|null;jobId:string|null;reason:string}>;
export const initialImport=():ImportPreview=>({path:'',phase:'empty',candidate:null,jobId:null,reason:''});
export type ImportAction={type:'path';path:string}|{type:'discover'}|{type:'choose';candidate:'pr24'|'pr25'}|{type:'observe';phase:'ready'|'unavailable'|'failed'|'unknown'};
export const importTransition=(state:ImportPreview,action:ImportAction):ImportPreview=>{
 if(action.type==='path')return {...state,path:action.path};
 if(action.type==='discover')return state.path.trim()?{...state,phase:'choosing',candidate:null,jobId:'mock-import-request',reason:'Two example candidates; no actual path or provider discovery.'}:state;
 if(action.type==='choose'){if(state.phase!=='choosing')return state;return {...state,candidate:action.candidate,phase:action.candidate==='pr24'?'unavailable':'acquiring',reason:action.candidate==='pr24'?'PR24 exists, but its source account is not prepared in this preview.':'Simulated acquisition; the displayed review stays usable.'};}
 if(state.phase!=='acquiring')return state;
 return {...state,phase:action.phase,reason:action.phase==='ready'?'Mock result ready; explicit Open is required.':action.phase==='unknown'?'Outcome unknown; no automatic replay or invented source result.':action.phase==='failed'?'Simulated source verification failure; old review retained.':'Simulated source unavailable; old review retained.'};
};
