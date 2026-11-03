import {test, expect} from '@playwright/test';

// Authored actual-journey check. Do not run as an alternate browser-control route.
test('shared highlighted diff switches modes and scrolls while the React card stays responsive', async ({page}) => {
    test.setTimeout(45000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./?v=rebuild-2');
    const reader = page.getByRole('region', {name: 'Pinned diff for src/server/public.ts'});
    const modes = page.getByRole('group', {name: 'Diff mode'});
    await expect(reader).toHaveClass(/unified/);
    await expect(reader.locator('.syntax-keyword').first()).toHaveCSS('color', 'rgb(213, 184, 240)');
    await expect(reader.locator('.syntax-string').first()).toHaveCSS('color', 'rgb(234, 213, 162)');
    await expect(reader.locator('[data-after-line="66"] .syntax-keyword')).toHaveText('const');
    await modes.getByRole('button', {name: 'Split', exact: true}).click();
    await expect(reader).toHaveClass(/split/);
    await expect(modes.getByRole('button', {name: 'Split', exact: true})).toHaveAttribute('aria-pressed', 'true');
    await expect(reader.locator('.split-column-heading')).toContainText('Before');
    await expect(reader.locator('.split-column-heading')).toContainText('After');
    await reader.focus();
    await reader.press('PageDown');
    await modes.getByRole('button', {name: 'Unified', exact: true}).click();
    await expect(reader).toHaveClass(/unified/);
    const counter = page.getByRole('button', {name: 'Check card response'});
    await counter.click();
    await expect(page.getByText('Card responses: 1', {exact: true})).toBeVisible();
    await expect(page.locator('#status')).toContainText('30 seconds elapsed', {timeout: 35000});
    await counter.click();
    await expect(page.getByText('Card responses: 2', {exact: true})).toBeVisible();
    expect(errors).toEqual([]);
});
