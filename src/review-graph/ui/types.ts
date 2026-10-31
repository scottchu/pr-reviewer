import type {NativeDocumentHunk, DocumentWitness} from '../domain/types.ts';
import type { GraphEntity, GraphRelation } from '../domain/types.ts';
import type { CardRows, RelationRows } from './content.ts';
export type EntityPresentation = Readonly<{
    card: CardRows;
    status: string | undefined;
    icon: string;
    sourceControl: boolean;
    sourceOpen: boolean;
    fileControl: boolean;
    sourceReading:SourceReadingUI|undefined;
    inlineSourceReading: boolean;
    unitCount: number;
    unpairedRows: readonly string[];
}>;
export type UIEntity = Omit<GraphEntity, 'nodes'> & Readonly<{
    ui: EntityPresentation;
    nodes?: readonly UIEntity[];
}>;
export type UIRelation = GraphRelation & Readonly<{
    ui: RelationRows;
}>;
export type GraphView = Readonly<{
    nodes: readonly UIEntity[];
    relations: readonly UIRelation[];
    entities: readonly UIEntity[];
}>;

export type SourceEditPaneUI=Readonly<{kind:'remove'|'add';title:string;versionLabel:string;emptyLabel:string;footer:string;rows:readonly Readonly<{kind:'add'|'remove'|'context';line:number|null;text:string}>[]}>;
export type SourceReadingUI=Readonly<{caption:string;available:boolean;hunks:readonly NativeDocumentHunk[];panes:readonly SourceEditPaneUI[]}>;

export type SourceWitnessUI = DocumentWitness;
export type SourceHunkUI = NativeDocumentHunk;
export type GraphSessionUI = Readonly<{
    comparisonId: string;
    view: GraphView;
    layoutRelations: readonly UIRelation[];
    limits: Readonly<Record<string, number>>;
    filter: GraphFilterUI;
    setChangesOnly: (enabled: boolean) => GraphSessionUI;
    expand: (id: string, hide: boolean) => GraphSessionUI;
    inspect: (id: string, open: boolean) => GraphSessionUI;
}>;

/** Semantic eligibility over the full current view; independent of geometry and viewport. */
export type GraphFilterUI = Readonly<{
    changesOnly: boolean;
    nodeIds: readonly string[];
    relationIds: readonly string[];
}>;

/** Serializable presentation geometry only; no domain objects or UI callbacks. */
export type SceneBoxUI = Readonly<{x: number; y: number; width: number; height: number}>;
export type SceneIdentityUI = Readonly<{comparison: string; revision: number}>;
export type SceneNodeUI = Readonly<{id: string; parentId?: string; bounds: SceneBoxUI}>;
export type SceneRouteUI = Readonly<{id: string; source: string; target: string; bounds: SceneBoxUI; labelBounds: SceneBoxUI}>;
export type SceneSnapshotUI = SceneIdentityUI & Readonly<{nodes: readonly SceneNodeUI[]; routes: readonly SceneRouteUI[]}>;
export type ViewportQueryUI = SceneIdentityUI & Readonly<{
    request: number; x: number; y: number; zoom: number; width: number; height: number;
    pixelRatio: number; overscan: number; pinnedNodes: readonly string[]; pinnedRoutes: readonly string[];
}>;
export type SceneSelectionUI = SceneIdentityUI & Readonly<{
    request: number; coverage: SceneBoxUI; nodeIds: readonly string[]; metadataNodeIds: readonly string[];
    routeIds: readonly string[]; visited: number; visitedBranches: number;
}>;
export type SceneWorkerInputUI = Readonly<{type: 'replace'; scene: SceneSnapshotUI}> | Readonly<{type: 'query'; query: ViewportQueryUI}>;
export type SceneWorkerOutputUI =
    (SceneIdentityUI & Readonly<{type: 'ready'}>) |
    Readonly<{type: 'selection'; selection: SceneSelectionUI}> |
    Readonly<{type: 'error'; message: string}>;

export type ReaderKindUI = 'inline-hunks' | 'source-hunks' | 'removed-preview' | 'added-preview' | 'unpaired-source';
export type ReaderIdentityUI = Readonly<{entityId: string; kind: ReaderKindUI}>;
export type ReaderStateUI = Readonly<{open: boolean; scrollTop: number; scrollLeft: number}>;
export type ReaderScrollUI = Pick<ReaderStateUI, 'scrollTop' | 'scrollLeft'>;
export type ReaderStateCacheUI = Readonly<{
    read: (identity: ReaderIdentityUI) => ReaderStateUI;
    disclose: (identity: ReaderIdentityUI, open: boolean) => void;
    capture: (identity: ReaderIdentityUI, scroll: ReaderScrollUI) => void;
    restore: (identity: ReaderIdentityUI, target: {scrollTop: number; scrollLeft: number}) => void;
}>;
