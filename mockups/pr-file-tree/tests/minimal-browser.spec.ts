import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`minimum header and graph retain complete JSON and canvas-only motion at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'PR25 · Request headers', exact: true })).toBeVisible();
    await expect(page.locator('.minimal-entity')).toHaveCount(10);
    await expect(page.locator('aside,footer,[role="dialog"],.workspace-actions,.diff-controls')).toHaveCount(0);
    const records = await page.locator('.minimal-outgoing pre').allTextContents();
    const edges = records.map(record => JSON.parse(record) as {
      from: string; to: string; relation: string; data: { commit?: string; range?: { startLine: number; endLine: number } };
    });
    expect(edges.find(edge => edge.from === 'request-before' && edge.relation === 'located_in')?.data.range)
      .toEqual({ startLine: 24, endLine: 32 });
    expect(edges.find(edge => edge.from === 'request-after' && edge.relation === 'located_in')?.data.commit)
      .toBe('e3b270e5f49a9215452b0b86702946043e979059');
    const header = await page.locator('header').boundingBox();
    const before = await page.locator('[data-id="change"]').boundingBox();
    expect(before).not.toBeNull();
    await page.mouse.move(width - 15, 900);
    await page.mouse.down();
    await page.mouse.move(width - 15, 420, { steps: 10 });
    await page.mouse.up();
    await expect.poll(async () => (await page.locator('[data-id="change"]').boundingBox())?.y)
      .toBeLessThan(before?.y ?? 0);
    expect(await page.locator('header').boundingBox()).toEqual(header);
    const viewport = page.locator('.react-flow__viewport');
    const transform = await viewport.getAttribute('style');
    await page.mouse.wheel(0, 240);
    await expect.poll(() => viewport.getAttribute('style')).not.toBe(transform);
    expect(await page.locator('header').boundingBox()).toEqual(header);
  });
}
