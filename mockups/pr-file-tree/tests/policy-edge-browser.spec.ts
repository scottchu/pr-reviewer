import {test, expect, type Page, type Locator} from '@playwright/test';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {sourceGraph} from '../source-graph.ts';

// Inventory for the supported browser host; never start an alternate browser to
// bypass host unavailability. Select the exact task candidate explicitly.
const target = process.env.PR_REVIEWER_CANDIDATE_URL;
const session = createGraphSession(sourceGraph);
const gateway = session.view.nodes.find(node => node.kind === 'test' &&
    node.ui.card.title.includes('single local owner reads and writes without a Bearer'))!;
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 12; step++) {
        const box = (await node.boundingBox())!;
        const size = page.viewportSize()!;
        const x = box.x + Math.min(100, box.width / 2), y = box.y + Math.min(40, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 130) return;
        await page.mouse.move(size.width - 10, size.height - 90);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('policy_edge_frame_limit');
};
for (const width of [1440, 390]) {
    test(`gateway assertion source survives unsupported edge removal at ${width}`, async ({page}) => {
        test.skip(!target, 'Exact candidate URL and supported browser host are required');
        expect(session.view.relations.some(edge => edge.relation === 'verifies_policy')).toBe(false);
        await page.setViewportSize({width, height: 900});
        await page.goto(target!);
        const node = page.locator(`.react-flow__node[data-id=${JSON.stringify(gateway.id)}]`);
        await frame(page, node);
        await expect(node.locator('.minimal-entity')).toBeVisible();
        await expect(page.locator('[data-edge-id$=":verifies-policy"]')).toHaveCount(0);
        await node.locator('summary').first().click();
        await expect(node.getByLabel('Added source rows', {exact: true})).toContainText('single local owner');
        await node.locator('summary').filter({hasText: /^Read all /}).click();
        await expect(node.getByLabel('All native source hunks', {exact: true})).toContainText('assert.equal');
        await node.locator('summary').filter({hasText: /^Read all /}).click();
        await expect(node).toContainText('After · e3b270e');
        await node.locator('summary').first().click();
        const button = page.getByRole('button', {name: 'Changes only', exact: true});
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(node.locator('.minimal-entity')).toBeVisible();
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        await expect(node.locator('summary').first()).toHaveText('View source changes');
    });
}
