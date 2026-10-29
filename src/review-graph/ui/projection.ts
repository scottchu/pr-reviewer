import type {EditComposition} from '../domain/edit-composition.ts';
import type {GraphEntity, GraphRelation, SourceGraph, NativeDocumentHunk} from '../domain/types.ts';
import type {ExperienceState} from '../experience/types.ts';
import {collectEntities} from '../domain/validation.ts';
import {visibleGraph} from './visibility.ts';
import {cardRows, edgeRows, presentationStatus, editPreview, editCaption} from './content.ts';
import {iconFor} from './entity-presentation.ts';
import type {GraphView, UIEntity, SourceReadingUI} from './types.ts';

export const projectSourceReading = (
    composition: EditComposition | undefined,
    nativeHunks?: readonly NativeDocumentHunk[],
): SourceReadingUI | undefined => {
    if (!composition && !nativeHunks) return undefined;
    const preview = composition ? editPreview(composition) : {removed: [], added: []};
    return {
        caption: composition ? editCaption(composition) : 'Scoped source edits unresolved',
        available: Boolean(composition && composition.status !== 'unresolved'),
        hunks: nativeHunks ?? composition?.hunks ?? [],
        panes: (['remove', 'add'] as const).map(kind => {
            const rows = kind === 'remove' ? preview.removed : preview.added;
            const side = composition?.hunks.map(hunk => kind === 'remove' ? hunk.before : hunk.after).find(Boolean);
            return {
                kind,
                title: kind === 'remove' ? 'Removed −' + (composition?.removed ?? 0) : 'Added +' + (composition?.added ?? 0),
                versionLabel: (kind === 'remove' ? 'Before' : 'After') + (side ? ' · ' + side.commit.slice(0, 7) : ''),
                emptyLabel: 'No ' + (kind === 'remove' ? 'removed' : 'added') + ' rows in this scope.',
                footer: 'First ' + rows.length + ' source rows · all evidence below',
                rows: rows.map(row => ({kind: row.kind, line: kind === 'remove' ? row.beforeLine : row.afterLine, text: row.text})),
            };
        }),
    };
};

const projectors = new WeakMap<SourceGraph, (state: ExperienceState) => GraphView>();
const createProjector = (comparison: SourceGraph) => {
    const registry = collectEntities(comparison.entities);
    const content = new WeakMap<GraphEntity, UIEntity['ui']>();
    const entities = new WeakMap<GraphEntity, UIEntity>();
    const relations = new WeakMap<GraphRelation, GraphView['relations'][number]>();
    const present = (entity: GraphEntity, state: ExperienceState): UIEntity => {
        let base = content.get(entity);
        if (!base) {
            let reading: SourceReadingUI | undefined, prepared = false;
            base = {
                card: cardRows(entity), status: presentationStatus(entity), icon: iconFor(entity),
                sourceControl: ['function', 'test'].includes(entity.kind) && Boolean(entity.data.editComposition),
                sourceOpen: false, fileControl: entity.kind === 'file',
                inlineSourceReading: Boolean(entity.data.nativeHunks),
                unitCount: comparison.fileUnits[entity.id]?.length ?? 0,
                unpairedRows: comparison.unresolved.filter(row => row.path === entity.data.path).map(row =>
                    (row.anchor.side === 'base' ? 'Before' : 'After') + ' L' + row.anchor.startLine + '–' + row.anchor.endLine + ' · ' + row.name),
                get sourceReading() {
                    if (!prepared) {
                        reading = projectSourceReading(entity.data.editComposition as EditComposition | undefined, entity.data.nativeHunks as readonly NativeDocumentHunk[] | undefined);
                        prepared = true;
                    }
                    return reading;
                },
            };
            content.set(entity, base);
        }
        const children = entity.nodes?.map(child => present(child, state));
        const open = state.sourceDisclosure[entity.id] ?? false;
        const known = entities.get(entity);
        if (known && known.ui.sourceOpen === open && (!children || children.every((child, i) => known.nodes?.[i] === child))) return known;
        const {nodes: _nodes, ...identity} = entity;
        // A descriptor preserves demand-driven source projection when disclosure changes.
        const ui = open ? Object.defineProperties({}, {...Object.getOwnPropertyDescriptors(base), sourceOpen: {enumerable: true, value: true}}) as UIEntity['ui'] : base;
        const result: UIEntity = {...identity, ui, ...(children ? {nodes: children} : {})};
        entities.set(entity, result);
        return result;
    };
    return (state: ExperienceState): GraphView => {
        const view = visibleGraph(comparison, state.limits);
        return {
            nodes: view.nodes.map(entity => present(entity, state)),
            relations: view.relations.map(edge => {
                const known = relations.get(edge);
                if (known) return known;
                const result = {...edge, ui: edgeRows(edge, registry)};
                relations.set(edge, result); return result;
            }),
            entities: registry.map(entity => present(entity, state)),
        };
    };
};

export const projectExperience = (state: ExperienceState): GraphView => {
    let project = projectors.get(state.comparison);
    if (!project) {project = createProjector(state.comparison); projectors.set(state.comparison, project);}
    return project(state);
};
