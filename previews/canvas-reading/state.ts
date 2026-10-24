export type Group='request'|'refresh'|'access';
export type Viewport=Readonly<{x:number;y:number;zoom:number}>;
export type CodeAnchor=Readonly<{kind:'code';side:'base'|'head';path:string;startLine:number;endLine:number}>;
export type ProseAnchor=Readonly<{kind:'prose';contentId:string;version:string;contentHash:string;start:number;end:number;quote:string}>;
export type CommentAnchor=CodeAnchor|ProseAnchor;
export type Thread=Readonly<{id:string;anchor:CommentAnchor;author:'human'|'agent';body:string;draft:string;replies:readonly string[]}>;
export type Frame=Readonly<{group:Group;lens:'overview'|'focus';viewport:Viewport;expanded:boolean;selection:CodeAnchor|null;story:{version:string;cursor:number};draft:{id:string;text:string;anchor:CodeAnchor|null}}>;
export type Scene=Readonly<{frame:Frame;back:readonly Frame[];resume:Frame|null;threads:readonly Thread[];activeThread:string|null;notice:string}>;
export const explanation={id:'auth-header-explanation',version:'mock-auth-account-v1',contentHash:'4318dbd058e75e04653aeba7188d113360ff487ed7dc45d66f6b821be0443b0a',text:'The request helper delegates header selection to accessHeaders. The local owner marker produces no owner Authorization header; an explicit credential still produces a Bearer header. Pinned source alone does not establish runtime delivery or network isolation.'} as const;
const phrase='header selection to accessHeaders',start=explanation.text.indexOf(phrase);
export const initialScene=():Scene=>({
 frame:{group:'request',lens:'overview',viewport:{x:0,y:0,zoom:1},expanded:false,selection:null,story:{version:'preview-story-v1',cursor:0},draft:{id:'prior-question-draft',text:'',anchor:null}},back:[],resume:null,activeThread:null,notice:'',
 threads:[{id:'agent-code',author:'agent',anchor:{kind:'code',side:'head',path:'src/application/review.ts',startLine:30,endLine:30},body:'Simulated agent note: this call site points to the added header helper; runtime delivery remains unobserved.',draft:'',replies:[]},{id:'human-code',author:'human',anchor:{kind:'code',side:'head',path:'src/application/review.ts',startLine:30,endLine:30},body:'Does the explicit credential path still send a Bearer header?',draft:'',replies:[]},{id:'agent-prose',author:'agent',anchor:{kind:'prose',contentId:explanation.id,version:explanation.version,contentHash:explanation.contentHash,start,end:start+phrase.length,quote:phrase},body:'Source observation only: this account does not establish live delivery.',draft:'',replies:[]}]
});
export type Intent=
 |{type:'restore';frame:Frame}|{type:'viewport';viewport:Viewport}|{type:'focus';group:Group;origin?:Frame}|{type:'back'}|{type:'resume'}|{type:'expand'}|{type:'select';anchor:CodeAnchor}|{type:'draft';text:string}
 |{type:'thread';id:string|null}|{type:'comment';id:string;anchor:CommentAnchor}|{type:'reply';threadId:string;text:string}|{type:'saveReply';threadId:string}|{type:'story';cursor:number};
export const transition=(state:Scene,intent:Intent):Scene=>{
 const frame=state.frame;
 switch(intent.type){
  case 'restore':return {...state,frame:structuredClone(intent.frame),back:[],resume:null,activeThread:null,notice:'Restored the retained authored canvas frame.'};
  case 'viewport':return {...state,frame:{...frame,viewport:intent.viewport}};
  case 'expand':return {...state,frame:{...frame,expanded:!frame.expanded}};
  case 'draft':return {...state,frame:{...frame,draft:{...frame.draft,text:intent.text}}};
  case 'select':return {...state,frame:{...frame,selection:intent.anchor}};
  case 'focus':return {...state,resume:state.resume??structuredClone(intent.origin??frame),back:[...state.back,structuredClone(intent.origin??frame)].slice(-16),frame:{...frame,group:intent.group,lens:'focus',viewport:{x:0,y:0,zoom:1},selection:null},activeThread:null,notice:'Reading source in the same canvas. Your prior draft is unchanged.'};
  case 'back':{const previous=state.back.at(-1);return previous?{...state,frame:previous,back:state.back.slice(0,-1),activeThread:null,notice:'Restored the exact prior canvas frame.'}:state;}
  case 'resume':return state.resume?{...state,frame:state.resume,resume:null,back:[],activeThread:null,notice:'Resumed the saved story frame and prior draft.'}:state;
  case 'thread':return {...state,activeThread:intent.id};
  case 'comment':return {...state,threads:[...state.threads,{id:intent.id,anchor:intent.anchor,author:'human',body:'',draft:'',replies:[]}],activeThread:intent.id,notice:'Local mock draft only. Nothing is submitted or persisted.'};
  case 'reply':return {...state,threads:state.threads.map(thread=>thread.id===intent.threadId?{...thread,draft:intent.text}:thread)};
  case 'saveReply':return {...state,threads:state.threads.map(thread=>thread.id===intent.threadId&&thread.draft.trim()?{...thread,body:thread.body||thread.draft,replies:thread.body?[...thread.replies,thread.draft]:thread.replies,draft:''}:thread),notice:'Added to this memory-only mock thread. Reload clears local changes.'};
  case 'story':return {...state,frame:{...frame,story:{...frame.story,cursor:intent.cursor}}};
 }
};

export const selectedProseAnchor=(start:number,end:number):ProseAnchor|null=>{
 const text=explanation.text,boundary=(offset:number)=>!(offset>0&&offset<text.length&&/[\uD800-\uDBFF]/.test(text[offset-1]!)&&/[\uDC00-\uDFFF]/.test(text[offset]!));
 return Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=text.length&&boundary(start)&&boundary(end)?{kind:'prose',contentId:explanation.id,version:explanation.version,contentHash:explanation.contentHash,start,end,quote:text.slice(start,end)}:null;
};
