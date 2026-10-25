import { test, expect, type Page, type Locator } from '@playwright/test';

const openFiles = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'File tree', exact: true }).click();
};
import { projectCalls } from '../calls.ts';
const evidence = '/tmp/pr-reviewer-reading-journey-evidence';
const closeOpeningContext = async (page: Page) => {
  if ((page.viewportSize()?.width ?? 0) >= 650) {
    await page.getByRole('button', { name: 'Close review context' }).click();
  }
};
test.use({
  reducedMotion: 'reduce'
});
const panTo = async (page: Page, locator: Locator, x = 20, y = 90) => {
  await page.locator('main').focus();
  for (let i = 0;i < 100;i++) {
    const box = await locator.boundingBox();
    if (box && Math.abs(box.x - x) <= 65 && Math.abs(box.y - y) <= 65)
      return;
    await page.keyboard.press(!box || box.x > x + 65 ? 'ArrowRight' : box.x < x - 65 ? 'ArrowLeft' : box.y > y + 65 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error(`source_context_not_exposed: ${JSON.stringify(await locator.boundingBox())}; camera ${await page.locator('.react-flow__viewport').getAttribute('style')}`);
};
const file = (page: Page, path: string) => page.locator(`[data-file-path="${path}"]`);
const functionNode = (page: Page, id: string) => page.locator(`[data-function-id="${id}"]`);
for (const width of [
  1440, 390
])
  test(`${width} review change shows only direct call context and source-observed explanation`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await openFiles(page);
    await closeOpeningContext(page);
    const path = 'src/application/review.ts';
    await panTo(page, file(page, path));
    await file(page, path).click();
    const projection = projectCalls(path);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await expect(page.locator('.react-flow__edge-call')).toHaveCount(projection.links.length);
    const seed = projection.seeds.find(node => node.declaration.side === 'head')!;
    const helper = projection.nodes.find(node => node.name === 'accessHeaders')!;
    const link = projection.links.find(link => link.caller === seed.id && link.callee === helper.id)!;
    await expect(page.locator('.import-label')).toHaveCount(0);
    await page.getByRole('button', {
      name: 'Show changed-function relationships'
    }).click();
    await page.screenshot({
      path: `${evidence}/calls-review-${width}.png`
    });
    const edge = page.locator(`button[data-call-id="${link.id}"]`);
    await expect(edge).toHaveAccessibleName('Explain After call request → accessHeaders · src/application/review.ts:30–30 → src/application/local-access.ts:3–3');
    await panTo(page, edge, 130, 350);
    await edge.click();
    await expect(page.getByRole('region', {
      name: 'Call relationship explanation'
    })).toBeVisible();
    await expect(page.locator('.reader-primary')).toContainText('Local-owner requests omit Bearer');
    await page.getByText('Why and source evidence', {
      exact: true
    }).click();
    await expect(page.locator('.relationship-reader')).toContainText('Source-observed lexical call');
    await expect(page.locator('.relationship-reader')).toContainText('semantic_obstruction');
    await page.screenshot({
      path: `${evidence}/calls-explanation-${width}.png`
    });
  });
for (const width of [
  1440, 390
])
  test(`${width} storage overlay is separate, actual edge source follows the right boundary after file expansion`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : 1000
    });
    await openFiles(page);
    await closeOpeningContext(page);
    const path = 'src/storage/public.ts';
    await panTo(page, file(page, path));
    await file(page, path).click();
    const projection = projectCalls(path);
    for (const link of projection.links) await expect(page.locator(`.react-flow__edge-call[data-id="${link.id}"]`)).toBeAttached();
    await expect(page.locator('.react-flow__edge-call')).toHaveCount(projection.links.length);
    const link = projection.links.find(link => link.target.side === 'head' && projection.seeds.some(seed => seed.id === link.caller))!;
    const source = functionNode(page, link.caller);
    const checkEndpoint = async () => {
      const endpoint = await page.locator(`.react-flow__edge[data-id="${link.id}"] path.react-flow__edge-path`).evaluate(path => {
        const edge = path as SVGPathElement;
        const point = edge.getPointAtLength(0).matrixTransform(edge.getScreenCTM()!);
        return {
          x: point.x,
          y: point.y
        };
      });
      const box = await source.boundingBox();
      expect(Math.abs(endpoint.x - (box!.x + box!.width))).toBeLessThan(4);
      expect(Math.abs(endpoint.y - (box!.y + box!.height / 2))).toBeLessThan(4);
    };
    await checkEndpoint();
    await panTo(page, file(page, path));
    await file(page, path).click();
    await checkEndpoint();
    const seed = projection.seeds.find(seed => seed.declaration.side === 'head')!;
    await panTo(page, functionNode(page, seed.id), width === 390 ? 8 : 280, 220);
    await page.screenshot({
      path: `${evidence}/calls-storage-${width}.png`
    });
  });
