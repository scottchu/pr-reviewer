import type {EditComposition} from '../domain/edit-composition.ts';
import type {GraphEntity, NativeDocumentHunk} from '../domain/types.ts';
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

export const projectExperience = (state: ExperienceState): GraphView => {
    const registry = collectEntities(state.comparison.entities);
    const present = (entity: GraphEntity): UIEntity => {
        const {nodes, ...identity} = entity;
        return {
            ...identity,
            ui: {
                card: cardRows(entity),
                status: presentationStatus(entity),
                icon: iconFor(entity),
                sourceControl: ['function', 'test'].includes(entity.kind) && Boolean(entity.data.editComposition),
                sourceOpen: state.sourceDisclosure[entity.id] ?? false,
                fileControl: entity.kind === 'file',
                inlineSourceReading: Boolean(entity.data.nativeHunks),
                unitCount: state.comparison.fileUnits[entity.id]?.length ?? 0,
                unpairedRows: state.comparison.unresolved.filter(row => row.path === entity.data.path).map(row =>
                    (row.anchor.side === 'base' ? 'Before' : 'After') + ' L' + row.anchor.startLine + '–' + row.anchor.endLine + ' · ' + row.name),
                sourceReading: projectSourceReading(entity.data.editComposition as EditComposition | undefined, entity.data.nativeHunks as readonly NativeDocumentHunk[] | undefined),
            },
            ...(nodes ? {nodes: nodes.map(present)} : {}),
        };
    };
    const view = visibleGraph(state.comparison, state.limits);
    return {
        nodes: view.nodes.map(present),
        relations: view.relations.map(edge => ({...edge, ui: edgeRows(edge, registry)})),
        entities: registry.map(present),
    };
};
