import {test, expect} from '@playwright/test';

// Execute through the supported browser environment only. Authored is not run.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
for (const width of [390, 1440]) {
    test(`first-load measurement never paints unfinished graph at ${width}`, async ({browser}) => {
        const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width === 390});
        const page = await context.newPage();
        const failures: string[] = [];
        page.on('pageerror', error => failures.push(error.message));
        await page.addInitScript(() => {
            const samples: {busy: boolean; painted: number}[] = [];
            Object.assign(window, {startupPaintSamples: samples});
            const sample = () => {
                const graph = document.querySelector('main[aria-label="PR25 source comparison graph"]');
                if (graph) {
                    const painted = [...graph.querySelectorAll<HTMLElement>('.minimal-entity,.minimal-change-graph,.minimal-edge-card,.minimal-route')]
                        .filter(element => {
                            const style = getComputedStyle(element);
                            return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0' && element.getClientRects().length > 0;
                        }).length;
                    samples.push({busy: graph.getAttribute('aria-busy') === 'true', painted});
                }
                if (samples.length < 240) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        await page.goto(target);
        const graph = page.locator('main[aria-label="PR25 source comparison graph"]');
        await expect(graph).toHaveAttribute('aria-busy', 'false', {timeout: 30000});
        await expect(graph).toHaveAttribute('data-scene-mode', 'selected');
        const samples = await page.evaluate(() => (window as unknown as {startupPaintSamples: {busy: boolean; painted: number}[]}).startupPaintSamples);
        expect(samples.some(sample => sample.busy)).toBe(true);
        expect(samples.filter(sample => sample.busy && sample.painted > 0)).toEqual([]);
        expect(failures).toEqual([]);
        await context.close();
    });
}
