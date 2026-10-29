import {test, expect, type Locator, type Page} from '@playwright/test';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {sourceGraph} from '../source-graph.ts';

// Actual React acceptance, authored for the supported browser host only.
// Do not execute by starting an independent browser when that host is unavailable.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const session = createGraphSession(sourceGraph);
const camera = (page: Page) => page.locator('.react-flow__viewport').getAttribute('style');
const wrapper = (page: Page, id: string) => page.locator(`.react-flow__node[data-id=${JSON.stringify(id)}]`);
const transforms = (page: Page) => page.locator('.react-flow__node').evaluateAll(nodes =>
    nodes.map(node => ({id: node.getAttribute('data-id'), transform: (node as HTMLElement).style.transform})));
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 12; step++) {
        const box = (await node.boundingBox())!;
        const size = page.viewportSize()!;
        const x = box.x + Math.min(120, box.width / 2);
        const y = box.y + Math.min(35, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 130) return;
        await page.mouse.move(size.width - 10, size.height - 90);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('change_filter_frame_limit');
};
const scroll = (node: Locator) => node.evaluate(element => ({scrollTop: element.scrollTop, scrollLeft: element.scrollLeft}));

for (const width of [1440, 390]) {
    test(`changes-only native toolbar preserves camera, positions and restores unchanged context at ${width}`, async ({browser}) => {
        const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width === 390, isMobile: width === 390});
        const page = await context.newPage();
        await page.goto(target);
        const graph = page.getByRole('main');
        await expect(graph).toHaveAttribute('data-scene-mode', 'selected');
        const button = page.getByRole('button', {name: 'Changes only', exact: true});
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        const hit = (await button.boundingBox())!;
        expect(hit.height).toBeGreaterThanOrEqual(44);
        expect(hit.x).toBeGreaterThanOrEqual(0);
        expect(hit.x + hit.width).toBeLessThanOrEqual(width);
        const disposed = session.view.nodes.find(node => node.kind === 'test' && node.ui.card.title.includes('disposed'))!;
        const node = wrapper(page, disposed.id);
        await frame(page, node);
        await expect(node.locator('.minimal-entity')).toBeVisible();
        const positions = await transforms(page);
        const before = await camera(page);
        await button.focus();
        await page.keyboard.press('Space');
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(button).toBeFocused();
        await expect(node.locator('.minimal-entity')).toHaveCount(0);
        await expect(page.locator('.status-no-change:visible')).toHaveCount(0);
        expect(await transforms(page)).toEqual(positions);
        expect(await camera(page)).toBe(before);
        for (const edge of session.view.relations.filter(edge => edge.data.comparisonStatus === 'no change')) {
            await expect(page.locator(`[data-edge-id=${JSON.stringify(edge.id)}]`)).toHaveCount(0);
            await expect(page.locator(`[data-route-id=${JSON.stringify(edge.id)}]`)).toHaveCount(0);
        }
        // Toolbar wheel input must not pan the graph underneath it.
        await button.hover();
        await page.mouse.wheel(100, 120);
        expect(await camera(page)).toBe(before);
        await page.screenshot({path: test.info().outputPath(`changes-only-${width}.png`)});
        await page.keyboard.press('Enter');
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        await expect(node.locator('.minimal-entity')).toBeVisible();
        expect(await transforms(page)).toEqual(positions);
        expect(await camera(page)).toBe(before);
        // Native touch activation uses the same explicit intent at narrow width.
        if (width === 390) {
            await button.tap();
            await expect(button).toHaveAttribute('aria-pressed', 'true');
            await button.tap();
            await expect(button).toHaveAttribute('aria-pressed', 'false');
            expect(await camera(page)).toBe(before);
        }
        await context.close();
    });
}

