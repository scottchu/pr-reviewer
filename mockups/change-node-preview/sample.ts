import {allEntities, sourceGraph} from '../pr-file-tree/source-graph.ts';
import fullSource from '../pr-file-tree/full-source.json' with {type: 'json'};
import type {GraphEntity} from '../../src/review-graph/domain/types.ts';
import type {ReadingFocus} from '../pr-file-tree/reading.ts';

const registry = allEntities();
export const sampleChange = registry.find(entity => entity.kind === 'change' && entity.data.name === 'createGateway() change')!;
if (!sampleChange) throw new Error('preview_gateway_change_missing');
export const codePath = 'src/server/public.ts';
export const testPath = 'tests/gateway.test.ts';
export const assertionsFor = (test: GraphEntity): readonly GraphEntity[] => {
    const ids = new Set(sourceGraph.relations.filter(edge => edge.relation === 'contains' && edge.from === test.id).map(edge => edge.to));
    return registry.filter(entity => entity.kind === 'assertion' && ids.has(entity.id));
};
export type Occurrence = Readonly<{anchor: Readonly<{side: 'base' | 'head'; path: string; commit: string; start: number; end: number; startLine: number; endLine: number}>}>;
export const occurrences = (entity: GraphEntity): readonly Occurrence[] => (entity.data.occurrences ?? []) as readonly Occurrence[];
export const sampleTests = registry.filter(entity => entity.kind === 'test' && occurrences(entity).some(value => value.anchor.path === testPath));
export const sourceFocus = (entity: GraphEntity, scope?: 'test'): ReadingFocus => {
    const values = occurrences(entity);
    return {
        id: 'preview:' + entity.id, path: values[0]?.anchor.path ?? codePath,
        name: String(entity.data.name ?? entity.id),
        before: values.filter(value => value.anchor.side === 'base').map(value => ({startLine: value.anchor.startLine, endLine: value.anchor.endLine})),
        after: values.filter(value => value.anchor.side === 'head').map(value => ({startLine: value.anchor.startLine, endLine: value.anchor.endLine})),
        preferredSide: values.some(value => value.anchor.side === 'head') ? 'after' : 'before', ...(scope ? {scope} : {}),
    };
};
export const gatewayFunction = registry.find(entity => entity.kind === 'function' && entity.id === sampleChange.id.replace(/^change:/, ''))!;
export const sampleSession = () => {
    const paths = [codePath, testPath];
    return paths.map(path => registry.find(entity => entity.kind === 'file' && entity.data.path === path)!.id);
};
export const directTestReference = (entity: GraphEntity) => {
    const anchors = occurrences(entity);
    return anchors.map(({anchor}) => {
        const source = fullSource.files.find(file => file.path === anchor.path)!;
        const text = (anchor.side === 'base' ? source.before : source.after) ?? '';
        const body = text.slice(anchor.start, anchor.end);
        const offset = body.indexOf('createGateway(');
        if (offset < 0) throw new Error('preview_test_has_no_direct_gateway_reference');
        const line = text.slice(0, anchor.start + offset).split('\n').length;
        return {side: anchor.side, commit: anchor.commit, path: anchor.path, line};
    });
};
