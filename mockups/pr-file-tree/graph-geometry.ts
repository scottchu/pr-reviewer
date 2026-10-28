import { boxCollisions, pointCollisions } from './spatial-collisions.ts';
export type Point = Readonly<{x:number;y:number}>;
export type Box = Point & Readonly<{width:number;height:number}>;
export type LayoutNode = Readonly<{id:string;parentId?:string;position:Point;measured?:{width?:number;height?:number};style?:Readonly<{width?:unknown;height?:unknown;opacity?:unknown}>}>;
export type Link = Readonly<{id:string;source:string;target:string}>;
export type Side = 'left'|'right'|'top'|'bottom';
export const groupInterior = { padding: 20, top: 80 } as const;
export const dimensions = (node:LayoutNode) => ({width:Number(node.style?.width ?? node.measured?.width ?? 300),height:Number(node.style?.height ?? node.measured?.height ?? 90)});
const ranks = (ids:readonly string[],links:readonly Link[]) => {
 const values=new Map(ids.map(id=>[id,0]));const degree=new Map(ids.map(id=>[id,0]));
 const relevant=links.filter(link=>link.source!==link.target&&values.has(link.source)&&values.has(link.target));
 for(const edge of relevant)degree.set(edge.target,degree.get(edge.target)!+1);
 const queue=ids.filter(id=>degree.get(id)===0);
 for(let i=0;i<queue.length;i++){const id=queue[i]!;for(const edge of relevant.filter(edge=>edge.source===id)){values.set(edge.target,Math.max(values.get(edge.target)!,values.get(id)!+1));degree.set(edge.target,degree.get(edge.target)!-1);if(degree.get(edge.target)===0)queue.push(edge.target);}}
 return values;
};
/** Directory-first depth-first traversal; direct files follow child directory subtrees. */
export const compareFilePaths = (left: string, right: string): number => {
 const a = left.split('/');
 const b = right.split('/');
 for (let index = 0; index < Math.min(a.length, b.length); index++) {
  const aDirectory = index < a.length - 1;
  const bDirectory = index < b.length - 1;
  if (aDirectory !== bDirectory) return aDirectory ? -1 : 1;
  if (a[index] !== b[index]) return a[index]! < b[index]! ? -1 : 1;
 }
 return a.length - b.length;
};
const fileIndent = (id: string, paths: ReadonlyMap<string, string>): number =>
 paths.has(id) ? (paths.get(id)!.split('/').length - 1) * 24 : 0;

