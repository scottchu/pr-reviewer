import {test,expect,type Page} from '@playwright/test';
import fixture from '../paths.json' with {type:'json'};
const evidence='/tmp/pr-reviewer-pr-file-tree-evidence';
const viewport=async(page:Page)=>page.locator('.react-flow__viewport').evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {x:m.e,y:m.f,zoom:m.a};});
test('whole PR tree contains exactly the pinned filenames, pans, gesture zooms and resets at readable scale',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.evaluate(()=>document.fonts.ready);
 const paths=await page.locator('[data-file-path]').evaluateAll(es=>es.map(e=>e.getAttribute('data-file-path')!).sort());expect(paths).toEqual([...fixture.paths].sort());
 for(const label of await page.locator('[data-file-path]').all()){const path=await label.getAttribute('data-file-path');const change=fixture.changes[path! as keyof typeof fixture.changes];await expect(label).toHaveText(`${change==='added'?'+ ':change==='modified'?'~ ':'− '}${path!.split('/').at(-1)!}`);await expect(label).toHaveAttribute('title',`${path} · ${change}`);}
 const sizes=await page.locator('.react-flow__node').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})));expect(sizes.every(s=>s.height>=22&&s.height<=26&&s.width<300)).toBe(true);await expect(page.locator('header button')).toHaveCount(1);
 const initial=await viewport(page);expect(initial.zoom).toBe(1);
 await page.screenshot({path:`${evidence}/desktop.png`});
 await page.mouse.move(1100,500);await page.mouse.down();await page.mouse.move(900,420,{steps:5});await page.mouse.up();await expect.poll(async()=>Math.round((await viewport(page)).x)).not.toBe(Math.round(initial.x));
 const panned=await viewport(page);await page.mouse.wheel(0,100);await expect.poll(async()=>Math.round((await viewport(page)).y)).not.toBe(Math.round(panned.y));
 await page.keyboard.down('Control');await page.mouse.wheel(0,-200);await page.keyboard.up('Control');await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(initial.zoom);await page.screenshot({path:`${evidence}/desktop-panned-zoomed.png`});
 await page.getByRole('button',{name:'Overview'}).click();await expect.poll(async()=>await viewport(page)).toEqual(initial);expect(errors).toEqual([]);
});
test.describe('touch-capable narrow viewport',()=>{test.use({hasTouch:true});
test('390px full-window tree has legible filenames, synthetic touch pinch and keyboard pan/zoom without page scroll',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.evaluate(()=>document.fonts.ready);const initial=await viewport(page);expect(initial.zoom).toBe(1);
 await page.screenshot({path:`${evidence}/390.png`});expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}))).toEqual({width:390,height:844});
 const session=await context.newCDPSession(page);await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await session.send('Input.synthesizePinchGesture',{x:200,y:400,scaleFactor:1.4,relativeSpeed:800,gestureSourceType:'touch'});await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(1);
 await page.getByRole('button',{name:'Overview'}).click();await expect.poll(async()=>(await viewport(page)).zoom).toBe(1);const overview=await viewport(page);const root=await page.locator('[data-id="directory:."]').boundingBox();expect(root!.x).toBeGreaterThanOrEqual(0);expect(root!.x+root!.width).toBeLessThan(390);
 await page.locator('main').focus();await page.keyboard.press('ArrowRight');await expect.poll(async()=>(await viewport(page)).x).toBe(overview.x-80);await page.keyboard.press('+');await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(1);await page.screenshot({path:`${evidence}/390-panned-zoomed.png`});
 await page.keyboard.press('0');await expect.poll(async()=>await viewport(page)).toEqual(overview);await expect(page.locator('[data-file-path]')).toHaveCount(50);expect(await page.evaluate(()=>scrollY)).toBe(0);
});

});

