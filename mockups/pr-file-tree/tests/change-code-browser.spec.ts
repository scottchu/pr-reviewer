import {test, expect, type Page, type Locator} from '@playwright/test';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const testId = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const expected = createGraphSession(sourceGraph).view;
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 20; step++) {
        const box = (await node.boundingBox())!, size = page.viewportSize()!;
        const x = box.x + Math.min(130, box.width / 2), y = box.y + Math.min(80, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 130) return;
        await page.mouse.move(size.width - 10, size.height - 90);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('change_code_frame_limit');
};

// Supported-host journey inventory; authored is not actual browser acceptance.
for (const width of [390, 1440]) test(`normal change and Test show actual Removed/Added code at ${width}`, async ({page}) => {
    await page.setViewportSize({width, height: 900}); await page.goto(target);
    await expect(page.locator('main[aria-label="PR25 source comparison graph"]')).toHaveAttribute('aria-busy', 'false', {timeout: 30000});
    const node = (id: string) => page.locator(`.react-flow__node[data-id=${JSON.stringify(id)}]`);
    await expect(node(testId)).toHaveCount(0); await expect(node('request')).toHaveCount(0);
    await expect(node('header-value')).toHaveCount(0);
    for (const id of ['change', 'change:' + testId]) {
        const group = expected.nodes.find(entity => entity.id === id)!;
        expect(group.nodes?.length).toBe(2);
        for (const codeNode of group.nodes!) {
            const actual = node(codeNode.id); await frame(page, actual);
            const edit = codeNode.ui.sourceEdit!;
            await expect(actual.getByLabel(edit.kind === 'remove' ? 'Removed code' : 'Added code', {exact: true})).toBeVisible();
            await expect(actual.getByRole('heading')).toHaveText(codeNode.ui.card.title);
            expect(await actual.locator('code[data-source-line]').allTextContents()).toEqual(edit.rows.map(row => row.text));
            expect(await actual.locator('code[data-source-line]').evaluateAll(rows => rows.map(row => Number((row as HTMLElement).dataset.sourceLine)))).toEqual(edit.rows.map(row => row.line));
            await expect(actual.locator('summary')).toHaveCount(0);
            if (edit.rows.some(row => row.text.includes('const '))) await expect(actual.locator('.syntax-keyword').first()).toBeAttached();
        }
        const outer = node(id); await frame(page, outer);
        const summary = outer.getByText('Source hunks and identities', {exact: true});
        await summary.click(); await expect(outer.getByLabel('All native source hunks', {exact: true})).toBeVisible();
        const reader = outer.getByLabel('All native source hunks', {exact: true});
        await reader.evaluate(element => {element.scrollTop = 100;});
        const position = await reader.evaluate(element => element.scrollTop);
        await summary.click(); await expect(reader).toHaveCount(0);
        await summary.click(); await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBe(position);
        await summary.click();
    }
    await page.getByRole('button', {name: 'Changes only', exact: true}).click();
    await expect(node('ui-source-edit:change:' + testId + ':remove')).toBeAttached();
    await expect(node('ui-source-edit:change:' + testId + ':add')).toBeAttached();
});