export const initialLayout = <T extends LayoutNode>(input:readonly T[],links:readonly Link[],focus='change',bands?:ReadonlyMap<string,number>,headers:Readonly<Record<string,number>>={},paths:ReadonlyMap<string,string>=new Map(),documents:ReadonlyMap<string,string>=new Map()):T[] => {
 const nodes=input.map(node=>({...node,position:{...node.position},style:{...node.style,opacity:1}}));
 for(const group of nodes.filter(node=>nodes.some(child=>child.parentId===node.id))){
  const children=nodes.filter(node=>node.parentId===group.id);const rank=ranks(children.map(node=>node.id),links);let y=headers[group.id]??groupInterior.top;let width=600;
  const rows=[...new Set(rank.values())].sort((a,b)=>a-b).map(value=>children.filter(node=>rank.get(node.id)===value));
  for(const row of rows)width=Math.max(width,row.reduce((sum,node)=>sum+dimensions(node).width,0)+(row.length-1)*120+64);
  for(const row of rows){let x=(width-row.reduce((sum,node)=>sum+dimensions(node).width,0)-(row.length-1)*120)/2;for(const child of row){child.position={x,y};x+=dimensions(child).width+120;}y+=Math.max(...row.map(node=>dimensions(node).height))+140;}
  group.style={...group.style,width,height:y-100+40};
 }
 const rootOf=(id:string):string=>nodes.find(node=>node.id===id)?.parentId??id;
 const roots=nodes.filter(node=>!node.parentId);const rootLinks=links.map(edge=>({...edge,source:rootOf(edge.source),target:rootOf(edge.target)}));const levels=bands ? new Map(roots.map(node => [node.id, bands.get(node.id) ?? 1])) : ranks(roots.map(node=>node.id),rootLinks);
 const columns=[...new Set(levels.values())].sort((a,b)=>a-b);let x=0;const xs=new Map<number,number>();
 for(const level of columns){xs.set(level,x);x+=Math.max(...roots.filter(node=>levels.get(node.id)===level).map(node=>dimensions(node).width+fileIndent(node.id,paths)))+300;}
 const focusX=xs.get(levels.get(focus)??0)??0;
 const documentHeight = Math.max(0, ...columns.map(level => {
  const column = roots.filter(node => levels.get(node.id) === level && documents.has(node.id));
  return column.reduce((height, node) => height + dimensions(node).height + 180, 0);
 }));
 for (const level of columns) {
  const column = roots.filter(node => levels.get(node.id) === level).sort((a, b) => {
   const aPath = paths.get(a.id) ?? documents.get(a.id);
   const bPath = paths.get(b.id) ?? documents.get(b.id);
   if (aPath !== undefined && bPath !== undefined) return compareFilePaths(aPath, bPath);
   return a.id === focus ? -1 : b.id === focus ? 1 : a.id.localeCompare(b.id);
  });
  let documentY = -documentHeight - 300;
  let codeY = 0;
  for (const node of column) {
   const document = documents.has(node.id);
   node.position = {x: xs.get(level)! - focusX + fileIndent(node.id, paths), y: document ? documentY : codeY};
   if (document) documentY += dimensions(node).height + 180;
   else codeY += dimensions(node).height + 180;
  }
 }
 return nodes as T[];
};
export const absoluteBoxes = (nodes:readonly LayoutNode[]):Map<string,Box> => {
 const result=new Map<string,Box>();const visit=(node:LayoutNode):Box=>{const known=result.get(node.id);if(known)return known;const parent=node.parentId?nodes.find(value=>value.id===node.parentId):undefined;const origin=parent?visit(parent):{x:0,y:0};const box={x:origin.x+node.position.x,y:origin.y+node.position.y,...dimensions(node)};result.set(node.id,box);return box;};for(const node of nodes)visit(node);return result;
};
export const sides = (source:Box,target:Box):[Side,Side] => {const dx=target.x+target.width/2-source.x-source.width/2;const dy=target.y+target.height/2-source.y-source.height/2;return Math.abs(dx)>=Math.abs(dy)?dx>=0?['right','left']:['left','right']:dy>=0?['bottom','top']:['top','bottom'];};
export const port = (box:Box,side:Side):Point => {const fraction=0.5;return {x:side==='left'?box.x:side==='right'?box.x+box.width:box.x+box.width*fraction,y:side==='top'?box.y:side==='bottom'?box.y+box.height:box.y+box.height*fraction};};
export const curve = (start:Point,end:Point,offset:Point) => {const middle={x:(start.x+end.x)/2+offset.x,y:(start.y+end.y)/2+offset.y};const control={x:2*middle.x-(start.x+end.x)/2,y:2*middle.y-(start.y+end.y)/2};const at=(t:number):Point=>({x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y});return {path:'M'+start.x+','+start.y+' Q'+control.x+','+control.y+' '+end.x+','+end.y,label:middle,at};};
const overlaps=(a:Box,b:Box)=>Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
export type Routed = Readonly<{sourceSide:Side;targetSide:Side;offset:Point;label:Point}>;
export const automaticRoutes = (nodes:readonly LayoutNode[],links:readonly Link[],sizes:Readonly<Record<string,{width:number;height:number}>>,manual:Readonly<Record<string,Point>>):Map<string,Routed> => {
 const boxes=absoluteBoxes(nodes);const obstacles=nodes.filter(node=>!nodes.some(child=>child.parentId===node.id)).map(node=>boxes.get(node.id)!);const groups=nodes.filter(node=>nodes.some(child=>child.parentId===node.id)).map(node=>boxes.get(node.id)!);
 const obstacleIndex=boxCollisions();for(const box of obstacles)obstacleIndex.add(box);const reserved=boxCollisions();const priorPoints=pointCollisions();const output=new Map<string,Routed>();
 const priority=(edge:Link)=>{const source=nodes.find(node=>node.id===edge.source);const target=nodes.find(node=>node.id===edge.target);return source?.parentId&&source.parentId===target?.parentId?0:nodes.some(node=>node.parentId===edge.source||node.parentId===edge.target)?2:1;};
 for(const edge of [...links].sort((a,b)=>priority(a)-priority(b))){const source=boxes.get(edge.source)!;const target=boxes.get(edge.target)!;const [sourceSide,targetSide]=sides(source,target);const start=port(source,sourceSide);const end=port(target,targetSide);const size=sizes[edge.id]??{width:240,height:75};const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy)||1;
 const normal=[0,80,-80,160,-160,240,-240,320,-320].filter(distance=>Math.abs(distance)<=Math.max(80,Math.min(320,length/2)));
 const tangent=[0,80,-80,160,-160,240,-240].filter(distance=>Math.abs(distance)<=length/4);
 const candidates=manual[edge.id]?[manual[edge.id]!]:normal.flatMap(distance=>tangent.map(along=>({x:-dy/length*distance+dx/length*along,y:dx/length*distance+dy/length*along})));
 let best=candidates[0]!;let bestScore=Infinity;
 for(const candidate of candidates){const route=curve(start,end,candidate);const label={x:route.label.x-size.width/2,y:route.label.y-size.height/2,...size};const points=Array.from({length:39},(_,i)=>route.at((i+1)/40));let hardCollisions=obstacleIndex.countOverlaps(label)+reserved.countOverlaps(label);let collisions=0;
 for(const box of groups)if(overlaps(box,label)&&!(label.x>=box.x&&label.y>=box.y&&label.x+label.width<=box.x+box.width&&label.y+label.height<=box.y+box.height))hardCollisions++;
 collisions+=points.filter(point=>obstacleIndex.containsPoint(point)||reserved.containsPoint(point)).length;collisions+=priorPoints.countInside(label);const score=hardCollisions*1000000000+collisions*10000+Math.hypot(candidate.x,candidate.y);if(score<bestScore){bestScore=score;best=candidate;}
 }
 const route=curve(start,end,best);reserved.add({x:route.label.x-size.width/2,y:route.label.y-size.height/2,...size});for(let i=0;i<39;i++)priorPoints.add(route.at((i+1)/40));output.set(edge.id,{sourceSide,targetSide,offset:best,label:route.label});
 }return output;
};