test('selecting review.ts overlays verified before/after imports and unchanged filename context while retaining all50 changed paths',async({page})=>{
 await page.goto('/');await page.locator('[data-file-path="src/application/review.ts"]').click();await expect(page.locator('.import-label')).toHaveCount(5);await expect(page.locator('[data-file-path]')).toHaveCount(50);
 await expect(page.locator('[data-context-path="src/domain/public.ts"]')).toHaveText('public.ts');await expect(page.locator('[data-context-path="src/application/public.ts"]')).toHaveText('public.ts');
 const added=page.locator('.import-label').filter({hasText:'+ imports'});await expect(added).toHaveCount(1);await expect(added).toHaveAttribute('title',new RegExp(`after ${fixture.head}`));await expect(added).toHaveAttribute('title',/src\/application\/review.ts:1/);
 await page.screenshot({path:`${evidence}/desktop-selected-imports.png`});await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Overview'}).click();await page.screenshot({path:`${evidence}/390-overview.png`});
 await page.locator('main').focus();await page.keyboard.press('Escape');await expect(page.locator('.import-label')).toHaveCount(0);await expect(page.locator('[data-context-path]')).toHaveCount(0);await expect(page.locator('[data-file-path]')).toHaveCount(50);
});

test('zoom reveals the same file object and native diff; source selection/scroll stays local and zoom out keeps the tree',async({page})=>{
 await page.goto('/');const file=page.locator('[data-id="file:scripts/dev.ts"]');const overview=await file.boundingBox();expect(overview!.height).toBe(26);await page.screenshot({path:`${evidence}/semantic-desktop-overview.png`});
 await page.mouse.move(overview!.x+overview!.width/2,overview!.y+13);await page.keyboard.down('Control');await page.mouse.wheel(0,-28);await page.keyboard.up('Control');const diff=page.getByRole('region',{name:'Pinned diff for scripts/dev.ts'});await expect(diff).toBeVisible();await expect(page.locator('[data-expanded-file]')).toHaveCount(1);await expect(page.locator('[data-file-path]')).toHaveCount(50);await expect(diff.locator('.removed')).toContainText(['node:fs']);
 await expect(page.locator('[data-external-module="node:fs"]')).toHaveText('node:fs');const removed=page.locator('.import-label[title*="imports node:fs"]');await expect(removed).toHaveText('− imports');await expect(removed).toHaveAttribute('title',/External module identity only/);
 await page.screenshot({path:`${evidence}/semantic-desktop-diff.png`});const before=await viewport(page);const line=await diff.locator('.diff-side.before .diff-line.removed').first().boundingBox();await page.mouse.move(line!.x+60,line!.y+8);await page.mouse.down();await page.mouse.move(line!.x+200,line!.y+8,{steps:5});await page.mouse.up();expect(await page.evaluate(()=>window.getSelection()?.toString().length??0)).toBeGreaterThan(0);expect(await viewport(page)).toEqual(before);
 const bounds=await diff.boundingBox();await page.mouse.move(bounds!.x+150,Math.min(bounds!.y+180,850));await page.mouse.wheel(0,260);await expect.poll(async()=>diff.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);expect(await viewport(page)).toEqual(before);
 await page.mouse.move(overview!.x+overview!.width/2,overview!.y+13);await page.keyboard.down('Control');await page.mouse.wheel(0,28);await page.keyboard.up('Control');await expect(page.locator('[data-expanded-file]')).toHaveCount(0);await expect(page.locator('[data-id="file:scripts/dev.ts"]')).toHaveCount(1);await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.screenshot({path:`${evidence}/semantic-desktop-collapsed-red-import.png`});
});
test('390 explicit file focus reveals actual before/after inside that node and Overview retains all identities',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');const id='file:src/application/review.ts';await page.screenshot({path:`${evidence}/semantic-390-overview.png`});await page.locator('[data-file-path="src/application/review.ts"]').click();const diff=page.getByRole('region',{name:'Pinned diff for src/application/review.ts'});await expect(diff).toBeVisible();await expect(page.locator(`[data-id="${id}"] [data-expanded-file]`)).toHaveCount(1);await expect(diff.locator('.diff-side.before').first()).toBeVisible();await expect(diff.locator('.diff-side.after').first()).toBeVisible();await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.screenshot({path:`${evidence}/semantic-390-diff.png`});
 const before=await viewport(page);const bounds=await diff.boundingBox();await page.mouse.move(bounds!.x+150,bounds!.y+200);await page.mouse.wheel(0,260);await expect.poll(async()=>diff.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);expect(await viewport(page)).toEqual(before);await page.getByRole('button',{name:'Overview',exact:true}).click();await expect(page.locator('[data-expanded-file]')).toHaveCount(0);await expect(page.locator(`[data-id="${id}"]`)).toHaveCount(1);await expect(page.locator('[data-file-path]')).toHaveCount(50);expect(await page.evaluate(()=>scrollY)).toBe(0);
});
