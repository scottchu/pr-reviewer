import type {Node, Edge} from '@xyflow/react';
import sample from './change-sample.json' with {type:'json'};

export type ChangeNodeUI = Node<{label: string}, 'change'>;
/** Fixed prototype geometry; framework-owned measurements never feed an app layout pass. */
export const createSingleChangeModel = (): {nodes: ChangeNodeUI[]; edges: Edge[]; viewport: {x:number;y:number;zoom:number}} => ({
    nodes: [{id:sample.id, type:'change', data:{label:sample.selection.title}, position:{x:16,y:16},
        dragHandle:'.graph-card-handle', ariaLabel:sample.selection.title,
        style:{width:'clamp(280px, calc(100vw - 32px), 760px)'}}],
    edges: [], viewport:{x:0,y:0,zoom:1},
});
