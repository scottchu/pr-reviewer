import { test, expect, type Page } from '@playwright/test';
import fixture from '../paths.json' with { type: 'json' };
test.use({
  reducedMotion: 'reduce'
});
const evidence = '/tmp/pr-reviewer-pr-file-tree-evidence';
const viewport = async (page: Page) => page.locator('.react-flow__viewport').first().evaluate(e => {
  const m = new DOMMatrix(getComputedStyle(e).transform);
  return {
    x: m.e,
    y: m.f,
    zoom: m.a
  };
});
test('whole PR tree contains exactly the pinned filenames, pans, gesture zooms and resets at readable scale', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.evaluate(() => document.fonts.ready);
  const paths = await page.locator('[data-file-path]').evaluateAll(es => es.map(e => e.getAttribute('data-file-path')!).sort());
  expect(paths).toEqual([
    ...fixture.paths
  ].sort());
  for (const label of await page.locator('[data-file-path]').all()) {
    const path = await label.getAttribute('data-file-path');
    const change = fixture.changes[path! as keyof typeof fixture.changes];
    await expect(label).toHaveText(`${change === 'added' ? '+ ' : change === 'modified' ? '~ ' : '− '}${path!.split('/').at(-1)!}`);
    await expect(label).toHaveAttribute('title', `${path} · ${change}`);
  }
  const sizes = await page.locator('.react-flow__node').evaluateAll(es => es.map(e => ({
    height: e.getBoundingClientRect().height,
    width: e.getBoundingClientRect().width
  })));
  expect(sizes.every(s => s.height >= 22 && s.height <= 26 && s.width < 300)).toBe(true);
  await expect(page.locator('header button')).toHaveCount(1);
  const initial = await viewport(page);
  expect(initial.zoom).toBe(1);
  await page.screenshot({
    path: `${evidence}/desktop.png`
  });
  await page.mouse.move(1100, 500);
  await page.mouse.down();
  await page.mouse.move(900, 420, {
    steps: 5
  });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await viewport(page)).x)).not.toBe(Math.round(initial.x));
  const panned = await viewport(page);
  await page.mouse.wheel(0, 100);
  await expect.poll(async () => Math.round((await viewport(page)).y)).not.toBe(Math.round(panned.y));
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -200);
  await page.keyboard.up('Control');
  await expect.poll(async () => (await viewport(page)).zoom).toBeGreaterThan(initial.zoom);
  await page.screenshot({
    path: `${evidence}/desktop-panned-zoomed.png`
  });
  await page.getByRole('button', {
    name: 'Overview'
  }).click();
  await expect.poll(async () => await viewport(page)).toEqual(initial);
  expect(errors).toEqual([]);
});
test.describe('touch-capable narrow viewport', () => {
  test.use({
    hasTouch: true
  });
  test('390px full-window tree has legible filenames, synthetic touch pinch and keyboard pan/zoom without page scroll', async ({ page, context }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await page.goto('/');
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await page.evaluate(() => document.fonts.ready);
    const initial = await viewport(page);
    expect(initial.zoom).toBe(1);
    await page.screenshot({
      path: `${evidence}/390.png`
    });
    expect(await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    }))).toEqual({
      width: 390,
      height: 844
    });
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 2
    });
    await session.send('Input.synthesizePinchGesture', {
      x: 200,
      y: 400,
      scaleFactor: 1.4,
      relativeSpeed: 800,
      gestureSourceType: 'touch'
    });
    await expect.poll(async () => (await viewport(page)).zoom).toBeGreaterThan(1);
    await page.getByRole('button', {
      name: 'Overview'
    }).click();
    await expect.poll(async () => (await viewport(page)).zoom).toBe(1);
    const overview = await viewport(page);
    const root = await page.locator('[data-id="directory:."]').boundingBox();
    expect(root!.x).toBeGreaterThanOrEqual(0);
    expect(root!.x + root!.width).toBeLessThan(390);
    await page.locator('main').focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await viewport(page)).x).toBe(overview.x - 80);
    await page.keyboard.press('+');
    await expect.poll(async () => (await viewport(page)).zoom).toBeGreaterThan(1);
    await page.screenshot({
      path: `${evidence}/390-panned-zoomed.png`
    });
    await page.keyboard.press('0');
    await expect.poll(async () => await viewport(page)).toEqual(overview);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
});
test('selecting review.ts overlays verified before/after imports and unchanged filename context while retaining all50 changed paths', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-file-path="src/application/review.ts"]').click();
  await expect(page.locator('.import-label')).toHaveCount(5);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await expect(page.locator('[data-context-path="src/domain/public.ts"]')).toHaveText('public.ts');
  await expect(page.locator('[data-context-path="src/application/public.ts"]')).toHaveText('public.ts');
  const added = page.locator('.import-label').filter({
    hasText: '+ imports'
  });
  await expect(added).toHaveCount(1);
  await expect(added).toHaveAttribute('title', new RegExp(`after ${fixture.head}`));
  await expect(added).toHaveAttribute('title', /src\/application\/review.ts:1/);
  await page.screenshot({
    path: `${evidence}/desktop-selected-imports.png`
  });
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.getByRole('button', {
    name: 'Overview'
  }).click();
  await page.screenshot({
    path: `${evidence}/390-overview.png`
  });
  await page.locator('main').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.import-label')).toHaveCount(0);
  await expect(page.locator('[data-context-path]')).toHaveCount(0);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
});
test('zoom reveals the same file object and native diff; source selection/scroll stays local and zoom out keeps the tree', async ({ page }) => {
  await page.goto('/');
  const file = page.locator('.react-flow__node-filename[data-id="file:scripts/dev.ts"]');
  const overview = await file.boundingBox();
  expect(overview!.height).toBe(26);
  await page.screenshot({
    path: `${evidence}/semantic-desktop-overview.png`
  });
  await page.mouse.move(overview!.x + overview!.width / 2, overview!.y + 13);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -28);
  await page.keyboard.up('Control');
  const diff = page.getByRole('region', {
    name: 'Pinned diff for scripts/dev.ts'
  });
  await expect(diff).toBeVisible();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(1);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await expect(diff.locator('.removed').first()).toContainText('node:fs');
  await expect(page.locator('[data-external-module="node:fs"]')).toHaveText('node:fs');
  const removed = page.locator('.import-label[title*="imports node:fs"]');
  await expect(removed).toHaveText('− imports');
  await expect(removed).toHaveAttribute('title', /External module identity only/);
  await page.screenshot({
    path: `${evidence}/semantic-desktop-diff.png`
  });
  const before = await viewport(page);
  const line = await diff.locator('.diff-side.before .diff-line.removed').first().boundingBox();
  await page.mouse.move(line!.x + 60, line!.y + 8);
  await page.mouse.down();
  await page.mouse.move(line!.x + 200, line!.y + 8, {
    steps: 5
  });
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection()?.toString().length ?? 0)).toBeGreaterThan(0);
  expect(await viewport(page)).toEqual(before);
  const bounds = await diff.boundingBox();
  await page.mouse.move(bounds!.x + 150, Math.min(bounds!.y + 180, 850));
  await page.mouse.wheel(0, 260);
  await expect.poll(async () => diff.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await viewport(page)).toEqual(before);
  await page.mouse.move(overview!.x + overview!.width / 2, overview!.y + 13);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 28);
  await page.keyboard.up('Control');
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await expect(page.locator('.react-flow__node-filename[data-id="file:scripts/dev.ts"]')).toHaveCount(1);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.screenshot({
    path: `${evidence}/semantic-desktop-collapsed-red-import.png`
  });
});
test('390 explicit file focus reveals actual before/after inside that node and Overview retains all identities', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
  const id = 'file:src/application/review.ts';
  await page.screenshot({
    path: `${evidence}/semantic-390-overview.png`
  });
  await page.locator('[data-file-path="src/application/review.ts"]').click();
  const diff = page.getByRole('region', {
    name: 'Pinned diff for src/application/review.ts'
  });
  await expect(diff).toBeVisible();
  await expect(page.locator(`[data-id="${id}"] [data-expanded-file]`)).toHaveCount(1);
  await expect(diff).toHaveClass(/unified/);
  await expect(diff.locator('.removed').first()).toBeVisible();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.screenshot({
    path: `${evidence}/semantic-390-diff.png`
  });
  const before = await viewport(page);
  const bounds = await diff.boundingBox();
  await page.mouse.move(bounds!.x + 150, bounds!.y + 200);
  await page.mouse.wheel(0, 260);
  await expect.poll(async () => diff.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await viewport(page)).toEqual(before);
  await page.getByRole('button', {
    name: 'Overview',
    exact: true
  }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await expect(page.locator(`[data-id="${id}"]`)).toHaveCount(1);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
for (const width of [
  1440, 390
])
  test(`${width} left change dots navigate actual paired hunks locally, keyboard works and mode retains active hunk`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    if (width === 390) {
      await page.getByRole('button', {
        name: 'Overview',
        exact: true
      }).click();
      await page.locator('main').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
    }
    const file = page.locator('[data-file-path="scripts/dev.ts"]');
    await file.click();
    const diff = page.getByRole('region', {
      name: 'Pinned diff for scripts/dev.ts'
    });
    await expect(diff).toBeVisible();
    const dots = page.locator('.change-rail button');
    await expect(dots).toHaveCount(4);
    await expect(dots.first()).toHaveClass(/removed/);
    const camera = await viewport(page);
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute('aria-current', 'location');
    await expect(diff.locator('[data-hunk="2"]')).toHaveClass(/active/);
    await expect.poll(() => diff.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
    expect(await viewport(page)).toEqual(camera);
    await dots.nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'location');
    expect(await viewport(page)).toEqual(camera);
    await page.getByRole('button', {
      name: width === 390 ? 'Split' : 'Unified',
      exact: true
    }).click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'location');
    expect(await viewport(page)).toEqual(camera);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await page.screenshot({
      path: `${evidence}/rail-${width}.png`
    });
  });
