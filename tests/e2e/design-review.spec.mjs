import { test, expect } from '@playwright/test';

test('opt-in atlas journey browses, launches practice and reveals feedback', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?design=atlas');
  await expect(page.locator('body')).toHaveClass(/design-review/);
  await page.locator('#btn-atlas-shapes').click();
  for (const label of ['Japan', 'Indonesia', 'Fiji', 'Monaco', 'Democratic Republic of the Congo']) {
    await page.locator('#atlas-shape-country').selectOption({ label });
    await expect(page.locator('#atlas-shape-toolbar-title')).toHaveText(label);
    await expect(page.locator('#atlas-shape-art svg')).toHaveAttribute('aria-label', `${label} border outline`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  }
  await page.locator('#btn-atlas-shape-challenge').click();
  await page.locator('#btn-showoff').click();
  await page.locator('#btn-start-game').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('svg#silhouette-img')).toBeVisible();
  await expect(page.locator('#flag-hint')).toBeHidden();
  await page.locator('#btn-show-options').click();
  await page.locator('#choices button').first().click();
  await expect(page.locator('#feedback')).toBeVisible();
  await expect(page.locator('#feedback-country-name')).not.toHaveText('');
  await expect(page.locator('#btn-feedback-next')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
