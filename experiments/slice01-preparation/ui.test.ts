import { test, expect } from 'bun:test';
import { chromium } from 'playwright';
import { join } from 'node:path';

test('React-only browser controls preserve source labels, emit one intent and remount cleanly', async () => {
  const build = await Bun.build({ entrypoints: [join(import.meta.dir, 'fixture.tsx')], target: 'browser', minify: false });
  expect(build.success).toBe(true);
  const js = await build.outputs[0]!.text();
  const server = Bun.serve({ port: 0, fetch: request => new URL(request.url).pathname === '/bundle.js' ? new Response(js, { headers: { 'Content-Type': 'text/javascript' } }) : new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Review loop diagnostic</title><div id="root"></div><script type="module" src="/bundle.js"></script></html>', { headers: { 'Content-Type': 'text/html' } }) });
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.url.toString());
    await page.getByRole('textbox', { name: 'Question' }).fill('Where does learned design belong?');
    await page.getByRole('button', { name: 'Ask agent' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes('Saved'));
    expect(await page.locator('[data-count]').textContent()).toBe('1');
    expect(await page.locator('[data-anchor]').textContent()).toContain('head · docs/README.md · 5–13');
    await page.getByRole('button', { name: 'Remount diagnostic' }).click();
    await page.getByRole('textbox', { name: 'Question' }).fill('Does a plan replace product knowledge?');
    await page.getByRole('button', { name: 'Ask agent' }).click();
    expect(await page.locator('[data-count]').textContent()).toBe('2');
    expect(errors).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: join(import.meta.dir, '../../..', 'react-diagnostic.png'), fullPage: true });
  } finally { await browser.close();server.stop(true); }
}, 30000);
