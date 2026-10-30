import {test, expect, type Page, type Locator} from '@playwright/test';

// Run only through an authorized supported browser route. Source checks do not
// establish that these real React interactions passed.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 16; step++) {
        const box = await node.boundingBox();
        if (!box) throw new Error('file_evidence_node_unavailable');
        const viewport = page.viewportSize()!;
        const x = box.x + box.width / 2;
        const y = box.y + Math.min(60, box.height / 2);
        if (x > 30 && x < viewport.width - 30 && y > 120 && y < viewport.height - 130) return;
        await page.mouse.move(viewport.width - 10, viewport.height - 90);
        await page.mouse.wheel((x - viewport.width / 2) * 2, (y - viewport.height / 2) * 2);
    }
    throw new Error('file_evidence_frame_limit');
};

for (const width of [1440, 390]) {
    test(`raw CSS native evidence uses existing File disclosure at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto(target);
        const file = page.locator('.react-flow__node[data-id="file:1708c8aaff8f501e656c6be562dd01087ffc46279cf69f73e0bf6657b5a79544"]');
        await expect(file).toBeAttached();
        await frame(page, file);
        const disclosure = file.getByText('View source changes', {exact: true});
        await disclosure.click();
        await expect(file.getByLabel('Removed source rows', {exact: true})).toContainText('.login');
        await expect(file.getByLabel('Added source rows', {exact: true})).toContainText('.workspace-loading');
        await expect(file).toContainText('Before · b096826');
        await expect(file).toContainText('After · e3b270e');
        await file.getByText('Read all 1 native hunks and source identities', {exact: true}).click();
        const all = file.getByLabel('All native source hunks', {exact: true});
        await expect(all).toContainText('width: 100%');
        await expect(all).toContainText('SHA256');
        await expect(file.getByRole('button', {name: 'Show source units', exact: true})).toHaveCount(0);
        await disclosure.click();
        await expect(all).toHaveCount(0);
        await disclosure.click();
        await expect(file.getByLabel('All native source hunks', {exact: true})).toBeVisible();
    });
}