for (const width of [
  1440, 390
])
  test(`${width} fullscreen preserves same node, rail, reading mode and exact graph return`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    if (width === 390) {
      await page.locator('main').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
    }
    const path = width === 1440 ? 'scripts/dev.ts' : 'src/application/review.ts';
    await page.locator(`[data-file-path="${path}"]`).click();
    const camera = await viewport(page);
    const diff = page.getByRole('region', {
      name: `Pinned diff for ${path}`
    });
    await page.locator('.change-rail button').last().click();
    const scroll = await diff.evaluate(e => e.scrollTop);
    const mode = await diff.getAttribute('class');
    await page.getByRole('button', {
      name: `Fullscreen ${path}`,
      exact: true
    }).click();
    const file = page.locator(`.react-flow__node-filename[data-id="file:${path}"]`);
    const box = await file.boundingBox();
    expect(box!.x).toBeCloseTo(16);
    expect(box!.width).toBe(width - 32);
    await expect(page.locator('[data-file-path]')).toHaveCount(1);
    await expect(page.locator('.pr-graph > .react-flow__renderer > .react-flow__pane .react-flow__node-filename')).toHaveCount(1);
    await expect(page.locator('.change-rail button').last()).toHaveAttribute('aria-current', 'location');
    await expect(page.getByRole('group', {
      name: 'Diff presentation'
    })).toBeVisible();
    await page.screenshot({
      path: `${evidence}/fullscreen-${width}.png`
    });
    await diff.focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', {
      name: `Fullscreen ${path}`,
      exact: true
    })).toBeVisible();
    await expect.poll(() => viewport(page)).toEqual(camera);
    expect(await diff.getAttribute('class')).toBe(mode);
    expect(await diff.evaluate(e => e.scrollTop)).toBeCloseTo(scroll);
    await expect(page.locator('[data-expanded-file]')).toHaveCount(1);
  });
