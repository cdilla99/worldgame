import { devices, expect, test } from '@playwright/test';

for (const profile of ['iPhone 13', 'Pixel 7']) {
  test(`${profile} emulation supports globe drag, pinch, country sheets and country suggestions`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ ...devices[profile], baseURL });
    const page = await context.newPage();
    try {
      await page.route(/^https:\/\//, route => route.abort());
      await page.goto('/');
      await page.locator('#btn-explore-hunt').tap();
      await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().geometryReady)).toBe(true);
      const canvas = page.locator('#explorer-globe-canvas');
      const box = await canvas.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 3;
      const client = await context.newCDPSession(page);
      const before = await page.evaluate(() => window.GeoWars.explorer.getState());
      const touch = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      await touch('touchStart', [{ x, y }]);
      for (let step = 1; step <= 5; step++) await touch('touchMove', [{ x: x + step * 9, y }]);
      await touch('touchEnd', []);
      await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().longitude)).not.toBe(before.longitude);

      const zoomBefore = await page.evaluate(() => window.GeoWars.explorer.getState().zoom);
      await touch('touchStart', [{ x: x - 24, y, id: 1 }, { x: x + 24, y, id: 2 }]);
      for (let step = 1; step <= 5; step++) {
        await touch('touchMove', [{ x: x - 24 - step * 7, y, id: 1 }, { x: x + 24 + step * 7, y, id: 2 }]);
      }
      await touch('touchEnd', []);
      await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().zoom)).toBeGreaterThan(zoomBefore);

      await page.locator('#explorer-country-search').fill('Japan');
      await page.getByRole('option', { name: /Japan/ }).tap();
      await expect(page.locator('#explorer-country-name')).toHaveText('Japan');
      await page.locator('#country-sheet-toggle').tap();
      await expect(page.locator('#country-sheet-toggle')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('#btn-activity-home').tap();
      await page.locator('#btn-activity-daily').tap();
      const input = page.locator('#worldle-guess-input');
      await input.fill('can');
      await expect(page.locator('#worldle-suggestions')).toBeVisible();
      await expect(page.locator('#worldle-suggestions')).toBeInViewport();
      expect(await input.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally {
      await context.close();
    }
  });
}
