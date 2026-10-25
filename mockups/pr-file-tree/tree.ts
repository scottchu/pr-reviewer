export type Change='added'|'modified'|'deleted'|'unchanged';
export type TreeNode={id:string;path:string;name:string;kind:'directory'|'file';depth:number;x:number;y:number;width:number;height:22;change:Change};
export type TreeEdge={id:string;source:string;target:string;kind:'contains'};
export type FileTree={nodes:TreeNode[];edges:TreeEdge[]};
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
export const buildTree=(paths:readonly string[],changes:Readonly<Record<string,string>>={}):FileTree=>{
 const entries=new Map<string,{id:string;path:string;name:string;kind:'directory'|'file';depth:number}>();
 entries.set('directory:.',{id:'directory:.',path:'.',name:'pr-reviewer',kind:'directory',depth:0});
 const edges=new Map<string,TreeEdge>();
 for(const path of [...new Set(paths)].sort(compare)){
  const parts=path.split('/');if(!path||parts.some(p=>!p||p==='.'||p==='..'))throw new Error('invalid_repository_path');
  let parent='directory:.';
  for(let i=0;i<parts.length;i++){
   const part=parts[i]!,full=parts.slice(0,i+1).join('/'),kind=i===parts.length-1?'file':'directory',id=`${kind}:${full}`;
   entries.set(id,{id,path:full,name:part,kind,depth:i+1});edges.set(id,{id:`contains:${id}`,source:parent,target:id,kind:'contains'});parent=id;
  }
 }
 const children=new Map<string,string[]>();for(const e of edges.values()){const list=children.get(e.source)??[];list.push(e.target);children.set(e.source,list);}
 for(const list of children.values())list.sort((a,b)=>{const x=entries.get(a)!,y=entries.get(b)!;return compare(x.name,y.name)||compare(x.kind,y.kind);});
 const columnWidths=new Map<number,number>();for(const n of entries.values())if(n.kind==='directory')columnWidths.set(n.depth,Math.max(columnWidths.get(n.depth)??0,n.name.length*7.4+12));
 const xs=[0];const maxDepth=Math.max(...[...entries.values()].map(n=>n.depth));for(let i=0;i<maxDepth;i++)xs.push(xs[i]!+Math.max(140,(columnWidths.get(i)??0)+48));
 const positions=new Map<string,number>();let row=0;
 const place=(id:string):number=>{const list=children.get(id)??[];if(!list.length){const y=row++*28;positions.set(id,y);return y;}const ys=list.map(place),y=(ys[0]!+ys.at(-1)!)/2;positions.set(id,y);return y;};place('directory:.');
 const nodes=[...entries.values()].sort((a,b)=>compare(a.id,b.id)).map(n=>({...n,x:xs[n.depth]!,y:positions.get(n.id)!,width:Math.ceil(n.name.length*7.4+12)+(n.kind==='file'&&changes[n.path]?14:0),height:22 as const,change:(n.kind==='file'?changes[n.path]??'unchanged':'unchanged') as Change}));
 return {nodes,edges:[...edges.values()].sort((a,b)=>compare(a.id,b.id))};
};
