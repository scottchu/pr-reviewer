import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createNodeEffects, type AcquisitionEffects } from '../../src/source-acquisition/public.ts';
import { extractSourceFacts, sourceHash, sourceFactsParserVersion, type SourceInput } from './source-facts.ts';
const hashBytes = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
export const decodePinnedText = (bytes: Uint8Array): string | null => {
    try {
        const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        return text.includes('\0') ? null : text;
    }
    catch {
        return null;
    }
};
export const parseTreeRecords = (text: string) => new Map(text.split('\0').filter(Boolean).map(row => {
    const separator = row.indexOf('\t');
    if (separator < 0)
        throw new Error('source_facts_tree_record_invalid');
    const [mode, type, objectId] = row.slice(0, separator).split(' ');
    if (!mode || !type || !objectId)
        throw new Error('source_facts_tree_metadata_invalid');
    return [row.slice(separator + 1), {
            mode, type, objectId
        }] as const;
}));
/** Native full-comparison File inventory plus explicitly discovered test-source context. */
export const prepareSourceFacts = async (repository: string, base: string, head: string, effects: AcquisitionEffects = createNodeEffects()) => {
    const gitBytes = async (...args: string[]) => {
        const result = await effects.run({
            executable: 'git', args: ['--no-optional-locks', '--no-lazy-fetch', '--literal-pathspecs', '--attr-source=' + head, '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...args], cwd: process.cwd(), maxBytes: 64 * 1024 * 1024, timeoutMs: 15000
        });
        if (result.kind !== 'ok')
            throw new Error('source_facts_git_' + result.reason);
        return result.stdout;
    };
    const git = async (...args: string[]) => {
        try {
            return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await gitBytes(...args));
        }
        catch {
            throw new Error('source_facts_git_metadata_unavailable');
        }
    };
    for (const commit of [base, head]) {
        if (!/^[a-f0-9]{40}$/.test(commit) || (await git('rev-parse', commit + '^{commit}')).trim() !== commit)
            throw new Error('source_facts_unpinned_commit');
    }
    const names = (await git('diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-status', '-z', base, head)).split('\0').filter(Boolean);
    if (names.length % 2)
        throw new Error('source_facts_file_manifest_invalid');
    const trees = new Map(await Promise.all([base, head].map(async (commit) => [commit, parseTreeRecords(await git('ls-tree', '-r', '-z', commit))] as const)));
    const sources: SourceInput[] = [];
    const unsupported: {
        side: string;
        path: string;
        reason: string;
    }[] = [];
    const readSides = async (path: string) => {
        const sides = [];
        for (const side of ['base', 'head'] as const) {
            const commit = side === 'base' ? base : head;
            const entry = trees.get(commit)!.get(path);
            if (!entry) {
                sides.push({
                    side, commit, available: false as const
                });
                continue;
            }
            if (entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) {
                unsupported.push({
                    side, path, reason: 'non-regular-blob'
                });
                sides.push({
                    side, commit, available: true as const, ...entry, disposition: 'non-regular-blob'
                });
                continue;
            }
            const bytes = await gitBytes('cat-file', 'blob', entry.objectId);
            const oid = createHash(entry.objectId.length === 64 ? 'sha256' : 'sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
            if (oid !== entry.objectId)
                throw new Error('source_facts_blob_identity_mismatch');
            const contentHash = hashBytes(bytes), content = decodePinnedText(bytes);
            if (content === null) {
                unsupported.push({
                    side, path, reason: 'binary-or-invalid-utf8'
                });
                sides.push({
                    side, commit, available: true as const, ...entry, contentHash, disposition: 'binary-or-invalid-utf8'
                });
                continue;
            }
            sources.push({
                repository, side, commit, path, content, contentHash, gitBlob: entry.objectId
            });
            sides.push({
                side, commit, available: true as const, ...entry, contentHash, disposition: 'text'
            });
        }
        return sides;
    };
    const files = [];
    for (let index = 0; index < names.length; index += 2) {
        const nativeStatus = names[index]!, path = names[index + 1]!;
        if (!['A', 'M', 'D', 'T'].includes(nativeStatus))
            throw new Error('source_facts_unsupported_file_status');
        const sides = await readSides(path);
        const bytes = await gitBytes('diff', '--no-ext-diff', '--no-textconv', '--no-color', '--no-renames', '--diff-algorithm=myers', '--no-indent-heuristic', '--unified=3', base, head, '--', path);
        files.push({
            id: sourceHash(JSON.stringify({ repository, path })), path, nativeStatus, comparisonStatus: nativeStatus === 'A' ? 'add' : nativeStatus === 'D' ? 'remove' : 'change', sides, patch: decodePinnedText(bytes), patchHash: hashBytes(bytes)
        });
    }
    const changed = new Set(files.map(file => file.path));
    const testPaths = [...new Set([...trees.values()].flatMap(tree => [...tree.keys()]))].filter(path => /\.(?:ts|tsx|mts|cts)$/.test(path) && (path.startsWith('tests/') || /\.(?:test|spec|e2e)\./.test(path))).sort();
    const contextFiles = [];
    for (const path of testPaths.filter(path => !changed.has(path))) {
        const sides = await readSides(path), before = trees.get(base)!.get(path), after = trees.get(head)!.get(path);
        if (!before || !after || before.objectId !== after.objectId || before.mode !== after.mode)
            throw new Error('source_facts_context_not_unchanged');
        contextFiles.push({
            id: sourceHash(JSON.stringify({ repository, path })), path, comparisonStatus: 'no change', sides, scope: 'test-source-context; not a PR changes File fact'
        });
    }
    const units = sources.flatMap(extractSourceFacts);
    return {
        format: 'pinned-source-structural-facts-v1', producer: {
            version: 'source-facts-v1', parser: 'typescript@' + sourceFactsParserVersion, sourceHashes: { extractor: hashBytes(readFileSync(new URL('./source-facts.ts', import.meta.url))), gitStage: hashBytes(readFileSync(new URL('./prepare-source-facts.ts', import.meta.url))) }
        }, repository, base, head, files, contextFiles, units,
        coverage: {
            changedFiles: files.length, testContextFiles: contextFiles.length, testCandidatePaths: testPaths.length, presentSides: [...files, ...contextFiles].flatMap(file => file.sides).filter(side => side.available).length,
            textSources: sources.length, astSources: sources.filter(source => /\.(?:ts|tsx|mts|cts)$/.test(source.path)).length, unsupportedSources: unsupported,
            sourceKindsNotParsed: sources.filter(source => !/\.(?:ts|tsx|mts|cts)$/.test(source.path)).map(source => ({ side: source.side, path: source.path })),
            unresolvedAssertionPatterns: units.filter(unit => unit.diagnostic).map(unit => ({ anchor: unit.anchor, reason: unit.diagnostic })),
            testDiscovery: 'Git tree tests/ or .test/.spec/.e2e TS paths; only supported imported test bindings are admitted, custom factories/namespaces remain unassessed',
            callTargetBinding: 'not performed by this syntax stage', logicalCrossVersionMatching: 'not performed by this occurrence stage', explanations: 'not generated; separate attributed input', executionResults: 'not generated'
        },
    };
};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [repository, base, head, output] = process.argv.slice(2);
    if (!repository || !base || !head || !output)
        throw new Error('usage: repository base head persistent-output.json');
    const facts = await prepareSourceFacts(repository, base, head);
    writeFileSync(output, JSON.stringify(facts, null, 2) + '\n');
    console.log(JSON.stringify({
        files: facts.files.length, contextFiles: facts.contextFiles.length, units: facts.units.length, coverage: facts.coverage
    }));
}
