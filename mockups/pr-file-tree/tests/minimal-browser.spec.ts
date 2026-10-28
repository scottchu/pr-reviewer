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

// V30: execute against the exact candidate URL; browser availability is a separate gate.
for (const width of [1440, 390]) {
  test(`path lane and Show/Hide preserve layout ownership at ${width}`, async ({ browser }) => {
    const {allEntities} = await import('../source-graph.ts');
    const {compareFilePaths} = await import('../graph-geometry.ts');
    const files = allEntities().filter(entity => entity.kind === 'file')
      .map(entity => ({id: entity.id, path: String(entity.data.path)}));
    const context = await browser.newContext({viewport: {width, height: 1000},
      ...(width === 390 ? {hasTouch: true, isMobile: true} : {})});
    const page = await context.newPage();
    await page.goto(test.info().project.use.baseURL ?? 'http://127.0.0.1:57943');
    const review = page.locator('.react-flow__node[data-id="pr25"]');
    await expect(review).toBeVisible();
    await expect.poll(async () => (await review.boundingBox())!.x).toBe(20);
    const camera = page.locator('.react-flow__viewport');
    const initialCamera = await camera.getAttribute('style');
    const inspect = async () => page.evaluate(fileMetadata => {
      const zoom = new DOMMatrix(getComputedStyle(document.querySelector('.react-flow__viewport')!).transform).a;
      const boxes = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].map(node => {
        const box = node.getBoundingClientRect();
        return {id: node.dataset.id!, x: box.x / zoom, y: box.y / zoom, right: box.right / zoom};
      });
      return {boxes, files: fileMetadata.map(file => ({...file, ...boxes.find(box => box.id === file.id)!}))};
    }, files);
    const assertArrangement = async () => {
      const geometry = await inspect();
      const pr = geometry.boxes.find(box => box.id === 'pr25')!;
      // Root IDs come from the actual visible source graph, not CSS parent heuristics.
      const children = new Set(allEntities().flatMap(entity => entity.nodes?.map(child => child.id) ?? []));
      for (const box of geometry.boxes.filter(box => box.id !== 'pr25' && !children.has(box.id))) {
        expect(box.x).toBeGreaterThan(pr.right);
      }
      const ordered = [...geometry.files].sort((a, b) => a.y - b.y);
      expect(ordered.map(file => file.path)).toEqual(files.map(file => file.path).sort(compareFilePaths));
      const origin = ordered[0]!.x - (ordered[0]!.path.split('/').length - 1) * 24;
      for (const file of ordered) expect(file.x - origin).toBeCloseTo((file.path.split('/').length - 1) * 24, 1);
      const fileIds = new Set(files.map(file => file.id));
      const laneRight = Math.max(...ordered.map(file => file.right));
      for (const box of geometry.boxes.filter(box => box.id !== 'pr25' && !children.has(box.id) && !fileIds.has(box.id))) {
        expect(box.x).toBeGreaterThan(laneRight);
      }
    };
    await assertArrangement();
    const file = page.locator('.react-flow__node[data-id="review-file"]');
    const show = file.getByRole('button', {name: 'Show source units', exact: true});
    await show.focus();
    await show.press('Enter');
    await expect(file.getByRole('button', {name: 'Hide source units', exact: true})).toBeVisible();
    await assertArrangement();
    await file.getByRole('button', {name: 'Hide source units', exact: true}).focus();
    await file.getByRole('button', {name: 'Hide source units', exact: true}).press('Enter');
    await expect(show).toBeVisible();
    await assertArrangement();
    const handle = file.getByRole('button', {name: 'Move src/application/review.ts', exact: true});
    await handle.focus();
    const before = (await file.boundingBox())!;
    await handle.press('ArrowRight');
    await expect.poll(async () => (await file.boundingBox())!.x - before.x).toBe(10);
    const manual = await file.getAttribute('style');
    await show.focus(); await show.press('Enter');
    await file.getByRole('button', {name: 'Hide source units', exact: true}).focus();
    await file.getByRole('button', {name: 'Hide source units', exact: true}).press('Enter');
    await expect(show).toBeVisible();
    expect(await file.getAttribute('style')).toBe(manual);
    expect(await camera.getAttribute('style')).toBe(initialCamera);
    await context.close();
  });
}
