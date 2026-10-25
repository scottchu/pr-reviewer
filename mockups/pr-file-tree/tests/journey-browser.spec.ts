import { test, expect, type Page, type Locator } from '@playwright/test';
import { projectCalls } from '../calls.ts';

test.use({ reducedMotion: 'reduce' });

for (const width of [1440, 390]) {
  test(`${width} motivation leads to exact evidence and returns to the original graph`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const context = page.getByRole(width < 650 ? 'dialog' : 'complementary', { name: 'Review context' });
    if (width < 650) {
      await page.getByRole('button', { name: 'Open review context' }).click();
    }
    await expect(context).toContainText('Why remove manual token entry?');
    await expect(context).toContainText('Captured requirement');
    await expect(context).toContainText('Prepared source account');
    await expect(context).toContainText('Explicit credential');
    await expect(context).toContainText('not an execution result');
    const citation = context.getByRole('button', { name: 'Read the captured runtime requirement' });
    const citationBox = await citation.boundingBox();
    const contextBox = await context.boundingBox();
    expect(citationBox!.x).toBeGreaterThanOrEqual(contextBox!.x);
    expect(citationBox!.x + citationBox!.width).toBeLessThanOrEqual(contextBox!.x + contextBox!.width);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/journey-context-${width}.png` });
    const camera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
    await context.getByRole('button', { name: 'Read the captured runtime requirement' }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'docs/product/review-loop/runtime.md');
    await expect(page.locator('.diff-line[data-after-line="22"]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Back to source context' }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', camera!);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    if (width < 650) {
      await page.getByRole('button', { name: 'Open review context' }).click();
    }
    await context.getByRole('button', { name: 'Inspect the changed request' }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
    await expect(page.locator('.diff-line[data-after-line="25"]').first()).toBeAttached();
    await expect(page.locator('.diff-line[data-after-line="33"]').first()).toBeAttached();
    await page.getByRole('button', { name: 'Back to source context' }).click();
    await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', camera!);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/journey-opening-${width}.png` });
  });
}

