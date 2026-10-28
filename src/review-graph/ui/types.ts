import type { GraphEntity, GraphRelation } from '../domain/types.ts';
import type { CardRows, RelationRows } from './content.ts';
export type EntityPresentation = Readonly<{
    card: CardRows;
    status: string | undefined;
    icon: string;
    sourceControl: boolean;
    sourceOpen: boolean;
    fileControl: boolean;
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
