import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {selectedReaderInputs} from './selected-reader-inputs.ts';
export default defineConfig({
    plugins: [selectedReaderInputs()],
    root: fileURLToPath(new URL('.', import.meta.url)), base: './', publicDir: false,
    cacheDir: '../../artifacts/change-node-rebuild/vite-cache',
    build: {modulePreload: {polyfill: false}, outDir: '../../dist/change-node-rebuild/build', emptyOutDir: true},
});
