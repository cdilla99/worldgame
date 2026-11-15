import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => { await page.route(/^https:\/\//, route => route.abort()); });

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: Antarctica is a selectable continent with a geographic South Pole`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-explore-hunt').click();
    await page.locator('#explorer-country-search').fill('South Pole');
    await page.getByRole('option', { name: /Antarctica/ }).click();
    await expect(page.locator('#explorer-country-name')).toHaveText('Antarctica');
    await expect(page.locator('#explorer-country-status')).toContainText('no national flag');
    await expect(page.locator('#explorer-country-flag')).toBeHidden();
    await expect(page.locator('#explorer-country-capital')).toBeHidden();
    await expect(page.locator('#explorer-country-currency')).toBeHidden();
    await expect(page.locator('#explorer-economics-callout')).toBeHidden();
    const marker = page.locator('#explorer-south-pole-marker');
    await expect(marker).toBeVisible();
    await expect(marker).toContainText('90°S');
    await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().latitude)).toBeCloseTo(-90, 6);
    expect(await page.evaluate(() => countryCards.length)).toBe(197);
    const globe = page.locator('#explorer-globe-canvas');
    const box = await globe.boundingBox();
    await globe.click({ position: { x: box.width / 2 + 12, y: box.height / 2 + 12 } });
    await expect(page.locator('#explorer-country-name')).toHaveText('Antarctica');
    await page.screenshot({ path: `test-results/antarctica-${viewport.width}.png`, fullPage: true });
    await page.locator('#explorer-country-search').fill('Canada');
    await page.getByRole('option', { name: /Canada/ }).click();
    await expect(page.locator('#explorer-country-flag')).toBeVisible();
    await expect(page.locator('#explorer-country-capital')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test('startup does not download music before the player asks for it', async ({ page }) => {
  const musicRequests = [];
  await page.route('**/sounds/**', route => { musicRequests.push(route.request().url()); return route.abort(); });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(musicRequests).toEqual([]);
  await page.locator('#atlas-utility-menu > summary').click();
  await page.getByRole('switch', { name: 'Music', exact: true }).click();
  await expect.poll(() => musicRequests.length).toBeGreaterThan(0);
});
