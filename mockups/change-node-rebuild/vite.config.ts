import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)), base: './', publicDir: false,
    cacheDir: '../../artifacts/change-node-rebuild/vite-cache',
    build: {modulePreload: {polyfill: false}, outDir: '../../dist/change-node-rebuild/build', emptyOutDir: true},
});