test('390 yellow replacement dot joins actual removed/added lines without explanation prose', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
  await page.getByRole('button', {
    name: 'Overview',
    exact: true
  }).click();
  await page.locator('main').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-file-path="scripts/dev.ts"]').click();
  const camera = await viewport(page);
  const dot = page.locator('.change-rail button.modified');
  await dot.click();
  await expect(dot).toHaveAttribute('aria-current', 'location');
  const hunk = page.locator('[data-hunk="3"]');
  await expect(hunk).toHaveClass(/active/);
  await expect(hunk.locator('.hunk-explanation')).toHaveCount(0);
  const comparison = page.locator('[data-id="comparison:scripts/dev.ts:3"]');
  await expect(comparison.locator('.removed')).toContainText('Local login credential reference:');
  await expect(comparison.locator('.added')).not.toContainText('Local login credential reference:');
  await expect(page.locator('.source-diff')).toHaveClass(/unified/);
  expect(await viewport(page)).toEqual(camera);
  await page.screenshot({
    path: `${evidence}/rail-unified-yellow-390.png`
  });
});
for (const width of [
  1440, 390
])
  test(`${width} import edge opens source-bounded explanation and close retains graph/hunk`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    await page.locator('[data-file-path="src/application/review.ts"]').click();
    const dot = page.locator('.change-rail button.modified').nth(1);
    await dot.click();
    const diff = page.locator('.source-diff');
    const scroll = await diff.evaluate(e => e.scrollTop);
    const edge = page.locator('.import-label').filter({
      hasText: '+ imports'
    });
    await page.locator('main').focus();
    for (let i = 0;i < 30;i++) {
      const b = await edge.boundingBox();
      if (b && b.x >= 10 && b.x + b.width < width - 10 && b.y > 55 && b.y < 700)
        break;
      await page.keyboard.press(b && b.x > width / 2 ? 'ArrowRight' : b && b.x < 0 ? 'ArrowLeft' : b && b.y > 700 ? 'ArrowDown' : 'ArrowUp');
    }
    const camera = await viewport(page);
    await edge.click();
    const reader = page.getByRole('region', {
      name: 'Import relationship explanation'
    });
    await expect(reader).toBeVisible();
    await expect(reader).toContainText('src/application/local-access.ts');
    await expect(reader).toContainText('Source fact:');
    await expect(reader).toContainText('Inference:');
    await expect(reader).toContainText('not live analysis');
    await expect(edge).toHaveClass(/active/);
    await reader.getByText('Exact pinned source citations').click();
    await expect(reader.locator('pre')).toContainText(fixture.head);
    expect(await viewport(page)).toEqual(camera);
    await page.screenshot({
      path: `${evidence}/edge-reader-${width}.png`
    });
    await page.getByRole('button', {
      name: 'Close relationship explanation'
    }).click();
    await expect(reader).toHaveCount(0);
    expect(await viewport(page)).toEqual(camera);
    expect(await diff.evaluate(e => e.scrollTop)).toEqual(scroll);
    await expect(dot).toHaveAttribute('aria-current', 'location');
  });
