import { test, expect, type Page, type Locator } from '@playwright/test';
import { mkdirSync, existsSync } from 'node:fs';
import { projectBehaviorCalls, projectCalls } from '../calls.ts';
test.use({ reducedMotion: 'reduce' });
const rootEvidence = process.env.REVIEW_ROOT_EVIDENCE_DIR ?? `/tmp/pr-reviewer-reading-journey-evidence/root-author-${Date.now()}`;
if (existsSync(`${rootEvidence}/candidate-manifest.json`)) throw new Error('refuse_to_overwrite_frozen_root_evidence');
mkdirSync(rootEvidence, { recursive: true });

for (const width of [1440, 390]) test(`${width} original file roots with caller/callee projection and unchanged expansion`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Behavior graph', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.react-flow__node-function')).toHaveCount(0);
  await expect(page.locator('.react-flow__node-behaviorNote')).toHaveCount(0);
  await expect(page.locator('.react-flow__edge-fileCall')).toHaveCount(15);
  await expect(page.locator('.react-flow__edge[data-id^="contains:"]')).toHaveCount(0);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  const graph = projectBehaviorCalls();
  const request = graph.nodes.find(node => node.name === 'request' && node.seed && node.declaration.side === 'head')!;
  const helper = graph.nodes.find(node => node.name === 'accessHeaders')!;
  const call = graph.links.find(link => link.caller === request.id && link.callee === helper.id)!;
  const edge = page.locator(`[data-call-id="${call.id}"]`);
  await expect(edge).toContainText('request() → accessHeaders()');
  await expect(edge).not.toContainText('New call in this PR');
  await expect(edge).toBeInViewport();
  const labelBox = await edge.boundingBox();
  expect(labelBox!.x).toBeGreaterThanOrEqual(0);
  expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(width);
  await expect(edge).toHaveCSS('font-size', '17px');
  await expect(edge).toHaveAttribute('data-relationship-status', 'added');
  const source = page.locator('[data-file-path="src/application/review.ts"]');
  await expect(source).toContainText('~ review.ts');
  const initial = await source.boundingBox();
  await page.screenshot({ path: `${rootEvidence}/opening-${width}.png` });
  await source.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', request.declaration.path);
  await expect(page.locator('.continuous-reader')).toBeInViewport();
  const root = page.locator('.react-flow__node[data-id="file:src/application/review.ts"]');
  await expect(root).toHaveCSS('width', width < 650 ? '324px' : '760px');
  const points = await page.locator(`.react-flow__edge-fileCall[data-id="${call.id}"]`).evaluate(element => {
    const positions = (path: SVGPathElement) => {
      const matrix = path.getScreenCTM()!;
      const start = path.getPointAtLength(0).matrixTransform(matrix);
      const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
      return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y } };
    };
    const path = element.querySelector<SVGPathElement>('.react-flow__edge-path')!;
    return { call: positions(path), marker: path.getAttribute('marker-end') };
  });
  const caller = await root.boundingBox();
  const callee = await page.locator('.react-flow__node[data-id="file:src/application/local-access.ts"]').boundingBox();
  const atBoundary = (point: { x: number; y: number }, box: NonNullable<typeof caller>) => Math.min(Math.abs(point.x-box.x), Math.abs(point.x-box.x-box.width), Math.abs(point.y-box.y), Math.abs(point.y-box.y-box.height));
  expect(atBoundary(points.call.start, caller!)).toBeLessThan(4);
  expect(atBoundary(points.call.end, callee!)).toBeLessThan(4);
  expect(points.marker).toBeTruthy();
  await page.screenshot({ path: `${rootEvidence}/expanded-${width}.png` });
  await page.getByRole('button', { name: 'Unified', exact: true }).click();
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 95; });
  const saved = await page.locator('.continuous-reader').evaluate(element => element.scrollTop);
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.getByRole('button', { name: 'File tree', exact: true }).click();
  await expect(page.locator('.continuous-reader')).toBeInViewport();
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(saved, 0);
  await page.getByRole('button', { name: 'Behavior graph', exact: true }).click();
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(saved, 0);
  expect(initial!.width).toBeGreaterThan(50);
});

