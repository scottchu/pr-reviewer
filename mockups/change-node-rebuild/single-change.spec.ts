import {test, expect} from '@playwright/test';
import related from './related-tests.json' with {type:'json'};

// Source-defined journey; execution requires the supported actual-browser route.
test('one edit connects explanation, scoped Diff, related Test and its Assertions', async ({page}) => {
    test.setTimeout(45000);
    const errors: string[] = []; page.on('pageerror', error=>errors.push(error.message));
    await page.goto('./?v=single-change');
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('heading', {level:1})).toHaveText('Use local-owner access when Authorization is absent');
    await expect(page.getByRole('region',{name:'Explaining',exact:true})).toContainText('Review question.');
    const code = page.getByRole('region',{name:'Diff',exact:true});
    await expect(code.locator('.diff-line.removed')).toHaveCount(2);
    await expect(code.locator('.diff-line.added')).toHaveCount(5);
    await expect(code).not.toContainText('/api/story/commands');
    await expect(code.locator('.fold-control')).toHaveCount(0);
    await code.getByRole('button',{name:'Split',exact:true}).click();
    await expect(code.locator('.continuous-reader')).toHaveClass(/split/);
    const added = related.tests.find(test=>test.status==='add')!;
    const testPanel = page.locator(`[data-test-id="${added.id}"]`);
    await testPanel.locator('summary').click();
    await expect(testPanel.locator('[data-assertion-id]')).toHaveCount(16);
    await testPanel.getByRole('button',{name:'Read Test source',exact:true}).click();
    const source = testPanel.getByRole('region',{name:'Test source',exact:true});
    await source.getByRole('button',{name:'Split',exact:true}).click();
    await testPanel.locator('[data-assertion-id] button').first().click();
    await expect(testPanel.getByRole('region',{name:'Assertion source line',exact:true})).toBeVisible();
    await testPanel.getByRole('button',{name:'Read Test source',exact:true}).click();
    await expect(source.getByRole('button',{name:'Split',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(code.getByRole('button',{name:'Split',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#status')).toContainText('30 seconds elapsed',{timeout:35000});
    expect(errors).toEqual([]);
});
