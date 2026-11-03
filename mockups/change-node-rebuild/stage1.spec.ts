import {test, expect} from '@playwright/test';
import sample from './change-sample.json' with {type: 'json'};

// Authored actual-journey check. Not executed while supported browser access is unavailable.
test('stage1 React card preserves source identity and responds throughout the30-second reading probe', async ({page}) => {
    test.setTimeout(45000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./?v=rebuild-1');
    const card = page.getByRole('article');
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute('data-change-id', sample.id);
    await expect(card.getByRole('heading', {name: sample.name})).toBeVisible();
    await card.getByRole('button', {name: 'Check card response'}).click();
    await expect(card.getByRole('status')).toHaveText('Card responses: 1');
    await card.locator('summary').click();
    for (const witness of sample.witnesses) await expect(card.getByText(witness.anchor.commit, {exact: true})).toBeVisible();
    await card.locator('summary').click();
    await card.getByRole('button', {name: 'Check card response'}).scrollIntoViewIfNeeded();
    await expect(page.locator('#status')).toContainText('30 seconds elapsed', {timeout: 35000});
    await card.getByRole('button', {name: 'Check card response'}).click();
    await expect(card.getByRole('status')).toHaveText('Card responses: 2');
    expect(errors).toEqual([]);
});
