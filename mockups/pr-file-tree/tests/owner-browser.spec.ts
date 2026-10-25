import { test, expect, type Page, type Locator } from '@playwright/test';

const openFiles = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'File tree', exact: true }).click();
};
import { projectCalls } from '../calls.ts';

test.use({ reducedMotion: 'reduce' });

for (const width of [1440, 390]) {
  test(`${width} real owner story, explicit evidence, saved question and original draft return`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 844 });
    await openFiles(page);
    await expect(page.getByRole('button', { name: 'Open prepared story' })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Prepared story' })).toHaveCount(0);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    const expanded = page.locator('[data-expanded-file]');
    await expect(expanded).toHaveCount(0);
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill(`Original draft ${width}`);
    await page.getByRole('button', { name: 'Close discussion' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    const story = page.getByRole('region', { name: 'Prepared story' });
    await expect(story).toContainText('local-user');
    await expect(page.locator('.owner-story').getByRole('heading', { name: 'Prepared source account', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next story step' }).click();
    await expect(story).toContainText('Trace an unchanged caller');
    await expect(expanded).toHaveCount(0);
    await expect(page.locator('[data-file-path]')).toHaveCount(50);
    await page.getByRole('button', { name: 'Previous story step' }).click();
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r8-story-${width}.png` });
    await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33' }).first().click();
    await expect(expanded).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
    const head = await page.locator('.diff-side.after [data-after-line="30"],.unified-row [data-after-line="30"]').first().boundingBox();
    const graph = await page.locator('main').boundingBox();
    expect(head).not.toBeNull();
    expect(head!.x).toBeGreaterThanOrEqual(graph!.x);
    expect(head!.x).toBeLessThan(graph!.x + graph!.width);
    await page.getByRole('button', { name: 'Open discussion' }).click();
    const discussion = page.getByRole('region', { name: 'Source discussion' });
    await discussion.getByRole('button', { name: 'Use inspected range for question' }).click();
    await expect(discussion).toContainText('head · src/application/review.ts:25–33');
    const questionText = `Owner journey ${width} ${Date.now()}`;
    await discussion.getByRole('textbox', { name: 'Your question' }).fill(questionText);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r8-evidence-draft-${width}.png` });
    await discussion.getByRole('button', { name: 'Save question' }).click();
    const savedRow = discussion.locator('[data-saved-question]').filter({ hasText: questionText });
    await expect(savedRow).toContainText('Saved · attach a session');
    const savedId = await savedRow.getAttribute('data-saved-question');
    const response = await request.get(`/api/questions/${savedId}?reviewId=pr-25`);
    expect(response.ok()).toBe(true);
    const saved = await response.json();
    expect(saved.question.text).toBe(questionText);
    expect(saved.question.actorId).toBe('local-user');
    expect(saved.question.anchor.path).toBe('src/application/review.ts');
    expect(saved.replies).toEqual([]);
    await page.getByRole('button', { name: 'Close discussion' }).click();
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(expanded).toHaveCount(0);
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue(`Original draft ${width}`);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r8-owner-${width}.png` });
  });
}

test('dirty anchor confirmation and failed owner return preserve recoverable reading and drafts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFiles(page);
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  const initialCamera = await page.locator('.react-flow__viewport').getAttribute('style');
  const overview = await page.locator('header button[aria-label="Overview"]').boundingBox();
  await page.mouse.click(overview!.x + overview!.width / 2, overview!.y + overview!.height / 2);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', initialCamera!);
  expect(await page.locator('header').evaluate(element => element.contains(document.activeElement))).toBe(false);
  await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33' }).first().click();
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await page.getByRole('button', { name: 'Use inspected range for question' }).click();
  await page.getByRole('textbox', { name: 'Your question' }).fill('Keep this exploration text');
  await page.getByRole('button', { name: 'Close discussion' }).click();
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  await page.getByRole('button', { name: 'Inspect base src/application/review.ts L24–32' }).first().click();
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await page.getByRole('button', { name: 'Use inspected range for question' }).click();
  await expect(page.getByRole('group', { name: 'Confirm question range' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep current range' }).click();
  await expect(page.getByRole('region', { name: 'Source discussion' })).toContainText('head · src/application/review.ts:25–33');
  await page.getByRole('button', { name: 'Use inspected range for question' }).click();
  await page.getByRole('button', { name: 'Replace question range' }).click();
  await expect(page.getByRole('region', { name: 'Source discussion' })).toContainText('base · src/application/review.ts:24–32');
  await page.getByRole('button', { name: 'Close discussion' }).click();
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.route('**/api/story?**', route => route.abort());
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Return to original reading' })).toBeVisible();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', camera!);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Keep this exploration text');
});

const panTo = async (page: Page, locator: Locator) => {
  await page.locator('main').focus();
  for (let attempt = 0; attempt < 100; attempt++) {
    const box = await locator.boundingBox();
    if (box && Math.abs(box.x - 20) <= 65 && Math.abs(box.y - 110) <= 65) return;
    await page.keyboard.press(!box || box.x > 85 ? 'ArrowRight'
      : box.x < -45 ? 'ArrowLeft' : box.y > 175 ? 'ArrowDown' : 'ArrowUp');
  }
  throw new Error('source_context_not_exposed');
};
const reading = async (page: Page) => ({
  camera: await page.locator('.react-flow__viewport').getAttribute('style'),
  top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
  left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
  mode: await page.getByRole('button', { name: 'Unified', exact: true }).getAttribute('aria-pressed'),
  folds: await page.locator('.fold-control[aria-expanded="true"]').allTextContents(),
  tests: await page.locator('[data-declared-test]').count(),
});
const expectReading = async (page: Page, saved: Awaited<ReturnType<typeof reading>>) => {
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', saved.camera!);
  await expect.poll(() => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBeCloseTo(saved.top, 0);
  await expect.poll(() => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBeCloseTo(saved.left, 0);
  await expect(page.getByRole('button', { name: 'Unified', exact: true })).toHaveAttribute('aria-pressed', saved.mode!);
  expect(await page.locator('.fold-control[aria-expanded="true"]').allTextContents()).toEqual(saved.folds);
  await expect(page.locator('[data-declared-test]')).toHaveCount(saved.tests);
};

test('owner return retains the earlier function/test/Context frames and exact folded reading', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openFiles(page);
  const path = 'src/application/review.ts';
  const file = page.locator(`[data-file-path="${path}"]`);
  await panTo(page, file);
  await file.click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.locator('.fold-control').first().click();
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 95; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
  const seed = projectCalls(path).seeds.find(node => node.name === 'request' && node.declaration.side === 'head')!;
  const identity = page.locator(`[data-function-id="${seed.id}"]`);
  await panTo(page, identity);
  const original = await reading(page);
  await identity.getByRole('button', { name: /^Read After/ }).click();
  await panTo(page, identity);
  await identity.getByRole('button', { name: /^Relevant tests/ }).click();
  const test = page.locator('[data-declared-test="review-owner-changed"]');
  await panTo(page, test);
  const functionReading = await reading(page);
  await test.click();
  await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 160; });
  await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 95; });
  const testReading = await reading(page);
  await page.getByRole('button', { name: 'Open review context' }).click();
  await page.getByRole('button', { name: 'Read the captured runtime requirement' }).click();
  const contextReading = await reading(page);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await page.getByRole('textbox', { name: 'Your question' }).fill('Original nested draft');
  await page.getByRole('button', { name: 'Close discussion' }).click();
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  const citation = page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33' }).first();
  await citation.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.continuous-reader')).toBeFocused();
  await page.getByRole('button', { name: 'Return to original reading' }).click();
  await expectReading(page, contextReading);
  const back = page.getByRole('button', { name: 'Back to source context' });
  await back.click();
  await expectReading(page, testReading);
  await back.click();
  await expectReading(page, functionReading);
  await back.click();
  await expectReading(page, original);
  await expect(page.locator('[data-file-path]')).toHaveCount(50);
  await page.getByRole('button', { name: 'Open discussion' }).click();
  await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Original nested draft');
});

test('an in-flight source validation exposes a busy state and cannot accept a competing citation', async ({ page }) => {
  await openFiles(page);
  await page.getByRole('button', { name: 'Open prepared story' }).click();
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = async (...args: Parameters<SubtleCrypto['digest']>) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return digest(...args);
    };
  });
  await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33' }).first().click();
  await expect(page.getByRole('button', { name: 'Inspect base src/application/review.ts L24–32' }).first()).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'Validating source' })).toBeVisible();
  await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/review.ts');
  await expect(page.getByRole('button', { name: 'Inspect base src/application/review.ts L24–32' }).first()).toBeEnabled();
});


test.describe('explicit guided attention with normal motion', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) test(`${width} visible step stays still, offscreen steps preserve the first public and local reading`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('Original guided attention draft');
    await page.getByRole('button', { name: 'Close discussion' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    const original = await page.locator('.react-flow__viewport').getAttribute('style');
    const zoom = (style: string | null) => style!.match(/scale\(([^)]+)\)/)![1];
    await page.getByRole('button', { name: 'Next story step' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
    await expect(page.getByRole('button', { name: 'Return to original reading' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Next story step' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Compare owner recognition with credential lookup');
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    await expect.poll(async () => (await page.locator('[data-file-path="src/storage/public.ts"]').boundingBox())!.y).toBeLessThan(900);
    expect(zoom(await page.locator('.react-flow__viewport').getAttribute('style'))).toBe(zoom(original));
    await expect(page.getByRole('button', { name: 'Previous story step' })).toBeEnabled();
    await page.getByRole('button', { name: 'Previous story step' }).click();
    await page.getByRole('button', { name: 'Next story step' }).click();
    await page.getByRole('button', { name: 'Inspect head src/storage/public.ts L200–204' }).first().click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/storage/public.ts');
    if (width < 650) await page.getByRole('button', { name: 'Open prepared story' }).click();
    await expect(page.getByRole('button', { name: 'Previous story step' })).toBeDisabled();
    if (width < 650) await page.getByRole('button', { name: 'Close prepared story' }).click();
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
    if (width < 650) await page.getByRole('button', { name: 'Close prepared story' }).click();
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Original guided attention draft');
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r19-return-${width}.png` });
  });
});


