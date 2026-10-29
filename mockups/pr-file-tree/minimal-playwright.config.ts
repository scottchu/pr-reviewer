import {defineConfig} from '@playwright/test';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
export default defineConfig({
 testDir:'./tests',testMatch:['minimal-route.spec.ts','viewport-browser.spec.ts','change-filter-browser.spec.ts','header-occurrence-browser.spec.ts','policy-edge-browser.spec.ts'],workers:1,fullyParallel:false,reporter:'list',
 outputDir:process.env.PR_REVIEWER_TEST_OUTPUT??resolve(homedir(),'.codex-workspaces/artifacts/pr-reviewer-minimum-route-tests'),
 use:{browserName:'chromium',channel:'chrome',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
});
