import { nativeDocumentHunks } from './native-diff.ts';
import ts from 'typescript-analysis';
import { sourceHash } from '../domain/hash.ts';
import type { SourceInput, ParsedSource, SourceSnapshot, ParsedSnapshot } from '../domain/types.ts';
export const sourceFactsParserVersion = ts.version;
export const parseSource = (input: SourceInput): ParsedSource => {
    if (sourceHash(input.content) !== input.contentHash)
        throw new Error('source_facts_hash_mismatch');
    if (!/\.(?:ts|tsx|mts|cts)$/.test(input.path))
        return { input, kind: 'unsupported' };
    const fileName = '/' + input.path;
    const ast = ts.createSourceFile(fileName, input.content, ts.ScriptTarget.Latest, true, input.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const host: ts.CompilerHost = {
        getSourceFile: name => name === fileName ? ast : undefined,
        getDefaultLibFileName: () => '', writeFile: () => { }, getCurrentDirectory: () => '/',
        getDirectories: () => [], fileExists: name => name === fileName,
        readFile: name => name === fileName ? input.content : undefined,
        getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
    };
    const program = ts.createProgram([fileName], {
        noLib: true, noResolve: true, target: ts.ScriptTarget.Latest
    }, host);
    if (program.getSyntacticDiagnostics(ast).length)
        throw new Error('source_facts_syntax_unavailable');
    const checker = program.getTypeChecker();
    return { input, kind: 'typescript', ast, checker };
};
export const parseSnapshot = (snapshot: SourceSnapshot): ParsedSnapshot => {
    const nativeDiffs = new Map<string, ReturnType<typeof nativeDocumentHunks>>();
    const nativeDiagnostics: {
        fileId: string;
        reason: string;
    }[] = [];
    for (const file of snapshot.files) {
        try {
            nativeDiffs.set(file.id, nativeDocumentHunks(file));
        }
        catch (error) {
            nativeDiagnostics.push({ fileId: file.id, reason: error instanceof Error ? error.message : String(error) });
        }
    }
    return { snapshot, sources: snapshot.sources.map(parseSource), nativeDiffs, nativeDiagnostics };
};
