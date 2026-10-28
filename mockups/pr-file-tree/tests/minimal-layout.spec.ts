import { test, expect } from '@playwright/test';
for (const width of [1440,390]) {
 test.describe(String(width),()=>{
 test.use({viewport:{width,height:900},hasTouch:true});
 test('node, group and label gestures only change layout',async({page})=>{
 await page.goto('https://mac-mini.duckbill-ionian.ts.net:8478/');
 const pane=page.locator('.react-flow__pane');
 const move=async(x:number,y:number,dx:number,dy:number)=>{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:8});await page.mouse.up();};
 await page.locator('[data-testid="rf__node-request"]').waitFor({state:'visible'});
 if(width===390) { await move(200,700,-120,0); await move(200,700,-120,0); }
 const node=page.locator('[data-testid="rf__node-request"]');const group=page.locator('[data-testid="rf__node-change"]');
 const before=await node.boundingBox();expect(before).not.toBeNull();
 const path=page.locator('[data-testid="rf__edge-request-before:constructs:bearer-before"] .react-flow__edge-path'); const oldPath=await path.getAttribute('d');
 const viewport=page.locator('.react-flow__viewport');const camera=await viewport.getAttribute('style');
 await move(before!.x+60,before!.y+25,40,25);
 await expect.poll(async()=>Math.round((await node.boundingBox())!.x-before!.x)).toBeGreaterThan(25);
 expect(await viewport.getAttribute('style')).toBe(camera);expect(await path.getAttribute('d')).not.toBe(oldPath);
 const g=await group.boundingBox();const child=await node.boundingBox();
 await move(Math.max(30,g!.x+100),g!.y+30,30,20);
 await expect.poll(async()=>Math.round((await node.boundingBox())!.x-child!.x)).toBeGreaterThan(15);
 expect(Math.round((await node.boundingBox())!.x-child!.x)).toBe(Math.round((await group.boundingBox())!.x-g!.x));
 const label=page.locator('[data-edge-id="request-before:constructs:bearer-before"]');
 const box=await label.boundingBox();const cam=await viewport.getAttribute('style');
 await move(box!.x+20,box!.y+15,35,20);
 await expect.poll(async()=>Math.round((await label.boundingBox())!.x-box!.x)).toBe(35);
 expect(await viewport.getAttribute('style')).toBe(cam);
 await label.focus();await label.press('ArrowRight');await expect.poll(async()=>Math.round((await label.boundingBox())!.x-box!.x)).toBe(45);
 await label.press('Home');
 await page.mouse.move(width/2,650);await page.mouse.wheel(0,200);await expect.poll(()=>viewport.getAttribute('style')).not.toBe(cam);
 const zoomBox=await label.boundingBox();const zoomCamera=await viewport.getAttribute('style');
 await move(zoomBox!.x+20,zoomBox!.y+15,30,15);
 await expect.poll(async()=>Math.round((await label.boundingBox())!.x-zoomBox!.x)).toBe(30);
 expect(await viewport.getAttribute('style')).toBe(zoomCamera);
 const unchanged=page.locator('[data-edge-id="refresh:unchanged-location:review-file"]');
 await expect(unchanged).toContainText('Before b096826 L34–44');await expect(unchanged).toContainText('After e3b270e L35–45');
 expect(await page.locator('[data-edge-id^="refresh:source-location"]').count()).toBe(0);
 });
 });
}

test('390 touch input moves nodes and labels without moving the camera',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();
 await page.goto('https://mac-mini.duckbill-ionian.ts.net:8478/');await page.locator('[data-testid="rf__node-request"]').waitFor();
 for(let i=0;i<2;i++){await page.mouse.move(200,700);await page.mouse.down();await page.mouse.move(80,700,{steps:8});await page.mouse.up();}
 const session=await context.newCDPSession(page);
 const touch=async(x:number,y:number,dx:number,dy:number)=>{await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 const viewport=page.locator('.react-flow__viewport');const camera=await viewport.getAttribute('style');const node=page.locator('[data-testid="rf__node-request"]');const before=await node.boundingBox();
 await touch(before!.x+50,before!.y+25,70,30);await expect.poll(async()=>Math.round((await node.boundingBox())!.x-before!.x)).toBeGreaterThan(45);expect(await viewport.getAttribute('style')).toBe(camera);
 const label=page.locator('[data-edge-id="request-before:constructs:bearer-before"]');const box=await label.boundingBox();
 await touch(box!.x+20,box!.y+15,30,20);await expect.poll(async()=>Math.round((await label.boundingBox())!.x-box!.x)).toBe(30);expect(await viewport.getAttribute('style')).toBe(camera);
 await context.close();
});
