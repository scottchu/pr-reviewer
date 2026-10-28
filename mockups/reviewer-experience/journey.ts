import fixture from './fixture.json' with {type:'json'};
export type SourceKey=keyof typeof fixture.sources;
export type Side='before'|'after';
export const account='Local-owner requests now omit the Bearer header; explicit credentials keep their separate path. Refresh still reads the same pinned review and snapshot.';
export const proseIdentity={contentId:'pr25-local-review-account',version:1,contentHash:'538901f039c38d20985d69119fccd7030bafcf6cbab47b51720bbfb14a60ce65'};
export type Anchor={kind:'code';source:SourceKey;path:string;commit:string;side:Side;contentHash:string;startLine:number;endLine:number;startOffset:number;endOffset:number;quote:string}|{kind:'prose';contentId:string;version:number;contentHash:string;startOffset:number;endOffset:number;quote:string};
export const codeAnchor=(key:SourceKey,side:Side,start:number,end:number):Anchor=>{
 const source=fixture.sources[key][side];if(!source||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>source.text.length)throw new Error('source_selection_unavailable');
 const first=source.text.slice(0,start).split('\n').length-1,last=source.text.slice(0,end-1).split('\n').length-1;
 return {kind:'code',source:key,path:source.path,commit:source.commit,side,contentHash:source.contentHash,startLine:source.startLine+first,endLine:source.startLine+last,startOffset:source.startOffset+start,endOffset:source.startOffset+end,quote:source.text.slice(start,end)};
};
export const proseAnchor=(start:number,end:number):Anchor=>{
 if(start<0||end<=start||end>account.length)throw new Error('prose_selection_unavailable');
 return {kind:'prose',...proseIdentity,startOffset:start,endOffset:end,quote:account.slice(start,end)};
};
export type Frame={step:number;focus:SourceKey|null};
export type Journey={frame:Frame;returnFrame:Frame|null;history:Frame[];playing:false;story:boolean;selection:Anchor|null;draft:{anchor:Anchor|null;text:string};threadOpen:boolean;conflict:boolean;unavailable:boolean;delivery:'unavailable'|'unknown'};
export const initialJourney=():Journey=>({frame:{step:0,focus:null},returnFrame:null,history:[],playing:false,story:true,selection:null,draft:{anchor:null,text:''},threadOpen:false,conflict:false,unavailable:false,delivery:'unavailable'});
export type Intent={type:'inspect';source:SourceKey}|{type:'step';step:number}|{type:'select';anchor:Anchor}|{type:'draft';text:string}|{type:'resume'|'back'|'comment'|'closeThread'|'openThread'|'keepDraft'|'replaceDraft'|'missing'|'unknown'|'sourceOnly'|'story'};
const focuses:(SourceKey|null)[]=[null,'request','helper','refresh','test'];
export const transition=(s:Journey,a:Intent):Journey=>{
 switch(a.type){
  case 'inspect':return {...s,frame:{...s.frame,focus:a.source},returnFrame:s.story?(s.returnFrame??s.frame):null,history:[...s.history,s.frame].slice(-12),unavailable:false};
  case 'step':return {...s,frame:{step:Math.max(0,Math.min(4,a.step)),focus:focuses[a.step]??null},returnFrame:null,history:[],unavailable:false};
  case 'resume':return s.returnFrame?{...s,frame:s.returnFrame,returnFrame:null,history:[],unavailable:false}:s;
  case 'back':{const frame=s.history.at(-1);return frame?{...s,frame,history:s.history.slice(0,-1),unavailable:false}:s;}
  case 'select':return {...s,selection:a.anchor};
  case 'comment':return s.selection?{...s,threadOpen:true,conflict:Boolean(s.draft.text&&JSON.stringify(s.selection)!==JSON.stringify(s.draft.anchor)),draft:s.draft.text?s.draft:{anchor:s.selection,text:''}}:s;
  case 'draft':return {...s,draft:{...s.draft,text:a.text}};
  case 'closeThread':return {...s,threadOpen:false,conflict:false};
  case 'openThread':return {...s,threadOpen:true};
  case 'keepDraft':return {...s,conflict:false,selection:s.draft.anchor};
  case 'replaceDraft':return {...s,conflict:false,draft:{anchor:s.selection,text:''}};
  case 'missing':return {...s,unavailable:true};
  case 'unknown':return {...s,delivery:'unknown'};
  case 'sourceOnly':return {...s,story:false,frame:{step:0,focus:null},returnFrame:null,history:[]};
  case 'story':return {...s,story:true,frame:{step:0,focus:null},returnFrame:null,history:[]};
 }
};