test.describe('guided original panel and reading', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) test(`${width} attention Return restores Story panel scroll and original folded reading without reopen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    if (width >= 650) await page.getByRole('button', { name: 'Close review context' }).click();
    await page.getByRole('button', { name: 'Find source', exact: true }).click();
    await page.getByRole('combobox', { name: 'Changed source' }).selectOption('src/application/private-session.ts');
    await page.locator('[data-file-path="src/application/private-session.ts"]').click();
    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.clientWidth)).toBeGreaterThan(width < 650 ? 280 : 700);
    await page.locator('.fold-control').first().click();
    await expect.poll(async () => (await page.locator('[data-expanded-file]').boundingBox())!.height).toBeGreaterThan(500);
    await page.locator('.continuous-reader').evaluate(element => { element.scrollTop = 70; });
    await page.locator('.continuous-comparison').evaluate(element => { element.scrollLeft = 80; });
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('Original folded guided draft');
    await page.getByRole('button', { name: 'Close discussion' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    const panel = page.locator('.owner-story');
    await panel.evaluate(element => { element.scrollTop = 24; });
    const next = page.getByRole('button', { name: 'Next story step' });
    await next.evaluate(element => element.focus({ preventScroll: true }));
    const originalReading = async () => ({
      camera: await page.locator('.react-flow__viewport').getAttribute('style'),
      top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
      left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
      split: await page.locator('.continuous-reader').evaluate(element => element.classList.contains('split')),
      folds: await page.locator('.fold-control[aria-expanded="true"]').allTextContents(),
      panelTop: await panel.evaluate(element => element.scrollTop),
    });
    const original = await originalReading();
    await page.keyboard.press('Enter');
    await next.click();
    await page.getByRole('button', { name: 'Inspect head src/storage/public.ts L200–204' }).first().click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/storage/public.ts');
    if (width === 1440) {
      const held = await page.locator('.react-flow__viewport').getAttribute('style');
      await page.route('**/api/story?**', route => route.abort());
      await page.getByRole('button', { name: 'Return to original reading' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/storage/public.ts');
      await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', held!);
      await expect(page.getByRole('button', { name: 'Return to original reading' })).toBeVisible();
      await page.unroute('**/api/story?**');
    }
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(panel).toBeVisible();
    await expect(page.locator('.owner-step')).toHaveText('Compare the request and its exact header helper');
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/application/private-session.ts');
    await expect.poll(originalReading).toEqual(original);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r19-panel-return-${width}.png` });
    await page.getByRole('button', { name: 'Close prepared story' }).click();
    await page.getByRole('button', { name: 'Open discussion' }).click();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toHaveValue('Original folded guided draft');
  });
});


