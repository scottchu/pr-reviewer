import {test, expect, type Page, type Locator} from '@playwright/test';

// Use the supported browser host. A task preview is explicitly selected by URL;
// the live endpoint is not restarted or changed by this test.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 12; step++) {
        const box = (await node.boundingBox())!;
        const size = page.viewportSize()!;
        const x = box.x + box.width / 2;
        const y = box.y + Math.min(70, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 130) return;
        await page.mouse.move(size.width - 10, size.height - 90);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('header_occurrence_frame_limit');
};

for (const width of [1440, 390]) {
    test(`literal removed construction and independent added source at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900}); await page.goto(target);
        await expect(page.locator('.react-flow__node[data-id="header-value"]')).toHaveCount(0);
        const removed = page.locator('.react-flow__node[data-id="ui-source-edit:change:remove"]');
        await frame(page, removed);
        await expect(removed.getByLabel('Removed code', {exact: true})).toContainText('Authorization:');
        await expect(removed).toContainText('Before b096826');
        const added = page.locator('.react-flow__node[data-id="ui-source-edit:change:add"]');
        await frame(page, added);
        await expect(added.getByLabel('Added code', {exact: true})).toContainText('accessHeaders(captured)');
        await expect(added).toContainText('After e3b270e');
        const helper = page.locator('.react-flow__node[data-id="ui-source-edit:change:helper:add"]');
        await frame(page, helper);
        await expect(helper.getByLabel('Added code', {exact: true})).toContainText('Authorization');
    });
}
