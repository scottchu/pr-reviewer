import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
export default defineConfig({
    testDir: '.', testMatch: 'stage1.spec.ts', workers: 1,
    outputDir: fileURLToPath(new URL('../../artifacts/change-node-rebuild/e2e', import.meta.url)),
    reporter: [['json', {outputFile: fileURLToPath(new URL('../../artifacts/change-node-rebuild/e2e-results.json', import.meta.url))}]],
    use: {baseURL: 'https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/', viewport: {width: 390, height: 844}},
});
