import {test, expect, type Page, type Locator} from '@playwright/test';
// Authored actual React journey. Execute only when the supported browser host is available.
// Source/local checks and the Node worker harness do not establish this journey.
const target = process.env.PR_REVIEWER_CANDIDATE_URL ?? 'https://mac-mini.duckbill-ionian.ts.net:8478/';
const camera = (page: Page) => page.locator('.react-flow__viewport').getAttribute('style');
const frame = async (page: Page, node: Locator) => {
    for (let step = 0; step < 12; step++) {
        const box = (await node.boundingBox())!, size = page.viewportSize()!;
        const x = box.x + Math.min(150, box.width / 2), y = box.y + Math.min(100, box.height / 2);
        if (x > 30 && x < size.width - 30 && y > 120 && y < size.height - 30) return;
        await page.mouse.move(size.width - 10, size.height - 10);
        await page.mouse.wheel((x - size.width / 2) * 2, (y - size.height / 2) * 2);
    }
    throw new Error('viewport_frame_limit');
};
for (const width of [1440, 390]) {
    test(`worker viewport keeps measured wrappers, camera, source, focus and movement at ${width}`, async ({browser}) => {
        const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: true, ...(width === 390 ? {isMobile: true} : {})});
        const page = await context.newPage();
        await page.goto(target);
        const graph = page.locator('main[aria-label="PR25 source comparison graph"]');
        await expect(graph).toHaveAttribute('data-scene-mode', 'selected');
        const wrapperCount = await page.locator('.react-flow__node').count();
        const heavy = await page.locator('.minimal-entity,.minimal-change-graph').count();
        expect(heavy).toBeLessThan(wrapperCount);
        // Closed native readers do not mount full hunk rows or source identities.
        expect(await page.locator('details:not([open]) .document-reading').count()).toBe(0);
        const wrapper = page.locator('.react-flow__node').filter({has: page.getByRole('button', {name: 'Show source units', exact: true})}).first();
        await frame(page, wrapper);
        const before = await camera(page);
        await wrapper.getByRole('button', {name: 'Show source units', exact: true}).click();
        await expect(wrapper.getByRole('button', {name: 'Hide source units', exact: true})).toBeVisible();
        expect(await camera(page)).toBe(before);
        const more = wrapper.getByRole('button', {name: 'Show more source units', exact: true});
        if (await more.count()) {await more.click(); expect(await camera(page)).toBe(before);}
        await wrapper.getByRole('button', {name: 'Hide source units', exact: true}).click();
        expect(await camera(page)).toBe(before);
        const sourceNode = page.locator('.react-flow__node').filter({has: page.locator('summary').filter({hasText: /^View source changes$/})}).first();
        await frame(page, sourceNode);
        const summary = sourceNode.locator('summary').filter({hasText: /^View source changes$/});
        await summary.click();
        const reader = sourceNode.locator('.edit-preview-rows').first();
        await expect(reader).toBeAttached();
        const sourceText = await sourceNode.innerText();
        const sourceId = await sourceNode.getAttribute('data-id');
        const openCamera = await camera(page);
        const mover = sourceNode.getByRole('button', {name: /^Move /}).first();
        await mover.focus(); await page.keyboard.press('ArrowRight');
        expect(await camera(page)).toBe(openCamera);
        await expect(mover).toBeFocused();
        const worldPosition = await sourceNode.getAttribute('style');
        await page.mouse.move(width - 10, 850); await page.mouse.wheel(10000, 10000);
        await expect(graph).toHaveAttribute('data-scene-mode', 'selected');
        await expect(page.locator(`.react-flow__node[data-id="${sourceId}"]`)).toContainText(sourceText);
        await expect(mover).toBeFocused();
        expect(await sourceNode.getAttribute('style')).toBe(worldPosition);
        await page.setViewportSize({width, height: 720});
        await frame(page, sourceNode);
        await summary.click();
        await expect(sourceNode.locator('.edit-preview-rows')).toHaveCount(0);
        await summary.click(); await expect(sourceNode).toContainText(sourceText);
        // Actual input path: camera changes immediately even with an in-flight query.
        const oldCamera = await camera(page);
        await page.mouse.move(width - 10, 680); await page.mouse.wheel(80, 90);
        await expect.poll(() => camera(page)).not.toBe(oldCamera);
        await page.keyboard.down('Control'); await page.mouse.wheel(0, -120); await page.keyboard.up('Control');
        await expect(graph).toHaveAttribute('data-scene-mode', 'selected');
        await context.close();
    });
}