test.describe('explicit motion', () => {
  test.use({
    reducedMotion: 'no-preference'
  });
  test('expansion and latest-dot scroll expose intermediate states then settle without camera drift', async ({ page }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await page.goto('/');
    const node = page.locator('.react-flow__node-filename[data-id="file:src/application/review.ts"]');
    const geometryPromise = node.evaluate(async (element) => {
      const values: number[] = [];
      await new Promise<void>(resolve => {
        const start = performance.now();
        const frame = () => {
          values.push(element.getBoundingClientRect().height);
          if (performance.now() - start < 650)
            requestAnimationFrame(frame);
          else
            resolve();
        };
        requestAnimationFrame(frame);
      });
      return values;
    });
    await page.locator('[data-file-path="src/application/review.ts"]').click();
    const geometry = await geometryPromise;
    expect(geometry.some(h => h > 26 && h < 580)).toBe(true);
    console.log('MOTION_GEOMETRY_SAMPLES', JSON.stringify(geometry));
    await expect(node).toHaveCSS('height', '580px');
    const camera = await viewport(page);
    const samples = await page.locator('.change-rail button').last().evaluate(async (button) => {
      const body = document.querySelector('.source-diff')!;
      const samples: number[] = [];
      (button as HTMLButtonElement).click();
      await new Promise<void>(resolve => {
        const start = performance.now();
        const frame = () => {
          samples.push(body.scrollTop);
          if (performance.now() - start < 750)
            requestAnimationFrame(frame);
          else
            resolve();
        };
        requestAnimationFrame(frame);
      });
      return samples;
    });
    expect(new Set(samples.map(Math.round)).size).toBeGreaterThan(3);
    expect(samples.at(-1)).toBeGreaterThan(0);
    const dots = page.locator('.change-rail button');
    await dots.first().click();
    await dots.nth(2).click();
    await expect(dots.nth(2)).toHaveAttribute('aria-current', 'location');
    await expect.poll(() => page.locator('.source-diff').evaluate(e => Math.round(e.scrollTop))).toBe(await page.locator('.source-diff').evaluate(e => Math.round(Math.min((e.querySelector('[data-hunk="2"]') as HTMLElement).getBoundingClientRect().top - e.getBoundingClientRect().top + e.scrollTop - 8, e.scrollHeight - e.clientHeight))));
    expect(await viewport(page)).toEqual(camera);
    await page.evaluate(samples => {
      (window as unknown as {
        motionSamples: number[];
      }).motionSamples = samples;
    }, samples);
    await page.screenshot({
      path: `${evidence}/motion-settled-390.png`
    });
    console.log('MOTION_SCROLL_SAMPLES', JSON.stringify(samples));
  });
});
for (const width of [
  1440, 390
])
  test(`${width} file is a nested graph; fullscreen changes workspace root and exit restores PR`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    if (width === 390) {
      await page.locator('main').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
    }
    const camera = await viewport(page);
    await page.locator('[data-file-path="src/application/review.ts"]').click();
    expect(await viewport(page)).toEqual(camera);
    const inner = page.locator('.nested-source-graph');
    await expect(inner.locator('[data-id="hunk:src/application/review.ts:2"]')).toHaveCount(1);
    await expect(inner.locator('[data-id="source:src/application/review.ts:2:before"]')).toHaveCount(1);
    await expect(inner.locator('[data-id="source:src/application/review.ts:2:after"]')).toHaveCount(1);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await page.locator('.change-rail button').nth(2).click();
    const edge = inner.locator('[data-id="compares:source:src/application/review.ts:2:before"]');
    if (width === 1440) {
      const point = await edge.locator('.react-flow__edge-interaction').evaluate(e => {
        const path = e as SVGGeometryElement;
        const p = path.getPointAtLength(path.getTotalLength() / 2);
        const point = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!);
        return {
          x: point.x,
          y: point.y
        };
      });
      await page.mouse.click(point.x, point.y);
    }
    else {
      await edge.focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.getByRole('region', {
      name: 'Source comparison explanation'
    })).toContainText('accessHeaders(captured)');
    await page.screenshot({
      path: `${evidence}/nested-edge-${width}.png`
    });
    await page.getByRole('button', {
      name: 'Close relationship explanation'
    }).click();
    await page.screenshot({
      path: `${evidence}/nested-pr-${width}.png`
    });
    await page.getByRole('button', {
      name: 'Fullscreen src/application/review.ts',
      exact: true
    }).click();
    await expect(page.locator('main')).toHaveAttribute('data-workspace-root', 'file:src/application/review.ts');
    await expect(page.locator('[data-file-path]')).toHaveCount(1);
    await expect(page.locator('[data-context-path],[data-external-module]')).toHaveCount(0);
    await expect(page.locator('.pr-graph > .react-flow__renderer > .react-flow__pane > .react-flow__viewport > .react-flow__nodes > .react-flow__node')).toHaveCount(1);
    await expect(inner.locator('[data-id="hunk:src/application/review.ts:2"]')).toHaveCount(1);
    await page.screenshot({
      path: `${evidence}/nested-workspace-${width}.png`
    });
    await page.getByRole('button', {
      name: 'Exit fullscreen src/application/review.ts',
      exact: true
    }).click();
    await expect(page.locator('main')).toHaveAttribute('data-workspace-root', 'pr:25');
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await expect.poll(() => viewport(page)).toEqual(camera);
    await expect(page.locator('.change-rail button').nth(2)).toHaveAttribute('aria-current', 'location');
  });
