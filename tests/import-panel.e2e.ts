import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// A real React fixture proves presentation/intent only, not import policy or the product journey.
let fixtureRoot: string;
let server: Server;
let url: string;
const projectRoot = resolve(import.meta.dirname, '..');

test.beforeAll(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'pr-reviewer-import-panel-'));
  await writeFile(join(fixtureRoot, 'index.html'), '<!doctype html><html lang="en"><head><title>Import presentation fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><main id="root"></main><script type="module" src="/fixture.js"></script></body></html>');
  await writeFile(join(fixtureRoot, 'fixture.tsx'), `
    import React, { StrictMode, useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { ImportPanel } from '${projectRoot}/src/ui/import-panel.tsx';
    import '${projectRoot}/src/ui/style.css';
    const calls = window.calls = [];
    const action = (id, label, disabled = false) => ({ id, label, disabled, onInvoke: () => calls.push(id) });
    const initial = {
      authenticated: true, path: '',
      requestActions: [
        { id: 'request', label: 'Import review', onInvoke: path => calls.push(['request', path]) },
        { id: 'continue', label: 'Import into this review', onInvoke: path => calls.push(['continue', path]) },
      ], jobs: [],
    };
    const choice = {
      id: 'job-1', title: 'Repository import', status: 'Choose a change', actions: [action('cancel', 'Request cancellation')],
      choices: [{ id: 'candidate-1', label: 'GitHub · project #24', href: 'https://github.com/example/project/pull/24',
        detail: 'feature → main', comparison: 'Base abc → Head def', actions: [action('choose', 'Create review for change 24')] }],
      evidence: ['Job job-1 · revision 3', 'Discovery: completed · 2 observed exits'],
    };
    const App = () => {
      const [props, setProps] = useState(initial);
      window.update = patch => setProps(value => ({ ...value, ...patch }));
      window.choose = () => setProps(value => ({ ...value, jobs: [choice] }));
      window.setStatus = (status, detail, enabled) => setProps(value => ({ ...value, jobs: [{
        id: 'job-1', title: 'Repository import', status, detail,
        actions: enabled ? [action('open', 'Open imported review')] : [],
      }] }));
      window.recover = () => setProps(value => ({ ...value, error: 'Request acknowledgement is unknown.', acknowledgementRecovery: action('recover', 'Retry unchanged import request') }));
      window.disable = () => setProps(value => ({ ...value, requestActions: value.requestActions.map(action => ({ ...action, disabled: true })), jobs: [{ ...choice, actions: [action('cancel', 'Request cancellation', true)] }] }));
      return <ImportPanel {...props} onPathChange={path => setProps(value => ({ ...value, path }))} />;
    };
    let root = createRoot(document.getElementById('root'));
    window.remount = () => { root.unmount(); root = createRoot(document.getElementById('root')); root.render(<StrictMode><App /></StrictMode>); };
    root.render(<StrictMode><App /></StrictMode>);
  `);
  await symlink(join(projectRoot, 'node_modules'), join(fixtureRoot, 'node_modules'));
  execFileSync('bun', ['build', join(fixtureRoot, 'fixture.tsx'), '--outdir', fixtureRoot, '--target', 'browser'], { stdio: 'pipe' });
  server = createServer((request, response) => {
    const name = request.url === '/fixture.js' ? 'fixture.js' : request.url === '/fixture.css' ? 'fixture.css' : request.url === '/' ? 'index.html' : undefined;
    if (!name) { response.writeHead(404).end(); return; }
    void readFile(join(fixtureRoot, name)).then(body => {
      response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
      response.end(body);
    }).catch(() => response.writeHead(500).end());
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing controlled fixture port');
  url = `http://127.0.0.1:${address.port}`;
  console.log(`Import presentation fixture: ${url}; temporary root ${fixtureRoot}`);
});

test.afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true });
});

type FixtureWindow = Window & {
  calls: unknown[];
  update: (patch: Record<string, unknown>) => void;
  choose: () => void;
  setStatus: (status: string, detail: string, open: boolean) => void;
  recover: () => void;
  disable: () => void;
  remount: () => void;
};

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Open a change from a repository' })).toBeVisible();
});

test('keyboard path submission, explicit candidate actions and opening emit only selected intent', async ({ page }, testInfo) => {
  const input = page.getByRole('textbox', { name: 'Repository path' });
  await input.fill('/local/repository');
  await input.press('Enter');
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([['request', '/local/repository']]);
  await page.getByRole('button', { name: 'Import into this review' }).click();
  await page.evaluate(() => (window as unknown as FixtureWindow).choose());
  await expect(page.getByRole('link', { name: 'GitHub · project #24' })).toHaveAttribute('rel', 'noreferrer');
  await page.getByRole('button', { name: 'Create review for change 24' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Request cancellation' }).click();
  await page.getByText('Import evidence', { exact: true }).click();
  await expect(page.getByText('Discovery: completed · 2 observed exits')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('import-panel.png'), fullPage: true });
  await page.evaluate(() => (window as unknown as FixtureWindow).setStatus('Import complete', 'The source is retained.', true));
  await page.getByRole('button', { name: 'Open imported review' }).focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([
    ['request', '/local/repository'], ['continue', '/local/repository'], 'choose', 'cancel', 'open',
  ]);
});

test('supplied states preserve input focus and never invent retry, cancel or open authority', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Repository path' });
  await input.fill('/local/draft');
  await input.focus();
  for (const status of ['Queued', 'Discovering changes', 'Importing source', 'Cancellation requested', 'Cancelled', 'Outcome unknown', 'Provider unavailable', 'Import failed', 'Import complete']) {
    await page.evaluate(status => (window as unknown as FixtureWindow).setStatus(status, 'Supplied truthful explanation.', false), status);
    await expect(page.getByRole('status')).toHaveText(status);
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('/local/draft');
    await expect(page.getByRole('button', { name: /cancellation|Retry|Open imported/ })).toHaveCount(0);
  }
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([]);
  await page.evaluate(() => (window as unknown as FixtureWindow).recover());
  await expect(page.getByRole('alert')).toHaveText('Request acknowledgement is unknown.');
  await expect(input).toHaveAccessibleDescription(/Request acknowledgement is unknown/);
  await page.getByRole('button', { name: 'Retry unchanged import request' }).click();
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual(['recover']);
});

test('native validation, disabled actions, unauthenticated state and remount remain passive', async ({ page }) => {
  await page.getByRole('button', { name: 'Import review', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([]);
  await page.getByRole('textbox', { name: 'Repository path' }).fill('/local/repository');
  await page.evaluate(() => (window as unknown as FixtureWindow).disable());
  await expect(page.getByRole('button', { name: 'Import review', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Request cancellation' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Repository path' }).press('Enter');
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([]);
  await page.evaluate(() => (window as unknown as FixtureWindow).update({ authenticated: false }));
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as FixtureWindow).remount());
  await expect(page.getByRole('textbox', { name: 'Repository path' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).calls)).toEqual([]);
});
