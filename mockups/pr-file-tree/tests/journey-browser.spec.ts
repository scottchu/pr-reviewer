import { test, expect } from '@playwright/test';

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
