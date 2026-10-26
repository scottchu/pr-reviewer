import { test, expect } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
const evidence = '/tmp/pr-reviewer-reading-journey-evidence/r26-author';
for (const width of [1440, 390]) test(`${width} both comparison modes wrap exact logical source and keep paired heights`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  if (width >= 650) await page.getByRole('button', { name: 'Close review context', exact: true }).click();
  await page.getByRole('button', { name: 'Find source', exact: true }).click();
  await page.getByRole('combobox', { name: 'Changed source', exact: true }).selectOption('src/application/review.ts');
  await page.locator('[data-file-path="src/application/review.ts"]').click();
  const reader = page.locator('.continuous-reader');
  await expect(reader).toBeInViewport();
  for (const mode of ['Split', 'Unified'] as const) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    const result = await reader.evaluate(element => {
      const pane = element.querySelector<HTMLElement>('.continuous-comparison')!;
      const lines = [...element.querySelectorAll<HTMLElement>('.source-code')];
      const longest = [...lines].sort((a,b) => b.textContent!.length-a.textContent!.length)[0]!;
      const pairs = [...element.querySelectorAll<HTMLElement>('.paired-row')].map(row => {
        const sides = [...row.querySelectorAll<HTMLElement>(':scope > .diff-side')];
        return Math.abs(sides[0]!.getBoundingClientRect().height-sides[1]!.getBoundingClientRect().height);
      });
      return { width: pane.clientWidth, extent: pane.scrollWidth,
        exact: lines.every(line => line.textContent === line.parentElement!.dataset.sourceText),
        longestLength: longest.textContent!.length, longestHeight: longest.getBoundingClientRect().height,
        overflowing: lines.filter(line => line.scrollWidth > line.clientWidth+1).length, pairs,
        syntax: element.querySelectorAll('.syntax-keyword,.syntax-string').length };
    });
    expect(result.exact).toBe(true); expect(result.longestLength).toBeGreaterThan(180);
    expect(result.extent).toBeLessThanOrEqual(result.width+1);
    expect(result.overflowing).toBe(0); expect(result.longestHeight).toBeGreaterThan(22);
    expect(result.pairs.every(delta => delta<1)).toBe(true); expect(result.syntax).toBeGreaterThan(0);
    await page.screenshot({ path: `${evidence}/wrap-${width}-${mode}.png` });
  }
  const fold=page.locator('.fold-control').first();
  const pre=page.locator('.continuous-comparison pre');
  const extent=await pre.evaluate(e=>(e as HTMLElement).offsetHeight);
  await fold.click();
  await expect(fold).toHaveAttribute('aria-expanded','true');
  await expect.poll(()=>pre.evaluate(e=>(e as HTMLElement).offsetHeight)).toBeGreaterThan(extent);
  await reader.evaluate(e=>{e.scrollTop=120;});
  const top=await reader.evaluate(e=>e.scrollTop),camera=await page.locator('.react-flow__viewport').getAttribute('style');
  await page.getByRole('button',{name:'Open prepared story',exact:true}).click();
  await page.getByRole('button',{name:'Inspect head src/application/local-access.ts L3–3',exact:true}).first().click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file','src/application/local-access.ts');
  await page.getByRole('button',{name:'Return to original reading',exact:true}).click();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file','src/application/review.ts');
  await expect(reader).toHaveClass(/unified/);await expect(fold).toHaveAttribute('aria-expanded','true');
  await expect.poll(()=>reader.evaluate(e=>e.scrollTop)).toBe(top);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style',camera!);
  if(width<650&&await page.getByRole('button',{name:'Close prepared story',exact:true}).count())await page.getByRole('button',{name:'Close prepared story',exact:true}).click();
  await page.getByRole('button',{name:'Find source',exact:true}).click();
  await page.getByRole('combobox',{name:'Changed source',exact:true}).selectOption('src/application/local-access.ts');
  await page.locator('[data-file-path="src/application/local-access.ts"]').click();
  await page.getByRole('button',{name:'Split',exact:true}).click();
  expect(await page.locator('.diff-side.before .source-code').allTextContents()).toEqual(expect.arrayContaining(['']));
  expect((await page.locator('.diff-side.before .source-code').allTextContents()).every(text=>text==='')).toBe(true);
  expect((await page.locator('.diff-side.after .source-code').allTextContents()).join('')).toContain('accessHeaders');
  const shortNode=page.locator('.react-flow__node[data-id="file:src/application/local-access.ts"]');
  await expect.poll(async()=> (await shortNode.boundingBox())!.height).toBeLessThanOrEqual(width<650?580:640);
  if(width>=650)expect((await shortNode.boundingBox())!.height).toBeLessThan(640);
  await page.screenshot({path:`${evidence}/added-wrapped-${width}.png`});
});

test('390 touch pinch changes only graph camera while reader keeps local vertical scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });await page.goto('/');
  const ownership = await page.evaluate(() => {
    const root=document.getElementById('root')!;
    const multi=new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[new Touch({identifier:1,target:root}),new Touch({identifier:2,target:root})]});
    const one=new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[new Touch({identifier:1,target:root})]});
    root.dispatchEvent(multi);root.dispatchEvent(one);
    return { multiPrevented:multi.defaultPrevented, onePrevented:one.defaultPrevented };
  });
  expect(ownership).toEqual({multiPrevented:true,onePrevented:false});
  const cdp=await page.context().newCDPSession(page);
  const before=await page.locator('.react-flow__viewport').getAttribute('style');
  const toolbar=await page.locator('.workspace-actions').boundingBox();
  await cdp.send('Input.synthesizePinchGesture',{x:320,y:580,scaleFactor:1.35,relativeSpeed:800,gestureSourceType:'touch'});
  await expect(page.locator('.react-flow__viewport')).not.toHaveAttribute('style',before!);
  expect(await page.evaluate(()=>window.visualViewport!.scale)).toBe(1);
  const after=await page.locator('.workspace-actions').boundingBox();expect(after!.width).toBeCloseTo(toolbar!.width,0);
  await page.getByRole('button',{name:'Find source',exact:true}).click();
  await page.getByRole('combobox',{name:'Changed source',exact:true}).selectOption('src/application/review.ts');
  await page.locator('[data-file-path="src/application/review.ts"]').click();
  const reader=page.locator('.continuous-reader');await expect(reader).toBeInViewport();
  const b=(await reader.boundingBox())!,camera=await page.locator('.react-flow__viewport').getAttribute('style');
  await cdp.send('Input.synthesizePinchGesture',{x:b.x+b.width/2,y:b.y+Math.min(b.height/2,250),scaleFactor:1.35,relativeSpeed:800,gestureSourceType:'touch'});
  expect(await page.evaluate(()=>window.visualViewport!.scale)).toBe(1);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style',camera!);
  await cdp.send('Input.synthesizeScrollGesture',{x:b.x+b.width/2,y:b.y+Math.min(b.height-40,350),yDistance:-220,gestureSourceType:'touch'});
  await expect.poll(()=>reader.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({path:`${evidence}/gesture-390.png`});
});
