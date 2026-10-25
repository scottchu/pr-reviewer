import React, { useMemo, useRef, useState, useReducer, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, BackgroundVariant, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath, MarkerType, type Node, type NodeProps, type ReactFlowInstance, type Edge, type EdgeProps, useUpdateNodeInternals } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import fixture from './paths.json' with { type: 'json' };
import { buildTree, type Change, type TreeNode } from './tree.ts';
import { detailTransition, detailTree } from './detail.ts';
import { FileDiffBody, DiffControls, fileDiffs, type FileDiff, type DiffMode, type SourceRelation } from './file-diff.tsx';
import { rememberFile, type FileReading, type FileReadings, type ReadingFocus } from './reading.ts';
import { RelationshipReader } from './relationship-reader.tsx';
import { projectCalls, layoutCalls, relevantTests, type FunctionIdentity, type CallLink } from './calls.ts';
import { FunctionLabel, DeclaredTestLabel, CallLine, CallExplanation, type FunctionNode, type DeclaredTestNode } from './call-graph.tsx';
import type { DeclaredTest } from './declared-tests.types.ts';
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
  focus: ReadingFocus | undefined;
  onCalls: (() => void) | undefined;
}, 'filename'>;
const Label = ({ id, data }: NodeProps<LabelNode>) => {
  const update = useUpdateNodeInternals();
  useLayoutEffect(() => {
    update(id);
    const timer = setTimeout(() => update(id), motionDuration());
    return () => clearTimeout(timer);
  }, [
    id, data.width, data.expanded, data.fullscreen, update
  ]);
  return data.fullscreen ? <div className="file-workspace-file">

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
      focus={data.focus}
      onCalls={data.onCalls}
    />

  </div> : <div
    className={`file-object ${data.kind} ${data.expanded ? 'expanded' : ''}`}
    data-expanded-file={data.expanded ? data.path : undefined}
  >

    <Handle
      id="contains-in"
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
      focus={data.focus}
      onCalls={data.onCalls}
    />}

    <Handle
      id="contains-out"
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
};
type CanvasNode = LabelNode | FunctionNode | DeclaredTestNode;
const nodeTypes = {
  filename: Label,
  function: FunctionLabel,
  declaredTest: DeclaredTestLabel
};
const edgeTypes = {
  call: CallLine
};
const containment = tree.edges.map(e => ({
  id: e.id,
  source: e.source,
  target: e.target,
  sourceHandle: 'contains-out',
  targetHandle: 'contains-in',
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
  const flow = useRef<ReactFlowInstance<CanvasNode>>(null);
  const main = useRef<HTMLElement>(null);
  const [sourceRelation, setSourceRelation] = useState<SourceRelation | null>(null);
  const [mode, setMode] = useState<DiffMode>(window.innerWidth < 650 ? 'unified' : 'split');
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, dispatchDetail] = useReducer(detailTransition, {
    expanded: null,
    lastZoom: 1
  });
  const [functionFocus, setFunctionFocus] = useState<ReadingFocus | undefined>();
  const [testsFor, setTestsFor] = useState<string | null>(null);
  const [callExplained, setCallExplained] = useState<CallLink | null>(null);
  const sourceSerial = useRef(0);
  const [sourceReturn, setSourceReturn] = useState<{
    expanded: string | null;
    focus: ReadingFocus | undefined;
    reading: FileReading | undefined;
    camera: {
      x: number;
      y: number;
      zoom: number;
    };
    mode: DiffMode;
  } | null>(null);
  const [testReturn, setTestReturn] = useState<typeof sourceReturn>(null);
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
    setCallExplained(null);
    setSourceRelation(null);
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
    setCallExplained(null);
    setSourceRelation(null);
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
  const fileNodes: LabelNode[] = useMemo(() => (fullscreen ? viewTree.nodes.filter(n => n.id === `file:${fullscreen.path}`) : [
    ...viewTree.nodes
  ]).map((n: TreeNode) => {
    const context = false;
    const provenance = n.path === '.' ? 'pr-reviewer' : `${n.path} · ${n.change}`;
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
        selected: n.path === selected || n.path === functionFocus?.path,
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
        focus: functionFocus?.path === n.path ? functionFocus : undefined,
        onCalls: !fullscreen && n.path === selected && projectCalls(selected).prepared ? () => {
          const projected = projectCalls(selected);
          const current = layoutCalls(projected, {
            x: n.x + n.width + 72,
            y: n.y
          }, window.innerWidth < 650 ? 170 : 200);
          const seed = current.find(item => item.identity.seed && item.identity.declaration.side === 'head') ?? current.find(item => item.identity.seed);
          if (seed)
            moveCamera({
              x: (window.innerWidth < 650 ? 8 : 550) - seed.x,
              y: 150 - seed.y,
              zoom: 1
            });
        } : undefined,
        activeRelation: sourceRelation,
        onSourceExplain: relation => {
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
    selected, viewTree, detail.expanded, mode, fullscreen, sourceRelation, restoreVersion, functionFocus
  ]);
  const calls = useMemo(() => projectCalls(selected), [
    selected
  ]);
  const callLayout = useMemo(() => {
    const origin = viewTree.nodes.find(node => node.path === selected && node.kind === 'file');
    return origin ? layoutCalls(calls, {
      x: origin.x + origin.width + 72,
      y: origin.y
    }, window.innerWidth < 650 ? 170 : 200) : [];
  }, [
    calls, viewTree, selected
  ]);
  const rememberReturn = () => {
    if (!sourceReturn && flow.current)
      setSourceReturn({
        expanded: detail.expanded,
        focus: functionFocus,
        reading: detail.expanded ? readings.current[detail.expanded] : undefined,
        camera: flow.current.getViewport(),
        mode
      });
  };
  const openFunction = (identity: FunctionIdentity) => {
    if (fullscreen)
      return;
    rememberReturn();
    setCallExplained(null);
    setSourceRelation(null);
    sourceSerial.current++;
    const side = identity.declaration.side === 'base' ? 'before' : 'after';
    setFunctionFocus({
      id: `function:${identity.id}:${sourceSerial.current}`,
      path: identity.declaration.path,
      name: identity.name,
      before: side === 'before' ? [
        identity.declaration
      ] : [],
      after: side === 'after' ? [
        identity.declaration
      ] : [],
      preferredSide: side
    });
    dispatchDetail({
      type: 'focus',
      path: identity.declaration.path
    });
    const node = tree.nodes.find(node => node.path === identity.declaration.path && node.kind === 'file');
    if (node)
      moveCamera({
        x: 5 - node.x,
        y: 30 - node.y,
        zoom: 1
      });
  };
  const openTest = (record: DeclaredTest) => {
    setCallExplained(null);
    setSourceRelation(null);
    if (flow.current)
      setTestReturn({
        expanded: detail.expanded,
        focus: functionFocus,
        reading: detail.expanded ? readings.current[detail.expanded] : undefined,
        camera: flow.current.getViewport(),
        mode
      });
    sourceSerial.current++;
    const before = record.versions.base;
    const after = record.versions.head;
    setFunctionFocus({
      id: `test:${record.id}:${sourceSerial.current}`,
      path: record.path,
      name: `Declared test: ${record.name}`,
      scope: 'test',
      before: before.availability === 'available' ? [
        before.definition.anchor
      ] : [],
      after: after.availability === 'available' ? [
        after.definition.anchor
      ] : [],
      preferredSide: after.availability === 'available' ? 'after' : 'before'
    });
    dispatchDetail({
      type: 'focus',
      path: record.path
    });
    const node = tree.nodes.find(node => node.path === record.path && node.kind === 'file');
    if (node)
      moveCamera({
        x: 5 - node.x,
        y: 30 - node.y,
        zoom: 1
      });
  };
  const functionNodes: FunctionNode[] = fullscreen ? [] : callLayout.map(({ identity, x, y }) => ({
    id: identity.id,
    type: 'function',
    position: {
      x,
      y
    },
    width: window.innerWidth < 650 ? 170 : 200,
    height: 52,
    draggable: false,
    selectable: false,
    data: {
      identity,
      active: (functionFocus?.id.includes(identity.id) ?? false) || callExplained?.caller === identity.id || callExplained?.callee === identity.id,
      testsShown: testsFor === identity.id,
      onRead: openFunction,
      onTests: identity => setTestsFor(current => current === identity.id ? null : identity.id)
    }
  }));
  const target = callLayout.find(node => node.identity.id === testsFor);
  const testNodes: DeclaredTestNode[] = !fullscreen && target ? relevantTests(target.identity.id).map((record, index) => ({
    id: `test:${target.identity.id}:${record.id}`,
    type: 'declaredTest',
    position: {
      x: target.x + 490,
      y: target.y + index * 120
    },
    width: 280,
    height: 108,
    draggable: false,
    selectable: false,
    data: {
      record,
      onRead: openTest
    }
  })) : [];
  const nodes: CanvasNode[] = [
    ...fileNodes, ...functionNodes, ...testNodes
  ];
  const edges: Edge[] = fullscreen ? [] : [
    ...containment,
    ...calls.links.map(link => ({
      id: link.id,
      source: link.caller,
      target: link.callee,
      sourceHandle: 'call-out',
      targetHandle: 'call-in',
      type: 'call',
      data: {
        link,
        active: callExplained?.id === link.id,
        onExplain: setCallExplained
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8daebe',
        width: 13,
        height: 13
      },
      ariaLabel: `${calls.nodes.find(node => node.id === link.caller)?.name} calls ${calls.nodes.find(node => node.id === link.callee)?.name}`
    })),
    ...testNodes.map(node => ({
      id: `relevance:${node.id}`,
      source: testsFor!,
      target: node.id,
      sourceHandle: 'call-out',
      targetHandle: 'test-in',
      type: 'smoothstep',
      style: {
        stroke: '#b6ab87',
        strokeDasharray: '3 4'
      },
      ariaLabel: 'Source-backed test relevance; not a call or execution result'
    })),
  ];
  const returnToSource = () => {
    const retained = testReturn ?? sourceReturn;
    if (!retained)
      return;
    if (retained.expanded && retained.reading)
      readings.current = rememberFile(readings.current, retained.expanded, retained.reading);
    setFunctionFocus(retained.focus);
    setMode(retained.mode);
    setRestoreVersion(value => value + 1);
    dispatchDetail({
      type: 'focus',
      path: retained.expanded
    });
    moveCamera(retained.camera);
    if (testReturn)
      setTestReturn(null);
    else
      setSourceReturn(null);
  };
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
    setTestsFor(null);
    setTestReturn(null);
    setCallExplained(null);
    setFunctionFocus(undefined);
    setSourceReturn(null);
    setMode(readings.current[path]?.mode ?? (window.innerWidth < 650 ? 'unified' : 'split'));
    dispatchDetail({
      type: 'focus',
      path: detail.expanded === path ? null : path
    });
  };
  const key = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && callExplained) {
      e.preventDefault();
      e.stopPropagation();
      setCallExplained(null);
      return;
    }
    if (e.key === 'Escape' && sourceRelation) {
      e.preventDefault();
      e.stopPropagation();
      setSourceRelation(null);
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
  return <>

    <header>

      {(testReturn || sourceReturn) && !fullscreen && <button
        className="source-return"
        aria-label="Back to source context"
        title="Back to source context"
        onClick={returnToSource}
      >←</button>}

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
      onKeyDownCapture={key}
      aria-label="PR25 file tree. Tree edges mean contains; selected changed-function arrows mean calls, with bounded source evidence. Drag or scroll to pan; pinch or Control-wheel to zoom; arrow keys pan, plus and minus zoom, zero shows Overview."
    >

      <ReactFlow<CanvasNode>
        className="pr-graph"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={(event, node) => {
          if (!(event.target as HTMLElement).closest('.source-diff,.change-rail,.diff-controls,.file-fullscreen,.relationship-reader') && node.type === 'filename' && node.data.kind === 'file' && !node.data.context)
            focusFile(node.data.path);
        }}
        onPaneClick={() => {
          if (!fullscreen)
            setSelected(null);
          setCallExplained(null);
          setSourceRelation(null);
        }}
        onEdgeClick={(_, edge) => {
          if (edge.type === 'call') {
            setSourceRelation(null);
            setCallExplained(calls.links.find(link => link.id === edge.id) ?? null);
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

      {callExplained && <CallExplanation
        link={callExplained}
        nodes={calls.nodes}
        onClose={() => setCallExplained(null)}
      />}

      {selected && !fullscreen && !calls.prepared && <span
        className="call-frontier"
        role="status"
      >Call context unprepared for this file</span>}

      {testsFor && !fullscreen && relevantTests(testsFor).length === 0 && <span
        className="call-frontier"
        role="status"
      >Test relationship not prepared for this function</span>}

      {!callExplained && sourceRelation && <RelationshipReader
        relation={sourceRelation}
        onClose={() => setSourceRelation(null)}
      />}

    </main>

  </>;
};
const root = document.getElementById('root');
if (root)
  createRoot(root).render(<App />);
