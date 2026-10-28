import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'minimal-browser.spec.ts',
  workers: 1,
  reporter: 'list',
  outputDir: '/tmp/pr-reviewer-reading-journey-evidence/minimum-graph/playwright',
  use: {
    baseURL: 'http://127.0.0.1:57943',
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    screenshot: 'only-on-failure',
  },
});
