import React, {createContext, useContext, useState} from 'react';
import {ReactFlow, Background, Controls, type NodeTypes, type NodeProps} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {ChangeCard} from './ChangeCard.tsx';
import {createSingleChangeModel, type ChangeNodeUI} from './graph-model.ts';

const noOp = () => {};
const Mounted = createContext<() => void>(noOp);
export const ChangeNodeView = (_props: NodeProps<ChangeNodeUI>) => <div className="graph-card-shell">
    <div className="graph-card-handle"><span aria-hidden="true">⠿</span> Move Change</div>
    <div className="graph-card-reading nodrag nopan nowheel" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}>
        <ChangeCard onMounted={useContext(Mounted)}/>
    </div>
</div>;
const nodeTypes: NodeTypes = {change:ChangeNodeView};
export const GraphProbe = ({onMounted}: {onMounted?: () => void}) => {
    const [model] = useState(createSingleChangeModel);
    return <Mounted.Provider value={onMounted ?? noOp}><div className="graph-probe">
        <p className="graph-probe-caption">Prototype · one Change. Drag the grip; scroll inside the card.</p>
        <div className="graph-probe-canvas"><ReactFlow<ChangeNodeUI>
            defaultNodes={model.nodes} defaultEdges={model.edges} defaultViewport={model.viewport}
            nodeTypes={nodeTypes} minZoom={.4} maxZoom={1.5} panOnScroll={false}
            selectionOnDrag={false} autoPanOnNodeFocus={false} zoomOnDoubleClick={false}
            deleteKeyCode={null} nodesConnectable={false} proOptions={{hideAttribution:true}}>
            <Background gap={24} size={1} color="#354850"/>
            <Controls showInteractive={false} fitViewOptions={{padding:.04,minZoom:.4,maxZoom:1}}/>
        </ReactFlow></div>
    </div></Mounted.Provider>;
};
