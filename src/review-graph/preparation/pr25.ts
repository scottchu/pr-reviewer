import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {domainService} from '../domain/service.ts';
import {pr25Aliases} from './pr25-aliases.ts';
import type {FactDocument,CompiledSourceGraph,SourceInput} from '../domain/types.ts';
import type { GraphEntity, GraphRelation } from '../domain/types.ts';
import {scopedEditComposition, type EditComposition} from '../domain/edit-composition.ts';
import {nativeDocumentHunks} from '../parse/native-diff.ts';
import {admitAttributedEnrichment} from '../enrich/attributed.ts';
import type {AttributedEnrichment} from '../enrich/attributed.ts';
import explanations from './graph-explanations.json' with { type: 'json' };
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
export const selectPreparedTests=(entities:readonly GraphEntity[])=>entities.filter(entity=>entity.kind==='test'&&(String(entity.data.name).includes('disposed ignored-abort read settles')||String(entity.data.name).includes('single local owner reads and writes without a Bearer')||String(entity.data.name).startsWith('01-A/C/F/G controlled host')));
export const prepareAttribution = (
    facts: FactDocument,
    compiled: CompiledSourceGraph,
    sources?: readonly SourceInput[],
): AttributedEnrichment => {
    const namedTests = selectPreparedTests(compiled.entities);
    const nodes = explanations.nodes.filter(entity => entity.id !== 'owner-http-policy' ||
        namedTests.some(test => String(test.data.name).includes('single local owner')));
    const groupSubjects = compiled.entities.filter(entity => ['function', 'test'].includes(entity.kind) &&
        ['change', 'add', 'remove'].includes(String(entity.data.comparisonStatus))).map(entity => ({
            id: entity.id === 'request' ? 'change' : 'change:' + entity.id,
            kind: 'change',
            data: {},
        }));
    const valid = new Set([...compiled.entities.map(entity => entity.id),
        ...groupSubjects.map(entity => entity.id), ...nodes.map(node => node.id)]);
    const edges = explanations.edges.filter(edge => valid.has(edge.from) && valid.has(edge.to)) as GraphRelation[];
    return admitAttributedEnrichment(facts, [...compiled.entities, ...groupSubjects], {nodes, edges}, sources, compiled.relations);
};

