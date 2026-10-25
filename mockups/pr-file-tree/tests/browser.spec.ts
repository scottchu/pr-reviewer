import {test,expect,type Page} from '@playwright/test';
import fixture from '../paths.json' with {type:'json'};
const evidence='/tmp/pr-reviewer-pr-file-tree-evidence';
const viewport=async(page:Page)=>page.locator('.react-flow__viewport').evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {x:m.e,y:m.f,zoom:m.a};});
test('whole PR tree contains exactly the pinned filenames, pans, gesture zooms and resets at readable scale',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.evaluate(()=>document.fonts.ready);
 const paths=await page.locator('[data-file-path]').evaluateAll(es=>es.map(e=>e.getAttribute('data-file-path')!).sort());expect(paths).toEqual([...fixture.paths].sort());
 for(const label of await page.locator('[data-file-path]').all()){const path=await label.getAttribute('data-file-path');await expect(label).toHaveText(path!.split('/').at(-1)!);await expect(label).toHaveAttribute('title',path!);}
 const sizes=await page.locator('.react-flow__node').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})));expect(sizes.every(s=>s.height===22&&s.width<300)).toBe(true);await expect(page.getByRole('button')).toHaveCount(1);
 const initial=await viewport(page);expect(initial.zoom).toBe(1);
 await page.screenshot({path:`${evidence}/desktop.png`});
 await page.mouse.move(1100,500);await page.mouse.down();await page.mouse.move(900,420,{steps:5});await page.mouse.up();await expect.poll(async()=>Math.round((await viewport(page)).x)).not.toBe(Math.round(initial.x));
 const panned=await viewport(page);await page.mouse.wheel(0,100);await expect.poll(async()=>Math.round((await viewport(page)).y)).not.toBe(Math.round(panned.y));
 await page.keyboard.down('Control');await page.mouse.wheel(0,-200);await page.keyboard.up('Control');await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(initial.zoom);await page.screenshot({path:`${evidence}/desktop-panned-zoomed.png`});
 await page.getByRole('button',{name:'Reset view'}).click();await expect.poll(async()=>await viewport(page)).toEqual(initial);expect(errors).toEqual([]);
});
test('390px full-window tree has legible filenames, synthetic touch pinch and keyboard pan/zoom without page scroll',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('[data-file-path]')).toHaveCount(50);await page.evaluate(()=>document.fonts.ready);const initial=await viewport(page);expect(initial.zoom).toBe(1);
 await page.screenshot({path:`${evidence}/390.png`});expect(await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}))).toEqual({width:390,height:844});
 const session=await context.newCDPSession(page);await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await session.send('Input.synthesizePinchGesture',{x:200,y:400,scaleFactor:1.4,relativeSpeed:800,gestureSourceType:'touch'});await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(1);
 await page.getByRole('button',{name:'Reset view'}).click();await expect.poll(async()=>await viewport(page)).toEqual(initial);
 await page.locator('main').focus();await page.keyboard.press('ArrowRight');await expect.poll(async()=>(await viewport(page)).x).toBe(initial.x-80);await page.keyboard.press('+');await expect.poll(async()=>(await viewport(page)).zoom).toBeGreaterThan(1);await page.screenshot({path:`${evidence}/390-panned-zoomed.png`});
 await page.keyboard.press('0');await expect.poll(async()=>await viewport(page)).toEqual(initial);await expect(page.locator('[data-file-path]')).toHaveCount(50);expect(await page.evaluate(()=>scrollY)).toBe(0);
});
