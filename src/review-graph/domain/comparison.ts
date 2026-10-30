import { posix } from 'node:path';
import {sourceHash} from './hash.ts';
import type {StructuralUnit,FactDocument,GraphEntity,GraphRelation,PreparationAliases,CompiledSourceGraph} from './types.ts';
export type {FactDocument} from './types.ts';
const version = (side: 'base' | 'head') => side === 'base' ? 'before' as const : 'after' as const;
const same = (left: StructuralUnit, right: StructuralUnit) => left.sourceText === right.sourceText;
const identityKey = (unit: StructuralUnit) => unit.kind + ':' + (unit.identityPath ?? unit.name);
/** Unchanged context and native context rows prove correspondence, not display names alone. */
export const nativeLineMap = (patch: string | null): ReadonlyMap<number, number> => {
    const map = new Map<number, number>();
    let before = 0, after = 0;
    for (const line of (patch ?? '').split('\n')) {
        const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
        if (hunk) {
            before = Number(hunk[1]);
            after = Number(hunk[2]);
            continue;
        }
        if (!before || line.startsWith('---') || line.startsWith('+++') || line.startsWith('\\'))
            continue;
        if (line.startsWith(' ')) {
            map.set(before++, after++);
        }
        else if (line.startsWith('-'))
            before++;
        else if (line.startsWith('+'))
            after++;
    }
    return map;
};
export const nativeLineCorresponds = (before: number, after: number, patch: string | null): boolean => {
    const direct = nativeLineMap(patch).get(before);
    if (direct !== undefined)
        return direct === after;
    let oldEnd = 1, newEnd = 1;
    for (const line of (patch ?? '').split('\n')) {
        const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
        if (!hunk)
            continue;
        const oldStart = Number(hunk[1]), oldCount = Number(hunk[2] ?? 1), newStart = Number(hunk[3]), newCount = Number(hunk[4] ?? 1);
        if (before < oldStart || (oldCount === 0 && before === oldStart))
            return after === before + newEnd - oldEnd;
        if (before < oldStart + oldCount)
            return false;
        oldEnd = oldStart + oldCount;
        newEnd = newStart + newCount;
    }
    return after === before + newEnd - oldEnd;
};
const sameReplacementHunk = (before: StructuralUnit, after: StructuralUnit, patch: string | null) => (patch ?? '').split('\n').some(line => {
    const h = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!h)
        return false;
    const bs = Number(h[1]), be = bs + Number(h[2] ?? 1), as = Number(h[3]), ae = as + Number(h[4] ?? 1);
    return before.anchor.startLine < be && before.anchor.endLine >= bs && after.anchor.startLine < ae && after.anchor.endLine >= as;
});
const editLines = (patch: string | null) => {
    const added = new Set<number>(), removed = new Set<number>();
    let before = 0, after = 0;
    for (const line of (patch ?? '').split('\n')) {
        const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
        if (hunk) {
            before = Number(hunk[1]);
            after = Number(hunk[2]);
            continue;
        }
        if (!before || line.startsWith('---') || line.startsWith('+++') || line.startsWith('\\'))
            continue;
        if (line.startsWith(' ')) {
            before++;
            after++;
        }
        else if (line.startsWith('-'))
            removed.add(before++);
        else if (line.startsWith('+'))
            added.add(after++);
    }
    return { added, removed };
};
const wholly = (unit: StructuralUnit, lines: ReadonlySet<number>) => Array.from({ length: unit.anchor.endLine - unit.anchor.startLine + 1 }, (_, index) => unit.anchor.startLine + index).every(line => lines.has(line));
export const compileSourceGraph = (facts: FactDocument, aliases:PreparationAliases={}):CompiledSourceGraph => {
    const entities: GraphEntity[] = [];
    const relations: GraphRelation[] = [];
    const occurrenceIds = new Map<string, string>();
    const fileUnits = new Map<string, string[]>();
    const unresolved: {
        path: string;
        occurrence: StructuralUnit;
        reason: string;
    }[] = [];
    const fileIds = new Map<string, string>();
    const allFiles = [...facts.files, ...facts.contextFiles];
    for (const file of allFiles) {
        const id = aliases.fileId?.(file.path,file.id) ?? 'file:' + file.id;
        fileIds.set(file.path, id);
        entities.push({
            id, kind: 'file', data: {
                repository: facts.repository, path: file.path, comparisonStatus: file.comparisonStatus,
                comparisonBasis: 'Pinned native diff or identical context blob evidence', sourceEvidence: file.sides,
                ...('scope' in file ? {sourceContextScope: file.scope} : {})
            }
        });
        fileUnits.set(id, []);
        const units = facts.units.filter(unit => unit.anchor.path === file.path && unit.kind !== 'callsite' && !(unit.kind === 'function' && unit.name === 'anonymous function'));
        const base = units.filter(unit => unit.anchor.side === 'base'), head = units.filter(unit => unit.anchor.side === 'head');
        const used = new Set<string>();
        const patch = 'patch' in file ? file.patch : null;
        const edits = editLines(patch);
        const emit = (witnesses: StructuralUnit[], basis: string, oneSidedStatus?: 'add' | 'remove') => {
            const first = witnesses[0]!;
            const logicalId = aliases.headerId && first.kind === 'header' ? aliases.headerId(first.ownerId ? occurrenceIds.get(first.ownerId) : undefined, 'unit:' + sourceHash(JSON.stringify([facts.repository, file.path, first.kind, witnesses.map(unit => unit.id).sort()]))) : (aliases.unitId?.(first, 'unit:' + sourceHash(JSON.stringify([facts.repository, file.path, first.kind, witnesses.map(unit => unit.id).sort()]))) ?? 'unit:' + sourceHash(JSON.stringify([facts.repository, file.path, first.kind, witnesses.map(unit => unit.id).sort()])));
            if (entities.some(entity => entity.id === logicalId))
                throw new Error('source_graph_ambiguous_logical_alias');
            const status = witnesses.length === 2 ? (same(witnesses[0]!, witnesses[1]!) ? 'no change' : 'change') : oneSidedStatus ?? (file.comparisonStatus === 'add' ? 'add' : 'remove');
            const entity: GraphEntity = {
                id: logicalId, kind: first.kind, data: {
                    name: first.kind === 'function' ? first.name + '()' : first.name,
                    ...(first.kind === 'assertion' ? { value: [first.sourceText] } : first.kind === 'header' ? { value: first.sourceText, statusScope: aliases.headerScope?.(first.ownerId ? occurrenceIds.get(first.ownerId) : undefined) ?? 'Direct headers.Authorization construction only' } : {}), comparisonStatus: status, comparisonBasis: basis,
                    occurrences: witnesses.map(unit => ({ canonicalId: unit.id, anchor: unit.anchor })), sourceWitnesses: witnesses.map(unit => ({
                        id: unit.id, anchor: unit.anchor, sourceText: unit.sourceText
                    }))
                }
            };
            entities.push(entity);
            fileUnits.get(id)!.push(logicalId);
            for (const unit of witnesses) {
                occurrenceIds.set(unit.id, logicalId);
                used.add(unit.id);
            }
            const locationWitnesses = witnesses.map(unit => ({
                id: logicalId + ':location:' + unit.anchor.side, from: logicalId, to: id, version: version(unit.anchor.side), relation: 'located_in', data: {
                    commit: unit.anchor.commit, range: { startLine: unit.anchor.startLine, endLine: unit.anchor.endLine }, sourceHash: unit.anchor.contentHash, sourceEvidence: unit.anchor
                }
            }));
            if (witnesses.length === 2 && status === 'no change')
                relations.push({
                    id: logicalId + ':location', from: logicalId, to: id, version: 'comparison', relation: 'located_in', data: {
                        comparisonStatus: 'no change', witnesses: locationWitnesses, basis
                    }
                });
            else
                relations.push(...locationWitnesses);
        };
        for (const before of base) {
            const candidates = head.filter(after => !used.has(after.id) && identityKey(before) === identityKey(after));
            const exact = base.filter(other => identityKey(before) === identityKey(other) && same(before, other)).length === 1 ? candidates.filter(after => same(before, after)) : [];
            const context = candidates.filter(after => nativeLineCorresponds(before.anchor.startLine, after.anchor.startLine, patch));
            const unchanged = file.comparisonStatus === 'no change' ? candidates.filter(after => before.anchor.start === after.anchor.start && before.anchor.end === after.anchor.end && same(before, after)) : [];
            const admitted = unchanged.length === 1 ? unchanged : exact.length === 1 ? exact : context.length === 1 ? context : [];
            if (admitted.length === 1)
                emit([before, admitted[0]!], unchanged.length ? 'Identical pinned File blob and exact source coordinates' : exact.length ? 'Unique exact source body and lexical identity' : 'Unique lexical declaration identity and native unchanged-context start-line correspondence');
            else if (file.comparisonStatus === 'remove')
                emit([before], 'File is absent in pinned Head tree');
            else if (wholly(before, edits.removed) && !head.some(other => other.kind === before.kind && wholly(other, edits.added) && sameReplacementHunk(before, other, patch)))
                emit([before], 'Whole source declaration is natively removed, with no same-kind added counterpart in this patch', 'remove');
        }
        for (const after of head)
            if (!used.has(after.id)) {
                if (file.comparisonStatus === 'add')
                    emit([after], 'File is absent in pinned Base tree');
                else if (wholly(after, edits.added) && !base.some(other => other.kind === after.kind && wholly(other, edits.removed) && sameReplacementHunk(other, after, patch)))
                    emit([after], 'Whole source declaration is natively added, with no same-kind removed counterpart in this patch', 'add');
            }
        for (const unit of units)
            if (!used.has(unit.id))
                unresolved.push({
                    path: file.path, occurrence: unit, reason: 'No unique evidenced cross-version correspondence; not a guessed logical entity'
                });
    }
    const prId = aliases.reviewId ?? 'review:' + sourceHash(JSON.stringify([facts.repository,facts.base,facts.head]));
    entities.push({
        id: prId, kind: 'review', data: {
            name: aliases.reviewName ?? 'Source comparison', repository: facts.repository, base: facts.base, head: facts.head
        }
    });
    for (const file of facts.files)
        relations.push({
            id: prId + ':changes:' + file.id, from: prId, to: fileIds.get(file.path)!, version: 'comparison', relation: 'changes', data: {
                comparisonStatus: file.comparisonStatus, basis: 'Native pinned File diff', sourceEvidence: {
                    base: facts.base, head: facts.head, path: file.path, patchHash: file.patchHash, sides: file.sides
                }
            }
        });
    const callBuckets = new Map<string, {
        from: string;
        to: string;
        sites: StructuralUnit[];
    }>();
    for (const site of facts.units.filter(unit => unit.kind === 'callsite' && unit.binding)) {
        let target = site.binding?.targetId;
        if (!target && site.binding?.kind === 'relative-import') {
            const base = posix.normalize(posix.join(posix.dirname(site.anchor.path), site.binding.module!));
            const paths = /\.(?:ts|tsx|mts|cts)$/.test(base) ? [base] : [];
            const candidates = facts.units.filter(unit => unit.kind === 'function' && unit.anchor.side === site.anchor.side && paths.includes(unit.anchor.path) && unit.exportName === site.binding!.name);
            if (candidates.length === 1)
                target = candidates[0]!.id;
        }
        const from = site.ownerId ? occurrenceIds.get(site.ownerId) : undefined, to = target ? occurrenceIds.get(target) : undefined;
        if (!from || !to)
            continue;
        const key = JSON.stringify([from, to, site.sourceText]);
        const bucket = callBuckets.get(key) ?? {
            from, to, sites: []
        };
        bucket.sites.push(site);
        callBuckets.set(key, bucket);
    }
    for (const bucket of callBuckets.values()) {
        const before = bucket.sites.filter(site => site.anchor.side === 'base'), after = bucket.sites.filter(site => site.anchor.side === 'head');
        const owner = entities.find(entity => entity.id === bucket.from);
        const sourceFile = facts.files.find(file => file.path === before[0]?.anchor.path);
        const paired = before.length === 1 && after.length === 1 && (owner?.data.comparisonStatus === 'no change' || nativeLineCorresponds(before[0]!.anchor.startLine, after[0]!.anchor.startLine, sourceFile?.patch ?? null));
        const batches = paired ? [bucket.sites] : bucket.sites.map(site => [site]);
        for (const sites of batches) {
            const target = entities.find(entity => entity.id === bucket.to);
            relations.push({
                id: 'calls:' + sourceHash(JSON.stringify(sites.map(site => site.id).sort())), from: bucket.from, to: bucket.to,
                version: paired ? 'comparison' : version(sites[0]!.anchor.side), relation: 'calls',
                data: {
                    ...(paired ? { comparisonStatus: 'no change' } : target?.data.comparisonStatus === 'add' && sites.every(site => site.anchor.side === 'head') ? { comparisonStatus: 'add' } : {}),
                    method: 'mechanically-supported-lexical-binding', basis: 'Immutable lexical/import target and exact source witnesses; not runtime or semantic analyzer admission',
                    sourceCalls: sites.map(site => ({ id: site.id, site: { sourceText: site.sourceText, anchor: site.anchor } }))
                }
            });
        }
    }
    const ownership = new Map<string, {
        from: string;
        to: string;
        witnesses: StructuralUnit[];
    }>();
    for (const unit of facts.units.filter(unit => unit.kind === 'assertion' && unit.ownerId)) {
        const from = occurrenceIds.get(unit.ownerId!), to = occurrenceIds.get(unit.id);
        if (!from || !to)
            continue;
        const key = from + ':contains:' + to;
        const record = ownership.get(key) ?? {
            from, to, witnesses: []
        };
        record.witnesses.push(unit);
        ownership.set(key, record);
    }
    for (const [id, record] of ownership) {
        const both = record.witnesses.some(unit => unit.anchor.side === 'base') && record.witnesses.some(unit => unit.anchor.side === 'head');
        relations.push({
            id, from: record.from, to: record.to, version: both ? 'comparison' : version(record.witnesses[0]!.anchor.side), relation: 'contains',
            data: { ...(both ? { comparisonStatus: 'no change' } : {}), sourceEvidence: record.witnesses.map(unit => unit.anchor) }
        });
    }
    for (const unit of facts.units.filter(unit => unit.kind === 'header' && unit.ownerId)) {
        const from = occurrenceIds.get(unit.ownerId!), to = occurrenceIds.get(unit.id);
        if (from && to)
            relations.push({
                id: 'constructs:' + from + ':' + to + ':' + version(unit.anchor.side), from, to, version: version(unit.anchor.side), relation: 'constructs', data: {
                    sourceEvidence: unit.anchor, comparisonStatus: entities.find(entity => entity.id === to)?.data.comparisonStatus, scope: aliases.headerScope?.(from) ?? 'Direct headers.Authorization construction only',
                    scopeLimit: 'Not global header removal'
                }
            });
    }
    return {
        id: aliases.graphId ?? 'source-comparison-graph', kind: 'graph', entities, relations,
        fileUnits: Object.fromEntries(fileUnits), unresolved,
        provenance: {
            producer: facts.producer, repository: facts.repository, base: facts.base, head: facts.head, coverage: facts.coverage,
            limits: ['Syntax occurrences are not executed test cases', 'Unknown logical correspondence remains source evidence', 'No author intent or TestRun generated']
        }
    };
};
