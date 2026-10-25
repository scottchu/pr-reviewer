import { mkdirSync, existsSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
const evidence = process.env.REVIEW_FUNCTIONAL_EVIDENCE_DIR ?? `/tmp/pr-reviewer-reading-journey-evidence/functional-${Date.now()}`;
if (existsSync(`${evidence}/candidate-manifest.json`)) throw new Error('refuse_to_overwrite_frozen_functional_evidence');
mkdirSync(evidence, { recursive: true });
test.use({ reducedMotion: 'reduce' });
const openFile = async (page: Page, path: string) => {
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source' }).selectOption(path);
  await page.locator(`[data-file-path="${path}"]`).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', path);
};

test('desktop global controls start bottom center and drag without moving the graph', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const bar = page.getByRole('navigation', { name: 'Workspace actions' });
  const box = await bar.boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(2);
  expect(box!.y).toBeGreaterThan(900);
  await expect(page.locator('header button')).toHaveCount(0);
  await expect(page.locator('.file-call-legend')).toHaveCount(0);
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  const grip = await page.getByRole('button', { name: 'Move workspace controls', exact: true }).boundingBox();
  await page.mouse.move(grip!.x + 10, grip!.y + 10);
  await page.mouse.down();
  await page.mouse.move(grip!.x + 130, grip!.y - 90, { steps: 4 });
  await page.mouse.up();
  expect((await bar.boundingBox())!.y).toBeLessThan(box!.y - 70);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  await page.screenshot({ path: `${evidence}/desktop-controls.png` });
});

for (const width of [1440, 390]) test(`${width} added Split shows actual After code and colored syntax; controls stay separate`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/');
  await openFile(page, 'src/storage/access.ts');
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(page.locator('.split-column-heading')).toContainText('Before · file absent');
  const reader = await page.locator('.continuous-comparison').boundingBox();
  const after = page.locator('.diff-side.after .diff-line[data-after-line="1"] .syntax-keyword').first();
  const code = await after.boundingBox();
  expect(code!.x).toBeGreaterThanOrEqual(reader!.x);
  expect(code!.x + code!.width).toBeLessThan(reader!.x + reader!.width);
  await expect(after).toHaveText('import');
  expect(await after.evaluate(element => getComputedStyle(element).color)).not.toBe(await page.locator('.diff-side.after .diff-line[data-after-line="1"]').evaluate(element => getComputedStyle(element).color));
  const global = await page.getByRole('navigation', { name: 'Workspace actions' }).boundingBox();
  const modes = await page.getByRole('group', { name: 'Diff presentation' }).boundingBox();
  const overlap = Math.min(global!.x + global!.width, modes!.x + modes!.width) > Math.max(global!.x, modes!.x)
    && Math.min(global!.y + global!.height, modes!.y + modes!.height) > Math.max(global!.y, modes!.y);
  expect(overlap).toBe(false);
  if (width < 650) expect(global!.y + global!.height).toBeCloseTo(1000, 0);
  await page.screenshot({ path: `${evidence}/added-split-${width}.png` });
  await page.getByRole('button', { name: 'Unified', exact: true }).click();
  await expect(page.locator('.unified-row .syntax-string').first()).toBeVisible();
  await expect(page.locator('.continuous-reader .diff-line.added')).toHaveCount(14);
  await page.screenshot({ path: `${evidence}/added-unified-${width}.png` });
});

test('expanded footprint reflows same-row file neighbors and uses content height without zooming', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await openFile(page, 'scripts/pair.ts');
  const selected = page.locator('.react-flow__node[data-id="file:scripts/pair.ts"]');
  await expect.poll(async () => (await selected.boundingBox())!.x).toBeCloseTo((await page.locator('.pr-graph').boundingBox())!.x + 12, 0);
  const box = await selected.boundingBox();
  const others = await page.locator('.react-flow__node-filename').evaluateAll(elements => elements.filter(element => element.getAttribute('data-id') !== 'file:scripts/pair.ts').map(element => {
    const b = element.getBoundingClientRect(); return { id: element.getAttribute('data-id'), x: b.x, y: b.y, width: b.width, height: b.height };
  }));
  for (const other of others) {
    const overlap = Math.min(box!.x + box!.width, other.x + other.width) > Math.max(box!.x, other.x) + 1
      && Math.min(box!.y + box!.height, other.y + other.height) > Math.max(box!.y, other.y) + 1;
    expect(overlap, String(other.id)).toBe(false);
  }
  await page.screenshot({ path: `${evidence}/pair-reflow.png` });
  await openFile(page, 'src/application/private-session.ts');
  const short = page.locator('.react-flow__node[data-id="file:src/application/private-session.ts"]');
  await expect.poll(async () => (await short.boundingBox())!.height).toBeLessThan(640);
  expect((await short.boundingBox())!.height).toBeGreaterThanOrEqual(180);
  await page.screenshot({ path: `${evidence}/content-height.png` });
});

test('modified Split keeps both visible columns while shared horizontal reading and folds change height', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await openFile(page, 'src/application/private-session.ts');
  for (const side of ['before', 'after']) {
    const token = page.locator(`.diff-side.${side} .syntax-keyword`).first();
    const box = await token.boundingBox();
    const pane = await page.locator('.continuous-comparison').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(pane!.x);
    expect(box!.x).toBeLessThan(pane!.x + pane!.width);
  }
  const node = page.locator('.react-flow__node[data-id="file:src/application/private-session.ts"]');
  const short = (await node.boundingBox())!.height;
  await page.locator('.fold-control').first().click();
  await expect.poll(async () => (await node.boundingBox())!.height).toBeGreaterThan(short + 40);
  expect((await node.boundingBox())!.height).toBeLessThanOrEqual(640);
  await page.locator('.fold-control').first().click();
  await expect.poll(async () => (await node.boundingBox())!.height).toBeCloseTo(short, 0);
  const beforeX = (await page.locator('.diff-side.after').first().boundingBox())!.x;
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 100; });
  await expect.poll(async () => (await page.locator('.diff-side.after').first().boundingBox())!.x).toBeCloseTo(beforeX, 0);
  await page.getByRole('button', { name: 'Unified', exact: true }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(page.locator('.continuous-comparison')).toBeVisible();
  await page.screenshot({ path: `${evidence}/modified-fold-split.png` });
});

for (const files of [false, true]) test(`${files ? 'File tree' : 'Behavior'} collapse restores node positions and preserves the framed camera`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(files ? '/?view=files' : '/');
  const positions = async () => page.locator('.react-flow__node-filename').evaluateAll(elements => elements.map(element => ({ id: element.getAttribute('data-id'), transform: (element as HTMLElement).style.transform })).sort((a, b) => String(a.id).localeCompare(String(b.id))));
  const original = await positions();
  await openFile(page, 'src/storage/public.ts');
  await expect.poll(async () => (await page.locator('.react-flow__node[data-id="file:src/storage/public.ts"]').boundingBox())!.x).toBeCloseTo((await page.locator('.pr-graph').boundingBox())!.x + 12, 0);
  const frame = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.locator('[data-file-path="src/storage/public.ts"]').click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await expect.poll(positions).toEqual(original);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', frame!);
});
