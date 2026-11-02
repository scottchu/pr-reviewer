import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
export default defineConfig({
    testDir: '.', testMatch: 'single-change.spec.ts', workers: 1,
    outputDir: fileURLToPath(new URL('../../artifacts/change-node-rebuild/e2e-single-change', import.meta.url)),
    reporter: [['json', {outputFile: fileURLToPath(new URL('../../artifacts/change-node-rebuild/e2e-single-change-results.json', import.meta.url))}]],
    use: {baseURL: 'https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/', viewport: {width: 390, height: 844}},
});
