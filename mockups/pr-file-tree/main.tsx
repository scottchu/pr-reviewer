import React, { useMemo, useRef, useState, useReducer, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, BackgroundVariant, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath, MarkerType, type Node, type NodeProps, type ReactFlowInstance, type Edge, type EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import fixture from './paths.json' with { type: 'json' };
import importFixture from './imports.json' with { type: 'json' };
import { buildTree, type Change, type TreeNode } from './tree.ts';
import { projectImports, citationText, type GraphNode } from './imports.ts';
import { detailTransition, detailTree, nearbyFile } from './detail.ts';
import { FileDiffBody, DiffControls, fileDiffs, type FileDiff, type DiffMode, type SourceRelation } from './file-diff.tsx';
import { rememberFile, type FileReading, type FileReadings } from './reading.ts';
import { RelationshipReader } from './relationship-reader.tsx';
const motionDuration = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
const tree = buildTree(fixture.paths, fixture.changes);
type LabelNode = Node<{
  name: string;
  path: string;
  kind: 'file' | 'directory' | 'external';
  change: Change;
  context: boolean;
  selected: boolean;
  provenance: string;
  expanded: boolean;
  diff: FileDiff | null;
  mode: DiffMode;
  fullscreen: boolean;
  onFullscreen: (path: string) => void;
  width: number;
  onSourceExplain: (relation: SourceRelation) => void;
  activeRelation: SourceRelation | null;
  reading: FileReading | undefined;
  onReading: (value: FileReading) => void;
  restoreVersion: number;
}, 'filename'>;
const Label = ({ data }: NodeProps<LabelNode>) => data.fullscreen ? <div className="file-workspace-file">

  <FileDiffBody
    file={data.diff!}
    mode={data.mode}
    fullscreen
    width={data.width}
    onExplain={data.onSourceExplain}
    activeRelation={data.activeRelation}
    reading={data.reading}
    onReading={data.onReading}
    restoreVersion={data.restoreVersion}
  />

</div> : <div
  className={`file-object ${data.kind} ${data.expanded ? 'expanded' : ''}`}
  data-expanded-file={data.expanded ? data.path : undefined}
>

  <Handle
    type="target"
    position={Position.Left}
    style={{
      top: 13
    }}
    isConnectable={false}
  />

  <span
    className={`filename ${data.kind} ${data.change} ${data.selected ? 'selected' : ''} ${data.context ? 'context' : ''}`}
    title={data.provenance}
    data-file-path={data.kind === 'file' && !data.context ? data.path : undefined}
    data-context-path={data.context && data.kind !== 'external' ? data.path : undefined}
    data-external-module={data.kind === 'external' ? data.path : undefined}
  >

    {data.change === 'added' ? '+ ' : data.change === 'modified' ? '~ ' : data.change === 'deleted' ? '− ' : ''}

    {data.name}

  </span>

  {data.kind === 'file' && !data.context && <button
    className="file-fullscreen nodrag nopan"
    aria-label={`${data.fullscreen ? 'Exit fullscreen' : 'Fullscreen'} ${data.path}`}
    title={data.fullscreen ? 'Exit canvas fullscreen · Escape' : 'Read file across canvas'}
    onClick={e => {
      e.stopPropagation();
      data.onFullscreen(data.path);
    }}
  >

    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >

      <path d={data.fullscreen ? 'M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5' : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'} />

    </svg>

  </button>}

  {data.expanded && data.diff && <FileDiffBody
    file={data.diff}
    mode={data.mode}
    fullscreen={data.fullscreen}
    width={data.width}
    onExplain={data.onSourceExplain}
    activeRelation={data.activeRelation}
    reading={data.reading}
    onReading={data.onReading}
    restoreVersion={data.restoreVersion}
  />}

  <Handle
    type="source"
    position={Position.Right}
    style={{
      top: 13
    }}
    isConnectable={false}
  />

  <Handle
    id="import-right"
    type="target"
    position={Position.Right}
    style={{
      top: 13
    }}
    isConnectable={false}
  />

</div>;
const nodeTypes = {
  filename: Label
};
type ImportEdge = Edge<{
  citation: string;
  change: Change;
  explain: () => void;
  active: boolean;
}, 'import'>;
const colors: Record<Change, string> = {
  added: '#91d2b0',
  modified: '#dcc88f',
  deleted: '#e3a0a7',
  unchanged: '#98a9b4'
};
const ImportLine = ({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: EdgeProps<ImportEdge>) => {
  const loopX = Math.max(sourceX, targetX) + 130;
  const [path, x, y] = targetPosition === Position.Right ? [
    `M${sourceX},${sourceY} C${loopX},${sourceY} ${loopX},${targetY} ${targetX},${targetY}`, (sourceX + targetX) / 8 + .75 * loopX, (sourceY + targetY) / 2
  ] : getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: .5
  });
  const color = colors[data?.change ?? 'unchanged'];
  return <>

    <BaseEdge
      path={path}
      {...(markerEnd ? {
        markerEnd
      } : {})}
      style={{
        stroke: color,
        strokeWidth: data?.active ? 3 : 1.6,
        opacity: .9
      }}
    />

    <EdgeLabelRenderer>

      <button
        onClick={data?.explain}
        aria-label={`Explain ${data?.citation?.split("\n")[0] ?? "import relationship"}`}
        className={`import-label ${data?.active ? 'active' : ''}`}
        style={{
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          color
        }}
        title={data?.citation}
      >

        {data?.change === 'added' ? '+ ' : data?.change === 'deleted' ? '− ' : ''}imports</button>

    </EdgeLabelRenderer>

  </>;
};
const edgeTypes = {
  import: ImportLine
};
const containment = tree.edges.map(e => ({
  id: e.id,
  source: e.source,
  target: e.target,
  type: 'smoothstep',
  interactionWidth: 0,
  selectable: false,
  focusable: false,
  ariaLabel: `${e.source.slice(10)} contains ${e.target.slice(e.target.indexOf(':') + 1)}`
}));
const initialView = (overview = false) => {
  const narrow = window.innerWidth < 650;
  const anchor = tree.nodes.find(n => n.id === (narrow && !overview ? 'directory:src/application' : 'directory:.'))!;
  return {
    x: narrow && !overview ? 20 - anchor.x : 28,
    y: narrow && !overview ? 110 - anchor.y : (window.innerHeight - 46) / 2 - anchor.y,
    zoom: 1
  };
};
const App = () => {
  const flow = useRef<ReactFlowInstance<LabelNode>>(null);
  const main = useRef<HTMLElement>(null);
  const focal = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const [explained, setExplained] = useState<string | null>(null);
  const [sourceRelation, setSourceRelation] = useState<SourceRelation | null>(null);
  const [mode, setMode] = useState<DiffMode>(window.innerWidth < 650 ? 'unified' : 'split');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, dispatchDetail] = useReducer(detailTransition, {
    expanded: null,
    lastZoom: 1
  });
  const readings = useRef<FileReadings>({});
  const [restoreVersion, setRestoreVersion] = useState(0);
  const cameraOwner = useRef<symbol | null>(null);
  const moveCamera = (view: {
    x: number;
    y: number;
    zoom: number;
  }) => {
    const owner = Symbol('explicit-camera');
    cameraOwner.current = owner;
    void flow.current?.setViewport(view, {
      duration: motionDuration(),
      interpolate: 'linear'
    }).finally(() => {
      if (cameraOwner.current === owner)
        cameraOwner.current = null;
    });
  };
  const [fullscreen, setFullscreen] = useState<{
    path: string;
    camera: {
      x: number;
      y: number;
      zoom: number;
    };
    selected: string | null;
    expanded: string | null;
    reading: FileReading | undefined;
    mode: DiffMode;
  } | null>(null);
  const restoreCamera = useRef<{
    x: number;
    y: number;
    zoom: number;
  } | null>(null);
  const exitFullscreen = () => {
    if (!fullscreen)
      return;
    restoreCamera.current = fullscreen.camera;
    if (fullscreen.expanded && fullscreen.reading)
      readings.current = rememberFile(readings.current, fullscreen.expanded, fullscreen.reading);
    setMode(fullscreen.mode);
    setRestoreVersion(value => value + 1);
    setSelected(fullscreen.selected);
    dispatchDetail({
      type: 'focus',
      path: fullscreen.expanded
    });
    setFullscreen(null);
  };
  const toggleFullscreen = (path: string) => {
    if (fullscreen) {
      exitFullscreen();
      return;
    }
    if (!flow.current)
      return;
    setFullscreen({
      path,
      camera: flow.current.getViewport(),
      selected,
      expanded: detail.expanded,
      reading: detail.expanded ? readings.current[detail.expanded] : undefined,
      mode
    });
    setSelected(path);
    setMode(readings.current[path]?.mode ?? (window.innerWidth < 650 ? 'unified' : 'split'));
    dispatchDetail({
      type: 'focus',
      path
    });
  };
  const viewTree = useMemo(() => {
    const result = detailTree(tree, detail.expanded, window.innerWidth < 650);
    if (!fullscreen)
      return result;
    return {
      ...result,
      nodes: result.nodes.map(n => n.id === `file:${fullscreen.path}` ? {
        ...n,
        width: window.innerWidth,
        height: window.innerHeight - 46
      } : n)
    };
  }, [
    detail.expanded, fullscreen
  ]);
  useLayoutEffect(() => {
    if (fullscreen) {
      const n = tree.nodes.find(n => n.path === fullscreen.path && n.kind === 'file')!;
      moveCamera({
        x: -n.x,
        y: -n.y,
        zoom: 1
      });
    }
    else if (restoreCamera.current) {
      moveCamera(restoreCamera.current);
      restoreCamera.current = null;
    }
  }, [
    fullscreen
  ]);
  const projection = useMemo(() => projectImports(viewTree, importFixture, null), [
    viewTree, selected
  ]);
  const nodes: LabelNode[] = useMemo(() => (fullscreen ? viewTree.nodes.filter(n => n.id === `file:${fullscreen.path}`) : [
    ...viewTree.nodes, ...projection.contexts
  ]).map((n: GraphNode) => {
    const context = n.id.startsWith('context:') || n.kind === 'external';
    const provenance = context ? `${n.path} · ${n.kind === 'external' ? 'external module, not a repository file' : 'unchanged imported context'}\n${citationText(projection.links.filter(e => e.targetPath === n.path).flatMap(e => e.citations))}` : n.path === '.' ? 'pr-reviewer' : `${n.path} · ${n.change}`;
    return {
      id: n.id,
      type: 'filename',
      position: {
        x: n.x,
        y: n.y
      },
      data: {
        name: n.name,
        path: n.path,
        kind: n.kind,
        change: n.change,
        context,
        selected: n.path === selected || projection.links.some(link => link.id === explained && link.target === n.id),
        provenance,
        expanded: n.path === detail.expanded && !context,
        diff: fileDiffs.get(n.path) ?? null,
        mode,
        fullscreen: fullscreen?.path === n.path,
        onFullscreen: toggleFullscreen,
        width: n.width,
        reading: readings.current[n.path],
        onReading: value => {
          readings.current = rememberFile(readings.current, n.path, value);
        },
        restoreVersion,
        activeRelation: sourceRelation,
        onSourceExplain: relation => {
          setExplained(null);
          setSourceRelation(relation);
        }
      },
      width: n.width,
      height: n.height,
      measured: {
        width: n.width,
        height: n.height
      },
      draggable: false,
      selectable: false,
      focusable: true,
      ariaLabel: provenance,
      ariaRole: n.kind === 'file' && !context && n.path !== detail.expanded ? 'button' : 'group',
      style: {
        width: n.width,
        height: n.height
      }
    };
  }), [
    projection, selected, viewTree, detail.expanded, mode, fullscreen, explained, sourceRelation, restoreVersion
  ]);
  const edges: Edge[] = useMemo(() => fullscreen ? [] : [
    ...containment, ...projection.links.map(link => ({
      id: link.id,
      source: link.source,
      target: link.target,
      ...(link.target.startsWith('file:') ? {
        targetHandle: 'import-right'
      } : {}),
      type: 'import',
      data: {
        citation: citationText(link.citations),
        change: link.change,
        explain: () => {
          setSourceRelation(null);
          setExplained(link.id);
        },
        active: explained === link.id
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: colors[link.change],
        width: 14,
        height: 14
      },
      focusable: true,
      ariaLabel: `${selected} imports ${link.targetPath} · ${link.change}\n${citationText(link.citations)}`
    }))
  ], [
    projection, selected, explained, fullscreen
  ]);
  const reset = () => {
    if (fullscreen) {
      exitFullscreen();
      return;
    }
    dispatchDetail({
      type: 'focus',
      path: null
    });
    void flow.current?.setViewport(initialView(true), {
      duration: 0
    });
  };
  const focusFile = (path: string) => {
    if (fullscreen)
      return;
    setSelected(path);
    setMode(readings.current[path]?.mode ?? (window.innerWidth < 650 ? 'unified' : 'split'));
    dispatchDetail({
      type: 'focus',
      path: detail.expanded === path ? null : path
    });
  };
  const key = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && sourceRelation) {
      e.preventDefault();
      e.stopPropagation();
      setSourceRelation(null);
      return;
    }
    if (e.key === 'Escape' && explained) {
      e.preventDefault();
      e.stopPropagation();
      setExplained(null);
      return;
    }
    if (e.key === 'Escape' && fullscreen) {
      e.preventDefault();
      e.stopPropagation();
      exitFullscreen();
      return;
    }
    if ((e.target as HTMLElement).closest('.source-diff,.change-rail,.diff-controls,.file-fullscreen,.relationship-reader') || !flow.current || e.altKey || e.metaKey || e.ctrlKey)
      return;
    const view = flow.current.getViewport();
    const step = e.shiftKey ? 160 : 80;
    if (e.key === 'Enter') {
      const id = (e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id');
      if (id?.startsWith('file:')) {
        e.preventDefault();
        e.stopPropagation();
        focusFile(id.slice(5));
      }
      return;
    }
    if (e.key === 'Escape') {
      setSelected(null);
      dispatchDetail({
        type: 'focus',
        path: null
      });
      return;
    }
    const offset: Record<string, {
      x: number;
      y: number;
    }> = {
      ArrowLeft: {
        x: step,
        y: 0
      },
      ArrowRight: {
        x: -step,
        y: 0
      },
      ArrowUp: {
        x: 0,
        y: step
      },
      ArrowDown: {
        x: 0,
        y: -step
      }
    };
    const pan = offset[e.key];
    if (pan) {
      e.preventDefault();
      void flow.current.setViewport({
        ...view,
        x: view.x + pan.x,
        y: view.y + pan.y
      });
    }
    else if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault();
      void flow.current.zoomTo(Math.max(.35, Math.min(2.5, view.zoom * (e.key === '-' ? .85 : 1.15))), {
        duration: 0
      });
    }
    else if (e.key === '0') {
      e.preventDefault();
      void reset();
    }
  };
  const prepared = importFixture.sources.some(s => s.path === selected);
  return <>

    <header>

      <span title={`PR25 · ${fixture.base} → ${fixture.head}`}>

        {fullscreen ? fullscreen.path : 'pr-reviewer'}

        {!fullscreen && <b>PR #25</b>}

      </span>

      <button
        onClick={reset}
        aria-label={fullscreen ? 'Back to PR' : 'Overview'}
        title={fullscreen ? 'Back to PR graph' : 'Overview · readable root framing'}
      >

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >

          <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />

        </svg>

      </button>

    </header>

    <main
      data-workspace-root={fullscreen ? `file:${fullscreen.path}` : 'pr:25'}
      ref={main}
      tabIndex={0}
      onPointerMoveCapture={e => {
        if (!(e.target as HTMLElement).closest('.source-diff,.change-rail,.diff-controls,.file-fullscreen,.relationship-reader'))
          focal.current = {
            x: e.clientX,
            y: e.clientY
          };
      }}
      onTouchMoveCapture={e => {
        if (e.touches.length === 2 && !(e.target as HTMLElement).closest('.source-diff,.change-rail,.diff-controls,.file-fullscreen,.relationship-reader'))
          focal.current = {
            x: (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2,
            y: (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2
          };
      }}
      onKeyDownCapture={key}
      aria-label="PR25 file tree. Tree edges mean contains; selected-file arrows mean static imports. Drag or scroll to pan; pinch or Control-wheel to zoom; arrow keys pan, plus and minus zoom, zero shows Overview."
    >

      <ReactFlow<LabelNode>
        className="pr-graph"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={(event, node) => {
          if (!(event.target as HTMLElement).closest('.source-diff,.change-rail,.diff-controls,.file-fullscreen,.relationship-reader') && node.data.kind === 'file' && !node.data.context)
            focusFile(node.data.path);
        }}
        onPaneClick={() => {
          if (!fullscreen)
            setSelected(null);
          setExplained(null);
          setSourceRelation(null);
        }}
        onEdgeClick={(_, edge) => {
          if (edge.type === 'import') {
            setSourceRelation(null);
            setExplained(edge.id);
          }
        }}
        onInit={instance => {
          flow.current = instance;
          void instance.setViewport(initialView(), {
            duration: 0
          });
        }}
        defaultViewport={{
          x: 28,
          y: 28,
          zoom: 1
        }}
        minZoom={.35}
        maxZoom={2.5}
        panOnDrag
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        preventScrolling
        autoPanOnNodeFocus={false}
        proOptions={{
          hideAttribution: true
        }}
      >

        <Background
          variant={BackgroundVariant.Dots}
          color="#41474b"
          gap={22}
          size={.65}
        />

      </ReactFlow>

      {detail.expanded && <DiffControls
        mode={mode}
        onMode={setMode}
      />}

      {sourceRelation && <RelationshipReader
        relation={sourceRelation}
        onClose={() => setSourceRelation(null)}
      />}

      {!sourceRelation && projection.links.find(link => link.id === explained) && <RelationshipReader
        link={projection.links.find(link => link.id === explained)!}
        onClose={() => setExplained(null)}
      />}

    </main>

  </>;
};
const root = document.getElementById('root');
if (root)
  createRoot(root).render(<App />);
