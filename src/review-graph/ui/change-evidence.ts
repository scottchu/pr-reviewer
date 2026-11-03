import {changeForSubject, resolveChangeEvidence, type ChangeModel, type SourceChange} from '../domain/change-model.ts';
import type {SourceGraph} from '../domain/types.ts';
import type {GraphView, UIEntity, UIRelation} from './types.ts';

/** Retained reading policy only. All subject kinds use the same domain Change/evidence. */
export const changeReadingMode = (change:SourceChange):'context'|'edit-sides' => change.subject.kind==='test'?'edit-sides':'context';
const views=new WeakMap<GraphView,GraphView>();
const children=new WeakMap<SourceChange,readonly UIEntity[]>();
const sources=new WeakMap<UIEntity,UIEntity>();
const sourceAnchor=(subject:UIEntity):UIEntity=>{
    const known=sources.get(subject);if(known)return known;
    const ui=Object.defineProperties({}, {...Object.getOwnPropertyDescriptors(subject.ui),changeEvidenceSource:{enumerable:true,value:true}}) as UIEntity['ui'];
    const result={...subject,ui};sources.set(subject,result);return result;
};
const codeChildren=(comparison:SourceGraph,change:SourceChange,groupId:string):readonly UIEntity[]=>{
    const known=children.get(change);if(known)return known;
    const evidence=resolveChangeEvidence(comparison,change);if(!evidence)return [];
    const result:UIEntity[]=[];
    for(const kind of ['remove','add'] as const){
        const rows=kind==='remove'?evidence.removed:evidence.added;if(!rows.length)continue;
        const witness=rows[0]!.witness;
        result.push({id:'source-edit:'+change.id+':'+kind,kind:'source_edit',data:{},ui:{
            card:{title:(kind==='remove'?'Removed −':'Added +')+rows.length,rows:[(kind==='remove'?'Before ':'After ')+witness.commit.slice(0,7)+' · '+witness.path]},
            status:kind,icon:'evidence',sourceControl:false,sourceOpen:false,fileControl:false,inlineSourceReading:false,unitCount:0,unpairedRows:[],sourceReading:undefined,
            sourceEdit:{kind,changeId:change.id,subjectId:change.subject.id,groupId,rows},
        }});
    }
    children.set(change,result);return result;
};

/** Generic native evidence projection; never classifies edits or creates source facts. */
export const projectChangeEvidence=(view:GraphView,comparison:SourceGraph,model:ChangeModel):GraphView=>{
    const known=views.get(view);if(known)return known;
    const replacements=new Map<string,UIEntity>(),additions=new Map<string,readonly UIEntity[]>();
    for(const group of view.entities.filter(e=>e.kind==='change'&&e.nodes)){
        const change=model.changes.find(c=>c.id===group.id);if(!change||changeReadingMode(change)!=='edit-sides')continue;
        const subject=group.nodes!.find(child=>child.id===change.subject.id);
        if(!subject||changeForSubject(model,subject.id)!==change)continue;
        const edits=codeChildren(comparison,change,group.id);if(!edits.length)continue;
        const source=sourceAnchor(subject);replacements.set(subject.id,source);
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
