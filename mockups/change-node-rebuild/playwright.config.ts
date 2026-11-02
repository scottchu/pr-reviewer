import {defineConfig} from '@playwright/test';
export default defineConfig({
    testDir: '.', testMatch: 'stage1.spec.ts', workers: 1,
    outputDir: '../../artifacts/change-node-rebuild/e2e',
    reporter: [['json', {outputFile: '../../artifacts/change-node-rebuild/e2e-results.json'}]],
    use: {baseURL: 'https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/', viewport: {width: 390, height: 844}},
});
