import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`one logical entity, versioned edge rows and boundary clearance at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'request()', exact: true })).toHaveCount(1);
    await expect(page.locator('.minimal-change-graph')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'src/application/review.ts', exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'tests/review.e2e.ts', exact: true })).toHaveCount(1);
    await expect(page.locator('aside,footer,[role="dialog"],.workspace-actions,.diff-controls')).toHaveCount(0);
    const before = page.locator('[data-edge-id="request-before:located_in:review-file-base"]');
    const after = page.locator('[data-edge-id="request-after:located_in:review-file-head"]');
    await expect(before).toContainText('Before');
    await expect(before).toContainText('b096826');
    await expect(before).toContainText('L24–32');
    await expect(after).toContainText('After');
    await expect(after).toContainText('e3b270e');
    await expect(after).toContainText('L25–33');
    await expect(before).toHaveCSS('background-color', 'rgb(250, 229, 228)');
    await expect(after).toHaveCSS('background-color', 'rgb(227, 243, 232)');
    await expect(page.locator('[data-id="review-file"] article')).toHaveCSS('background-color', 'rgb(38, 49, 57)');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/[a-f0-9]{64}|canonicalId|contentHash|sourceHash|"from"|"to"|"kind"/);
    const geometry = await page.evaluate(() => {
      const rect = (element: Element) => element.getBoundingClientRect();
      const group = (id: string) => rect(document.querySelector(`[data-id="${id}"]`)!);
      const errors: string[] = [];
      for (const [id, parent] of [['request','change'],['header-value','change'],['owner-journey-test','test-change'],['old-test-step','test-change'],['new-test-assertions','test-change']]) {
        const a = rect(document.querySelector(`[data-id="${id}"]`)!); const b = group(parent!);
        if (a.left < b.left || a.top < b.top || a.right > b.right || a.bottom > b.bottom) errors.push(`child outside ${id}`);
      }
      const cards = [...document.querySelectorAll('.minimal-edge-card')];
      const nodes = [...document.querySelectorAll('.minimal-entity')];
      for (const card of cards) {
        const a = rect(card);
        for (const node of nodes) {
          const b = rect(node);
          if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1) errors.push(`node overlap ${card.getAttribute('data-edge-id')}`);
        }
        for (const id of ['change','test-change']) {
          const b = group(id);
          const intersects = Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
          const inside = a.left>b.left && a.right<b.right && a.top>b.top && a.bottom<b.bottom;
          if (intersects && !inside) errors.push(`straddles ${card.getAttribute('data-edge-id')}`);
        }
      }
      return errors;
    });
    expect(geometry).toEqual([]);
    const header = await page.locator('header').boundingBox();
    await page.mouse.move(width-10,900); await page.mouse.down(); await page.mouse.move(width-10,500,{steps:8}); await page.mouse.up();
    expect(await page.locator('header').boundingBox()).toEqual(header);
  });
}