test('nested source stays within hunk bounds at outer zoom1 and gesture scale near1.4', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-file-path="src/application/review.ts"]').click();
  const containment = () => page.locator('.nested-source-graph').evaluate(root => [
    ...root.querySelectorAll<HTMLElement>('[data-hunk]')
  ].map(group => {
    const box = group.getBoundingClientRect();
    const comparison = root.querySelector<HTMLElement>(`[data-id="comparison:src/application/review.ts:${group.dataset.hunk}"] pre`)!.getBoundingClientRect();
    return {
      groupBottom: box.bottom,
      sourceBottom: comparison.bottom
    };
  }));
  await expect.poll(async () => (await containment()).every(b => b.sourceBottom <= b.groupBottom + 1)).toBe(true);
  const heights = await page.locator('.inner-comparison pre').evaluateAll(es => es.map(e => (e as HTMLElement).offsetHeight));
  await page.mouse.move(1300, 900);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -24);
  await page.keyboard.up('Control');
  await expect.poll(async () => (await viewport(page)).zoom).toBeGreaterThan(1.3);
  await expect.poll(async () => (await containment()).every(b => b.sourceBottom <= b.groupBottom + 1)).toBe(true);
  expect(await page.locator('.inner-comparison pre').evaluateAll(es => es.map(e => (e as HTMLElement).offsetHeight))).toEqual(heights);
  console.log('CONTAINMENT_OUTER_ZOOM', JSON.stringify(await viewport(page)));
});
for (const width of [
  1440, 390
])
  test(`${width} different-file fullscreen restores A hunk, vertical/horizontal reading and mode after B changes`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    if (width === 390) {
      await page.locator('main').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
    }
    await page.locator('[data-file-path="src/application/review.ts"]').click();
    await page.locator('.change-rail button').nth(2).click();
    const body = page.locator('.source-diff');
    const initialTop = await body.evaluate(e => e.scrollTop);
    await body.hover();
    await page.mouse.wheel(0, 35);
    await expect.poll(() => body.evaluate(e => e.scrollTop)).toBeGreaterThan(initialTop);
    const comparison = page.locator('[data-id="comparison:src/application/review.ts:2"] .inner-comparison');
    if (width === 390) {
      const initialLeft = await comparison.evaluate(e => e.scrollLeft);
      await comparison.hover();
      await page.mouse.wheel(70, 0);
      await expect.poll(() => comparison.evaluate(e => e.scrollLeft)).toBeGreaterThan(initialLeft);
    }
    const snapshot = {
      camera: await viewport(page),
      top: await body.evaluate(e => e.scrollTop),
      left: await comparison.evaluate(e => e.scrollLeft),
      mode: await page.getByRole('button', {
        name: 'Unified',
        exact: true
      }).getAttribute('aria-pressed'),
      active: await page.locator('.change-rail [aria-current]').getAttribute('aria-label')
    };
    if (width === 390)
      expect(snapshot.left).toBeGreaterThan(0);
    await page.getByRole('button', {
      name: 'Fullscreen src/application/local-access.ts',
      exact: true
    }).click();
    await expect(page.locator('[data-file-path]')).toHaveCount(1);
    await page.getByRole('button', {
      name: snapshot.mode === 'true' ? 'Split' : 'Unified',
      exact: true
    }).click();
    await page.getByRole('button', {
      name: 'Exit fullscreen src/application/local-access.ts',
      exact: true
    }).click();
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await expect(page.locator('[data-expanded-file="src/application/review.ts"]')).toHaveCount(1);
    await expect.poll(() => viewport(page)).toEqual(snapshot.camera);
    await expect(page.locator('.change-rail [aria-current]')).toHaveAttribute('aria-label', snapshot.active!);
    await expect(page.getByRole('button', {
      name: 'Unified',
      exact: true
    })).toHaveAttribute('aria-pressed', snapshot.mode!);
    await expect.poll(() => body.evaluate(e => e.scrollTop)).toBeCloseTo(snapshot.top, 0);
    await expect.poll(() => comparison.evaluate(e => e.scrollLeft)).toBeCloseTo(snapshot.left, 0);
    await page.screenshot({
      path: `${evidence}/cross-file-return-${width}.png`
    });
  });
