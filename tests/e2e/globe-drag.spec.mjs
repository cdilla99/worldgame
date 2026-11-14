import { expect, test } from '@playwright/test';

test('globe drag batches pointer updates and paints the final position on release', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.addInitScript(() => {
    window.globePaints = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.id === 'explorer-globe-canvas') window.globePaints++;
      return clear.apply(this, args);
    };
  });
  await page.goto('/');
  await page.locator('#btn-explore-hunt').click();
  await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().geometryReady)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  const canvas = page.locator('#explorer-globe-canvas');
  await canvas.evaluate(element => element.addEventListener('pointerdown', event => {
    window.dragPointerId = event.pointerId;
    window.dragOrigin = { x: event.clientX, y: event.clientY };
  }, { once: true }));
  // Wait for layout stability and scroll into view before starting the gesture.
  await canvas.hover();
  await page.mouse.down();
  const burst = await canvas.evaluate(element => {
    const { x, y } = window.dragOrigin;
    const before = window.globePaints;
    const longitude = GeoWars.explorer.getState().longitude;
    const zoom = GeoWars.explorer.getState().zoom;
    for (let step = 1; step <= 12; step++) {
      element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: window.dragPointerId, pointerType: 'mouse',
        clientX: x + step * 3, clientY: y, bubbles: true,
      }));
    }
    return { paints: window.globePaints - before, before, longitude, zoom,
      after: GeoWars.explorer.getState().longitude };
  });
  expect(burst.paints).toBe(0);
  expect(burst.after).toBeCloseTo(burst.longitude - 36 * 0.38 / Math.sqrt(burst.zoom), 5);
  await expect.poll(() => page.evaluate(() => window.globePaints)).toBeGreaterThan(burst.before);
  const beforeRelease = await page.evaluate(() => window.globePaints);
  await page.mouse.up();
  expect(await page.evaluate(() => window.globePaints)).toBeGreaterThan(beforeRelease);
  expect(await page.evaluate(() => GeoWars.explorer.getState().longitude)).toBeCloseTo(burst.after, 5);
});