test('source disclosures, preview/native scroll, manual node/route positions and expansion survive toggles', async ({page}) => {
    await page.goto(target);
    await expect(page.getByRole('main')).toHaveAttribute('data-scene-mode', 'selected');
    const button = page.getByRole('button', {name: 'Changes only', exact: true});
    const source = session.view.nodes.filter(node => node.ui.sourceControl && node.ui.sourceReading?.hunks.length)
        .sort((a, b) => b.ui.sourceReading!.hunks.reduce((sum, hunk) => sum + hunk.rows.length, 0)
            - a.ui.sourceReading!.hunks.reduce((sum, hunk) => sum + hunk.rows.length, 0))[0]!;
    const node = wrapper(page, source.id);
    await frame(page, node);
    const outer = node.locator('article > details.document-details');
    await outer.locator(':scope > summary').click();
    const inner = outer.locator('details.document-details');
    await inner.locator(':scope > summary').click();
    const reader = node.locator('.document-reading');
    await reader.evaluate(element => {element.scrollTop = 137;});
    await expect.poll(async () => (await scroll(reader)).scrollTop).toBeGreaterThan(0);
    const nativeScroll = await scroll(reader);
    const panes = node.locator('.edit-preview-rows');
    await panes.evaluateAll(elements => elements.forEach(element => {element.scrollTop = 31;}));
    const paneScrolls = await panes.evaluateAll(elements => elements.map(element => element.scrollTop));
    const before = await camera(page);
    const title = node.locator('h2').first();
    const box = (await title.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 45, box.y + 25, {steps: 4});
    await page.mouse.up();
    const manualPosition = await node.evaluate(element => (element as HTMLElement).style.transform);
    expect(await camera(page)).toBe(before);
    const route = page.locator('.minimal-edge-card[role="button"]').first();
    await route.focus();
    await page.keyboard.press('ArrowRight');
    const routeId = await route.getAttribute('data-edge-id');
    const routeTransform = await route.getAttribute('style');
    await button.click();
    await button.click();
    await expect(inner).toHaveAttribute('open', '');
    expect(await scroll(reader)).toEqual(nativeScroll);
    expect(await panes.evaluateAll(elements => elements.map(element => element.scrollTop))).toEqual(paneScrolls);
    expect(await node.evaluate(element => (element as HTMLElement).style.transform)).toBe(manualPosition);
    expect(await page.locator(`[data-edge-id=${JSON.stringify(routeId)}]`).getAttribute('style')).toBe(routeTransform);
    expect(await camera(page)).toBe(before);
    // Explicitly open an unchanged source reader, hide it, move offscreen, and restore.
    const disposed = session.view.nodes.find(entity => entity.kind === 'test' && entity.ui.card.title.includes('disposed'))!;
    const unchanged = wrapper(page, disposed.id);
    await frame(page, unchanged);
    await unchanged.locator('article > details > summary').click();
    await button.click();
    await expect(unchanged.locator('article')).toHaveCount(0);
    await page.mouse.move(1430, 800);
    await page.mouse.wheel(5000, 5000);
    const offscreenCamera = await camera(page);
    await button.click();
    await expect(unchanged.locator('article > details')).toHaveAttribute('open', '');
    expect(await camera(page)).toBe(offscreenCamera);
    const fileId = Object.entries(sourceGraph.fileUnits).find(([, units]) => units.length > 0)![0];
    const file = wrapper(page, fileId);
    await frame(page, file);
    await file.getByRole('button', {name: 'Show source units', exact: true}).click();
    await expect(file.getByRole('button', {name: 'Hide source units'})).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute('data-scene-mode', 'selected');
    const expandedPositions = await transforms(page);
    await button.click();
    await button.click();
    await expect(file.getByRole('button', {name: 'Hide source units'})).toBeVisible();
    expect(await transforms(page)).toEqual(expandedPositions);
});

for (const fallback of [false, true]) {
    test(`early toggle measures full geometry and settles without hidden focus targets, fallback=${fallback}`, async ({page}) => {
        if (fallback) {
            await page.addInitScript(() => {
                Object.defineProperty(window, 'Worker', {value: class {constructor() {throw Error('filter_fallback_fixture');}}});
            });
        }
        // Delay measurement callbacks so the user can activate before scene readiness.
        await page.addInitScript(() => {
            const NativeObserver = window.ResizeObserver;
            window.ResizeObserver = class extends NativeObserver {
                constructor(callback: ResizeObserverCallback) {
                    super((entries, observer) => setTimeout(() => callback(entries, observer), 300));
                }
            };
        });
        await page.goto(target, {waitUntil: 'domcontentloaded'});
        const button = page.getByRole('button', {name: 'Changes only', exact: true});
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        const graph = page.getByRole('main');
        await expect(graph).toHaveAttribute('data-scene-mode', fallback ? 'full' : 'selected');
        await expect(page.locator('.status-no-change:visible')).toHaveCount(0);
        const unchanged = session.view.nodes.find(node => node.ui.status === 'no change')!;
        await expect(wrapper(page, unchanged.id).locator('article,section')).toHaveCount(0);
        const positions = await transforms(page);
        const before = await camera(page);
        for (let i = 0; i < 6; i++) await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(await transforms(page)).toEqual(positions);
        expect(await camera(page)).toBe(before);
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[inert],[aria-hidden="true"]')))).toBe(false);
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(await transforms(page)).toEqual(positions);
    });
}
