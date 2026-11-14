import { expect, test } from '@playwright/test';

test('previously distorted outlines stay readable in the Atlas, quiz and Daily rendering path', async ({ page }) => {
  const remoteShapes = [];
  page.on('request', request => { if (/mapsicon/.test(request.url())) remoteShapes.push(request.url()); });
  await page.route(/^https:\/\//, route => route.abort());
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => GeoWars.activities.explore('globe'));
    await page.evaluate(() => GeoWars.activities.explore('shapes'));
    for (const country of ['Argentina', 'Cuba', 'Senegal', 'Barbados', 'Fiji', 'Samoa']) {
      await page.locator('#atlas-shape-country').selectOption({ label: country });
      const svg = page.locator('#atlas-shape-art svg');
      await expect(svg).toHaveAttribute('aria-label', `${country} border outline`);
      const shape = await svg.evaluate(element => {
        const bounds = element.viewBox.baseVal;
        const path = element.querySelector('path').getBBox();
        return { width: bounds.width, height: bounds.height, x: path.x, y: path.y, right: path.x + path.width, bottom: path.y + path.height };
      });
      expect(shape.width).toBeLessThan(65);
      expect(shape.height).toBeLessThan(65);
      expect(shape.x).toBeGreaterThanOrEqual(-0.001);
      expect(shape.y).toBeGreaterThanOrEqual(-0.001);
      expect(shape.right).toBeLessThanOrEqual(shape.width + 0.001);
      expect(shape.bottom).toBeLessThanOrEqual(shape.height + 0.001);
    }
    await page.evaluate(() => window.startGame({ deckCardIds: [5], sessionKind: 'review' }));
    const quiz = page.locator('svg#silhouette-img');
    await expect(quiz).toBeVisible();
    const quizWidth = await quiz.evaluate(element => element.viewBox.baseVal.width);
    expect(quizWidth).toBeLessThan(65);
  }
  expect(remoteShapes).toEqual([]);
});
