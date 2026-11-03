import type {EditComposition} from '../domain/edit-composition.ts';
import type {GraphView, UIEntity, SourceEditNodeUI} from './types.ts';

const views = new WeakMap<GraphView, GraphView>();
const children = new WeakMap<UIEntity['data'], readonly UIEntity[]>();

/** Literal edit sides are UI reading nodes, never new canonical source entities. */
const codeChildren = (group: UIEntity, subject: UIEntity): readonly UIEntity[] | undefined => {
    const known = children.get(group.data);
    if (known) return known;
    const composition = subject.data.editComposition as EditComposition | undefined;
    if (!composition || !['change', 'add', 'remove'].includes(composition.status)) return;
    const nodes: UIEntity[] = [];
    for (const kind of ['remove', 'add'] as const) {
        const expected = kind === 'remove' ? composition.removed : composition.added;
        const rows: SourceEditNodeUI['rows'][number][] = [];
        for (const hunk of composition.hunks) {
            const witness = kind === 'remove' ? hunk.before : hunk.after;
            for (const row of hunk.rows.filter(row => row.kind === kind)) {
                const line = kind === 'remove' ? row.beforeLine : row.afterLine;
                if (!witness || witness.side !== (kind === 'remove' ? 'base' : 'head') || line === null || line < witness.startLine || line > witness.endLine ||
                    !witness.path || !witness.commit || !witness.contentHash) return;
                rows.push({line, text: row.text, hunkIndex: hunk.index, witness});
            }
        }
        if (rows.length !== expected || JSON.stringify(rows.map(row => [row.text, row.line])) !==
            JSON.stringify(composition.rows.filter(row => row.kind === kind).map(row => [row.text, kind === 'remove' ? row.beforeLine : row.afterLine]))) return;
        if (!rows.length) continue;
        const witness = rows[0]!.witness;
        nodes.push({id: 'ui-source-edit:' + group.id + ':' + kind, kind: 'source_edit', data: {}, ui: {
            card: {title: (kind === 'remove' ? 'Removed −' : 'Added +') + rows.length,
                rows: [(kind === 'remove' ? 'Before ' : 'After ') + witness.commit.slice(0, 7) + ' · ' + witness.path]},
            status: kind, icon: 'evidence', sourceControl: false, sourceOpen: false,
            fileControl: false, inlineSourceReading: false, unitCount: 0, unpairedRows: [], sourceReading: undefined,
            sourceEdit: {kind, subjectId: subject.id, groupId: group.id, rows},
        }});
    }
    if (!nodes.length) return;
    children.set(group.data, nodes);
    return nodes;
};

export const projectChangeCode = (view: GraphView): GraphView => {
    const known = views.get(view);
    if (known) return known;
    const groups = new Map<string, UIEntity>(), owners = new Map<string, string>();
    for (const group of view.entities.filter(entity => entity.kind === 'change' && entity.nodes)) {
        const subjects = group.nodes!.filter(child => child.kind === 'function' || child.kind === 'test');
        if (subjects.length !== 1) continue;
        const subject = subjects[0]!, edits = codeChildren(group, subject);
        if (!edits) continue;
        // Preserve the lazy source-reader descriptor; disclosure still belongs to
        // the original source subject in Experience Service.
        const ui = Object.defineProperties({}, {
            ...Object.getOwnPropertyDescriptors(group.ui),
            sourceControl: {enumerable: true, value: true},
            sourceOpen: {enumerable: true, value: subject.ui.sourceOpen},
            changeSource: {enumerable: true, value: {subjectId: subject.id, subjectKind: subject.kind}},
            sourceReading: {enumerable: true, get: () => subject.ui.sourceReading},
        }) as UIEntity['ui'];
        groups.set(group.id, {...group, ui, nodes: edits});
        for (const child of group.nodes!) owners.set(child.id, group.id);
    }
    const nodes = view.nodes.filter(entity => !owners.has(entity.id)).flatMap(entity => {
        const group = groups.get(entity.id);
        return group ? [group, ...group.nodes!] : [entity];
    });
    const relations = view.relations.flatMap(edge => {
        const from = owners.get(edge.from) ?? edge.from, to = owners.get(edge.to) ?? edge.to;
        if (from === to && edge.from !== edge.to) return [];
        return from === edge.from && to === edge.to ? [edge] : [{...edge, from, to,
            ui: {...edge.ui, sourceEndpoints: edge.ui.sourceEndpoints ?? {from: edge.from, to: edge.to}},
        }];
    });
    const entities = new Map(view.entities.map(entity => [entity.id, groups.get(entity.id) ?? entity]));
    for (const group of groups.values()) for (const child of group.nodes!) {
        if (entities.has(child.id)) throw new Error('ui_source_edit_identity_collision:' + child.id);
        entities.set(child.id, child);
    }
    const result = {nodes, relations, entities: [...entities.values()]};
    views.set(view, result);
    return result;
};
