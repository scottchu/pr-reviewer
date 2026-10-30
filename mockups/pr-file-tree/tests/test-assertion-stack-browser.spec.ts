import {test, expect, type Page, type Locator} from '@playwright/test';

const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 16; step++) {
        const box = await node.boundingBox();
        if (!box) throw new Error('test_stack_subject_unavailable');
        const viewport = page.viewportSize()!;
        const x = box.x + box.width / 2, y = box.y + Math.min(60, box.height / 2);
        if (x > 30 && x < viewport.width - 30 && y > 120 && y < viewport.height - 130) return;
        await page.mouse.move(viewport.width - 10, viewport.height - 90);
        await page.mouse.wheel((x - viewport.width / 2) * 2, (y - viewport.height / 2) * 2);
    }
    throw new Error('test_stack_frame_limit');
};

for (const width of [1440, 390]) {
    test(`Test above owned Assertions after source disclosure at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto(target);
        const node = (id: string) => page.locator('.react-flow__node[data-id="' + id + '"]');
        const subject = node('unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f');
        const first = node('unit:c2bc0f435148c8428f71772ba9f406fec2c0ab14a2ab494288c616183a37b79a');
        const second = node('unit:4a7ff26fbe288fde3b1b2ab6b75b15edef959964f0dda3fd57cd3c76455aa6b0');
        await frame(page, subject);
        const positions = async () => {
            await expect.poll(async () => {
                const t = await subject.boundingBox(), a = await first.boundingBox(), b = await second.boundingBox();
                return Boolean(t && a && b && a.x > t.x && Math.abs(a.x - b.x) < 1 &&
                    a.y >= t.y + t.height && b.y >= a.y + a.height);
            }).toBe(true);
        };
        await positions();
        const details = subject.locator('details').first();
        const closedHeight = (await subject.boundingBox())!.height;
        await subject.getByText('View source changes', {exact: true}).click();
        await expect(details).toHaveAttribute('open', '');
        await expect(subject.getByLabel('Removed source rows', {exact: true})).toBeAttached();
        await expect.poll(async () => (await subject.boundingBox())!.height).toBeGreaterThan(closedHeight);
        await positions();
        const openHeight = (await subject.boundingBox())!.height;
        await subject.getByText('View source changes', {exact: true}).click();
        await expect(details).not.toHaveAttribute('open');
        await expect.poll(async () => (await subject.boundingBox())!.height).toBeLessThan(openHeight);
        await positions();
    });
}
