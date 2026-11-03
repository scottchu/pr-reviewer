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
        nodes.push({id: 'ui-test-edit:' + group.id + ':' + kind, kind: 'source_edit', data: {}, ui: {
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

const subjects = new WeakMap<UIEntity, UIEntity>();
const testSource = (subject: UIEntity): UIEntity => {
    const known = subjects.get(subject);
    if (known) return known;
    const ui = Object.defineProperties({}, {...Object.getOwnPropertyDescriptors(subject.ui),
        testCodeSource: {enumerable: true, value: true},
    }) as UIEntity['ui'];
    const result = {...subject, ui}; subjects.set(subject, result); return result;
};

/** Test-only augmentation: every existing relationship and non-Test node survives. */
export const projectTestCode = (view: GraphView): GraphView => {
    const known = views.get(view); if (known) return known;
    const replacements = new Map<string, UIEntity>(), additions = new Map<string, readonly UIEntity[]>();
    for (const group of view.entities.filter(entity => entity.kind === 'change' && entity.nodes)) {
        const tests = group.nodes!.filter(child => child.kind === 'test');
        if (tests.length !== 1) continue;
        const subject = tests[0]!, edits = codeChildren(group, subject);
        if (!edits) continue;
        const source = testSource(subject);
        replacements.set(subject.id, source);
        replacements.set(group.id, {...group, nodes: [...group.nodes!.map(child => child.id === subject.id ? source : child), ...edits]});
        additions.set(group.id, edits);
    }
    const nodes = view.nodes.flatMap(entity => [replacements.get(entity.id) ?? entity, ...(additions.get(entity.id) ?? [])]);
    const entities = new Map(view.entities.map(entity => [entity.id, replacements.get(entity.id) ?? entity]));
    for (const edits of additions.values()) for (const edit of edits) {
        if (entities.has(edit.id)) throw new Error('ui_test_edit_identity_collision:' + edit.id);
        entities.set(edit.id, edit);
    }
    const result = {nodes, relations: view.relations, entities: [...entities.values()]};
    views.set(view, result); return result;
};
