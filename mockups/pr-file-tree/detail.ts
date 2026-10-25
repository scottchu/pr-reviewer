import type {FileTree} from './tree.ts';
export type DetailState={expanded:string|null;lastZoom:number};
export type DetailIntent={type:'focus';path:string|null}|{type:'zoom';zoom:number;focal:string|null};
export const detailTransition=(s:DetailState,a:DetailIntent):DetailState=>{
 if(a.type==='focus')return {...s,expanded:a.path};
 if(a.zoom<s.lastZoom-.001&&a.zoom<=1.08)return {expanded:null,lastZoom:a.zoom};
 if(a.zoom>s.lastZoom+.001&&a.zoom>=1.3&&a.focal)return {expanded:s.expanded??a.focal,lastZoom:a.zoom};
 return {...s,lastZoom:a.zoom};
};
export const nearbyFile=(tree:FileTree,p:{x:number;y:number},radius:number):string|null=>{
 const candidates=tree.nodes.filter(n=>n.kind==='file').map(n=>({path:n.path,distance:Math.hypot(Math.max(n.x-p.x,0,p.x-n.x-n.width),Math.max(n.y-p.y,0,p.y-n.y-n.height))})).sort((a,b)=>a.distance-b.distance);
 return candidates[0]&&candidates[0].distance<=radius?candidates[0].path:null;
};
export const detailTree=(tree:FileTree,path:string|null,narrow:boolean):FileTree=>{
 const selected=tree.nodes.find(n=>n.kind==='file'&&n.path===path);if(!selected)return tree;const height=narrow?580:520,extra=height-selected.height+18;
 return {edges:tree.edges,nodes:tree.nodes.map(n=>n.id===selected.id?{...n,width:narrow?324:760,height}:n.y>selected.y?{...n,y:n.y+extra}:n)};
};
