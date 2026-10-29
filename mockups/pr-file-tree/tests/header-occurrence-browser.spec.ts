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
    test(`removed construction and independent After source at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto(target);
        const header = page.locator('.react-flow__node[data-id="header-value"]');
        await frame(page, header);
        await expect(header.getByRole('heading', {name: 'Authorization property construction', exact: true})).toBeVisible();
        await expect(header).toContainText('Removed source occurrence');
        await expect(header).toContainText('Direct request construction only');
        await expect(header).toContainText('Before b096826 · src/application/review.ts · L29');
        await expect(header).not.toContainText(/helper (?:returns|produces)|globally removed/i);
        const request = page.locator('.react-flow__node[data-id="request"]');
        await frame(page, request);
        await request.locator('summary').first().click();
        await expect(request.getByLabel('Removed source rows', {exact: true})).toContainText('Authorization:');
        await expect(request.getByLabel('Added source rows', {exact: true})).toContainText('accessHeaders(captured)');
        await expect(request).toContainText('Before · b096826');
        await expect(request).toContainText('After · e3b270e');
        await request.locator('summary').first().click();
        await frame(page, header);
        await expect(header).toContainText('Removed source occurrence');
    });
}
