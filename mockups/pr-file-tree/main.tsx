import { installPageGestureBoundary } from './page-gestures.ts';
import React, { useMemo, useRef, useState, useReducer, useLayoutEffect, useEffect, useSyncExternalStore } from 'react';
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
import { projectCalls, projectBehaviorCalls, layoutCalls, relevantTests, callDisplayName, type FunctionIdentity, type CallLink } from './calls.ts';
import { FunctionLabel, DeclaredTestLabel, CallLine, CallExplanation, type FunctionNode, type DeclaredTestNode } from './call-graph.tsx';
import type { DeclaredTest } from './declared-tests.types.ts';
import { ReviewContext, type ContextEvidence } from './review-context.tsx';
import { createReviewWorkspace, storyProjection, storyTransition } from '../../src/application/public.ts';
import type { StoryIntent } from '../../src/application/public.ts';
import { graphFiles } from '../../src/domain/public.ts';
import type { StoryReference } from '../../src/domain/public.ts';
import { OwnerPanels, type OwnerPanel } from './owner-panels.tsx';
import { type GraphLens } from './behavior.ts';
import { BehaviorNoteLabel, LensIcon, ActionIcon, type BehaviorNote } from './behavior-graph.tsx';
import { mapJourneySource } from './journey-source.ts';
import { layoutFileProjection, projectFileCalls, fileRequirementReferences } from './file-projection.ts';
import { FileCallLine, FileRequirementLine } from './file-call.tsx';
import { prepareChangeImpact } from './change-impact.ts';
import { ChangeImpactLine, ChangeImpactExplanation } from './change-impact-view.tsx';
import { storyAttentionCamera, type AttentionRect } from './story-framing.ts';
import { WorkspaceActions } from './workspace-actions.tsx';
const motionDuration = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240;
const tree = buildTree(fixture.paths, fixture.changes);
const behaviorCalls = projectBehaviorCalls();
const fileCalls = projectFileCalls(tree);
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
  height: number;
  onMeasure: (height: number) => void;
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
  const surface = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!data.expanded || data.fullscreen) return;
    const pre = surface.current?.querySelector<HTMLElement>('.continuous-comparison pre');
    const heading = surface.current?.querySelector<HTMLElement>('.continuous-version-header');
    if (!pre) return;
    const measure = () => {
      const maximum = Math.max(180, Math.min(window.innerWidth < 650 ? 580 : 640, window.innerHeight - 120));
      data.onMeasure(Math.max(180, Math.min(maximum, pre.offsetHeight + (heading?.offsetHeight ?? 32) + 60)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [data.expanded, data.fullscreen, data.path, data.width, data.onMeasure]);
  useLayoutEffect(() => {
    update(id);
    const timer = setTimeout(() => update(id), motionDuration());
    return () => clearTimeout(timer);
  }, [
    id, data.width, data.height, data.expanded, data.fullscreen, update
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
    ref={surface}
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
type CanvasNode = LabelNode | FunctionNode | DeclaredTestNode | BehaviorNote;
const nodeTypes = {
  behaviorNote: BehaviorNoteLabel,
  filename: Label,
  function: FunctionLabel,
  declaredTest: DeclaredTestLabel
};
const edgeTypes = {
  call: CallLine,
  fileCall: FileCallLine, requirementReference: FileRequirementLine, changeImpact: ChangeImpactLine
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
const initialView = (lens: GraphLens, overview = false) => {
  const narrow = window.innerWidth < 650;
  if (lens === 'behavior') {
    return { x: narrow ? 12 : 28, y: 120, zoom: 1 };
  }
  const anchor = tree.nodes.find(n => n.id === (narrow && !overview ? 'directory:src/application' : 'directory:.'))!;
  return {
    x: narrow && !overview ? 20 - anchor.x : 28,
    y: narrow && !overview ? 110 - anchor.y : (window.innerHeight - 46) / 2 - anchor.y,
    zoom: 1
  };
};
const App = () => {
  useEffect(() => {
    const root = document.getElementById('root');
    return root ? installPageGestureBoundary(root) : undefined;
  }, []);
  const [lens, setLens] = useState<GraphLens>(() => new URLSearchParams(window.location.search).get('view') === 'files' ? 'files' : 'behavior');
  const lensCameras = useRef<Record<GraphLens, ReturnType<typeof initialView> | null>>({ behavior: null, files: null });
  const lensCameraSources = useRef<Record<GraphLens, string | null>>({ behavior: null, files: null });
  const [canvasReady, setCanvasReady] = useState(false);
  const [narrow, setNarrow] = useState(window.innerWidth < 650);
  const behaviorTree = useMemo(() => layoutFileProjection(tree, narrow), [narrow]);
  const [fileHeights, setFileHeights] = useState<Record<string, number>>({});
  const pendingFileFrame = useRef<{ path: string } | null>(null);
  const baseTree = lens === 'behavior' ? behaviorTree : tree;
  const [sourceFinder, setSourceFinder] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (lens === 'files') url.searchParams.set('view', 'files');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
  }, [lens]);
  const [workspace] = useState(() => createReviewWorkspace('pr-25'));
  const ownerStory = useSyncExternalStore(workspace.story.subscribe, workspace.story.getSnapshot);
  const ownerReview = useSyncExternalStore(workspace.review.subscribe, workspace.review.getSnapshot);
  const [ownerPanel, setOwnerPanel] = useState<OwnerPanel | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [ownerBusy, setOwnerBusy] = useState(false);
  const ownerScroll = useRef({ story: 0, discussion: 0 });
  const panelRestoreRevision = useRef(0);
  const runOwner = (operation: () => unknown) => {
    setOwnerError('');
    try {
      const result = operation();
      if (result instanceof Promise) void result.catch(error => setOwnerError(error instanceof Error ? error.message : 'owner_operation_failed'));
    } catch (error) {
      setOwnerError(error instanceof Error ? error.message : 'owner_operation_failed');
    }
  };
  useEffect(() => {
    const disconnect = workspace.connect();
    const disconnectStory = workspace.story.connect();
    void workspace.open().catch(error => setOwnerError(error instanceof Error ? error.message : 'owner_unavailable'));
    return () => { disconnectStory(); disconnect(); };
  }, [workspace]);
  const impact = useMemo(() => ownerStory.snapshot ? prepareChangeImpact(ownerStory.snapshot) : null, [ownerStory.snapshot]);
  const [contextOpen, setContextOpen] = useState(window.innerWidth >= 650);
  const contextInvoker = useRef<HTMLButtonElement>(null);
  const contextScroll = useRef(0);
  const [pendingFocus, setPendingFocus] = useState<{
    target: 'context' | 'reading' | 'reply';
    path: string | null;
  } | null>(null);
  useEffect(() => {
    const media = matchMedia('(max-width: 649px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const closeContext = () => {
    setContextOpen(false);
    setPendingFocus({ target: 'context', path: null });
  };
  const flow = useRef<ReactFlowInstance<CanvasNode>>(null);
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!pendingFocus) {
      return;
    }
    const focus = () => {
      const target = pendingFocus.target === 'reply'
        ? Array.from(document.querySelectorAll<HTMLElement>('[data-reply-evidence]')).find(element => element.dataset.replyEvidence === pendingFocus.path)
        : pendingFocus.target === 'context'
        ? contextInvoker.current
        : pendingFocus.path
          ? Array.from(main.current?.querySelectorAll<HTMLElement>('.continuous-reader') ?? [])
            .find(reader => reader.getAttribute('aria-label') === `Pinned diff for ${pendingFocus.path}`)
          : main.current;
      if (!target) {
        return false;
      }
      target.focus({ preventScroll: true });
      setPendingFocus(null);
      return true;
    };
    if (focus() || !main.current) {
      return;
    }
    // ReactFlow may publish its node DOM after the parent navigation commit.
    const observer = new MutationObserver(() => {
      if (focus()) {
        observer.disconnect();
      }
    });
    observer.observe(main.current.parentElement ?? main.current, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, [pendingFocus]);
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
    selected: string | null;
    testsFor: string | null;
    expanded: string | null;
    focus: ReadingFocus | undefined;
    reading: FileReading | undefined;
    camera: {
      x: number;
      y: number;
      zoom: number;
    };
    mode: DiffMode;
    lens: GraphLens;
  } | null>(null);
  const [testReturn, setTestReturn] = useState<typeof sourceReturn>(null);
  const [contextReturns, setContextReturns] = useState<readonly {
    frame: NonNullable<typeof sourceReturn>;
    source: typeof sourceReturn;
    test: typeof sourceReturn;
  }[]>([]);
  const readings = useRef<FileReadings>({});
  const pendingOwnerReadings = useRef<FileReadings | null>(null);
  const [restoreVersion, setRestoreVersion] = useState(0);
  useLayoutEffect(() => {
    if (pendingOwnerReadings.current) {
      // Old readers may publish their final scroll during unmount. The owner
      // return restores the captured presentation after that cleanup finishes.
      readings.current = pendingOwnerReadings.current;
      pendingOwnerReadings.current = null;
    }
  }, [restoreVersion]);
  const cameraOwner = useRef<symbol | null>(null);
  const moveCamera = (view: {
    x: number;
    y: number;
    zoom: number;
  }) => {
    pendingFileFrame.current = null;
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
  const stopCameraMotion = () => {
    const current = flow.current?.getViewport();
    if (current && cameraOwner.current) {
      cameraOwner.current = null;
      void flow.current?.setViewport(current, { duration: 0 });
    }
  };
  const switchLens = (next: GraphLens) => {
    if (fullscreen || next === lens || !flow.current) return;
    const current = flow.current.getViewport();
    const path = detail.expanded ?? selected;
    lensCameras.current[lens] = current;
    lensCameraSources.current[lens] = path;
    const targetTree = next === 'behavior' ? behaviorTree : tree;
    const origin = baseTree.nodes.find(node => node.kind === 'file' && node.path === path);
    const destination = targetTree.nodes.find(node => node.kind === 'file' && node.path === path);
    const remembered = lensCameraSources.current[next] === path ? lensCameras.current[next] : null;
    const target = remembered ?? (origin && destination
      ? { x: current.x + (origin.x - destination.x) * current.zoom,
        y: current.y + (origin.y - destination.y) * current.zoom, zoom: current.zoom }
      : initialView(next));
    setLens(next);
    lensCameras.current[next] = target;
    lensCameraSources.current[next] = path;
    moveCamera(target);
    const url = new URL(window.location.href);
    if (next === 'files') url.searchParams.set('view', 'files');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
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
    lens: GraphLens;
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
    setLens(fullscreen.lens);
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
      mode, lens
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
    let result = detailTree(baseTree, detail.expanded, window.innerWidth < 650, fileHeights);
    if (lens === 'behavior' && detail.expanded) {
      const source = result.nodes.find(node => node.path === detail.expanded);
      if (source) {
        const targets = new Set(fileCalls.filter(call => call.caller.declaration.path === source.path).map(call => call.callee.declaration.path));
        const clearance = (narrow ? 208 : 340) + 96;
        result = { ...result, nodes: result.nodes.map(node => targets.has(node.path) && node.x < source.x + source.width + clearance
          ? { ...node, x: source.x + source.width + clearance } : node) };
      }
    }
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
    detail.expanded, fullscreen, lens, baseTree, fileHeights, narrow
  ]);
  useLayoutEffect(() => {
    if (fullscreen) {
      const n = baseTree.nodes.find(n => n.path === fullscreen.path && n.kind === 'file')!;
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
  useLayoutEffect(() => {
    const request = pendingFileFrame.current;
    if (!request) return;
    const { path } = request;
    if (path !== detail.expanded || fullscreen) { pendingFileFrame.current = null; return; }
    const timer = setTimeout(() => {
      if (pendingFileFrame.current !== request) return;
      const node = Array.from(main.current?.querySelectorAll<HTMLElement>('[data-file-path]') ?? [])
        .find(element => element.dataset.filePath === path)?.closest<HTMLElement>('.react-flow__node');
      const graph = main.current?.querySelector<HTMLElement>('.pr-graph');
      const current = flow.current?.getViewport();
      if (!node || !graph || !current) return;
      const bounds = node.getBoundingClientRect();
      const area = graph.getBoundingClientRect();
      pendingFileFrame.current = null;
      moveCamera({ ...current, x: current.x + area.left + 12 - bounds.left, y: current.y + area.top + 12 - bounds.top });
    }, motionDuration() + 40);
    return () => clearTimeout(timer);
  }, [viewTree, detail.expanded, fullscreen]);
  const previousRoot = useRef({ tree: viewTree, narrow, lens });
  useLayoutEffect(() => {
    const previous = previousRoot.current;
    previousRoot.current = { tree: viewTree, narrow, lens };
    if (previous.narrow === narrow || previous.lens !== lens || !detail.expanded || fullscreen || pendingFileFrame.current) return;
    const before = previous.tree.nodes.find(node => node.path === detail.expanded && node.kind === 'file');
    const after = viewTree.nodes.find(node => node.path === detail.expanded && node.kind === 'file');
    const camera = flow.current?.getViewport();
    if (before && after && camera) moveCamera({ ...camera, x: camera.x + (before.x - after.x) * camera.zoom, y: camera.y + (before.y - after.y) * camera.zoom });
  }, [viewTree, narrow, lens, detail.expanded, fullscreen]);
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
        height: n.height,
        onMeasure: height => setFileHeights(current => Math.abs((current[n.path] ?? 0) - height) < 1 ? current : { ...current, [n.path]: height }),
        reading: readings.current[n.path],
        onReading: value => {
          readings.current = rememberFile(readings.current, n.path, value);
        },
        restoreVersion,
        focus: functionFocus?.path === n.path ? functionFocus : undefined,
        onCalls: !fullscreen && n.path === selected && projectCalls(selected).prepared ? () => {
          if (lens === 'behavior') { switchLens('files'); return; }
          const current = callLayout.filter(item => item.identity.declaration.path === selected);
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
    selected, viewTree, detail.expanded, mode, fullscreen, sourceRelation, restoreVersion, functionFocus, lens
  ]);
  const calls = useMemo(() => lens === 'behavior' ? behaviorCalls : projectCalls(selected), [lens, selected]);
  const callLayout = useMemo(() => {
    if (lens === 'behavior') {
      const origin = viewTree.nodes.find(node => node.path === selected && node.kind === 'file');
      return origin ? layoutCalls(projectCalls(selected), { x: origin.x + origin.width + 72, y: origin.y }, narrow ? 170 : 200) : [];
    }
    const origin = viewTree.nodes.find(node => node.path === selected && node.kind === 'file');
    return origin ? layoutCalls(calls, { x: origin.x + origin.width + 72, y: origin.y }, narrow ? 170 : 200) : [];
  }, [
    calls, viewTree, selected, lens, narrow
  ]);
  const rememberReturn = () => {
    if (!sourceReturn && flow.current)
      setSourceReturn({
        selected,
        testsFor,
        expanded: detail.expanded,
        focus: functionFocus,
        reading: detail.expanded ? readings.current[detail.expanded] : undefined,
        camera: flow.current.getViewport(),
        mode, lens
      });
  };
  const openFunction = (identity: FunctionIdentity, saveReturn = true) => {
    if (fullscreen)
      return;
    if (saveReturn) {
      rememberReturn();
    }
    setSelected(identity.declaration.path);
    setCallExplained(null);
    setSourceRelation(null);
    sourceSerial.current++;
    const side = identity.declaration.side === 'base' ? 'before' : 'after';
    setFunctionFocus({
      id: `function:${identity.id}:${sourceSerial.current}`,
      path: identity.declaration.path,
      name: callDisplayName(identity),
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
    const node = baseTree.nodes.find(node => node.path === identity.declaration.path && node.kind === 'file');
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
        selected,
        testsFor,
        expanded: detail.expanded,
        focus: functionFocus,
        reading: detail.expanded ? readings.current[detail.expanded] : undefined,
        camera: flow.current.getViewport(),
        mode, lens
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
    const node = baseTree.nodes.find(node => node.path === record.path && node.kind === 'file');
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
      active: (functionFocus?.id.includes(identity.id) ?? false)
        || Boolean(storyOpen && storyProjection(ownerStory)?.sources.some(source => source.reference.type === 'snapshot_source'
          && source.reference.anchor.path === identity.declaration.path && source.reference.anchor.side === identity.declaration.side
          && source.reference.anchor.startLine === identity.declaration.startLine && source.reference.anchor.endLine === identity.declaration.endLine))
        || callExplained?.caller === identity.id || callExplained?.callee === identity.id,
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
  const nodes: CanvasNode[] = [...fileNodes, ...(lens === 'files' ? functionNodes : []), ...testNodes];
  const edges: Edge[] = fullscreen ? [] : [
    ...(lens === 'files' ? containment : []),
    ...(lens === 'behavior' && impact?.status === 'ready' ? [{
      id: `impact:${impact.claim.id}`, type: 'changeImpact',
      source: 'file:src/server/public.ts', target: 'file:src/application/review.ts',
      sourceHandle: 'contains-out', targetHandle: 'contains-in',
      data: { impact, narrow, sourceBottom: (() => { const node = viewTree.nodes.find(node => node.path === 'src/server/public.ts')!; return node.y + node.height; })(),
        onExplain: () => { pendingFileFrame.current = null; setCallExplained(null); setSourceRelation(null); if (narrow) { setContextOpen(false); setOwnerPanel(null); } setImpactOpen(true); } },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#baa6d6', width: 16, height: 16 },
      ariaLabel: 'Inferred implementation consequence, not a call or proven edit causation',
    }] : []),
    ...(lens === 'behavior' ? fileRequirementReferences.map((reference, index) => ({
      id: `requirement-reference:${reference.key}:request`, type: 'requirementReference',
      source: `file:${reference.path}`, target: 'file:src/application/review.ts',
      sourceHandle: 'contains-out', targetHandle: 'contains-in',
      data: { document: reference.path, sourceLeft: viewTree.nodes.find(node => node.path === reference.path)!.x, startLine: reference.start, endLine: reference.end, lane: index,
        onRead: (keyboard: boolean) => openContextEvidence(reference.key, keyboard) },
      ariaLabel: `Documented requirement to request implementation evidence; not a call`,
    })) : []),
    ...(lens === 'behavior' ? fileCalls.map(call => {
      const siblings = fileCalls.filter(other => other.caller.declaration.path === call.caller.declaration.path && other.callee.declaration.path === call.callee.declaration.path);
      const index = siblings.findIndex(other => other.link.id === call.link.id);
      return {
        id: call.link.id, type: 'fileCall',
        source: `file:${call.caller.declaration.path}`, target: `file:${call.callee.declaration.path}`,
        sourceHandle: 'contains-out', targetHandle: 'contains-in',
        data: { ...call, active: callExplained?.id === call.link.id, onExplain: setCallExplained,
          sourceBounds: viewTree.nodes.find(node => node.path === call.caller.declaration.path)!,
          targetBounds: viewTree.nodes.find(node => node.path === call.callee.declaration.path)!,
          count: siblings.length,
          targetIndex: (() => {
            const incoming = fileCalls.filter(other => other.callee.declaration.path === call.callee.declaration.path).sort((a, b) => {
              const first = viewTree.nodes.find(node => node.path === a.caller.declaration.path)!;
              const second = viewTree.nodes.find(node => node.path === b.caller.declaration.path)!;
              return first.y - second.y || fileCalls.indexOf(a) - fileCalls.indexOf(b);
            });
            const rank = incoming.findIndex(other => other.link.id === call.link.id);
            const first = viewTree.nodes.find(node => node.path === incoming[0]!.caller.declaration.path)!;
            const target = viewTree.nodes.find(node => node.path === call.callee.declaration.path)!;
            // The narrow overlapping source exits upward inside the other curves.
            if (narrow && first.x > 0 && first.x + first.width > target.x) return rank === 0 ? 0 : incoming.length - rank;
            // Earlier/higher bands terminate farther right, preserving nested order.
            return incoming.length - 1 - rank;
          })(),
          targetCount: fileCalls.filter(other => other.callee.declaration.path === call.callee.declaration.path).length,
          lane: index, narrow },
        markerEnd: { type: MarkerType.ArrowClosed, color: call.status === 'added' ? '#92d4ac' : '#bdc6cc', width: 16, height: 16 },
        ariaLabel: `${callDisplayName(call.caller)} calls ${callDisplayName(call.callee)}; exact contained-symbol call projection`,
      };
    }) : []),
    ...(lens === 'files' ? calls.links : []).map(link => ({
      id: link.id,
      source: link.caller,
      target: link.callee,
      sourceHandle: 'call-out',
      targetHandle: 'call-in',
      type: 'call',
      data: {
        link,
        active: callExplained?.id === link.id,
        onExplain: setCallExplained,
        caller: calls.nodes.find(node => node.id === link.caller)!,
        callee: calls.nodes.find(node => node.id === link.callee)!,
        lane: (() => {
          const parallel = calls.links.filter(other => other.caller === link.caller && other.callee === link.callee);
          return (parallel.findIndex(other => other.id === link.id) - (parallel.length - 1) / 2) * 32;
        })(),
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
  const returnToSource = (keyboard = false) => {
    pendingFileFrame.current = null;
    const context = contextReturns.at(-1);
    const retained = testReturn ?? sourceReturn ?? context?.frame;
    if (!retained)
      return;
    if (retained.expanded && retained.reading)
      readings.current = rememberFile(readings.current, retained.expanded, retained.reading);
    if (keyboard) {
      setPendingFocus({ target: 'reading', path: retained.expanded });
    }
    setFunctionFocus(retained.focus);
    setSelected(retained.selected);
    setTestsFor(retained.testsFor);
    setMode(retained.mode);
    setLens(retained.lens);
    setRestoreVersion(value => value + 1);
    dispatchDetail({
      type: 'focus',
      path: retained.expanded
    });
    moveCamera(retained.camera);
    if (testReturn)
      setTestReturn(null);
    else if (sourceReturn)
      setSourceReturn(null);
    else if (context) {
      setSourceReturn(context.source);
      setTestReturn(context.test);
      setContextReturns(frames => frames.slice(0, -1));
    }
  };
  const reset = () => {
    pendingFileFrame.current = null;
    if (fullscreen) {
      exitFullscreen();
      return;
    }
    dispatchDetail({
      type: 'focus',
      path: null
    });
    void flow.current?.setViewport(initialView(lens, true), {
      duration: 0
    });
  };
  const focusFile = (path: string) => {
    if (fullscreen)
      return;
    pendingFileFrame.current = detail.expanded === path ? null : { path };
    setSelected(path);
    setTestsFor(null);
    setTestReturn(null);
    setCallExplained(null);
    setFunctionFocus(undefined);
    setSourceReturn(null);
    setContextReturns([]);
    setMode(readings.current[path]?.mode ?? (window.innerWidth < 650 ? 'unified' : 'split'));
    dispatchDetail({
      type: 'focus',
      path: detail.expanded === path ? null : path
    });
  };
  const openContextEvidence = (target: ContextEvidence, keyboard: boolean) => {
    pendingFileFrame.current = null;
    if (!flow.current) {
      return;
    }
    if (narrow) {
      setContextOpen(false);
    }
    const path = target === 'request'
      ? 'src/application/review.ts'
      : target === 'rationale' ? 'docs/plans/480p/slices/01-review-loop/single-user-access/plan.md' : 'docs/product/review-loop/runtime.md';
    if (keyboard) {
      setPendingFocus({ target: 'reading', path });
    }
    const frame = {
      selected,
      testsFor,
      expanded: detail.expanded,
      focus: functionFocus,
      reading: detail.expanded ? readings.current[detail.expanded] : undefined,
      camera: flow.current.getViewport(),
      mode, lens
    };
    setContextReturns(frames => [...frames, {
      frame,
      source: sourceReturn,
      test: testReturn
    }]);
    setSourceReturn(null);
    setTestReturn(null);
    setSelected(path);
    setTestsFor(null);
    if (target === 'request') {
      const request = projectCalls(path).seeds.find(node => node.name === 'request' && node.declaration.side === 'head');
      if (request) {
        openFunction(request, false);
      }
    } else {
      sourceSerial.current++;
      setCallExplained(null);
      setSourceRelation(null);
      setFunctionFocus({
        id: `requirement:${sourceSerial.current}`,
        path,
        name: 'Captured local-owner requirement',
        before: [],
        after: target === 'rationale' ? [{ startLine: 11, endLine: 13 }] : [{ startLine: 22, endLine: 26 }],
        preferredSide: 'after'
      });
      dispatchDetail({ type: 'focus', path });
      const node = baseTree.nodes.find(node => node.path === path && node.kind === 'file');
      if (node) {
        moveCamera({ x: 5 - node.x, y: 30 - node.y, zoom: 1 });
      }
    }
  };
  const capturePresentation = (retainPanels = false) => {
    const file = detail.expanded;
    const retained = file ? readings.current[file] : undefined;
    if (file && retained) {
      const reader = main.current?.querySelector<HTMLElement>('.continuous-reader');
      const comparison = main.current?.querySelector<HTMLElement>('.continuous-comparison');
      readings.current = rememberFile(readings.current, file, {
        ...retained,
        top: reader?.scrollTop ?? retained.top,
        horizontal: { ...retained.horizontal, [-1]: comparison?.scrollLeft ?? retained.horizontal[-1] ?? 0 },
      });
    }
    return structuredClone({
      camera: flow.current?.getViewport() ?? initialView(lens),
      selected, testsFor, mode, lens, lensCameras: lensCameras.current, lensCameraSources: lensCameraSources.current, functionFocus, expanded: detail.expanded,
      readings: readings.current, sourceReturn, testReturn, contextReturns,
      callExplained, impactOpen, sourceRelation,
      panels: retainPanels ? {
        contextOpen, storyOpen, discussionOpen, ownerPanel,
        contextScroll: contextScroll.current,
        scroll: {
          story: document.querySelector<HTMLElement>('.owner-story')?.scrollTop ?? ownerScroll.current.story,
          discussion: document.querySelector<HTMLElement>('.owner-discussion')?.scrollTop ?? ownerScroll.current.discussion,
        },
      } : null,
    });
  };
  const ownerReturn = useRef<ReturnType<typeof capturePresentation> | null>(null);
  const supportingPresentation = useRef<{ id: string; frame: ReturnType<typeof capturePresentation>; focus: string | null } | null>(null);
  const ownerOperation = useRef(false);
  const openOwnerPanel = (panel: OwnerPanel) => {
    pendingFileFrame.current = null;
    setSourceFinder(false);
    if (narrow) setContextOpen(false);
    if (panel === 'story') setStoryOpen(true);
    else setDiscussionOpen(true);
    setOwnerPanel(panel);
  };
  const closeOwnerPanel = (target: OwnerPanel) => {
    if (target === 'story') stopCameraMotion();
    if (target === 'story') setStoryOpen(false);
    else setDiscussionOpen(false);
    if (ownerPanel === target) setOwnerPanel(null);
    requestAnimationFrame(() => document.getElementById(`open-owner-${target}`)?.focus({ preventScroll: true }));
  };
  const inspectOwnerEvidence = async (reference: StoryReference, keyboard: boolean) => {
    pendingFileFrame.current = null;
    if (ownerOperation.current || !flow.current) return;
    if (reference.type !== 'snapshot_source') throw new Error('Exact snapshot evidence is required for this reader.');
    if (!fileDiffs.has(reference.anchor.path)) throw new Error('This retained source is not prepared in the continuous reader.');
    ownerOperation.current = true;
    setOwnerBusy(true);
    try {
      const held = workspace.story.getSnapshot();
      const frame = held.returnFrame || held.supportingCheckpoint ? null : capturePresentation();
      workspace.story.enterExploration();
      if (frame) ownerReturn.current = frame;
      await workspace.inspectReference(reference);
      const canvas = workspace.canvas.getSnapshot();
      if (canvas.busy || canvas.error || canvas.frame?.inspection?.contentHash !== reference.contentHash
        || JSON.stringify(canvas.frame.inspection.anchor) !== JSON.stringify(reference.anchor)) {
        throw new Error(canvas.error || 'Exact source inspection did not complete.');
      }
      const { path, side, startLine, endLine } = reference.anchor;
      sourceSerial.current++;
      setSelected(path);
      setTestsFor(null);
      setCallExplained(null);
      setSourceRelation(null);
      setSourceReturn(null);
      setTestReturn(null);
      setContextReturns([]);
      setFunctionFocus({
        id: `owner-evidence:${sourceSerial.current}`,
        path,
        name: 'Exact retained evidence',
        before: side === 'base' ? [{ startLine, endLine }] : [],
        after: side === 'head' ? [{ startLine, endLine }] : [],
        preferredSide: side === 'base' ? 'before' : 'after',
        revealSide: true,
      });
      dispatchDetail({ type: 'focus', path });
      const node = baseTree.nodes.find(node => node.path === path && node.kind === 'file');
      if (node) moveCamera({ x: 8 - node.x, y: 30 - node.y, zoom: 1 });
      if (narrow) setOwnerPanel(null);
      setImpactOpen(false);
      if (keyboard) setPendingFocus({ target: 'reading', path });
    } finally {
      ownerOperation.current = false;
      setOwnerBusy(false);
    }
  };
  const restorePresentation = (frame: ReturnType<typeof capturePresentation>) => {
      readings.current = frame.readings;
      pendingOwnerReadings.current = frame.readings;
      setSelected(frame.selected);
      setTestsFor(frame.testsFor);
      setMode(frame.mode);
      setLens(frame.lens);
      lensCameras.current = frame.lensCameras;
      lensCameraSources.current = frame.lensCameraSources;
      setFunctionFocus(frame.functionFocus);
      setSourceReturn(frame.sourceReturn);
      setTestReturn(frame.testReturn);
      setContextReturns(frame.contextReturns);
      setCallExplained(frame.callExplained);
      setImpactOpen(Boolean(frame.impactOpen));
      setSourceRelation(frame.sourceRelation);
      dispatchDetail({ type: 'focus', path: frame.expanded });
      setRestoreVersion(value => value + 1);
      moveCamera(frame.camera);
      if (frame.panels) {
        ownerScroll.current = structuredClone(frame.panels.scroll);
        contextScroll.current = frame.panels.contextScroll;
        setContextOpen(frame.panels.contextOpen);
        setStoryOpen(frame.panels.storyOpen);
        setDiscussionOpen(frame.panels.discussionOpen);
        setOwnerPanel(frame.panels.ownerPanel);
        panelRestoreRevision.current++;
      } else if (narrow) setOwnerPanel(null);
      setPendingFocus({ target: 'reading', path: frame.expanded });
  };
  const inspectReplyEvidence = async (reference: StoryReference, keyboard: boolean) => {
    if (ownerOperation.current) throw new Error('owner_operation_in_progress');
    const existing = workspace.story.getSnapshot().supportingCheckpoint;
    if (existing && supportingPresentation.current?.id !== existing.id) throw new Error('answer_reading_unavailable');
    const frame = existing ? null : capturePresentation(true);
    const focus = document.activeElement?.getAttribute('data-reply-evidence') ?? null;
    const id = workspace.story.beginSupportingEvidence();
    if (frame) supportingPresentation.current = { id, frame, focus };
    await inspectOwnerEvidence(reference, keyboard);
  };
  const resumeAnswerReading = async () => {
    pendingFileFrame.current = null;
    if (ownerOperation.current) return;
    const checkpoint = workspace.story.getSnapshot().supportingCheckpoint;
    const retained = supportingPresentation.current;
    if (!checkpoint || !retained || retained.id !== checkpoint.id) throw new Error('answer_reading_unavailable');
    ownerOperation.current = true;
    setOwnerBusy(true);
    try {
      await workspace.story.resumeSupportingEvidence(checkpoint.id);
      if (workspace.story.getSnapshot().supportingCheckpoint) throw new Error('Answer return is not complete.');
      restorePresentation(retained.frame);
      supportingPresentation.current = null;
      if (retained.focus) setPendingFocus({ target: 'reply', path: retained.focus });
    } finally { ownerOperation.current = false; setOwnerBusy(false); }
  };
  const resumeOwnerReading = async () => {
    pendingFileFrame.current = null;
    if (ownerOperation.current) return;
    const frame = ownerReturn.current;
    if (!frame) throw new Error('The original local reading frame is unavailable after reload; retained owner drafts remain preserved.');
    ownerOperation.current = true;
    setOwnerBusy(true);
    try {
      await workspace.story.resumeStory();
      if (workspace.story.getSnapshot().returnFrame) throw new Error('Owner return is not complete.');
      restorePresentation(frame);
      ownerReturn.current = null;
    } finally {
      ownerOperation.current = false;
      setOwnerBusy(false);
    }
  };
  const navigateOwnerStory = (intent: StoryIntent) => runOwner(() => {
    if (ownerOperation.current) throw new Error('owner_operation_in_progress');
    const before = workspace.story.getSnapshot();
    if (intent.type !== 'previous' && intent.type !== 'next' || before.mode === 'exploring') {
      workspace.story.intent(intent);
      return;
    }
    const preview = storyTransition(before, intent);
    if (!preview.cursor || preview.cursor.stepId === before.cursor?.stepId) return;
    const projection = storyProjection(preview);
    const file = before.snapshot && graphFiles(before.snapshot).find(file => file.key === projection?.comparisonKey);
    const path = file?.newPath ?? file?.oldPath;
    const header = Array.from(main.current?.querySelectorAll<HTMLElement>('[data-file-path]') ?? [])
      .find(element => element.dataset.filePath === path);
    const graph = main.current?.querySelector<HTMLElement>('.pr-graph');
    const camera = flow.current?.getViewport();
    if (!path || !header || !graph || !camera) throw new Error('story_attention_target_unavailable');
    const bounds = graph.getBoundingClientRect();
    const area = { left: bounds.left + 12, top: bounds.top + 12, right: bounds.right - 12, bottom: bounds.bottom - 12 };
    if (!narrow) {
      for (const panel of document.querySelectorAll<HTMLElement>('.relationship-reader:not(.owner-modal)')) {
        const rect = panel.getBoundingClientRect();
        if (rect.bottom <= area.top || rect.top >= area.bottom) continue;
        if (rect.right >= area.right && rect.left > area.left) area.right = Math.min(area.right, rect.left - 12);
      }
    }
    const actions = document.querySelector<HTMLElement>('.workspace-actions');
    if (actions && getComputedStyle(actions).visibility !== 'hidden') {
      const rect = actions.getBoundingClientRect();
      if (rect.left < area.right && rect.right > area.left && rect.bottom > area.top) area.bottom = Math.min(area.bottom, rect.top - 12);
    }
    const target = header.getBoundingClientRect();
    let context: AttentionRect | undefined;
    if (!narrow && lens === 'behavior') {
      const relevant = fileCalls.filter(call => call.caller.declaration.path === path);
      if (relevant.length) {
        const ids = new Set(relevant.map(call => call.link.id));
        const paths = new Set([path, ...relevant.map(call => call.callee.declaration.path)]);
        const rectangles: AttentionRect[] = Array.from(main.current?.querySelectorAll<HTMLElement>('[data-file-path]') ?? [])
          .filter(element => paths.has(element.dataset.filePath ?? '')).map(element => element.getBoundingClientRect());
        for (const label of main.current?.querySelectorAll<HTMLElement>('[data-call-id]') ?? []) {
          if (ids.has(label.dataset.callId ?? '')) rectangles.push(label.getBoundingClientRect());
        }
        for (const edge of main.current?.querySelectorAll<SVGElement>('.react-flow__edge-fileCall') ?? []) {
          if (!ids.has(edge.dataset.id ?? '')) continue;
          const rect = edge.querySelector('.react-flow__edge-path')?.getBoundingClientRect();
          if (rect) rectangles.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom + 30 });
        }
        context = {
          left: Math.min(...rectangles.map(rect => rect.left)), top: Math.min(...rectangles.map(rect => rect.top)),
          right: Math.max(...rectangles.map(rect => rect.right)), bottom: Math.max(...rectangles.map(rect => rect.bottom)),
        };
      }
    }
    const attention = storyAttentionCamera(camera, target, area, context);
    if (attention) {
      if (before.returnFrame && !ownerReturn.current) throw new Error('original_local_reading_unavailable');
      const original = before.returnFrame ? null : capturePresentation(true);
      if (!workspace.story.enterExploration({ allowStoryNavigation: true, navigation: intent })) return;
      if (original) ownerReturn.current = original;
    } else workspace.story.intent(intent);
    const after = workspace.story.getSnapshot();
    if (after.snapshotId !== before.snapshotId || after.view?.version?.versionId !== before.view?.version?.versionId
      || after.cursor?.stepId !== preview.cursor.stepId) throw new Error('story_attention_superseded');
    pendingFileFrame.current = null;
    stopCameraMotion();
    setSelected(path);
    if (attention) moveCamera(attention);
  });
  const inspectVisibleSource = () => {
    const snapshot = ownerStory.snapshot;
    const path = detail.expanded;
    const side = functionFocus?.path === path && functionFocus.preferredSide === 'before' ? 'base' : 'head';
    const source = snapshot?.sources.find(source => source.path === path && source.side === side);
    const ranges = functionFocus?.path === path ? functionFocus[side === 'base' ? 'before' : 'after'] : [];
    if (!snapshot || !source || !path) throw new Error('Visible source has no retained question mapping.');
    return inspectOwnerEvidence({
      type: 'snapshot_source', contentHash: source.hash,
      anchor: { snapshotId: snapshot.snapshotId, side, path, startLine: ranges[0]?.startLine ?? 1, endLine: ranges[0]?.endLine ?? 1 },
    }, true);
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
      pendingFileFrame.current = null;
      e.preventDefault();
      void flow.current.setViewport({
        ...view,
        x: view.x + pan.x,
        y: view.y + pan.y
      });
    }
    else if (e.key === '+' || e.key === '=' || e.key === '-') {
      pendingFileFrame.current = null;
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

    <header className="workspace-title">
      <span title={`PR25 · ${fixture.base} → ${fixture.head}`}>

        {fullscreen ? fullscreen.path : 'pr-reviewer'}

        {!fullscreen && <b>PR #25</b>}

      </span>

    </header>
    <WorkspaceActions blocked={ownerBusy || (!fullscreen && narrow && (contextOpen || Boolean(ownerPanel) || impactOpen))}>

      {!fullscreen && <button
        className="context-cue"
        ref={contextInvoker}
        aria-label={contextOpen ? 'Hide review context' : 'Open review context'}
        aria-expanded={contextOpen}
        onClick={() => { pendingFileFrame.current = null; setSourceFinder(false); if (narrow) setOwnerPanel(null); setContextOpen(value => !value); }}
        title="Review context"
      ><ActionIcon action="context" />{!detail.expanded && <span>Context</span>}</button>}

      {!fullscreen && <div className="lens-actions" role="group" aria-label="Graph view">
        <button aria-label="Behavior graph" title="Behavior graph · callers and callees" aria-pressed={lens === 'behavior'} disabled={!canvasReady} onClick={() => switchLens('behavior')}><LensIcon files={false} /></button>
        <button aria-label="File tree" title="File tree · alternate source organization" aria-pressed={lens === 'files'} disabled={!canvasReady} onClick={() => switchLens('files')}><LensIcon files /></button>
        <button aria-label="Find source" title="Find any changed source" aria-expanded={sourceFinder} onClick={() => setSourceFinder(value => !value)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg>
        </button>
      </div>}

      {!fullscreen && <div className="owner-cues">
        <button id="open-owner-story" aria-label="Open prepared story" title="Prepared story" disabled={!ownerStory.authenticated || ownerBusy} aria-expanded={storyOpen && (!narrow || (ownerPanel === 'story' && !impactOpen))} onClick={() => openOwnerPanel('story')}><ActionIcon action="story" /></button>
        <button id="open-owner-discussion" aria-label="Open discussion" title="Discussion" disabled={!ownerStory.authenticated || ownerBusy} aria-expanded={discussionOpen && (!narrow || (ownerPanel === 'discussion' && !impactOpen))} onClick={() => openOwnerPanel('discussion')}><ActionIcon action="discussion" /></button>
        {detail.expanded && <button aria-label="Inspect visible source for discussion" title="Ask about expanded source" disabled={!ownerStory.authenticated || ownerBusy} onClick={() => runOwner(async () => { await inspectVisibleSource(); openOwnerPanel('discussion'); })}><ActionIcon action="source" /></button>}
        {(ownerStory.supportingCheckpoint || ownerStory.returnFrame) && <button
          aria-label={ownerStory.supportingCheckpoint ? 'Back to answer' : 'Return to original reading'}
          title={ownerStory.supportingCheckpoint ? 'Back to answer' : 'Return to original reading'}
          disabled={ownerBusy || ownerStory.questionLocked}
          onClick={() => runOwner(ownerStory.supportingCheckpoint ? resumeAnswerReading : resumeOwnerReading)}><ActionIcon action="return" /></button>}

      </div>}

      {(testReturn || sourceReturn || contextReturns.length > 0) && !fullscreen && <button
        className="source-return"
        aria-label="Back to source context"
        title="Back to source context"
        onClick={event => returnToSource(event.detail === 0)}
      >←</button>}

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

    </WorkspaceActions>

    <div className="review-workspace">
      {!fullscreen && sourceFinder && <section className="source-finder" aria-label="Find changed source">
        <label>Go to source<select aria-label="Changed source" value="" onChange={event => {
          const path = event.target.value;
          const node = baseTree.nodes.find(node => node.path === path && node.kind === 'file');
          if (node) { setSelected(path); moveCamera({ x: 12 - node.x, y: 100 - node.y, zoom: 1 }); }
          setSourceFinder(false);
        }}><option value="" disabled>Choose one of 50 changed sources</option>{fixture.paths.map(path => <option key={path} value={path}>{path}</option>)}</select></label>
        <p>Choose any changed file. Some call relationships are not shown yet; choosing a file does not expand it.</p>
      </section>}
      {(ownerError || ownerReview.error || ownerStory.error) && <div className="owner-error" role="alert">{ownerError || ownerReview.error || ownerStory.error}<button onClick={() => { setOwnerError(''); }}>Dismiss</button></div>}
      {!fullscreen && contextOpen && (!narrow || (!ownerPanel && !impactOpen)) && <ReviewContext
        narrow={narrow}
        scrollTop={contextScroll.current}
        onScroll={top => { contextScroll.current = top; }}
        onClose={closeContext}
        onEvidence={openContextEvidence}
      />}
    <div className="owner-center">
    <main
      inert={ownerBusy || (!fullscreen && narrow && (contextOpen || Boolean(ownerPanel) || impactOpen)) ? true : undefined}
      data-workspace-root={fullscreen ? `file:${fullscreen.path}` : 'pr:25'}
      data-canonical-call-count={behaviorCalls.links.length}
      data-canonical-function-count={behaviorCalls.nodes.length}
      ref={main}
      tabIndex={0}
      onKeyDownCapture={key}
      aria-label={`PR25 ${lens === 'behavior' ? 'caller-to-callee behavior graph; call arrows retain exact source evidence, some file relationships are not mapped yet' : 'alternate file tree; directory edges mean contains'}. Drag or scroll to pan; pinch or Control-wheel to zoom; arrow keys pan, plus and minus zoom, zero shows Overview.`}
    >

      <ReactFlow<CanvasNode>
        className={`pr-graph${lens === 'behavior' && !fullscreen && !detail.expanded ? ' file-projection-overview' : ''}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onMoveStart={event => { if (event) { pendingFileFrame.current = null; stopCameraMotion(); } }}
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
          if (edge.type === 'call' || edge.type === 'fileCall') {
            setSourceRelation(null);
            setCallExplained(calls.links.find(link => link.id === edge.id) ?? null);
          }
        }}
        onInit={instance => {
          flow.current = instance;
          setCanvasReady(true);
          void instance.setViewport(initialView(lens), {
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

        {lens === 'behavior' && !fullscreen && <EdgeLabelRenderer>
          <span className="root-region-label" style={{ transform: `translate(0px,${Math.min(...viewTree.nodes.filter(node => /\.mdx?$/.test(node.path)).map(node => node.y)) - 38}px)` }}>Documentation · requirement references</span>
          <span className="root-region-label" style={{ transform: 'translate(0px,-38px)' }}>Code</span>
        </EdgeLabelRenderer>}
      </ReactFlow>

      {detail.expanded && !(narrow && (contextOpen || Boolean(ownerPanel) || impactOpen)) && <DiffControls
        mode={mode}
        onMode={setMode}
      />}

      {callExplained && <CallExplanation
        link={callExplained}
        nodes={calls.nodes}
        onClose={() => setCallExplained(null)}
        onInspect={anchor => runOwner(async () => {
          const snapshot = workspace.story.getSnapshot().snapshot;
          if (!snapshot) throw new Error('Retained source owner is still opening.');
          const mapped = mapJourneySource(snapshot, anchor);
          if (mapped.status !== 'ready') throw new Error(`Callsite source is unavailable: ${mapped.reason}`);
          await inspectOwnerEvidence(mapped.reference, true);
        })}
      />}

      {selected && !fullscreen && !calls.nodes.some(node => node.declaration.path === selected) && <span
        className="call-frontier"
        role="status"
      >Call relationships are not mapped for this file · source is available</span>}

      {testsFor && !fullscreen && relevantTests(testsFor).length === 0 && <span
        className="call-frontier"
        role="status"
      >Test relationship not prepared for this function</span>}

      {!callExplained && sourceRelation && <RelationshipReader
        relation={sourceRelation}
        onClose={() => setSourceRelation(null)}
      />}

    </main>
    {!fullscreen && impactOpen && impact?.status === 'ready' && <ChangeImpactExplanation impact={impact} narrow={narrow} busy={ownerBusy}
      onClose={() => { setImpactOpen(false); requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-impact-id]')?.focus({ preventScroll: true })); }}
      onInspect={(reference, keyboard) => runOwner(() => inspectOwnerEvidence(reference, keyboard))}
    />}
    {!fullscreen && discussionOpen && (!narrow || (ownerPanel === 'discussion' && !impactOpen)) && <OwnerPanels
      panel="discussion"
      narrow={narrow}
      workspace={workspace}
      story={ownerStory}
      review={ownerReview}
      busy={ownerBusy}
      scroll={ownerScroll}
      restoreVersion={panelRestoreRevision.current}
      onClose={() => closeOwnerPanel('discussion')}
      onInspect={inspectOwnerEvidence}
      onInspectReply={inspectReplyEvidence}
      onNavigate={navigateOwnerStory}
      run={runOwner}
    />}
    </div>
    {!fullscreen && storyOpen && (!narrow || (ownerPanel === 'story' && !impactOpen)) && <OwnerPanels
      panel="story"
      narrow={narrow}
      workspace={workspace}
      story={ownerStory}
      review={ownerReview}
      busy={ownerBusy}
      scroll={ownerScroll}
      restoreVersion={panelRestoreRevision.current}
      onClose={() => closeOwnerPanel('story')}
      onInspect={inspectOwnerEvidence}
      onInspectReply={inspectReplyEvidence}
      onNavigate={navigateOwnerStory}
      run={runOwner}
    />}
    </div>

  </>;
};
const root = document.getElementById('root');
if (root)
  createRoot(root).render(<App />);
