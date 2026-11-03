import {test, expect, type Page, type Locator} from '@playwright/test';
import {sourceGraph} from '../source-graph.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';

// Actual React journeys: authored, not executed while the supported host is unavailable.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const reportedTest = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const assertions = collectEntities(sourceGraph.entities).filter(entity => entity.kind === 'assertion').map(entity => entity.id);
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 12; step++) {
        const box = (await node.boundingBox())!, size = page.viewportSize()!;
        const x = box.x + Math.min(150, box.width / 2), y = box.y + Math.min(100, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 30) return;
        await page.mouse.move(size.width - 10, size.height - 10);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('test_source_frame_limit');
};
for (const width of [390, 1440]) {
    test(`Test source is one normal change without an assertion canvas at ${width}`, async ({page}) => {
        await page.setViewportSize({width, height: 900});
        await page.goto(target);
        await expect(page.locator('main[aria-label="PR25 source comparison graph"]')).toHaveAttribute('aria-busy', 'false');
        const assertionNodes = () => page.locator('.react-flow__node').evaluateAll((elements, ids) =>
            elements.filter(element => ids.includes((element as HTMLElement).dataset.id ?? '')).length, assertions);
        expect(await assertionNodes()).toBe(0);
        const node = page.locator(`.react-flow__node[data-id=${JSON.stringify(reportedTest)}]`);
        await expect(node).toHaveCount(1);
        await frame(page, node);
        await node.getByText('View source changes', {exact: true}).click();
        await expect(node.getByLabel('Scoped removed and added source preview')).toBeVisible();
        await expect(node).toContainText('Removed −4');
        await expect(node).toContainText('Added +8');
        expect(await assertionNodes()).toBe(0);
        await node.getByText('View source changes', {exact: true}).click();
        await page.getByRole('button', {name: 'Changes only', exact: true}).click();
        expect(await assertionNodes()).toBe(0);
        await page.getByRole('button', {name: 'Changes only', exact: true}).click();
        const file = page.locator('.react-flow__node[data-id="application-test-file"]');
        await frame(page, file);
        await file.getByRole('button', {name: 'Show source units', exact: true}).click();
        expect(await assertionNodes()).toBe(0);
        await expect(file.getByRole('button', {name: 'Show more source units', exact: true})).toHaveCount(0);
        await file.getByRole('button', {name: 'Hide source units', exact: true}).click();
        expect(await assertionNodes()).toBe(0);
    });
}
