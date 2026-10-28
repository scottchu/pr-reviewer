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

test.describe('normal-motion wrapped source focus', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) test(`${width} Story request citation reveals line25 and Return keeps earliest origin`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    if (width >= 650) await page.getByRole('button', { name: 'Close review context', exact: true }).click();
    await page.getByRole('button', { name: 'Find source', exact: true }).click();
    await page.getByRole('combobox', { name: 'Changed source', exact: true }).selectOption('src/application/review.ts');
    await page.locator('[data-file-path="src/application/review.ts"]').click();
    const reader = page.locator('.continuous-reader');
    await expect(reader).toBeInViewport();
    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await page.locator('.fold-control').first().click();
    await reader.evaluate(e => { e.scrollTop = 70; });
    await page.locator('main').focus();
    for (let index=0; index<5; index++) {
      const left = (await page.locator('[data-file-path="src/application/review.ts"]').boundingBox())!.x;
      await page.keyboard.press('ArrowRight');
      await expect.poll(async () => (await page.locator('[data-file-path="src/application/review.ts"]').boundingBox())!.x).toBeLessThan(left-60);
    }
    const originalCamera = await page.locator('.react-flow__viewport').getAttribute('style');
    const originalTop = await reader.evaluate(e => e.scrollTop);
    await page.getByRole('button', { name: 'Open prepared story', exact: true }).click();
    await page.getByRole('button', { name: 'Next story step', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33', exact: true }).first().click();
    const row = page.locator('.diff-side.after .diff-line[data-after-line="25"]');
    await expect(reader).toBeVisible();
    const geometry = await row.evaluate(e => ({ rowTop: e.getBoundingClientRect().top, offsetTop: (e as HTMLElement).offsetTop, offsetParent: (e as HTMLElement).offsetParent?.className,
      readerTop: e.closest('.continuous-reader')!.getBoundingClientRect().top, readerHeight: e.closest('.continuous-reader')!.clientHeight, scrollTop: e.closest('.continuous-reader')!.scrollTop }));
    await info.attach('focus-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    await expect.poll(async () => {
      const a = (await row.boundingBox())!, b = (await reader.boundingBox())!;
      return a.y >= b.y+25 && a.y < b.y+b.height-22;
    }).toBe(true);
    await expect(row).toContainText('const request');
    await page.screenshot({ path: `${evidence}/exact-citation-${width}.png` });
    await page.getByRole('button', { name: 'Return to original reading', exact: true }).click();
    await expect(page.locator('.owner-step')).toHaveText('Compare the request and its exact header helper');
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
    await expect.poll(() => reader.evaluate(e => e.scrollTop)).toBe(originalTop);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', originalCamera!);
  });
});

test.describe('compact exact change navigation', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) for (const mode of ['Split', 'Unified'] as const) {
    test(`${width} ${mode} every marker keeps its actual change and manual scrolling hands back`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      if (width >= 650) await page.getByRole('button', { name: 'Close review context', exact: true }).click();
      await page.getByRole('button', { name: 'Find source', exact: true }).click();
      await page.getByRole('combobox', { name: 'Changed source', exact: true }).selectOption('src/application/review.ts');
      await page.locator('[data-file-path="src/application/review.ts"]').click();
      await page.getByRole('button', { name: mode, exact: true }).click();
      const reader = page.locator('.continuous-reader');
      const dots = page.locator('.change-dot');
      await expect(dots).toHaveCount(4);
      for (let index = 0; index < 4; index++) {
        await dots.nth(index).click();
        await expect(dots.nth(index)).toHaveAttribute('aria-current', 'location');
        const changed = page.locator(`.continuous-hunk[data-hunk="${index}"] .diff-line.added, .continuous-hunk[data-hunk="${index}"] .diff-line.removed`).first();
        await expect.poll(async () => {
          const row = await changed.boundingBox(), pane = await reader.boundingBox();
          return !!row && !!pane && row.y >= pane.y + 31 && row.y < pane.y + pane.height - 20;
        }).toBe(true);
        // A late programmatic event must not replace the deliberate target.
        await reader.evaluate(element => element.dispatchEvent(new Event('scroll')));
        await expect(dots.nth(index)).toHaveAttribute('aria-current', 'location');
        await page.getByRole('button', { name: 'Explain current source comparison', exact: true }).click();
        await expect(page.locator('.relationship-reader .reader-heading strong')).toHaveText(`Change ${index + 1}`);
        await page.getByRole('button', { name: 'Close relationship explanation', exact: true }).click();
      }
      const centers = await dots.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect(); return { y: rect.y + rect.height / 2, height: rect.height };
      }));
      for (let index = 1; index < centers.length; index++) {
        expect(centers[index]!.y - centers[index - 1]!.y).toBe(width < 650 ? 44 : 36);
        expect(centers[index]!.y - centers[index - 1]!.y).toBeGreaterThanOrEqual(centers[index]!.height);
      }
      await expect(page.locator('.continuous-hunk[data-hunk="3"]')).toContainText('login:async');
      await reader.hover(); await page.mouse.wheel(0, -100000);
      await expect(dots.first()).toHaveAttribute('aria-current', 'location');
      const fold = page.locator('.fold-control').first();
      await fold.click();
      await page.setViewportSize({ width: width === 390 ? 400 : 1380, height: 900 });
      await dots.nth(3).focus(); await page.keyboard.press('Enter');
      await expect(dots.nth(3)).toHaveAttribute('aria-current', 'location');
      await expect.poll(async () => {
        const pane = await reader.boundingBox();
        const row = await page.locator('.continuous-hunk[data-hunk="3"] .diff-line.added').first().boundingBox();
        return !!row && !!pane && row.y >= pane.y + 31 && row.y < pane.y + pane.height - 20;
      }).toBe(true);
      await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r28-navigation/${width}-${mode}.png` });
    });
  }
});
