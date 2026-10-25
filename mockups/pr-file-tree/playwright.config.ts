import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: ['continuous-browser.spec.ts', 'calls-browser.spec.ts', 'journey-browser.spec.ts'],
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  outputDir: '/tmp/pr-reviewer-reading-journey-evidence/playwright',
  use: {
    baseURL: 'http://127.0.0.1:57943',
    viewport: {
      width: 1440,
      height: 1000
    },
    launchOptions: {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-first-run', '--no-default-browser-check'
      ]
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