test('changed function toggles only relevant declared tests and opens exact full test source with return', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await openFiles(page);
    await closeOpeningContext(page);
  const path = 'src/application/review.ts';
  await panTo(page, file(page, path));
  await file(page, path).click();
  const seed = projectCalls(path).seeds.find(node => node.declaration.side === 'head')!;
  const identity = functionNode(page, seed.id);
  await panTo(page, identity);
  await identity.getByRole('button', {
    name: /^Read After/
  }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', path);
  const camera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
  const top = await page.locator('.continuous-reader').evaluate(element => element.scrollTop);
  await panTo(page, identity);
  await identity.getByRole('button', {
    name: /^Relevant tests/
  }).click();
  await expect(page.locator('[data-declared-test]')).toHaveCount(1);
  await expect(page.locator('[data-declared-test="gateway-owner-added"]')).toHaveCount(0);
  const summary = page.locator('[data-declared-test="review-owner-changed"]');
  await panTo(page, summary, 20, 120);
  await page.screenshot({
    path: `${evidence}/tests-summary-390.png`
  });
  // Record the actual pre-test camera after deliberate graph pan.
  const beforeTestCamera = await page.locator('.pr-graph .react-flow__viewport').getAttribute('style');
  await summary.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'tests/review.e2e.ts');
  for (const line of [
    140, 242
  ])
    await expect(page.locator(`.diff-line[data-after-line="${line}"]`)).toHaveCount(1);
  await expect(page.locator('.version-hashes')).toHaveAttribute('title', /Declared test:/);
  await page.screenshot({
    path: `${evidence}/tests-source-390.png`
  });
  await page.getByRole('button', {
    name: 'Back to source context'
  }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', path);
  await expect(page.locator('.pr-graph .react-flow__viewport')).toHaveAttribute('style', beforeTestCamera!);
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(top, 0);
  expect(camera).toContain('scale(1)');
});
test('storage declared tests retain unchanged boundary source without inventing a changed hunk or execution', async ({ page }) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await openFiles(page);
    await closeOpeningContext(page);
  const path = 'src/storage/public.ts';
  await panTo(page, file(page, path));
  await file(page, path).click();
  const seed = projectCalls(path).seeds.find(seed => seed.declaration.side === 'head')!;
  const identity = functionNode(page, seed.id);
  await panTo(page, identity);
  await identity.getByRole('button', {
    name: /^Relevant tests/
  }).click();
  await expect(page.locator('[data-declared-test]')).toHaveCount(3);
  const retained = page.locator('[data-declared-test="gateway-retained"]');
  await expect(retained).toContainText('unchanged context');
  await expect(retained).toContainText('not run');
  await panTo(page, retained, 15, 110);
  await page.screenshot({
    path: `${evidence}/tests-storage-summary-390.png`
  });
  await retained.click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'tests/gateway.test.ts');
  await expect(page.locator('.test-source-caption')).toHaveText('Selected declared test · unchanged source · not run');
  await expect(page.locator('.change-rail button')).toHaveCount(0);
  await expect(page.locator('.diff-line[data-after-line="9"]')).toHaveCount(1);
  await expect(page.locator('.diff-line[data-after-line="75"]')).toHaveCount(1);
  await expect(page.locator('.diff-line.added')).toHaveCount(0);
  await page.screenshot({
    path: `${evidence}/tests-unchanged-source-390.png`
  });
  await page.getByRole('button', {
    name: 'Back to source context'
  }).click();
  const added = page.locator('[data-declared-test="gateway-owner-added"]');
  await panTo(page, added, 15, 110);
  await added.click();
  await expect(page.locator('.test-source-caption')).toHaveText('Added declared test · Before absent · not run');
  for (const line of [
    90, 114
  ])
    await expect(page.locator(`.diff-line[data-after-line="${line}"]`)).toHaveCount(1);
  await expect(page.locator('.diff-line.added')).not.toHaveCount(0);
  await expect(page.locator('.diff-line.removed')).toHaveCount(0);
  await page.screenshot({
    path: `${evidence}/tests-added-source-390.png`
  });
});
