import type {GraphEntity, GraphRelation, SourceAnchor, SourceGraph} from './types.ts';
import {collectEntities} from './validation.ts';
import {changeForSubject, loadChangeModel, changeSourceComparison, type SourceChange} from './change-model.ts';

export type SourceRelationship = Readonly<{
    id: string; relation: 'calls' | 'constructs'; ownerId: string; targetId: string;
    targetLabel: string; targetSource: SourceAnchor; relationIds: readonly string[]; source: SourceAnchor;
}>;
export type ChangeRelationships = Readonly<{
    references: readonly SourceRelationship[];
    implementationLink: 'supplied' | 'not-established';
}>;
type Witness = Readonly<{id: string; anchor: SourceAnchor}>;
type Call = Readonly<{id: string; site: Readonly<{sourceText: string; anchor: SourceAnchor}>}>;
const isWitness=(value:unknown):value is Witness=>{
    if(!value||typeof value!=='object')return false;
    const witness=value as Partial<Witness>;
    return typeof witness.id==='string'&&Boolean(witness.id)&&Boolean(witness.anchor)&&typeof witness.anchor==='object';
};
const witnesses = (entity: GraphEntity): readonly Witness[] =>
    Array.isArray(entity.data.sourceWitnesses)&&entity.data.sourceWitnesses.every(isWitness) ? entity.data.sourceWitnesses : [];
const isCall=(value:unknown):value is Call=>{
    if(!value||typeof value!=='object')return false;
    const call=value as Partial<Call>;
    return typeof call.id==='string'&&Boolean(call.id)&&Boolean(call.site)&&typeof call.site?.sourceText==='string'&&Boolean(call.site.sourceText)&&Boolean(call.site.anchor);
};
const sourceCalls = (relation: GraphRelation): readonly Call[] =>
    Array.isArray(relation.data.sourceCalls)&&relation.data.sourceCalls.every(isCall) ? relation.data.sourceCalls : [];
const caches = new WeakMap<SourceGraph, Map<string, ChangeRelationships>>();
const registries = new WeakMap<SourceGraph, readonly GraphEntity[]>();
const registry = (graph: SourceGraph) => {
    let value=registries.get(graph);
    if(!value){value=collectEntities(graph.entities);registries.set(graph,value);}
    return value;
};
const sameAnchor = (a: SourceAnchor, b: SourceAnchor) =>
    ['repository','side','commit','path','contentHash','start','end','startLine','endLine'].every(key=>
        a[key as keyof SourceAnchor]===b[key as keyof SourceAnchor]);
const contains = (outer: SourceAnchor, inner: SourceAnchor) =>
    outer.repository===inner.repository && outer.side===inner.side && outer.commit===inner.commit &&
    outer.path===inner.path && outer.contentHash===inner.contentHash &&
    outer.start<=inner.start && outer.end>=inner.end && outer.startLine<=inner.startLine && outer.endLine>=inner.endLine;

