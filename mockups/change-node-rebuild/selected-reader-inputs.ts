import type {Plugin} from 'vite';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import diffs from '../pr-file-tree/diffs.json' with {type: 'json'};
import source from '../pr-file-tree/full-source.json' with {type: 'json'};
import context from '../pr-file-tree/function-context.json' with {type: 'json'};
import syntax from '../pr-file-tree/syntax.json' with {type: 'json'};

// Build/SSR only: unchanged projections of existing fixtures, never a browser import.
export const selectedPath = 'src/server/public.ts';
export const selectedPaths = [selectedPath, 'tests/gateway.test.ts'];
export const selectedDiffs = {...diffs, files: diffs.files.filter(file => selectedPaths.includes(file.path))};
export const selectedSource = {...source, files: source.files.filter(file => selectedPaths.includes(file.path))};
export const selectedContext = {...context, files: context.files.filter(file => selectedPaths.includes(file.path))};
export const selectedSyntax = Object.fromEntries(Object.entries(syntax).filter(([key]) => selectedPaths.some(path => key === path + ':before' || key === path + ':after')));
const directory = fileURLToPath(new URL('../pr-file-tree/', import.meta.url));
const inputs = new Map<string, unknown>([
    [resolve(directory, 'diffs.json'), selectedDiffs],
    [resolve(directory, 'full-source.json'), selectedSource],
    [resolve(directory, 'function-context.json'), selectedContext],
    [resolve(directory, 'syntax.json'), selectedSyntax],
]);
export const selectedReaderInputs = (): Plugin => ({
    name: 'selected-reader-inputs', enforce: 'pre',
    resolveId: (id, importer) => {
        if (!importer || !id.startsWith('.')) return null;
        const path = resolve(dirname(importer.split('?')[0]!), id);
        return inputs.has(path) ? '\0selected-reader:' + path + '.mjs' : null;
    },
    load: id => id.startsWith('\0selected-reader:') ? 'export default ' + JSON.stringify(inputs.get(id.slice('\0selected-reader:'.length, -4))) : null,
});
