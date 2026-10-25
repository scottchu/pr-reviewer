import { test, expect, type Page, type Locator } from '@playwright/test';
import { projectBehaviorCalls, projectCalls } from '../calls.ts';
test.use({ reducedMotion: 'reduce' });

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
  await expect(edge).toContainText('New call in this PR');
  await expect(edge).toBeInViewport();
  const labelBox = await edge.boundingBox();
  expect(labelBox!.x).toBeGreaterThanOrEqual(0);
  expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(width);
  await expect(edge).toHaveCSS('font-size', '17px');
  await expect(edge).toHaveAttribute('data-relationship-status', 'added');
  const source = page.locator('[data-file-path="src/application/review.ts"]');
  await expect(source).toContainText('~ review.ts');
  const initial = await source.boundingBox();
  await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r12-root-projection/opening-${width}.png` });
  await source.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', request.declaration.path);
  await expect(page.locator('.continuous-reader')).toBeInViewport();
  const root = page.locator('.react-flow__node[data-id="file:src/application/review.ts"]');
  await expect(root).toHaveCSS('width', width < 650 ? '324px' : '760px');
  const points = await page.locator(`.react-flow__edge-fileCall[data-id="${call.id}"] path.react-flow__edge-path`).evaluate(element => {
    const path = element as SVGPathElement; const matrix = path.getScreenCTM()!;
    const start = path.getPointAtLength(0).matrixTransform(matrix);
    const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
    return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y }, marker: path.getAttribute('marker-end') };
  });
  const caller = await root.boundingBox();
  const callee = await page.locator('.react-flow__node[data-id="file:src/application/local-access.ts"]').boundingBox();
  expect(Math.abs(points.start.x - caller!.x - caller!.width)).toBeLessThan(4);
  expect(Math.abs(points.end.x - callee!.x)).toBeLessThan(4);
  expect(points.marker).toBeTruthy();
  await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r12-root-projection/expanded-${width}.png` });
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
  const edge = page.getByRole('button', { name: 'Explain After call request → accessHeaders · src/application/review.ts:30–30 → src/application/local-access.ts:3–3', exact: true });
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
  await expect(page.getByRole('status').filter({ hasText: 'Calls unprepared for this source' })).toBeVisible();
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
  const edge = page.getByRole('button', { name: 'Explain After call request → accessHeaders · src/application/review.ts:30–30 → src/application/local-access.ts:3–3', exact: true });
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
  await expect(page.getByRole('status').filter({ hasText: 'Calls unprepared for this source' })).toBeVisible();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
});
