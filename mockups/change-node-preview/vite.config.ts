import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({root: fileURLToPath(new URL('.', import.meta.url)), base: './',
    publicDir: fileURLToPath(new URL('../pr-file-tree/public', import.meta.url)),
    cacheDir: '../../node_modules/.vite/change-node-preview',
    build: {outDir: '../../.decompozr/flow/run/change-node-preview/build', emptyOutDir: true},
});
