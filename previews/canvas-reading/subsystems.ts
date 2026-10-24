import type {Frame,Group} from './state.ts';
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
export type DiscussionPreview=Readonly<{delivery:'not_attached'|'idle'|'unknown';prose:'current'|'newer'|'missing';viewingOriginal:boolean}>;
export const initialDiscussion=():DiscussionPreview=>({delivery:'not_attached',prose:'current',viewingOriginal:false});
export type DiscussionAction={type:'delivery';delivery:DiscussionPreview['delivery']}|{type:'prose';prose:DiscussionPreview['prose']}|{type:'original'};
export const discussionTransition=(state:DiscussionPreview,action:DiscussionAction):DiscussionPreview=>action.type==='delivery'?{...state,delivery:action.delivery}:action.type==='prose'?{...state,prose:action.prose,viewingOriginal:false}:state.prose==='missing'?state:{...state,viewingOriginal:true};

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
