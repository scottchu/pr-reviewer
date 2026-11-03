import type {SourceGraph, GraphEntity, SourceAnchor, SourceSide, DocumentWitness} from './types.ts';
import type {EditComposition} from './edit-composition.ts';
import {collectEntities} from './validation.ts';

export type ChangeSubjectKind = 'file' | 'function' | 'test';
export type ChangeOccurrence = Readonly<{side:'base'|'head'}> & (
    (Readonly<{presence:'present';occurrenceIds:readonly string[]}> & (Readonly<{source:'available';contentHash:string}> | Readonly<{source:'unavailable';reason:string}>)) |
    Readonly<{presence:'absent';basis:string}> |
    Readonly<{presence:'unavailable';reason:string}>);
export type ChangeRowReference = Readonly<{hunkIndex:number;rowIndex:number;line:number}>;
export type NativeChangeEvidence = Readonly<{ownerId:string;scope:'file'|'source unit'}> & (
    Readonly<{status:'available';removed:readonly ChangeRowReference[];added:readonly ChangeRowReference[]}> |
    Readonly<{status:'unavailable';reason:string}>);
export type SourceChange = Readonly<{
    id:string;kind:'change';comparison:Readonly<{repository:string;base:string;head:string}>;
    subject:Readonly<{id:string;kind:ChangeSubjectKind}>;fileId:string;fileChangeId?:string;
    status:'change'|'add'|'remove';basis:string;before:ChangeOccurrence;after:ChangeOccurrence;
    evidence:NativeChangeEvidence;
}>;
export type ChangeModel = Readonly<{version:1;changes:readonly SourceChange[];diagnostics:readonly Readonly<{subjectId:string;reason:string}>[]}>;
export type ChangeEditRow = Readonly<{line:number;text:string;hunkIndex:number;witness:DocumentWitness}>;
export type ChangeEvidence = Readonly<{composition:EditComposition;removed:readonly ChangeEditRow[];added:readonly ChangeEditRow[]}>;
type Witness = Readonly<{id:string;anchor:SourceAnchor}>;
const changed = new Set(['change','add','remove']);
const subjects = new Set(['file','function','test']);
const positive = (n:unknown):n is number => Number.isInteger(n) && Number(n)>0;
const canonical = (v:unknown):string => JSON.stringify(v,(_key,value:unknown) => value && typeof value==='object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))) : value);
const registries = new WeakMap<SourceGraph,readonly GraphEntity[]>();
const registry = (graph:SourceGraph) => {let known=registries.get(graph);if(!known){known=collectEntities(graph.entities);registries.set(graph,known);}return known;};

const nativeEvidence = (subject:GraphEntity, before:ChangeOccurrence, after:ChangeOccurrence, comparison:SourceChange['comparison'], path:string):NativeChangeEvidence => {
    const scope=subject.kind==='file'?'file':'source unit';
    const unavailable=(reason:string):NativeChangeEvidence=>({ownerId:subject.id,scope,status:'unavailable',reason});
    const c=subject.data.editComposition as EditComposition|undefined;
    if(!c || c.status==='unresolved')return unavailable(c?.reason ?? 'Native source edits unavailable');
    if(c.scope!==scope)return unavailable('Native edit scope mismatch');
    const removed:ChangeRowReference[]=[],added:ChangeRowReference[]=[];
    let previousHunk=0;
    const lastLine={base:0,head:0},terminal={base:false,head:false};
    const witnesses=(subject.data.sourceWitnesses ?? []) as readonly Witness[];
    for(const hunk of c.hunks){
        if(!positive(hunk.index)||hunk.index<=previousHunk||(scope==='file'&&hunk.index!==previousHunk+1))return unavailable('Native hunk index invalid');previousHunk=hunk.index;
        if(!hunk.rows.length||(scope==='file'&&!hunk.rows.some(row=>row.kind!=='context')))return unavailable('Empty or unedited native hunk');
        const header=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(hunk.header);
        if(!header)return unavailable('Native hunk header invalid');
        for(const side of ['base','head'] as const){
            const witness=side==='base'?hunk.before:hunk.after,occurrence=side==='base'?before:after;
            const ownRows=hunk.rows.filter(row=>(side==='base'?row.beforeLine:row.afterLine)!==null);
            if(!ownRows.length){
                if(witness||(scope==='file'&&Number(header[side==='base'?2:4]??1)!==0))return unavailable('Native witness/header without source rows');
                continue;
            }
            if(terminal[side]||ownRows.some((row,i)=>!row.text.length||(i<ownRows.length-1&&!row.text.endsWith('\n'))))return unavailable('Native physical newline invalid');
            terminal[side]=!ownRows.at(-1)!.text.endsWith('\n');
            const lines=ownRows.map(row=>side==='base'?row.beforeLine!:row.afterLine!);
            const start=Number(header[side==='base'?1:3]),count=Number(header[side==='base'?2:4]??1);
            if(!witness||occurrence.presence!=='present'||occurrence.source!=='available'||witness.side!==side||
                witness.commit!==(side==='base'?comparison.base:comparison.head)||witness.path!==path||witness.contentHash!==occurrence.contentHash||
                witness.text!==ownRows.map(row=>row.text).join('')||witness.startLine!==lines[0]||witness.endLine!==lines.at(-1))
                return unavailable('Native witness identity/text/range mismatch');
            if(lines.some((line,i)=>!positive(line)||(i>0&&line!==lines[i-1]!+1))||lines[0]!<=lastLine[side])return unavailable('Native physical source row order invalid');
            if(!positive(start)||!positive(count)||lines[0]!<start||lines.at(-1)!>=start+count||
                (scope==='file'&&(lines.length!==count||lines[0]!==start)))return unavailable('Native header source range mismatch');
            lastLine[side]=lines.at(-1)!;
            if(subject.kind!=='file'&&lines.some(line=>!witnesses.some(w=>w.anchor.side===side&&line>=w.anchor.startLine&&line<=w.anchor.endLine)))
                return unavailable('Native context row outside subject');
        }
        for(const [rowIndex,row] of hunk.rows.entries()){
            if(!['context','add','remove'].includes(row.kind)||row.text.replace(/\n$/, '').includes('\n')||
                (row.kind==='remove'&&row.afterLine!==null)||(row.kind==='add'&&row.beforeLine!==null)||
                (row.beforeLine===null&&row.afterLine===null)||
                (scope==='file'&&row.kind==='context'&&(row.beforeLine===null||row.afterLine===null)))return unavailable('Native physical row invalid');
            if(row.kind==='context')continue;
            const side=row.kind==='remove'?'base':'head',occurrence=side==='base'?before:after;
            const witness=side==='base'?hunk.before:hunk.after,line=side==='base'?row.beforeLine:row.afterLine;
            if(occurrence.presence!=='present'||occurrence.source!=='available'||!witness||witness.side!==side||!positive(line)||!positive(witness.startLine)||
                witness.endLine<witness.startLine||line<witness.startLine||line>witness.endLine||witness.contentHash!==occurrence.contentHash||
                (subject.kind!=='file'&&!witnesses.some(w=>w.anchor.side===side&&line>=w.anchor.startLine&&line<=w.anchor.endLine)))
                return unavailable('Native row or side witness invalid');
            (row.kind==='remove'?removed:added).push({hunkIndex:hunk.index,rowIndex,line});
        }
    }
    if(removed.length!==c.removed||added.length!==c.added||removed.length+added.length===0)return unavailable('Native edit counts unavailable or inconsistent');
    const nativeStatus=added.length?(removed.length?'change':'add'):'remove';
    if(c.status!==nativeStatus)return unavailable('Native edit status/count mismatch');
    const rows=c.hunks.flatMap(h=>h.rows);
    if(canonical(rows)!==canonical(c.rows))return unavailable('Native row order mismatch');
    return {ownerId:subject.id,scope,status:'available',removed,added};
};

/** One source-comparison account, independent of UI reading modes and graph-card shape. */
export const buildChangeModel = (graph:SourceGraph):ChangeModel => {
    const changes:SourceChange[]=[],diagnostics:{subjectId:string;reason:string}[]=[];
    const all=registry(graph),files=all.filter(e=>e.kind==='file');
    const {repository,base,head}=graph.provenance;
    const candidates=all.filter(e=>subjects.has(e.kind)&&changed.has(String(e.data.comparisonStatus)));
    if(![repository,base,head].every(v=>typeof v==='string'&&v.length))return {version:1,changes,diagnostics:candidates.map(e=>({subjectId:e.id,reason:'Qualified comparison unavailable'}))};
    const comparison={repository:repository as string,base:base as string,head:head as string};
    for(const subject of candidates){
        const witnesses=(subject.data.sourceWitnesses ?? []) as readonly Witness[];
        const path=subject.kind==='file'?subject.data.path:witnesses[0]?.anchor.path;
        const file=subject.kind==='file'?subject:files.find(f=>f.data.path===path);
        if(!file||typeof path!=='string'){diagnostics.push({subjectId:subject.id,reason:'Owning File unavailable'});continue;}
        const sides=(file.data.sourceEvidence ?? []) as readonly SourceSide[];
        if(file.data.repository!==comparison.repository||['base','head'].some(side=>sides.filter(record=>record.side===side).length!==1)){
            diagnostics.push({subjectId:subject.id,reason:'Qualified File side identity invalid'});continue;
        }
        const status=subject.data.comparisonStatus as SourceChange['status'],basis=String(subject.data.comparisonBasis??'');
        let invalid:string|undefined;
        const occurrence=(side:'base'|'head'):ChangeOccurrence=>{
            const commit=side==='base'?comparison.base:comparison.head,record=sides.find(s=>s.side===side);
            const selected=witnesses.filter(w=>w.anchor.side===side);
            const absent=(status==='add'&&side==='base')||(status==='remove'&&side==='head');
            if(absent){
                if(!basis||selected.length||(subject.kind==='file'&&(!record||record.commit!==commit||record.available!==false||
                    Object.keys(record).some(key=>!['side','commit','available'].includes(key))))){invalid='Checked absence unsupported';return {side,presence:'unavailable',reason:invalid};}
                return {side,presence:'absent',basis};
            }
            if(!record||record.commit!==commit){invalid='Pinned File occurrence unavailable';return {side,presence:'unavailable',reason:invalid};}
            if(!record.available||!record.contentHash)return subject.kind==='file'
                ? {side,presence:'present',source:'unavailable',reason:'Present-side source identity unavailable',occurrenceIds:[]}
                : {side,presence:'unavailable',reason:'Qualified source occurrence unavailable'};
            if(subject.kind!=='file'&&(!selected.length||selected.some(w=>!w.id||w.anchor.repository!==comparison.repository||w.anchor.commit!==commit||
                w.anchor.path!==path||w.anchor.contentHash!==record.contentHash||!positive(w.anchor.startLine)||w.anchor.endLine<w.anchor.startLine||
                !Number.isInteger(w.anchor.start)||!Number.isInteger(w.anchor.end)||w.anchor.start<0||w.anchor.end<w.anchor.start))){invalid='Qualified source occurrence invalid';return {side,presence:'unavailable',reason:invalid};}
            return {side,presence:'present',source:'available',contentHash:record.contentHash,occurrenceIds:selected.map(w=>w.id)};
        };
        const before=occurrence('base'),after=occurrence('head');
        if(invalid){diagnostics.push({subjectId:subject.id,reason:invalid});continue;}
        const frame=subject.kind==='file'?all.find(e=>e.kind==='change'&&e.data.documentPath===path)?.id:graph.groupFor[subject.id];
        const id=frame??'change:'+subject.id;
        if(changes.some(c=>c.id===id)){diagnostics.push({subjectId:subject.id,reason:'Change identity collision'});continue;}
        const evidence=nativeEvidence(subject,before,after,comparison,path);
        if(evidence.status==='available'){
            const c=subject.data.editComposition as EditComposition;
            if(c.hunks.some(h=>[h.before,h.after].some(w=>w&&(w.path!==path||w.commit!==(w.side==='base'?comparison.base:comparison.head))))){diagnostics.push({subjectId:subject.id,reason:'Native source identity mismatch'});continue;}
        }
        changes.push({id,kind:'change',comparison,subject:{id:subject.id,kind:subject.kind as ChangeSubjectKind},fileId:file.id,status,basis,before,after,evidence});
    }
    const fileChanges=new Map(changes.filter(c=>c.subject.kind==='file').map(c=>[c.fileId,c.id]));
    return {version:1,changes:changes.map(c=>c.subject.kind!=='file'&&fileChanges.has(c.fileId)?{...c,fileChangeId:fileChanges.get(c.fileId)!}:c),diagnostics};
};
const models=new WeakMap<SourceGraph,ChangeModel>();
export const loadChangeModel = (graph:SourceGraph):ChangeModel => {
    const known=models.get(graph);if(known)return known;
    const expected=buildChangeModel(graph);
    if(graph.changeModel&&canonical(graph.changeModel)!==canonical(expected))throw new Error('change_model_source_reference_invalid');
    const model=graph.changeModel??expected;models.set(graph,model);return model;
};
export const changeForSubject = (model:ChangeModel,subjectId:string):SourceChange|undefined => model.changes.find(c=>c.subject.id===subjectId);
const evidenceCaches=new WeakMap<SourceGraph,WeakMap<SourceChange,ChangeEvidence>>();
export const resolveChangeEvidence = (graph:SourceGraph,change:SourceChange):ChangeEvidence|undefined => {
    const expected=changeForSubject(loadChangeModel(graph),change.subject.id);
    if(!expected||canonical(expected)!==canonical(change))throw new Error('change_model_evidence_reference_invalid');
    if(change.evidence.status!=='available')return undefined;
    let evidenceCache=evidenceCaches.get(graph);if(!evidenceCache){evidenceCache=new WeakMap();evidenceCaches.set(graph,evidenceCache);}
    const known=evidenceCache.get(change);if(known)return known;
    const owner=registry(graph).find(e=>e.id===change.evidence.ownerId)!;
    const composition=owner.data.editComposition as EditComposition;
    const rows=(refs:readonly ChangeRowReference[],side:'base'|'head'):readonly ChangeEditRow[]=>refs.map(ref=>{
        const hunk=composition.hunks.find(h=>h.index===ref.hunkIndex)!,row=hunk.rows[ref.rowIndex]!;
        return {line:ref.line,text:row.text,hunkIndex:ref.hunkIndex,witness:(side==='base'?hunk.before:hunk.after)!};
    });
    const result={composition,removed:rows(change.evidence.removed,'base'),added:rows(change.evidence.added,'head')};evidenceCache.set(change,result);return result;
};

/** Shared source-reader value; status lookup does not eagerly map every native row. */
export const changeSourceComparison = (graph:SourceGraph,change:SourceChange):EditComposition => {
    const expected=changeForSubject(loadChangeModel(graph),change.subject.id);
    if(!expected||canonical(expected)!==canonical(change))throw new Error('change_model_evidence_reference_invalid');
    return change.evidence.status==='available'
        ? registry(graph).find(entity=>entity.id===change.evidence.ownerId)!.data.editComposition as EditComposition
        : unresolvedComparison(change.subject.kind==='file'?'file':'source unit',change.evidence.reason);
};
const unresolvedComparison=(scope:EditComposition['scope'],reason:string):EditComposition=>({status:'unresolved',scope,added:0,removed:0,rows:[],hunks:[],reason});

/** Source subjects and retained Change frames share validated native status/evidence. */
export const sourceComparisonFor=(graph:SourceGraph,entity:GraphEntity):EditComposition|undefined=>{
    const model=loadChangeModel(graph);
    const documentParent=entity.kind==='evidence'?registry(graph).find(parent=>parent.kind==='change'&&parent.data.documentPath&&parent.nodes?.some(child=>child.id===entity.id)):undefined;
    const change=changeForSubject(model,entity.id)??model.changes.find(item=>item.id===(documentParent?.id??entity.id));
    if(change)return changeSourceComparison(graph,change);
    if(documentParent||entity.kind==='change'||(subjects.has(entity.kind)&&changed.has(String(entity.data.comparisonStatus))))
        return unresolvedComparison(entity.kind==='file'||entity.data.documentPath?'file':'source unit','Qualified Change account unavailable');
    return entity.data.editComposition as EditComposition|undefined;
};