test('unsupported worker retains the full existing renderer and source controls', async ({page}) => {
    await page.addInitScript(() => {Object.defineProperty(window, 'Worker', {configurable: true, value: class {constructor() {throw new Error('worker_unavailable_for_fallback_test');}}});});
    await page.goto(target);
    await expect(page.locator('.minimal-edge-card').first()).toBeAttached();
    const graph = page.locator('main[aria-label="PR25 source comparison graph"]');
    await expect(graph).toHaveAttribute('data-scene-mode', 'full');
    const count = await page.locator('.react-flow__node').count();
    expect(await page.locator('.minimal-entity,.minimal-change-graph').count()).toBe(count);
    const start = await camera(page);await page.mouse.move(20, 850);await page.mouse.wheel(80, 90);
    await expect.poll(() => camera(page)).not.toBe(start);
});

test('a real-corpus curve and label remain mounted with both endpoint wrappers outside the viewport', async ({browser}) => {
    const control = await browser.newContext({viewport: {width:1440,height:900}});
    await control.addInitScript(() => {Object.defineProperty(window,'Worker',{value:class {constructor(){throw Error('full_control');}}});});
    const full = await control.newPage();await full.goto(target);
    await expect(full.locator('.minimal-edge-card').first()).toBeAttached();
    const longest = await full.locator('[data-route-id] .react-flow__edge-path').evaluateAll(paths => paths.map(path => {
        const d=path.getAttribute('d')!.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)!.map(Number);
        return {id:path.closest('[data-route-id]')!.getAttribute('data-route-id')!,start:{x:d[0]!,y:d[1]!},end:{x:d[4]!,y:d[5]!},middle:{x:(d[0]!+2*d[2]!+d[4]!)/4,y:(d[1]!+2*d[3]!+d[5]!)/4},length:Math.hypot(d[4]!-d[0]!,d[5]!-d[1]!)};
    }).sort((a,b)=>b.length-a.length)[0]!);
    expect(longest.length).toBeGreaterThan(3000);
    await control.close();
    const page = await browser.newPage({viewport:{width:1440,height:900}});await page.goto(target);
    const graph=page.locator('main[aria-label="PR25 source comparison graph"]');await expect(graph).toHaveAttribute('data-scene-mode','selected');
    for(let i=0;i<8;i++){
        const point=await page.locator('.react-flow__viewport').evaluate((element,middle)=>{const m=new DOMMatrix(getComputedStyle(element).transform);return {x:m.a*middle.x+m.e,y:m.d*middle.y+m.f};},longest.middle);
        if(Math.abs(point.x-720)<20&&Math.abs(point.y-450)<20)break;
        await page.mouse.move(1430,850);await page.mouse.wheel((point.x-720)*2,(point.y-450)*2);
    }
    await expect(graph).toHaveAttribute('data-scene-mode','selected');
    const id=JSON.stringify(longest.id);
    const path=page.locator(`[data-route-id=${id}] .react-flow__edge-path`);
    await expect(path).toBeAttached();await expect(page.locator(`[data-edge-id=${id}]`)).toBeAttached();
    const endpoints=await page.locator('.react-flow__viewport').evaluate((element,edge)=>{const m=new DOMMatrix(getComputedStyle(element).transform);return [edge.start,edge.end].map(p=>({x:m.a*p.x+m.e,y:m.d*p.y+m.f}));},longest);
    expect(endpoints.every(p=>p.x<0||p.x>1440||p.y<100||p.y>900)).toBe(true);
    await page.close();
});

test('touch canvas pan and pinch remain local while worker queries are pending', async ({browser}) => {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage();await page.goto(target);
    const graph=page.locator('main[aria-label="PR25 source comparison graph"]');await expect(graph).toHaveAttribute('data-scene-mode','selected');
    await page.mouse.move(380,800);await page.mouse.wheel(100000,100000);
    const session=await context.newCDPSession(page);
    const start=await camera(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:440,id:1}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:490,id:1}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(()=>camera(page)).not.toBe(start);
    const zoom=()=>page.locator('.react-flow__viewport').evaluate(element=>new DOMMatrix(getComputedStyle(element).transform).a);
    const beforeZoom=await zoom(),pageScale=await page.evaluate(()=>visualViewport?.scale);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:100,y:400,id:2},{x:290,y:600,id:3}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:70,y:370,id:2},{x:320,y:630,id:3}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(zoom).toBeGreaterThan(beforeZoom);expect(await page.evaluate(()=>visualViewport?.scale)).toBe(pageScale);
    await context.close();
});
