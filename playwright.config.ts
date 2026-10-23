import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "review.e2e.ts",
  workers: 1,
  timeout: 45000,
  use: {
    browserName: "chromium",
    headless: true,
    launchOptions: {
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  },
  reporter: "list",
  outputDir:
    process.env.REVIEW_E2E_ARTIFACT_DIR ??
    "/tmp/pr-reviewer-playwright-artifacts",
});