export const prepareAppGraph = (
    facts: FactDocument,
    inputHash: string,
    compiledInput?: CompiledSourceGraph,
    attributionInput?: AttributedEnrichment,
    nativeDiffs?: ReadonlyMap<string, readonly import('../domain/types.ts').NativeDocumentHunk[]>,
    editCompositions?: ReadonlyMap<string, EditComposition>,
    sources?: readonly SourceInput[],
) => {
    const compiled = compiledInput ?? domainService.compare(facts, pr25Aliases);
    let attributionFailure: string | undefined;
    let attribution = attributionInput;
    if (!attribution) {
        try {
            attribution = prepareAttribution(facts, compiled, sources);
        } catch (error) {
            attribution = {nodes: [], edges: []};
            attributionFailure = error instanceof Error ? error.message : String(error);
        }
    }

    const entities = [...compiled.entities];
    const relations = [...compiled.relations];
    const paths = new Map(entities.filter(entity => entity.kind === 'file').map(entity => [String(entity.data.path), entity.id]));
    for (const relation of [...relations].filter(edge => edge.relation === 'calls' && edge.version === 'after' && edge.data.comparisonStatus === 'add')) {
        const sites = relation.data.sourceCalls as {
            id: string;
            site: {
                sourceText: string;
                anchor: {
                    path: string;
                    commit: string;
                    startLine: number;
                    endLine: number;
                    contentHash: string;
                };
            };
        }[];
        if (sites.length !== 1)
            continue;
        const source = sites[0]!, id = 'callsite:' + source.id;
        entities.push({
            id, kind: 'callsite', data: {
                name: source.site.sourceText, value: source.site.sourceText, comparisonStatus: 'add', comparisonBasis: 'Call to added target with exact Head witness', occurrences: [source.site.anchor]
            }
        });
        relations.splice(relations.indexOf(relation), 1, {
            ...relation, id: relation.id + ':site', to: id, relation: 'contains_call'
        }, { ...relation, from: id });
        relations.push({
            id: id + ':location', from: id, to: paths.get(source.site.anchor.path)!, version: 'after', relation: 'located_in', data: {
                commit: source.site.anchor.commit, range: { startLine: source.site.anchor.startLine, endLine: source.site.anchor.endLine }, sourceHash: source.site.anchor.contentHash, sourceEvidence: source.site.anchor
            }
        });
    }
    const groups: GraphEntity[] = [];
    const grouped = new Set<string>();
    const groupSources=new Map<string,string>();
    const groupFor = new Map<string, string>();
    for (const entity of entities.filter(entity => ['function', 'test'].includes(entity.kind) && ['change', 'add', 'remove'].includes(String(entity.data.comparisonStatus)))) {
        const children = [entity, ...relations.filter(edge => edge.from === entity.id && ['constructs', 'contains_call', ...(entity.kind === 'test' ? ['contains'] : [])].includes(edge.relation)).map(edge => entities.find(node => node.id === edge.to)!).filter(Boolean)];
        const unique = [...new Map(children.map(child => [child.id, child])).values()].filter(child => !grouped.has(child.id));
        if (!unique.length)
            continue;
        const id = entity.id === 'request' ? 'change' : 'change:' + entity.id;
        groupSources.set(id,entity.id);
        for (const child of unique) {
            grouped.add(child.id);
            groupFor.set(child.id, id);
        }
        groups.push({
            id, kind: 'change', data: {
                name: String(entity.data.name) + ' change', comparisonStatus: entity.data.comparisonStatus, comparisonBasis: entity.data.comparisonBasis, sourceWitnesses: entity.data.sourceWitnesses
            }, nodes: unique, edges: []
        });
    }
    // Native Markdown hunks are file-scoped evidence, not inferred structural units.
    for (const file of facts.files.filter(file => /\.md$/i.test(file.path))) {
        const fileId = paths.get(file.path)!;
        const id = 'document-change:' + file.id;
        const hunks = nativeDiffs ? nativeDiffs.get(file.id) : nativeDocumentHunks(file);
        if (!hunks) continue;
        const evidence: GraphEntity = {id: id + ':evidence', kind: 'evidence', data: {
            name: 'Native document comparison', nativeHunks: hunks,
            comparisonStatus: file.comparisonStatus, comparisonBasis: 'Pinned native Markdown patch', patchHash: file.patchHash,
        }};
        groupFor.set(evidence.id, id);
        groupSources.set(id,fileId);
        groups.push({id, kind: 'change', data: {
            name: file.path + ' change', documentPath: file.path,
            comparisonStatus: file.comparisonStatus, comparisonBasis: 'Pinned native Markdown patch',
        }, nodes: [evidence], edges: []});
        for (const hunk of hunks) {
            for (const witness of [hunk.before, hunk.after]) {
                if (!witness) continue;
                const {text: _text, ...anchor} = witness;
                relations.push({id: id + ':hunk:' + hunk.index + ':location:' + witness.side,
                    from: id, to: fileId, version: witness.side === 'base' ? 'before' : 'after', relation: 'located_in',
                    data: {commit: witness.commit, range: {startLine: witness.startLine, endLine: witness.endLine},
                        sourceHash: witness.contentHash, sourceEvidence: anchor}});
            }
        }
    }
    const flat = [...entities, ...groups];
    const initial = new Set(['pr25', 'request', 'refresh', 'helper', 'header-value', 'reason', 'goal', 'owner-http-policy']);
    for (const edge of relations.filter(edge => edge.from === 'request' && edge.relation === 'contains_call'))
        initial.add(edge.to);
    const namedTests = selectPreparedTests(entities);
    for (const test of namedTests)
        initial.add(test.id);
    for (const group of groups.filter(group => group.data.documentPath)) initial.add(group.id);
    for (const id of [...initial]) {
        const group = groupFor.get(id);
        if (group)
            initial.add(group);
    }
    const valid = new Set(flat.map(entity => entity.id));
    try {
        admitAttributedEnrichment(facts, [...entities.filter(entity => !grouped.has(entity.id)), ...groups], attribution, sources, relations);
    } catch (error) {
        attributionFailure = error instanceof Error ? error.message : String(error);
        attribution = {nodes: [], edges: []};
    }
    const acceptedExplanations = attribution.nodes;
    for (const node of acceptedExplanations)
        valid.add(node.id);
    for (const edge of attribution.edges)
        if (valid.has(edge.from) && valid.has(edge.to))
            relations.push(edge as GraphRelation);
    const ownerByUnit = Object.fromEntries(entities.filter(entity => entity.kind !== 'file' && entity.kind !== 'review').flatMap(entity => {
        const witness = (entity.data.sourceWitnesses as {
            anchor: {
                path: string;
            };
        }[] | undefined)?.[0];
        const occurrence = (entity.data.occurrences as {
            path?: string;
        }[] | undefined)?.[0];
        const file = witness ? paths.get(witness.anchor.path) : occurrence?.path ? paths.get(occurrence.path) : undefined;
        return file ? [[entity.id, file]] : [];
    }));
    const decorateEdits = (entity: GraphEntity): GraphEntity => {
        if (!entity.data.comparisonStatus) return entity;
        const composition = (entity.data.editComposition as EditComposition | undefined) ?? editCompositions?.get(groupSources.get(entity.id)??entity.id) ?? domainService.classifyEdits(entity, facts,nativeDiffs);
        const children = entity.nodes?.map(child => child.kind === 'evidence' ? {...child, data: {...child.data, editComposition: composition}} : decorateEdits(child));
        return {...entity, data: {...entity.data, editComposition: composition}, ...(children ? {nodes: children} : {})};
    };
    const compact = (entity: GraphEntity): GraphEntity => {
        const { sourceWitnesses, ...data } = entity.data;
        const witnesses = sourceWitnesses as {
            id: string;
            anchor: unknown;
            sourceText: string;
        }[] | undefined;
        return {
            ...entity, data: { ...data, ...(witnesses ? { sourceWitnesses: witnesses.map(witness => ({
                        id: witness.id, anchor: witness.anchor, sourceTextHash: hash(witness.sourceText)
                    })) } : {}) }, ...(entity.nodes ? { nodes: entity.nodes.map(compact) } : {})
        };
    };
    const graph = {
        id: compiled.id, kind: 'graph', entities: [...entities.filter(entity => !grouped.has(entity.id)), ...groups, ...acceptedExplanations].map(decorateEdits).map(compact), relations,
        fileUnits: compiled.fileUnits, ownerByUnit, groupFor: Object.fromEntries(groupFor), initialVisible: [...initial],
        unresolved: compiled.unresolved.map(row => ({
            path: row.path, id: row.occurrence.id, kind: row.occurrence.kind, name: row.occurrence.name, anchor: row.occurrence.anchor, sourceTextHash: hash(row.occurrence.sourceText), reason: row.reason
        })),
        provenance: {
            ...compiled.provenance, ...(attributionFailure?{enrichmentFailure:attributionFailure}:{}), inputArtifactHash: inputHash, compilerHash: hash(readFileSync(new URL('../domain/comparison.ts', import.meta.url))), appCompilerHash: hash(readFileSync(new URL('./pr25.ts', import.meta.url))), explanationHash: hash(readFileSync(new URL('./graph-explanations.json', import.meta.url))), documentCompilerHash: hash(readFileSync(new URL('../parse/native-diff.ts', import.meta.url))), editCompilerHash: hash(readFileSync(new URL('../domain/edit-composition.ts', import.meta.url)))
        }
    };
    domainService.validateGraph(graph.entities, graph.relations);
    return graph;
};
