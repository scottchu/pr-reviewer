import { test, expect, type Page } from '@playwright/test';
const evidence = '/tmp/pr-reviewer-reading-journey-evidence';
const closeOpeningContext = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 0) >= 650) {
    await page.getByRole('button', { name: 'Close review context' }).click();
  }
};
test.use({
  reducedMotion: 'reduce'
});
const camera = (page: Page) => page.locator('.pr-graph .react-flow__viewport').first().getAttribute('style');
const find = (page: Page, path: string) => page.locator(`[data-file-path="${path}"]`);
const expose = async (page: Page, path: string) => {
  await page.getByRole('button', {
    name: 'Overview',
    exact: true
  }).click();
  await page.locator('main').focus();
  for (let i = 0;i < 70;i++) {
    const b = await find(page, path).boundingBox();
    if (b && b.x >= 5 && b.x < 60 && b.y >= 55 && b.y < 160)
      return;
    await page.keyboard.press(b && b.x >= 60 ? 'ArrowRight' : b && b.x < 5 ? 'ArrowLeft' : b && b.y >= 160 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error('file_not_exposed');
};
test('390 continuous diff, exact two-sided coordinates, inline context and edge-to-edge workspace', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
    await closeOpeningContext(page);
  await expose(page, 'src/storage/imports.ts');
  await find(page, 'src/storage/imports.ts').click();
  const before = await camera(page);
  await page.getByRole('button', {
    name: 'Fullscreen src/storage/imports.ts',
    exact: true
  }).click();
  await expect(page.locator('.continuous-reader')).toBeVisible();
  await expect(page.locator('[data-file-path]')).toHaveCount(0);
  await expect(page.locator('.inner-group')).toHaveCount(0);
  expect((await page.locator('.file-workspace-file').boundingBox())!.x).toBe(0);
  expect((await page.locator('.file-workspace-file').boundingBox())!.width).toBe(390);
  await page.locator('.change-rail button').nth(1).click();
  const h = page.locator('[data-hunk="1"]');
  const gutters = h.locator('.unified-gutter');
  expect(await gutters.evaluateAll(es => es.map(e => [
    e.querySelector('.before-number')!.textContent, e.querySelector('.after-number')!.textContent
  ]))).toEqual([
    [
      '24', '26'
    ], [
      '25', '27'
    ], [
      '26', '28'
    ], [
      '27', ''
    ], [
      '', '29'
    ], [
      '28', '30'
    ], [
      '29', '31'
    ], [
      '30', '32'
    ]
  ]);
  const fold = page.getByRole('button', {
    name: /1 unchanged line · Before L31/
  });
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await fold.click();
  await expect(fold).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('img', {
    name: 'Before 31; After 33; context',
    exact: true
  })).toHaveCount(1);
  await page.screenshot({
    path: `evidence/continuous-imports-390.png`.replace('evidence', evidence)
  });
  await page.getByRole('button', {
    name: 'Back to PR',
    exact: true
  }).click();
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  expect(await camera(page)).toEqual(before);
});
test('390 storage public manual wheel bottom selects its actual third hunk', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
    await closeOpeningContext(page);
  await expose(page, 'src/storage/public.ts');
  await find(page, 'src/storage/public.ts').click();
  const body = page.locator('.continuous-reader');
  const dots = page.locator('.change-rail button');
  await expect(dots).toHaveCount(3);
  await dots.first().click();
  await body.hover();
  await page.mouse.wheel(0, 20000);
  await expect(dots.last()).toHaveAttribute('aria-current', 'location');
  const topBeforeExplain = await body.evaluate(e => e.scrollTop);
  const explainBox = await page.getByRole('button', {
    name: 'Explain current source comparison'
  }).boundingBox();
  await page.mouse.click(explainBox!.x + explainBox!.width / 2, explainBox!.y + explainBox!.height / 2);
  console.log('READER_STATE', JSON.stringify(await body.evaluate(e => ({
    top: e.scrollTop,
    height: e.clientHeight,
    extent: e.scrollHeight,
    active: document.querySelector('.change-rail [aria-current]')?.getAttribute('aria-label'),
    ranges: [
      ...e.querySelectorAll<HTMLElement>('[data-hunk]')
    ].map(a => ({
      i: a.dataset.hunk,
      top: a.offsetTop
    }))
  }))));
  await expect(dots.last()).toHaveAttribute('aria-current', 'location');
  expect(await body.evaluate(e => e.scrollTop)).toBe(topBeforeExplain);
  await expect(page.getByRole('region', {
    name: 'Source comparison explanation'
  })).toBeVisible();
  await page.screenshot({
    path: `${evidence}/continuous-public-reader-390.png`
  });
  await page.getByRole('button', {
    name: 'Close relationship explanation'
  }).click();
  await page.screenshot({
    path: `${evidence}/continuous-public-bottom-390.png`
  });
});
test('all-added file begins at leading source text in full workspace', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
    await closeOpeningContext(page);
  await expose(page, 'src/storage/access.ts');
  await page.getByRole('button', {
    name: 'Fullscreen src/storage/access.ts',
    exact: true
  }).click();
  await expect(page.locator('.continuous-comparison')).toHaveJSProperty('scrollLeft', 0);
  await expect(page.locator('.diff-line.added').first()).toHaveAttribute('data-source-text', "import {createHash} from 'node:crypto';");
  await page.screenshot({
    path: `${evidence}/continuous-added-390.png`
  });
});
for (const width of [
  1440, 390
])
  test(`${width} expanded context and exact reading survive A to B fullscreen return and mode changes`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    await closeOpeningContext(page);
    if (width === 390)
      await expose(page, 'src/storage/imports.ts');
    else
      await find(page, 'src/storage/imports.ts').focus().catch(() => {
      });
    if (width === 1440) {
      await page.locator('main').focus();
      for (let i = 0;i < 50;i++) {
        const b = await find(page, 'src/storage/imports.ts').boundingBox();
        if (b && b.y > 60 && b.y < 160)
          break;
        await page.keyboard.press(b && b.y >= 160 ? 'ArrowDown' : 'ArrowUp');
      }
    }
    await find(page, 'src/storage/imports.ts').click();
    await page.locator('.change-rail button').nth(1).click();
    const fold = page.getByRole('button', {
      name: /1 unchanged line · Before L31/
    });
    await fold.click();
    await expect(fold).toHaveAttribute('aria-expanded', 'true');
    const body = page.locator('.continuous-reader');
    const source = page.locator('.continuous-comparison');
    await body.hover();
    const top0 = await body.evaluate(e => e.scrollTop);
    await page.mouse.wheel(0, 30);
    await expect.poll(() => body.evaluate(e => e.scrollTop)).toBeGreaterThan(top0);
    const left0 = await source.evaluate(e => e.scrollLeft);
    const canScroll = await source.evaluate(e => e.scrollWidth > e.clientWidth);
    await source.hover();
    await page.mouse.wheel(60, 0);
    if (canScroll)
      await expect.poll(() => source.evaluate(e => e.scrollLeft)).toBeGreaterThan(left0);
    const saved = {
      top: await body.evaluate(e => e.scrollTop),
      left: await source.evaluate(e => e.scrollLeft),
      active: await page.locator('.change-rail [aria-current]').getAttribute('aria-label'),
      mode: await page.getByRole('button', {
        name: 'Unified',
        exact: true
      }).getAttribute('aria-pressed'),
      camera: await camera(page)
    };
    await page.getByRole('button', {
      name: 'Fullscreen src/storage/access.ts',
      exact: true
    }).click();
    await page.getByRole('button', {
      name: saved.mode === 'true' ? 'Split' : 'Unified',
      exact: true
    }).click();
    await page.getByRole('button', {
      name: 'Back to PR',
      exact: true
    }).click();
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await expect(fold).toHaveAttribute('aria-expanded', 'true');
    expect(await camera(page)).toEqual(saved.camera);
    await expect(page.getByRole('button', {
      name: 'Unified',
      exact: true
    })).toHaveAttribute('aria-pressed', saved.mode!);
    await expect(page.locator('.change-rail [aria-current]')).toHaveAttribute('aria-label', saved.active!);
    await expect.poll(() => body.evaluate(e => e.scrollTop)).toBeCloseTo(saved.top, 0);
    await expect.poll(() => source.evaluate(e => e.scrollLeft)).toBeCloseTo(saved.left, 0);
    await page.screenshot({
      path: `${evidence}/continuous-return-${width}.png`
    });
  });