test.describe('guided camera intent ownership', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('rapid Next Previous, closing Story and a manual pan cannot finish an older target movement', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Close review context' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    await page.getByRole('button', { name: 'Next story step' }).click();
    const original = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.getByRole('button', { name: 'Next story step' }).click();
    await page.getByRole('button', { name: 'Previous story step' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
    await page.getByRole('button', { name: 'Close prepared story' }).click();
    const graph = (await page.locator('.pr-graph').boundingBox())!;
    await page.mouse.move(graph.x + graph.width / 2, graph.y + 100);
    await page.mouse.down();
    await page.mouse.move(graph.x + graph.width / 2 + 60, graph.y + 140, { steps: 5 });
    await page.mouse.up();
    const manual = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.waitForTimeout(600);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', manual!);
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
  });
});

test.describe('supporting actual answered-question source with normal motion', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) test(`${width} reply citations return to the immediate answer before the original Story`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    if (width >= 650) await page.getByRole('button', { name: 'Close review context' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    await page.getByRole('button', { name: 'Next story step' }).click();
    const earliestCamera = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.getByRole('button', { name: 'Next story step' }).click();
    await page.getByRole('button', { name: 'Inspect head src/storage/public.ts L200–204' }).first().click();
    await expect(page.locator('[aria-label="Back to answer"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Split', exact: true }).click();
    await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.clientWidth)).toBeGreaterThan(width < 650 ? 280 : 700);
    await page.getByRole('button', { name: 'Open discussion' }).click();
    const discussion = page.locator('.owner-discussion');
    const question = discussion.locator('[data-saved-question]').filter({ hasText: 'When an explicit invalid Bearer token is supplied' });
    await expect(question).toHaveCount(1);
    await expect(question).toContainText('26545167-0d82-4f0c-8af4-bb4b16252476');
    const gateway = question.getByRole('button', { name: 'Inspect head src/server/public.ts L61–67', exact: true });
    await gateway.focus();
    const origin = {
      camera: await page.locator('.react-flow__viewport').getAttribute('style'),
      top: await page.locator('.continuous-reader').evaluate(element => element.scrollTop),
      left: await page.locator('.continuous-comparison').evaluate(element => element.scrollLeft),
      scroll: await discussion.evaluate(element => element.scrollTop),
    };
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/server/public.ts');
    await expect(page.getByRole('button', { name: 'Back to answer' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Return to original reading' })).toHaveCount(0);
    if (width === 1440) {
      const heldCamera = await page.locator('.react-flow__viewport').getAttribute('style');
      await page.route('**/api/story?**', route => route.abort());
      await page.getByRole('button', { name: 'Back to answer' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/server/public.ts');
      await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', heldCamera!);
      await page.unroute('**/api/story?**');
    }
    if (width < 650) await page.getByRole('button', { name: 'Open discussion' }).click();
    const helper = question.getByRole('button', { name: 'Inspect head src/storage/access.ts L4–14', exact: true });
    await helper.click();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/storage/access.ts');
    await page.getByRole('button', { name: 'Back to answer' }).click();
    await expect(discussion).toBeVisible();
    await expect(page.locator('[data-expanded-file]')).toHaveAttribute('data-expanded-file', 'src/storage/public.ts');
    await expect(page.locator('.continuous-reader')).toHaveClass(/split/);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', origin.camera!);
    await expect.poll(async () => page.locator('.continuous-reader').evaluate(element => element.scrollTop)).toBe(origin.top);
    await expect.poll(async () => page.locator('.continuous-comparison').evaluate(element => element.scrollLeft)).toBe(origin.left);
    await expect.poll(async () => discussion.evaluate(element => element.scrollTop)).toBe(origin.scroll);
    await expect(gateway).toBeFocused();
    await expect(page.locator('[aria-label="Back to answer"]')).toHaveCount(0);
    await page.screenshot({ path: `/tmp/pr-reviewer-reading-journey-evidence/r20-answer-return-${width}.png` });
    await page.getByRole('button', { name: 'Close discussion' }).click();
    if (width < 650) await page.getByRole('button', { name: 'Open prepared story' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Compare owner recognition with credential lookup');
    if (width < 650) await page.getByRole('button', { name: 'Close prepared story' }).click();
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', earliestCamera!);
  });
});


test.describe('desktop guided call-context framing', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('offscreen Story3 shows existing storage headers and both call rows near the top without Find or pan', async ({ page }) => {
    await page.setViewportSize({ width: 1408, height: 796 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Close review context' }).click();
    await page.getByRole('button', { name: 'Open prepared story' }).click();
    const original = await page.locator('.react-flow__viewport').getAttribute('style');
    await page.getByRole('button', { name: 'Next story step' }).click();
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
    await expect(page.getByRole('button', { name: 'Return to original reading' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Next story step' }).click();
    const graph = (await page.locator('.pr-graph').boundingBox())!;
    const callee = page.locator('[data-file-path="src/storage/access.ts"]');
    await expect.poll(async () => (await callee.boundingBox())!.y).toBeCloseTo(graph.y + 12, 0);
    const storage = projectCalls('src/storage/public.ts');
    const authenticate = storage.seeds.find(node => node.name === 'authenticate' && node.declaration.side === 'head')!;
    const links = storage.links.filter(link => link.caller === authenticate.id && link.target.path === 'src/storage/access.ts');
    expect(links).toHaveLength(2);
    for (const link of links) {
      const label = page.locator(`[data-call-id="${link.id}"]`);
      await expect(label).toBeInViewport();
      const box = (await label.boundingBox())!;
      expect(box.y).toBeGreaterThan(graph.y);
      expect(box.y + box.height).toBeLessThan(graph.y + graph.height);
      const path = page.locator(`.react-flow__edge[data-id="${link.id}"] .react-flow__edge-path`);
      const line = (await path.boundingBox())!;
      expect(line.x).toBeGreaterThanOrEqual(graph.x);
      expect(line.x + line.width).toBeLessThanOrEqual(graph.x + graph.width);
      expect(line.y + 30).toBeLessThan(graph.y + graph.height);
    }
    await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
    const framed = await page.locator('.react-flow__viewport').getAttribute('style');
    expect(framed!.match(/scale\(([^)]+)\)/)![1]).toBe(original!.match(/scale\(([^)]+)\)/)![1]);
    await page.screenshot({ path: '/tmp/pr-reviewer-reading-journey-evidence/r21-desktop-context.png' });
    await page.getByRole('button', { name: 'Return to original reading' }).click();
    await expect(page.locator('.owner-step')).toHaveText('Trace an unchanged caller into the changed decision');
    await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', original!);
  });
});

test('exact request focus selects its comparison until deliberate reader navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1408, height: 796 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Inspect the changed request', exact: true }).click();
  const explain = page.getByRole('button', { name: 'Explain current source comparison', exact: true });
  await explain.click();
  const panel = page.getByRole('region', { name: 'Source comparison explanation' });
  await expect(panel).toContainText('Change 3');
  await expect(panel).not.toContainText('No prepared summary');
  await page.getByRole('button', { name: 'Close relationship explanation' }).click();
  await page.getByRole('button', { name: /src\/application\/review.ts change 1 ·/ }).click();
  await explain.click();
  await expect(panel).toContainText('Change 1');
  await page.screenshot({ path: '/tmp/pr-reviewer-reading-journey-evidence/r22-request-handback.png' });
});


test('exact retained request citation hands comparison selection back to manual scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1408, height: 796 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Close review context', exact: true }).click();
  await page.getByRole('button', { name: 'Open prepared story', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect head src/application/review.ts L25–33', exact: true }).first().click();
  const explain = page.getByRole('button', { name: 'Explain current source comparison', exact: true });
  await explain.click();
  const panel = page.getByRole('region', { name: 'Source comparison explanation' });
  await expect(panel).toContainText('Change 3');
  await page.getByRole('button', { name: 'Close relationship explanation' }).click();
  const reader = page.locator('[data-expanded-file="src/application/review.ts"] .continuous-reader');
  await reader.hover();
  await page.mouse.wheel(0, -10000);
  await expect.poll(() => reader.evaluate(element => element.scrollTop)).toBe(0);
  await explain.click();
  await expect(panel).toContainText('Change 1');
  await page.getByRole('button', { name: 'Close relationship explanation' }).click();
  await page.getByRole('button', { name: 'Return to original reading', exact: true }).click();
  await expect(page.locator('[data-expanded-file]')).toHaveCount(0);
});