/** References to existing admitted facts, never a new call analyzer or name-based binding. */
export const changeSourceRelationships = (graph: SourceGraph, change: SourceChange): ChangeRelationships => {
    const admitted=changeForSubject(loadChangeModel(graph),change.subject.id);
    if(admitted!==change && JSON.stringify(admitted)!==JSON.stringify(change)) throw new Error('change_relationship_scope_invalid');
    let cache=caches.get(graph);
    if(!cache){cache=new Map();caches.set(graph,cache);}
    const known=cache.get(change.id);if(known)return known;
    const entities=registry(graph),byId=new Map(entities.map(entity=>[entity.id,entity]));
    const references:SourceRelationship[]=[];
    const validAnchor = (value: unknown): value is SourceAnchor => {
        if(!value||typeof value!=='object')return false;
        const a=value as SourceAnchor;
        if(!['base','head'].includes(a.side)||a.repository!==change.comparison.repository||
            a.commit!==(a.side==='base'?change.comparison.base:change.comparison.head)||
            !Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start<0||a.end<=a.start||
            !Number.isInteger(a.startLine)||!Number.isInteger(a.endLine)||a.startLine<1||a.endLine<a.startLine)return false;
        const file=entities.find(entity=>entity.kind==='file'&&entity.data.path===a.path&&entity.data.repository===a.repository);
        const sides=file?.data.sourceEvidence as readonly {side:string;commit:string;available:boolean;contentHash?:string}[]|undefined;
        return Boolean(Array.isArray(sides)&&sides.some(side=>side.side===a.side&&side.commit===a.commit&&side.available&&side.contentHash===a.contentHash));
    };
    const qualifiedTarget = (target: GraphEntity, source: SourceAnchor) => {
        const selected=witnesses(target).filter(w=>w.id&&validAnchor(w.anchor)&&w.anchor.side===source.side);
        return selected.length===1?selected[0]!.anchor:undefined;
    };
    const owns = (owner: GraphEntity, source: SourceAnchor) => {
        if(!validAnchor(source))return false;
        if(change.subject.kind==='file')return owner.kind!=='file' && witnesses(owner).some(w=>validAnchor(w.anchor)&&contains(w.anchor,source)) &&
            byId.get(change.fileId)?.data.path===source.path;
        return owner.id===change.subject.id && witnesses(owner).some(w=>validAnchor(w.anchor)&&contains(w.anchor,source));
    };
    const temporal = (edge: GraphRelation, source: SourceAnchor) =>
        edge.version==='comparison'||edge.version===(source.side==='base'?'before':'after');
    const append = (edge: GraphRelation, owner: GraphEntity, target: GraphEntity, source: SourceAnchor, ids: readonly string[]) => {
        const targetSource=qualifiedTarget(target,source);
        if(!['function','test'].includes(owner.kind)||!owns(owner,source)||!targetSource||!temporal(edge,source))return;
        const id=JSON.stringify([edge.id,source.side,source.start,source.end]);
        if(references.some(ref=>ref.id===id))return;
        references.push({id,relation:edge.relation as 'calls'|'constructs',ownerId:owner.id,targetId:target.id,
            targetLabel:typeof target.data.name==='string'?target.data.name:target.id,targetSource,relationIds:ids,source});
    };
    const native=changeSourceComparison(graph,change);
    const physicalRows=native.hunks.flatMap(hunk=>hunk.rows);
    const consistentCallText=(call:Call)=>{
        const anchor=call.site.anchor;
        if(anchor.startLine!==anchor.endLine)return true;
        const row=physicalRows.find(row=>(anchor.side==='base'?row.beforeLine:row.afterLine)===anchor.startLine);
        return !row||row.text.includes(call.site.sourceText);
    };
    for(const edge of graph.relations){
        if(!['calls','constructs'].includes(edge.relation))continue;
        const from=byId.get(edge.from),target=byId.get(edge.to);if(!from||!target)continue;
        if(edge.relation==='constructs'){
            const source=edge.data.sourceEvidence as SourceAnchor|undefined;
            if(target.kind==='header'&&validAnchor(source)&&witnesses(target).some(w=>sameAnchor(w.anchor,source)))append(edge,from,target,source,[edge.id]);
            continue;
        }
        if(target.kind!=='function'||edge.data.method!=='mechanically-supported-lexical-binding')continue;
        for(const call of sourceCalls(edge)){
            const source=call.site?.anchor;if(!call.id||!call.site?.sourceText||!validAnchor(source)||!temporal(edge,source)||!consistentCallText(call))continue;
            if(from.kind!=='callsite'){
                if(['function','test'].includes(from.kind))append(edge,from,target,source,[edge.id]);
                continue;
            }
            const incident=graph.relations.filter(relation=>relation.from===from.id||relation.to===from.id);
            const owners=incident.filter(relation=>relation.to===from.id&&relation.relation==='contains_call');
            const targets=incident.filter(relation=>relation.from===from.id&&relation.relation==='calls');
            const homes=incident.filter(relation=>relation.from===from.id&&relation.relation==='located_in');
            if(incident.length!==3||owners.length!==1||targets.length!==1||homes.length!==1||targets[0]!==edge)continue;
            const ownerEdge=owners[0]!,home=homes[0]!,owner=byId.get(ownerEdge.from);
            const range=home.data.range as {startLine?:number;endLine?:number}|undefined;
            if(!owner||!['function','test'].includes(owner.kind)||ownerEdge.version!==edge.version||home.version!==edge.version||
                ownerEdge.data.method!==edge.data.method||JSON.stringify(ownerEdge.data.sourceCalls)!==JSON.stringify(edge.data.sourceCalls)||
                byId.get(home.to)?.kind!=='file'||byId.get(home.to)?.data.path!==source.path||
                home.data.commit!==source.commit||home.data.sourceHash!==source.contentHash||
                range?.startLine!==source.startLine||range.endLine!==source.endLine||
                !validAnchor(home.data.sourceEvidence)||!sameAnchor(home.data.sourceEvidence,source)||
                !Array.isArray(from.data.occurrences)||
                !(from.data.occurrences as readonly SourceAnchor[]).some(anchor=>validAnchor(anchor)&&sameAnchor(anchor,source))||from.data.value!==call.site.sourceText)continue;
            append(edge,owner,target,source,[ownerEdge.id,edge.id,home.id]);
        }
    }
    const result:ChangeRelationships={references,implementationLink:references.some(ref=>ref.relation==='calls')?'supplied':'not-established'};
    cache.set(change.id,result);return result;
};
