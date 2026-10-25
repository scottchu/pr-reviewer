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


test.describe('review regressions with normal expansion motion', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('Split columns follow the animated viewport and expose readable source on both sides', async ({ page }) => {
    await page.goto('/');
    for (const path of ['src/storage/access.ts', 'scripts/pair.ts', 'src/application/private-session.ts']) {
      await openFile(page, path);
      await page.getByRole('button', { name: 'Split', exact: true }).click();
      const pane = page.locator('.continuous-comparison');
      const after = page.locator('.diff-side.after').first();
      await expect.poll(async () => {
        const a = await after.boundingBox(); const p = await pane.boundingBox();
        return a!.width / p!.width;
      }).toBeGreaterThan(0.45);
      const geometry = await page.locator('.diff-side.after .source-code').first().evaluate(element => {
        const code = element.getBoundingClientRect();
        const cell = element.closest('.diff-side')!.getBoundingClientRect();
        return { available: cell.right - code.left, width: code.width, prefix: element.textContent };
      });
      expect(geometry.available).toBeGreaterThan(200);
      expect(geometry.prefix!.length).toBeGreaterThan(10);
      await page.screenshot({ path: `${evidence}/motion-split-${path.split('/').at(-1)}.png` });
    }
  });
  test('desktop control offset is clamped after shrinking the viewport', async ({ page }) => {
    await page.goto('/');
    const grip = page.getByRole('button', { name: 'Move workspace controls', exact: true });
    await grip.focus();
    for (let n = 0; n < 24; n++) await page.keyboard.press('ArrowRight');
    const camera = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.setViewportSize({ width: 700, height: 800 });
    const bar = page.getByRole('navigation', { name: 'Workspace actions' });
    await expect.poll(async () => (await bar.boundingBox())!.x).toBeGreaterThanOrEqual(7);
    await expect.poll(async () => { const b = (await bar.boundingBox())!; return b.x + b.width; }).toBeLessThanOrEqual(693);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  });
  test('new Context navigation cancels the older file framing and exact Back survives its timer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Close review context' }).click();
    await openFile(page, 'src/storage/access.ts');
    await page.getByRole('button', { name: 'Open review context' }).click();
    const original = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.getByRole('button', { name: 'Read the captured runtime requirement' }).click();
    await page.getByRole('button', { name: 'Back to source context' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
  });
  test('After evidence reveals its source prefix and Return restores the original horizontal offset', async ({ page }) => {
    await page.goto('/');
    await openFile(page, 'src/application/private-session.ts');
    await expect.poll(async () => (await page.locator('.diff-side.after').first().boundingBox())!.width).toBeGreaterThan(250);
    await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
    const original = await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft);
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33' }).first().click();
    await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBe(0);
    const code = page.locator('.diff-side.after [data-after-line="30"] .source-code');
    await expect.poll(async () => code.evaluate(element => { const b = element.getBoundingClientRect(); return element.closest('.diff-side')!.getBoundingClientRect().right - b.left; })).toBeGreaterThan(200);
    const bounds = await code.evaluate(element => {
      const b = element.getBoundingClientRect(); const cell = element.closest('.diff-side')!.getBoundingClientRect();
      return { left: b.left, cell: cell.left, available: cell.right - b.left };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(bounds.cell);
    expect(bounds.available).toBeGreaterThan(200);
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/private-session.ts');
    await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBe(original);
  });
  test('resizing an expanded source retains its screen anchor and Context has no background controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Close review context' }).click();
    await openFile(page, 'src/application/private-session.ts');
    const node = page.locator('.react-flow__node[data-id="file:src/application/private-session.ts"]');
    await expect.poll(async () => (await node.boundingBox())!.x).toBeCloseTo(12, 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await node.boundingBox())!.x).toBeCloseTo(12, 0);
    await page.getByRole('button', { name: 'Open review context' }).click();
    await expect(page.getByRole('group', { name: 'Diff presentation' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Workspace actions' })).toBeHidden();
    await page.screenshot({ path: `${evidence}/mobile-context-controls.png` });
    await page.getByRole('button', { name: 'Close review context' }).click();
    await expect(node).toBeVisible();
    await page.screenshot({ path: `${evidence}/mobile-expanded-resize.png` });
  });

  test('manual graph navigation cancels a pending file alignment', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Close review context' }).click();
    await openFile(page, 'src/storage/access.ts');
    await page.locator('main').focus();
    await page.keyboard.press('ArrowRight');
    const camera = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.waitForTimeout(500);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  });

});
