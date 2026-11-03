import {test, expect, type Page, type Locator} from '@playwright/test';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const testId = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const expected = createGraphSession(sourceGraph).view;
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 20; step++) {
        const box = (await node.boundingBox())!, size = page.viewportSize()!;
        const x = box.x + Math.min(100, box.width / 2), y = box.y + Math.min(60, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 130) return;
        await page.mouse.move(size.width - 10, size.height - 90);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('test_only_frame_limit');
};

// Authored actual React journeys; execution requires the supported browser host.
for (const width of [390, 1440]) test(`only Test gains actual code; request and Authorization survive at ${width}`, async ({page}) => {
    await page.setViewportSize({width, height: 900}); await page.goto(target);
    await expect(page.locator('main[aria-label="PR25 source comparison graph"]')).toHaveAttribute('aria-busy', 'false', {timeout: 30000});
    const node = (id: string) => page.locator(`.react-flow__node[data-id=${JSON.stringify(id)}]`);
    const request = node('request'), header = node('header-value');
    await frame(page, request); await expect(request.getByRole('heading')).toContainText('request()');
    const requestText = await request.innerText();
    await request.getByText('View source changes', {exact: true}).click();
    await expect(request.getByLabel('Removed source rows', {exact: true})).toContainText('Authorization:');
    await request.getByText('View source changes', {exact: true}).click();
    await frame(page, header); await expect(header).toContainText('Authorization property construction');
    const headerText = await header.innerText();
    const group = expected.nodes.find(entity => entity.id === 'change:' + testId)!;
    for (const child of group.nodes!.filter(child => child.ui.sourceEdit)) {
        const actual = node(child.id); await frame(page, actual);
        await expect(actual.getByLabel(child.ui.sourceEdit!.kind === 'remove' ? 'Removed code' : 'Added code', {exact: true})).toBeVisible();
        expect(await actual.locator('code[data-source-line]').allTextContents()).toEqual(child.ui.sourceEdit!.rows.map(row => row.text));
    }
    const subject = node(testId); await frame(page, subject);
    await subject.getByText('View source changes', {exact: true}).click();
    await expect(subject.getByLabel('All native source hunks', {exact: true})).toBeVisible();
    await expect(subject.getByLabel('Scoped removed and added source preview', {exact: true})).toHaveCount(0);
    await subject.getByText('View source changes', {exact: true}).click();
    await frame(page, request); expect(await request.innerText()).toBe(requestText);
    await frame(page, header); expect(await header.innerText()).toBe(headerText);
});
