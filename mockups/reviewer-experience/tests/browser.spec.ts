import {test,expect} from '@playwright/test';
const evidence='/tmp/pr-reviewer-experience-mockup-evidence';
test('one coherent source-grounded journey keeps an anchored draft through evidence and exact paused Resume',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toContainText('without a token');await expect(page.locator('.graph-card')).toHaveCount(3);
 await page.screenshot({path:`${evidence}/desktop-opening.png`,fullPage:true});
 await page.getByRole('button',{name:'Next step',exact:true}).click();await expect(page.getByRole('region',{name:'Inline source reading'})).toContainText('Build request headers');
 await expect(page.locator('.source-side.after code')).toContainText('accessHeaders(captured)');await expect(page.locator('.source-side.before code')).toContainText('Authorization:');
 await page.screenshot({path:`${evidence}/desktop-inline-comparison.png`,fullPage:true});
 await page.locator('.graph-card.added').click();await page.locator('.source-side.after .range-picker summary').click();await page.getByLabel('after first line').fill('3');await page.getByLabel('after last line').fill('3');await page.getByRole('button',{name:'Select lines',exact:true}).click();
 await page.getByRole('button',{name:'Comment on selection'}).click();await expect(page.locator('.anchor-label')).toContainText('local-access.ts:3–3');
 await page.getByLabel('Your question').fill('What prevents an explicit invalid credential from becoming the owner?');
 await page.locator('.graph-card.context').click();await expect(page.locator('.source-side.after code')).toContainText('selectedSnapshotId');await expect(page.locator('.reading-title')).toContainText('Unchanged body');await page.getByRole('button',{name:'Back',exact:false}).click();
 await page.getByRole('button',{name:'Read gateway branch'}).click();await expect(page.locator('.source-side.after code')).toContainText('authorization===undefined?store.localOwner:authorization.slice(7)');
 await page.getByRole('button',{name:'Read test definition',exact:false}).click();await expect(page.getByRole('region',{name:'Inline source reading'})).toContainText('Test definition · unrun');await expect(page.locator('.source-side.after code')).toContainText('401');
 await page.locator('.thread > details > summary').click();await page.getByRole('button',{name:'Preview unknown delivery'}).click();await expect(page.getByRole('status')).toContainText('delivery unknown');
 await page.getByRole('button',{name:'Back',exact:false}).click();await expect(page.getByRole('region',{name:'Inline source reading'})).toContainText('Derive the local owner');
 await page.getByRole('button',{name:'Resume step 2'}).click();await expect(page.getByRole('region',{name:'Inline source reading'})).toContainText('Build request headers');await expect(page.getByLabel('Your question')).toHaveValue('What prevents an explicit invalid credential from becoming the owner?');
 await expect(page.locator('.anchor-label')).toContainText('local-access.ts:3–3');await expect(page.getByRole('navigation',{name:'Paused story player'})).toContainText('2 / 5');await expect(page.getByRole('button',{name:'Resume step 2'})).toHaveCount(0);expect(errors).toEqual([]);
});
test('prose selection, keyboard close and source-only/missing variants remain honest',async({page})=>{
 await page.goto('/');await page.locator('.prose-comment summary').click();await page.getByRole('button',{name:'Select first sentence'}).click();await page.getByRole('button',{name:'Comment on selection'}).click();
 await expect(page.locator('.anchor-label')).toContainText('Explanation v1');await page.getByLabel('Your question').fill('Is this only the local-owner branch?');await page.getByLabel('Your question').press('Escape');await expect(page.getByLabel('Contextual comment thread')).toHaveCount(0);
 await page.getByRole('button',{name:'Scott, human, one local comment draft'}).click();await expect(page.getByLabel('Your question')).toHaveValue('Is this only the local-owner branch?');
 await page.getByRole('button',{name:'Close thread, keep draft'}).click();await page.locator('.graph-card.modified').click();await page.getByText('Source availability example',{exact:true}).click();await page.getByRole('button',{name:'Show requested-source unavailable'}).click();await expect(page.getByRole('alert')).toContainText('Requested source unavailable');
 await page.getByRole('button',{name:'Context & scope'}).click();await page.getByRole('button',{name:'View source without prepared explanation'}).click();await expect(page.getByRole('navigation',{name:'Paused story player'})).toHaveCount(0);await expect(page.locator('.question-context')).toContainText('Explanation not available');await expect(page.locator('.graph-card')).toHaveCount(3);
});
for(const width of [390,320])test(`narrow ${width}: meaningful opening, inline code and contextual keyboard composer`,async({page})=>{
 await page.setViewportSize({width,height:width===390?844:720});await page.goto('/');await expect(page.locator('.graph-card.modified')).toBeVisible();
 const relation=await page.locator('.graph-card.added').boundingBox();const player=await page.locator('.player').boundingBox();expect((relation?.y??0)+(relation?.height??0)).toBeLessThan(player?.y??0);
 await page.screenshot({path:`${evidence}/${width}-opening.png`,fullPage:false});
 await page.getByRole('button',{name:'Next step',exact:true}).click();await page.locator('.graph-card.added').click();await page.locator('.source-side.after .range-picker summary').click();await page.getByLabel('after first line').fill('3');await page.getByLabel('after last line').fill('3');await page.getByRole('button',{name:'Select lines',exact:true}).click();await page.getByRole('button',{name:'Comment on selection'}).click();await page.getByLabel('Your question').fill('Does the gateway reject a supplied bad credential?');
 await page.getByLabel('Your question').scrollIntoViewIfNeeded();await page.screenshot({path:`${evidence}/${width}-thread.png`,fullPage:false});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.setViewportSize({width,height:430});await page.getByLabel('Your question').scrollIntoViewIfNeeded();await page.screenshot({path:`${evidence}/${width}-keyboard-height-simulation.png`,fullPage:false});
 await page.getByRole('button',{name:'Resume step 2'}).click();await expect(page.getByLabel('Your question')).toHaveValue('Does the gateway reject a supplied bad credential?');
});
