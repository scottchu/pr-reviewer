import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)), base: './', publicDir: false,
    cacheDir: '../../node_modules/.vite/change-node-rebuild',
    build: {modulePreload: {polyfill: false}, outDir: '../../.decompozr/flow/run/change-node-preview/rebuild-stage0', emptyOutDir: true},
});
