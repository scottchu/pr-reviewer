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
    view: GraphView;
    layoutRelations: readonly UIRelation[];
    limits: Readonly<Record<string, number>>;
    expand: (id: string, hide: boolean) => GraphSessionUI;
    inspect: (id: string, open: boolean) => GraphSessionUI;
}>;