test('narrow context owns focus and Escape without moving the graph', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const camera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
  const opener = page.getByRole('button', { name: 'Open review context' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Review context' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Inspect the changed request' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', camera!);
});

test('a second context citation returns one level without consuming the earlier reading frame', async ({ page }) => {
  await page.goto('/');
  const context = page.getByRole('complementary', { name: 'Review context' });
  const initialCamera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
  await context.getByRole('button', { name: 'Inspect the changed request' }).click();
  const requestCamera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
  const body = page.locator('.continuous-reader');
  await body.evaluate(element => { element.scrollTop = 120; });
  const requestTop = await body.evaluate(element => element.scrollTop);
  await context.getByRole('button', { name: 'Read the captured runtime requirement' }).click();
  await page.getByRole('button', { name: 'Back to source context' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', requestCamera!);
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBe(requestTop);
  await expect(page.locator('.react-flow__edge-call')).toHaveCount(13);
  await page.getByRole('button', { name: 'Back to source context' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
  await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', initialCamera!);
});

// F17 revision 2: pointer input, retained local reading and actual DOM focus.
test('narrow modal blocks background Overview and Back pointer navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open review context' }).click();
  await page.getByRole('button', { name: 'Inspect the changed request' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.getByRole('button', { name: 'Open review context' }).click();
  const background = page.locator('header');
  for (const selector of ['button[aria-label="Overview"]', 'button[aria-label="Back to source context"]']) {
    const box = await background.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
    await expect(background.locator('button[aria-label="Back to source context"]')).toBeAttached();
    expect(await background.evaluate(element => element.contains(document.activeElement))).toBe(false);
  }
  await page.getByRole('button', { name: 'Close review context' }).click();
  await page.getByRole('button', { name: 'Back to source context' }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`${width} context retains local scroll across close, evidence and fullscreen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto('/');
    const context = page.locator('.review-context');
    if (width < 650) {
      await page.getByRole('button', { name: 'Open review context' }).click();
    }
    await expect(context).toBeVisible();
    await context.getByRole('button', { name: 'Close review context' }).evaluate(element => element.focus({ preventScroll: true }));
    await context.evaluate(element => { element.scrollTop = 180; });
    const top = await context.evaluate(element => element.scrollTop);
    expect(top).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open review context' }).click();
    await expect.poll(() => context.evaluate(element => element.scrollTop)).toBe(top);
    const citation = context.getByRole('button', { name: 'Inspect the changed request' });
    await citation.scrollIntoViewIfNeeded();
    const citationTop = await context.evaluate(element => element.scrollTop);
    await citation.click();
    if (width < 650) {
      await page.getByRole('button', { name: 'Open review context' }).click();
      await expect.poll(() => context.evaluate(element => element.scrollTop)).toBe(citationTop);
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: 'Fullscreen src/application/review.ts', exact: true }).click();
    await expect(context).toHaveCount(0);
    await page.getByRole('button', { name: 'Back to PR', exact: true }).click();
    if (width < 650) {
      await page.getByRole('button', { name: 'Open review context' }).click();
    }
    await expect.poll(() => context.evaluate(element => element.scrollTop)).toBe(citationTop);
  });
}

test('keyboard evidence and Back focus the visible reader or graph without losing camera', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Open review context' });
  await opener.click();
  await page.getByRole('button', { name: 'Read the captured runtime requirement' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.continuous-reader')).toBeFocused();
  const savedCamera = await page.locator('.react-flow__viewport').getAttribute('style');
  await opener.click();
  await page.getByRole('button', { name: 'Inspect the changed request' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.continuous-reader')).toBeFocused();
  const back = page.getByRole('button', { name: 'Back to source context' });
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.continuous-reader')).toBeFocused();
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', savedCamera!);
  await back.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
});


const panTo = async (page: Page, locator: Locator, x = 20, y = 110) => {
  await page.locator('main').focus();
  for (let attempt = 0; attempt < 100; attempt++) {
    const box = await locator.boundingBox();
    if (box && Math.abs(box.x - x) < 65 && Math.abs(box.y - y) < 65) {
      return;
    }
    await page.keyboard.press(!box || box.x > x + 65 ? 'ArrowRight'
      : box.x < x - 65 ? 'ArrowLeft'
        : box.y > y + 65 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error('source_context_not_exposed');
};

const captureReading = async (page: Page) => ({
  camera: await page.locator('.react-flow__viewport').getAttribute('style'),
  top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
  left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
  mode: await page.getByRole('button', { name: 'Unified', exact: true }).getAttribute('aria-pressed'),
  folds: await page.locator('.fold-control[aria-expanded="true"]').allTextContents(),
  tests: await page.locator('[data-declared-test]').count(),
});

const expectReading = async (page: Page, saved: Awaited<ReturnType<typeof captureReading>>) => {
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', saved.camera!);
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(saved.top, 0);
  await expect.poll(() => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBeCloseTo(saved.left, 0);
  await expect(page.getByRole('button', { name: 'Unified', exact: true })).toHaveAttribute('aria-pressed', saved.mode!);
  expect(await page.locator('.fold-control[aria-expanded="true"]').allTextContents()).toEqual(saved.folds);
  await expect(page.locator('[data-declared-test]')).toHaveCount(saved.tests);
};

test('context preserves earlier function and test return frames including folds, x-scroll, mode and test lens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const path = 'src/application/review.ts';
  const file = page.locator(`[data-file-path="${path}"]`);
  await panTo(page, file);
  await file.click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  const fold = page.locator('.fold-control').first();
  await fold.click();
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 95; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
  // Capture after explicit graph pan to the function; pan does not alter source reading.
  const seed = projectCalls(path).seeds.find(node => node.name === 'request' && node.declaration.side === 'head')!;
  const identity = page.locator(`[data-function-id="${seed.id}"]`);
  await panTo(page, identity);
  const original = await captureReading(page);
  expect(original.left).toBeGreaterThan(0);
  expect(original.folds.length).toBeGreaterThan(0);
  await identity.getByRole('button', { name: /^Read After/ }).click();
  await panTo(page, identity);
  await identity.getByRole('button', { name: /^Relevant tests/ }).click();
  const test = page.locator('[data-declared-test="review-owner-changed"]');
  await panTo(page, test);
  const functionReading = await captureReading(page);
  expect(functionReading.tests).toBe(1);
  await test.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'tests/review.e2e.ts');
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 160; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 95; });
  const testReading = await captureReading(page);
  await page.getByRole('button', { name: 'Open review context' }).click();
  await page.getByRole('button', { name: 'Read the captured runtime requirement' }).click();
  await page.getByRole('button', { name: 'Open review context' }).click();
  await page.getByRole('button', { name: 'Inspect the changed request' }).click();
  const back = page.getByRole('button', { name: 'Back to source context' });
  await back.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'docs/product/review-loop/runtime.md');
  await back.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'tests/review.e2e.ts');
  await expectReading(page, testReading);
  await back.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', path);
  await expectReading(page, functionReading);
  await back.click();
  await expectReading(page, original);
  await expect(back).toHaveCount(0);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.screenshot({ path: '/tmp/pr-reviewer-reading-journey-evidence/r2-nested-return-390.png' });
});
