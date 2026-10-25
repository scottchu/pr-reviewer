import type {Change,FileTree,TreeNode} from './tree.ts';
export type ImportRecord={from:string;side:string;commit:string;sourceHash:string;sourceLine:number;startOffset:number;endOffset:number;specifier:string;target:string|null;targetHash:string|null};
export type ImportLink={id:string;source:string;target:string;targetPath:string;kind:'imports';change:Change;citations:ImportRecord[]};
export type ImportProjection={contexts:TreeNode[];links:ImportLink[];unresolved:ImportRecord[]};
export const projectImports=(tree:FileTree,fixture:{records:readonly ImportRecord[]},selected:string|null):ImportProjection=>{
 const origin=tree.nodes.find(n=>n.kind==='file'&&n.path===selected);if(!origin)return {contexts:[],links:[],unresolved:[]};
 const records=fixture.records.filter(r=>r.from===selected),unresolved=records.filter(r=>!r.target),grouped=new Map<string,ImportRecord[]>();
 for(const r of records){if(!r.target)continue;const group=grouped.get(r.target)??[];group.push(r);grouped.set(r.target,group);}
 const contexts:TreeNode[]=[],links:ImportLink[]=[];
 for(const [path,citations] of [...grouped.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0)){
  let target=tree.nodes.find(n=>n.kind==='file'&&n.path===path);
  if(!target){const name=path.split('/').at(-1)!,width=Math.ceil(name.length*7.4+12),x=origin.x+origin.width+160;let y=origin.y+contexts.length*34;
   const overlaps=(n:TreeNode)=>x<n.x+n.width+10&&x+width+10>n.x&&y<n.y+n.height+6&&y+28>n.y;
   while([...tree.nodes,...contexts].some(overlaps))y+=28;
   target={id:`context:${path}`,path,name,kind:'file',change:'unchanged',depth:origin.depth+1,x,y,width,height:22};contexts.push(target);
  }
  const before=citations.some(r=>r.side==='before'),after=citations.some(r=>r.side==='after');
  links.push({id:`imports:${origin.path}:${path}`,source:origin.id,target:target.id,targetPath:path,kind:'imports',change:before&&after?'unchanged':after?'added':'deleted',citations});
 }
 return {contexts,links,unresolved};
};
export const citationText=(records:readonly ImportRecord[])=>records.map(r=>`${r.side} ${r.commit}\n${r.from}:${r.sourceLine} UTF-16[${r.startOffset},${r.endOffset})\nsource SHA-256 ${r.sourceHash}\nimports ${r.specifier} → ${r.target??'unresolved'}\ntarget SHA-256 ${r.targetHash??'unavailable'}`).join('\n\n');