test.describe('native touch and smooth travel', () => {
  test.use({
    hasTouch: true,
    reducedMotion: 'no-preference'
  });
  test('dot travel has intermediate movement and real touch bottom releases target ownership', async ({ page, context }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await page.goto('/');
    await closeOpeningContext(page);
    await expose(page, 'src/storage/public.ts');
    await page.getByRole('button', {
      name: 'Fullscreen src/storage/public.ts',
      exact: true
    }).click();
    const dots = page.locator('.change-rail button');
    const body = page.locator('.continuous-reader');
    const samples = await dots.last().evaluate(async (button) => {
      const body = document.querySelector('.continuous-reader')!;
      const values: number[] = [];
      (button as HTMLButtonElement).click();
      await new Promise<void>(resolve => {
        const start = performance.now();
        const frame = () => {
          values.push(body.scrollTop);
          if (performance.now() - start < 650)
            requestAnimationFrame(frame);
          else
            resolve();
        };
        requestAnimationFrame(frame);
      });
      return values;
    });
    expect(new Set(samples.map(Math.round)).size).toBeGreaterThan(3);
    await dots.first().click();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', {
      x: 230,
      y: 350,
      yDistance: -20000,
      speed: 18000,
      gestureSourceType: 'touch'
    });
    await expect(dots.last()).toHaveAttribute('aria-current', 'location');
    await expect.poll(() => body.evaluate(e => Math.round(e.scrollTop + e.clientHeight - e.scrollHeight))).toBeGreaterThanOrEqual(-2);
    console.log('CONTINUOUS_MOTION_SCROLL_SAMPLES', JSON.stringify(samples));
    await page.screenshot({
      path: `${evidence}/continuous-touch-bottom-390.png`
    });
  });
});
test('desktop native source selection and shared horizontal scroll stay inside the continuous file', async ({ page }) => {
  await page.goto('/');
    await closeOpeningContext(page);
  await page.getByRole('button', {
    name: 'Fullscreen scripts/dev.ts',
    exact: true
  }).click();
  await page.locator('.change-rail button').last().click();
  const source = page.locator('.continuous-comparison');
  const camera0 = await camera(page);
  const line = page.locator('.diff-side.before .diff-line.removed').last();
  const b = await line.boundingBox();
  await page.mouse.move(b!.x + 70, b!.y + 9);
  await page.mouse.down();
  await page.mouse.move(b!.x + 210, b!.y + 9, {
    steps: 5
  });
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection()?.toString().length ?? 0)).toBeGreaterThan(0);
  expect(await camera(page)).toEqual(camera0);
  await page.screenshot({
    path: `${evidence}/continuous-desktop-split.png`
  });
  await page.getByRole('button', {
    name: 'Unified',
    exact: true
  }).click();
  await expect(source.locator('.unified-gutter')).not.toHaveCount(0);
  await page.screenshot({
    path: `${evidence}/continuous-desktop-diff.png`
  });
});
test('fresh analysis source starts at zero with matched code and gutter geometry', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await page.goto('/');
    await closeOpeningContext(page);
  await expose(page, 'src/application/analysis.ts');
  await page.getByRole('button', {
    name: 'Fullscreen src/application/analysis.ts',
    exact: true
  }).click();
  await expect(page.locator('.continuous-comparison')).toHaveJSProperty('scrollLeft', 0);
  const geometry = await page.locator('.diff-line').first().evaluate(line => {
    const code = getComputedStyle(line);
    const gutter = getComputedStyle(line.querySelector('.unified-gutter')!);
    return {
      code: code.fontSize,
      codeHeight: code.lineHeight,
      gutter: gutter.fontSize,
      gutterHeight: gutter.lineHeight,
      rowHeight: line.getBoundingClientRect().height,
      textAdjust: getComputedStyle(document.documentElement).webkitTextSizeAdjust
    };
  });
  expect(geometry).toEqual({
    code: '12px',
    codeHeight: '22px',
    gutter: '10px',
    gutterHeight: '22px',
    rowHeight: 22,
    textAdjust: '100%'
  });
  console.log('INITIAL_ANALYSIS_GEOMETRY', JSON.stringify(geometry));
  for (const line of [49, 54]) await expect(page.locator(`.diff-line[data-after-line="${line}"]`)).toHaveCount(1);
  for (const line of [48, 53]) await expect(page.locator(`.diff-line[data-before-line="${line}"]`)).toHaveCount(1);
  await page.screenshot({
    path: `${evidence}/continuous-analysis-initial-390.png`
  });
});
test('graph zoom in both directions only changes the camera for collapsed and expanded files', async ({ page }) => {
  await page.setViewportSize({
    width: 1440,
    height: 1000
  });
  await page.goto('/');
    await closeOpeningContext(page);
  await expose(page, 'src/application/review.ts');
  const file = find(page, 'src/application/review.ts');
  const zoom = async (delta: number) => {
    await page.mouse.move(1350, 800);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, delta);
    await page.keyboard.up('Control');
  };
  const initial = await camera(page);
  await zoom(-180);
  await expect.poll(() => camera(page)).not.toEqual(initial);
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await zoom(180);
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await file.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await zoom(180);
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await zoom(-180);
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
});
for (const width of [
  390, 1440
])
  test(`${width} actual authentication change has a concrete prepared explanation beside its exact source`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await page.goto('/');
    await closeOpeningContext(page);
    await expose(page, 'src/storage/public.ts');
    await page.getByRole('button', {
      name: 'Fullscreen src/storage/public.ts',
      exact: true
    }).click();
    if (width === 1440)
      await page.getByRole('button', {
        name: 'Unified',
        exact: true
      }).click();
    await page.locator('.change-rail button').nth(1).click();
    const box = await page.getByRole('button', {
      name: 'Explain current source comparison'
    }).boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.locator('.reader-primary')).toHaveText('Local-owner access is recognized before credential lookup. Other credentials continue through the lookup path.');
    await expect(page.locator('.change-rail button').nth(1)).toHaveAttribute('aria-current', 'location');
    await page.screenshot({
      path: `${evidence}/continuous-authenticate-explanation-${width}.png`
    });
  });