const panTo = async (page: Page, locator: Locator) => {
  await page.locator('main').focus();
  for (let attempt = 0; attempt < 100; attempt++) {
    const box = await locator.boundingBox();
    if (box && Math.abs(box.x - 20) <= 65 && Math.abs(box.y - 150) <= 65) return;
    await page.keyboard.press(!box || box.x > 85 ? 'ArrowRight' : box.x < -45 ? 'ArrowLeft' : box.y > 215 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error(`behavior_member_not_exposed: ${JSON.stringify(await locator.boundingBox())}`);
};

test('both-side unchanged callers and callees, callsite evidence and arbitrary unprepared source remain inspectable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=files');
  const graph = projectBehaviorCalls();
  for (const side of ['base', 'head'] as const) for (const name of ['refresh', 'encodedBytes', 'requestFingerprint']) {
    const identity = graph.nodes.find(node => node.name === name && node.declaration.side === side)!;
    await page.getByRole('button', { name: 'Find source', exact: true }).click();
    await page.getByRole('combobox', { name: 'Changed source' }).selectOption(identity.declaration.path);
    const node = page.locator(`[data-function-id="${identity.id}"]`);
    await panTo(page, node);
    await expect(node).toContainText('unchanged source');
    await node.getByRole('button', { name: /^Read/ }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', identity.declaration.path);
    await expect(page.locator(`.diff-line[data-${side === 'base' ? 'before' : 'after'}-line="${identity.declaration.startLine}"]`).first()).toBeAttached();
    await page.getByRole('button', { name: 'Back to source context' }).click();
    await expect(page.getByRole('button', { name: 'File tree', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  const request = graph.nodes.find(node => node.name === 'request' && node.seed && node.declaration.side === 'head')!;
  const helper = graph.nodes.find(node => node.name === 'accessHeaders')!;
  const link = graph.links.find(link => link.caller === request.id && link.callee === helper.id)!;
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/application/review.ts');
  const edge = page.getByRole('button', { name: /^Explain After call request → accessHeaders · src\/application\/review.ts:30–30 → src\/application\/local-access.ts:3–3;/ });
  await expect(edge).toHaveAttribute('data-call-id', link.id);
  await panTo(page, edge);
  await edge.focus();
  await expect(edge).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByText('Why and source evidence', { exact: true }).click();
  await expect(page.getByRole('region', { name: 'Call relationship explanation' })).toContainText('Source-observed lexical call');
  await page.getByRole('button', { name: /^Read callsite After/ }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', link.sites[0]!.anchor.path);
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await page.getByRole('button', { name: 'Close relationship explanation' }).click();
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('scripts/add-snapshot.ts');
  const source = page.locator('[data-file-path="scripts/add-snapshot.ts"]');
  await expect(source).toBeInViewport();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await source.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'scripts/add-snapshot.ts');
  await expect(page.getByRole('status').filter({ hasText: 'Call relationships are not mapped for this file' })).toBeVisible();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.screenshot({ path: '/tmp/pr-reviewer-reading-journey-evidence/r9-unprepared-390.png' });
});

const reading = async (page: Page) => ({
  camera: await page.locator('.react-flow__viewport').getAttribute('style'),
  top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
  left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
  mode: await page.getByRole('button', { name: 'Unified', exact: true }).getAttribute('aria-pressed'),
  folds: await page.locator('.fold-control[aria-expanded="true"]').allTextContents(),
  tests: await page.locator('[data-declared-test]').count(),
});
const expectReading = async (page: Page, saved: Awaited<ReturnType<typeof reading>>, camera = true) => {
  if (camera) await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', saved.camera!);
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(saved.top, 0);
  await expect.poll(() => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBeCloseTo(saved.left, 0);
  await expect(page.getByRole('button', { name: 'Unified', exact: true })).toHaveAttribute('aria-pressed', saved.mode!);
  expect(await page.locator('.fold-control[aria-expanded="true"]').allTextContents()).toEqual(saved.folds);
  await expect(page.locator('[data-declared-test]')).toHaveCount(saved.tests);
};

test('icon lens switches preserve folded source/test lens, public story cursor, dirty draft and owner/source return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=files');
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/application/review.ts');
  const identity = projectBehaviorCalls().nodes.find(node => node.name === 'request' && node.seed && node.declaration.side === 'head')!;
  const node = page.locator(`[data-function-id="${identity.id}"]`);
  await panTo(page, node);
  await node.getByRole('button', { name: /^Read After/ }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.locator('.fold-control').first().click();
  await panTo(page, node);
  await node.getByRole('button', { name: /^Relevant tests/ }).click();
  await node.getByRole('button', { name: /^Read After/ }).click();
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 95; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
  const saved = await reading(page);
  expect(saved.left).toBeGreaterThan(0);
  expect(saved.folds.length).toBeGreaterThan(0);
  expect(saved.tests).toBe(1);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await page.getByRole('textbox', { name: 'Your question' }).fill('Preserve this original behavior-view question');
  await page.getByRole('button', { name: 'Close discussion' }).click();
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  await page.getByRole('button', { name: 'Next story step' }).click();
  await page.getByRole('button', { name: 'Close prepared story' }).click();
  await page.getByRole('button', { name: 'Behavior graph', exact: true }).click();
  await expectReading(page, { ...saved, tests: saved.tests }, false);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Preserve this original behavior-view question');
  await page.getByRole('button', { name: 'Close discussion' }).click();
  await page.getByRole('button', { name: 'File tree', exact: true }).click();
  await expectReading(page, saved);
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  await expect(page.getByRole('region', { name: 'Prepared story' })).toContainText('Trace an unchanged caller');
  await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33', exact: true }).first().click();
  await page.getByRole('button', { name: 'Behavior graph', exact: true }).click();
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await expect(page.getByRole('button', { name: 'File tree', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expectReading(page, saved);
  await page.getByRole('button', { name: 'Back to source context' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Preserve this original behavior-view question');
});

test('root call keyboard evidence returns to exact file projection; unprepared changed source stays reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const edge = page.getByRole('button', { name: /^Explain After call request → accessHeaders · src\/application\/review.ts:30–30 → src\/application\/local-access.ts:3–3;/ });
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  await edge.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Call relationship explanation' })).toBeVisible();
  await page.getByText('Why and source evidence', { exact: true }).click();
  await page.getByRole('button', { name: /^Read callsite After/ }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  await expect(page.getByRole('button', { name: 'Behavior graph', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close relationship explanation' }).click();
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('scripts/add-snapshot.ts');
  const file = page.locator('[data-file-path="scripts/add-snapshot.ts"]');
  await expect(file).toBeInViewport();
  await file.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'scripts/add-snapshot.ts');
  await expect(page.getByRole('status').filter({ hasText: 'Call relationships are not mapped for this file' })).toBeVisible();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
});

for (const resize of [false, true]) test(`phone root viewport clears bottom controls and preserves endpoint framing after ${resize ? 'desktop resize' : 'fresh open'}`, async ({ page }) => {
  await page.setViewportSize({ width: resize ? 1408 : 390, height: resize ? 796 : 844 });
  await page.goto('/');
  if (resize) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Close review context' }).click();
    await page.getByRole('button', { name: 'Overview', exact: true }).click();
  }
  const source = page.locator('[data-file-path="src/application/review.ts"]');
  const target = page.locator('[data-file-path="src/application/local-access.ts"]');
  await page.screenshot({ path: `${rootEvidence}/${resize ? 'resize' : 'fresh'}-current.png` });
  for (const node of [source, target]) {
    const box = await node.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  const graph = await page.locator('.pr-graph').boundingBox();
  await expect(page.locator('.file-call-legend')).toHaveCount(0);
  const controls = await page.getByRole('navigation', { name: 'Workspace actions' }).boundingBox();
  expect(graph!.y + graph!.height).toBeLessThanOrEqual(controls!.y);
  if (resize) {
    await source.click();
    await page.getByRole('button', { name: 'Unified', exact: true }).click();
    await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 70; });
    const readingTop = await page.locator('.continuous-reader').evaluate(element => element.scrollTop);
    await page.setViewportSize({ width: 1408, height: 796 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
    await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(readingTop, 0);
    await expect(page.getByRole('button', { name: 'Unified', exact: true })).toHaveAttribute('aria-pressed', 'true');
  }

  await expect(page.locator('[data-file-path]')).toHaveCount(50);
});

test('storage root caller blocks keep every exact relation label disjoint', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open prepared story', exact: true }).click();
  await page.getByRole('button', { name: 'Next story step', exact: true }).click();
  await page.getByRole('button', { name: 'Next story step', exact: true }).click();
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/storage/public.ts');
  await page.screenshot({ path: `${rootEvidence}/storage-labels-current.png` });
  const labels = await page.locator('.file-call-label').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { id: element.getAttribute('data-call-id'), left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  }));
  expect(labels).toHaveLength(15);
  for (const [index, a] of labels.entries()) for (const b of labels.slice(index + 1)) {
    const overlap = Math.min(a.right, b.right) > Math.max(a.left, b.left)
      && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
    expect(overlap, `Exact call labels overlap: ${a.id} and ${b.id}`).toBe(false);
  }
});


for (const width of [1440, 390]) test(`${width} independent direct file arrows retain boundary ownership collapsed and expanded`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  if (width >= 650) await page.getByRole('button', { name: 'Close review context', exact: true }).click();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await expect(page.locator('.react-flow__edge-fileCall')).toHaveCount(15);
  await expect(page.locator('.file-port-extension')).toHaveCount(0);
  const verify = async () => {
    const routes = await page.locator('.react-flow__edge-fileCall').evaluateAll(edges => edges.map(edge => {
      const path = edge.querySelector<SVGPathElement>('.react-flow__edge-path')!;
      const matrix = path.getScreenCTM()!;
      const point = (at: number) => { const p = path.getPointAtLength(at).matrixTransform(matrix); return { x: p.x, y: p.y }; };
      return { id: edge.getAttribute('data-id'), start: point(0), end: point(path.getTotalLength()), d: path.getAttribute('d'), marker: path.getAttribute('marker-end'), dash: getComputedStyle(path).strokeDasharray };
    }));
    const facts = projectBehaviorCalls();
    for (const route of routes) {
      const link = facts.links.find(link => link.id === route.id)!;
      const caller = facts.nodes.find(node => node.id === link.caller)!;
      const source = await page.locator(`.react-flow__node[data-id="file:${caller.declaration.path}"]`).boundingBox();
      const target = await page.locator(`.react-flow__node[data-id="file:${link.target.path}"]`).boundingBox();
      const boundary = (point: { x: number; y: number }, box: NonNullable<typeof source>) => Math.min(Math.abs(point.x-box.x), Math.abs(point.x-box.x-box.width), Math.abs(point.y-box.y), Math.abs(point.y-box.y-box.height));
      expect(boundary(route.start, source!)).toBeLessThan(4);
      expect(boundary(route.end, target!)).toBeLessThan(4);
      expect(route.marker).toBeTruthy(); expect(route.dash).toBe('none');
      expect((route.d!.match(/M/g) ?? []).length).toBe(1);
    }
    expect(new Set(routes.map(route => route.d)).size).toBe(15);
  };
  await verify();
  await page.screenshot({ path: `${rootEvidence}/direct-opening-${width}.png` });
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/storage/analysis.ts');
  await page.screenshot({ path: `${rootEvidence}/direct-storage-${width}.png` });
  await page.locator('[data-file-path="src/storage/analysis.ts"]').click();
  await expect(page.locator('.continuous-reader')).toBeInViewport();
  await verify();
  await page.screenshot({ path: `${rootEvidence}/direct-expanded-${width}.png` });
  await page.getByRole('button', { name: 'Unified', exact: true }).click();
  await expect(page.locator('.continuous-reader')).toHaveClass(/unified/);
  await page.getByRole('button', { name: 'File tree', exact: true }).click();
  await expect(page.locator('.continuous-reader')).toHaveClass(/unified/);
  await page.getByRole('button', { name: 'Behavior graph', exact: true }).click();
  await expect(page.locator('.continuous-reader')).toHaveClass(/unified/);
});


test('document region references distinguish normative source from implementation and exact return', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('docs/product/review-loop/runtime.md');
  const reference = page.getByRole('button', { name: /Read documented requirement docs\/product\/review-loop\/runtime.md/ });
  await expect(reference).toBeInViewport();
  const frame = await page.locator('.react-flow__viewport').getAttribute('style');
  await reference.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'docs/product/review-loop/runtime.md');
  await expect(page.locator('[data-after-line="22"]')).toBeVisible();
  await page.getByRole('button', { name: 'Back to source context' }).click();
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', frame!);
  await page.screenshot({ path: `${rootEvidence}/document-references.png` });
});


for (const activation of ['Enter', 'Space']) test(`requirement reference ${activation} focuses visible source and keyboard Back`, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('docs/product/review-loop/runtime.md');
  const reference = page.getByRole('button', { name: /Read documented requirement docs\/product\/review-loop\/runtime.md/ });
  const frame = await page.locator('.react-flow__viewport').getAttribute('style');
  await reference.focus();
  await page.keyboard.press(activation);
  const reader = page.locator('.continuous-reader');
  await expect(reader).toBeFocused();
  await expect(reader).toBeInViewport();
  const back = page.getByRole('button', { name: 'Back to source context' });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', frame!);
  await expect(page.locator('main')).toBeFocused();
});


for (const width of [1440, 390]) test(`${width} inferred change consequence exposes real source and exact explanation return`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  if (width >= 650) await page.getByRole('button', { name: 'Close review context' }).click();
  const edge = page.getByRole('button', { name: /Explain inferred change consequence/ });
  await expect(edge).toBeVisible();
  await expect(page.locator('.react-flow__edge-fileCall')).toHaveCount(15);
  await expect(page.locator('.react-flow__edge-requirementReference')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge-changeImpact')).toHaveCount(1);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.screenshot({ path: `${rootEvidence}/impact-overview-${width}.png` });
  await edge.focus();
  await page.keyboard.press('Enter');
  const explanation = page.getByRole(width < 650 ? 'dialog' : 'region', { name: 'Change consequence explanation' });
  await expect(explanation.getByRole('heading', { name: 'Matching owner-request headers' })).toBeFocused();
  await expect(explanation).toContainText('Prepared inference');
  await expect(explanation).toContainText('not runtime proof');
  await expect(explanation.locator('.callsite-action')).toHaveCount(6);
  const original = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.screenshot({ path: `${rootEvidence}/impact-explanation-${width}.png` });
  for (const side of ['After', 'Before']) {
    const button = explanation.getByRole('button', { name: new RegExp(`Read ${side} · src/server/public.ts`) });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(explanation).toHaveCount(0);
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/server/public.ts');
    const reader = page.locator('.continuous-reader');
    await expect(reader).toBeFocused();
    await expect(reader).toBeInViewport();
    await expect(page.locator(`[data-${side === 'After' ? 'after' : 'before'}-line="61"]`).first()).toBeVisible();
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(explanation).toBeVisible();
    await expect(explanation.getByRole('heading', { name: 'Matching owner-request headers' })).toBeFocused();
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
  }
  await explanation.getByRole('button', { name: 'Close change consequence' }).click();
  await expect(edge).toBeFocused();
});


test.describe('normal-motion impact reading restoration', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('change consequence Return keeps an existing expanded folded Split reading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Close review context' }).click();
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/application/private-session.ts');
  await page.locator('[data-file-path="src/application/private-session.ts"]').click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.clientWidth)).toBeGreaterThan(700);
  await page.locator('.fold-control').first().click();
  await expect.poll(async () => (await page.locator('[data-expanded-file]').boundingBox())!.height).toBeGreaterThan(600);
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 70; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
  const reading = async () => ({
    top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
    left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
    folds: await page.locator('.fold-control').allTextContents(),
  });
  const original = await reading();
  await page.getByRole('button', { name: /Explain inferred change consequence/ }).focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('region', { name: 'Change consequence explanation' });
  await panel.getByRole('button', { name: 'Read After · src/server/public.ts L61–67', exact: true }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/server/public.ts');
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await expect(panel).toBeVisible();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/private-session.ts');
  await expect.poll(reading).toEqual(original);
  await expect(page.getByRole('button', { name: 'Split', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

});


test('narrow change consequence traps reverse Tab from its initial heading and cycles buttons', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const edge = page.getByRole('button', { name: /Explain inferred change consequence/ });
  await edge.click();
  const dialog = page.getByRole('dialog', { name: 'Change consequence explanation' });
  await expect(dialog.getByRole('heading', { name: 'Matching owner-request headers' })).toBeFocused();
  const last = dialog.locator('.callsite-action').last();
  const first = dialog.getByRole('button', { name: 'Close change consequence' });
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(edge).toBeFocused();
});