test('390 unified imports Change2 shows separate old/new coordinates and exact omitted context', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
  await page.getByRole('button', {
    name: 'Overview',
    exact: true
  }).click();
  await page.locator('main').focus();
  for (let i = 0;i < 4;i++)
    await page.keyboard.press('ArrowRight');
  for (let i = 0;i < 18;i++) {
    const b = await page.locator('[data-file-path="src/storage/imports.ts"]').boundingBox();
    if (b && b.y > 60 && b.y < 650)
      break;
    await page.keyboard.press(b && b.y > 650 ? 'ArrowDown' : 'ArrowUp');
  }
  await page.getByRole('button', {
    name: 'Fullscreen src/storage/imports.ts',
    exact: true
  }).click();
  await page.locator('.change-rail button').nth(1).click();
  const comparison = page.locator('[data-id="comparison:src/storage/imports.ts:1"]');
  const gutters = comparison.locator('.unified-gutter');
  await expect(gutters).toHaveCount(8);
  expect(await gutters.evaluateAll(es => es.map(e => [
    e.querySelector('.before-number')!.textContent, e.querySelector('.after-number')!.textContent, e.querySelector('.change-glyph')!.textContent
  ]))).toEqual([
    [
      '24', '26', ' '
    ], [
      '25', '27', ' '
    ], [
      '26', '28', ' '
    ], [
      '27', '', '−'
    ], [
      '', '29', '+'
    ], [
      '28', '30', ' '
    ], [
      '29', '31', ' '
    ], [
      '30', '32', ' '
    ]
  ]);
  const gap = page.locator('[data-id="gap:src/storage/imports.ts:2"]');
  await expect(gap).toContainText('1 unchanged line omitted');
  await expect(gap.locator('.hunk-gap')).toHaveAttribute('title', /Before L31–31.*After L33–33/);
  const first = gutters.first();
  const initial = await first.boundingBox();
  const source = comparison.locator('.inner-comparison');
  const initialLeft = await source.evaluate(e => e.scrollLeft);
  await source.hover();
  await page.mouse.wheel(80, 0);
  await expect.poll(() => source.evaluate(e => e.scrollLeft)).toBeGreaterThan(initialLeft);
  expect((await first.boundingBox())!.x).toBeCloseTo(initial!.x, 0);
  await page.screenshot({
    path: `${evidence}/unified-coordinates-imports-390.png`
  });
});
