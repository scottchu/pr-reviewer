import {changeSourceRelationships, type ChangeRelationships} from '../domain/source-relationships.ts';
import {changeForSubject, resolveChangeEvidence, type ChangeModel, type SourceChange} from '../domain/change-model.ts';
import type {SourceGraph} from '../domain/types.ts';
import type {GraphView, UIEntity, UIRelation} from './types.ts';

const views=new WeakMap<GraphView,GraphView>();
const children=new WeakMap<SourceChange,readonly UIEntity[]>();
const sources=new WeakMap<UIEntity,UIEntity>();
const sourceAnchor=(subject:UIEntity,relationships:ChangeRelationships):UIEntity=>{
    const known=sources.get(subject);if(known)return known;
    const ui=Object.defineProperties({}, {...Object.getOwnPropertyDescriptors(subject.ui),changeEvidenceSource:{enumerable:true,value:true},relationshipNotice:{enumerable:true,value:relationships.implementationLink==='not-established'?'Outgoing call relationship not established from the available source evidence.':undefined}}) as UIEntity['ui'];
    const result={...subject,ui};sources.set(subject,result);return result;
};
const codeChildren=(comparison:SourceGraph,change:SourceChange,groupId:string):readonly UIEntity[]=>{
    const known=children.get(change);if(known)return known;
    const evidence=resolveChangeEvidence(comparison,change);if(!evidence)return [];
    const result:UIEntity[]=[];
    for(const kind of ['remove','add'] as const){
        const rows=kind==='remove'?evidence.removed:evidence.added;if(!rows.length)continue;
        const witness=rows[0]!.witness;
        const relationships=changeSourceRelationships(comparison,change).references.flatMap(reference=>{
            const source=reference.source;
            const row=rows.find(row=>source.side===(kind==='remove'?'base':'head')&&source.commit===row.witness.commit&&source.path===row.witness.path&&source.contentHash===row.witness.contentHash&&row.line>=source.startLine&&row.line<=source.endLine);
            return row?[{reference,line:row.line}]:[];
        });
        result.push({id:'source-edit:'+change.id+':'+kind,kind:'source_edit',data:{},ui:{
            card:{title:(kind==='remove'?'Removed −':'Added +')+rows.length,rows:[(kind==='remove'?'Before ':'After ')+witness.commit.slice(0,7)+' · '+witness.path]},
            status:kind,icon:'evidence',sourceControl:false,sourceOpen:false,fileControl:false,inlineSourceReading:false,unitCount:0,unpairedRows:[],sourceReading:undefined,
            sourceEdit:{kind,changeId:change.id,subjectId:change.subject.id,groupId,rows,relationships},
        }});
    }
    children.set(change,result);return result;
};

/** Generic native evidence projection; never classifies edits or creates source facts. */
export const projectChangeEvidence=(view:GraphView,comparison:SourceGraph,model:ChangeModel):GraphView=>{
    const known=views.get(view);if(known)return known;
    const replacements=new Map<string,UIEntity>(),additions=new Map<string,readonly UIEntity[]>();
    for(const metadata of view.entities.filter(e=>e.kind==='change'&&e.nodes)){
        // Retain the visible callsite reduction; registry children are not a new
        // instruction to reintroduce hidden source-detail nodes.
        const group=view.nodes.find(node=>node.id===metadata.id)??metadata;
        const change=model.changes.find(c=>c.id===group.id);if(!change)continue;
        const subject=group.nodes!.find(child=>child.id===change.subject.id);
        if(!subject||changeForSubject(model,subject.id)!==change)continue;
        const edits=codeChildren(comparison,change,group.id);
        const source=sourceAnchor(subject,changeSourceRelationships(comparison,change));replacements.set(subject.id,source);
        replacements.set(group.id,{...group,nodes:[...group.nodes!.map(child=>child.id===subject.id?source:child),...edits]});additions.set(group.id,edits);
    }
    const nodes=view.nodes.flatMap(entity=>[replacements.get(entity.id)??entity,...(additions.get(entity.id)??[])]);
    const entities=new Map(view.entities.map(entity=>[entity.id,replacements.get(entity.id)??entity]));
    for(const edits of additions.values())for(const edit of edits){if(entities.has(edit.id))throw new Error('change_evidence_identity_collision:'+edit.id);entities.set(edit.id,edit);}
    const visible=new Set(nodes.map(node=>node.id));
    const changeEditConnections:UIRelation[]=[...additions.values()].flat().filter(edit=>visible.has(edit.id)&&visible.has(edit.ui.sourceEdit!.subjectId)).map(edit=>({
        id:'source-edit-connection:'+edit.id,from:edit.ui.sourceEdit!.subjectId,to:edit.id,version:edit.ui.sourceEdit!.kind==='remove'?'before':'after',
        relation:'source_edit_evidence',changeEditConnector:true,data:{comparisonStatus:'change',projection:'change-edit-evidence',changeId:edit.ui.sourceEdit!.changeId},
        ui:{title:'Source edit evidence',rows:[],explanation:'Native source edits belonging to this Change subject',scope:[],provenance:[]},
    }));
    const result={nodes,relations:view.relations,changeEditConnections,entities:[...entities.values()]};views.set(view,result);return result;
};
