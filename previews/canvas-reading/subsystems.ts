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
