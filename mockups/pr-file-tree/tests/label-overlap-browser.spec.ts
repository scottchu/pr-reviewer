import {test, expect, type Page, type Locator} from '@playwright/test';

const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const frame = async (page: Page, subject: Locator) => {
    for (let step = 0; step < 18; step++) {
        const box = await subject.boundingBox();
        if (!box) throw new Error('label_repair_subject_missing');
        const viewport = page.viewportSize()!;
        const x = box.x + box.width / 2, y = box.y + Math.min(60, box.height / 2);
        if (x > 30 && x < viewport.width - 30 && y > 120 && y < viewport.height - 130) return;
        await page.mouse.move(viewport.width - 10, viewport.height - 90);
        await page.mouse.wheel((x - viewport.width / 2) * 2, (y - viewport.height / 2) * 2);
    }
    throw new Error('label_repair_frame_limit');
};
const clearScene = async (page: Page) => {
    await expect(page.locator('.minimal-edge-card').first()).toBeAttached();
    await expect.poll(async () => {
        const labels = await page.locator('.minimal-edge-card:not([aria-hidden="true"])').all();
        const nodes = await page.locator('.react-flow__node-entity').all();
        const cards = (await Promise.all(nodes.map(node => node.boundingBox()))).filter(box => box !== null);
        const rectangles = (await Promise.all(labels.map(label => label.boundingBox()))).filter(box => box !== null);
        const overlaps = (a: NonNullable<typeof rectangles[number]>, b: NonNullable<typeof rectangles[number]>) =>
            a.x < b.x + b.width - .5 && a.x + a.width > b.x + .5 && a.y < b.y + b.height - .5 && a.y + a.height > b.y + .5;
        return rectangles.length > 0 && rectangles.every((box, i) =>
            !cards.some(card => overlaps(box, card)) && !rectangles.slice(0, i).some(prior => overlaps(box, prior))) &&
            await page.locator('.minimal-edge-card[data-placement-state="blocked"]').count() === 0;
    }).toBe(true);
};

for (const width of [1440, 390]) {
    test(`screenshot assertion appears once and settled label rectangles stay clear at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto(target);
        await page.evaluate(() => document.fonts.ready);
        const assertion = page.locator('.react-flow__node[data-id="unit:d9c72b99c306310068176e50b9bdac0e92f6e17e08470bf2f94f34543df35317"]');
        await frame(page, assertion);
        await expect(assertion.getByRole('heading')).toContainText('Save question');
        await expect(assertion.locator('p').filter({hasText: 'Save question'})).toHaveCount(0);
        await clearScene(page);
        const subject = page.locator('.react-flow__node[data-id="unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f"]');
        await frame(page, subject);
        const closed = (await subject.boundingBox())!.height;
        await subject.getByText('View source changes', {exact: true}).click();
        await expect.poll(async () => (await subject.boundingBox())!.height).toBeGreaterThan(closed);
        await clearScene(page);
        const opened = (await subject.boundingBox())!.height;
        await subject.getByText('View source changes', {exact: true}).click();
        await expect.poll(async () => (await subject.boundingBox())!.height).toBeLessThan(opened);
        await clearScene(page);
    });
}
