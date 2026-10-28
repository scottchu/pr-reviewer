import type { ExperienceState } from '../experience/types.ts';
import type { GraphEntity } from '../domain/types.ts';
import { collectEntities } from '../domain/validation.ts';
import { visibleGraph } from './visibility.ts';
import { cardRows, edgeRows, presentationStatus } from './content.ts';
import { iconFor } from './entity-presentation.ts';
import type { GraphView, UIEntity } from './types.ts';
export const projectExperience = (state: ExperienceState): GraphView => {
    const registry = collectEntities(state.comparison.entities);
    const present = (entity: GraphEntity): UIEntity => { const { nodes, ...identity } = entity; return ({ ...identity, ui: { card: cardRows(entity), status: presentationStatus(entity), icon: iconFor(entity), sourceControl: ['function', 'test'].includes(entity.kind) && Boolean(entity.data.editComposition), sourceOpen: state.sourceDisclosure[entity.id] ?? false, fileControl: entity.kind === 'file' }, ...(nodes ? { nodes: nodes.map(present) } : {}) }); };
    const view = visibleGraph(state.comparison, state.limits);
    return { nodes: view.nodes.map(present), relations: view.relations.map(edge => ({ ...edge, ui: edgeRows(edge, registry) })), entities: registry.map(present) };
};
