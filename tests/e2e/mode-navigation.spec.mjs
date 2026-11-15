import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

test('activity navigation fits narrow through wide screens with reachable controls', async ({ page }) => {
  test.setTimeout(60000);
  for (const width of [320, 390, 600, 768, 900, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const selector of ['#btn-explore-hunt', '#btn-challenge-hunt', '#btn-explore-shapes', '#btn-challenge-shapes', '#btn-header-google']) {
      const button = page.locator(selector);
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator('.atlas-primary-nav')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('Player contains preferences while challenge controls live in the difficulty dialog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#atlas-utility-menu > summary').click();
  await expect(page.locator('#btn-choose-player')).toBeHidden();
  await expect(page.getByRole('switch', { name: 'Sound effects', exact: true })).toBeVisible();
  await expect(page.locator('#btn-explorer-music')).toBeVisible();
  await expect(page.locator('#atlas-utility-panel [data-level]')).toHaveCount(0);
  await page.locator('#btn-close-player-panel').click();
  await page.locator('#btn-challenge-shapes').click();
  await page.locator('#btn-game-difficulty').click();
  await expect(page.locator('#activity-settings-dialog [data-level]')).toHaveCount(5);
  await expect(page.locator('#activity-settings-dialog [data-continent]')).toHaveCount(6);
  await expect(page.locator('#btn-sprint')).toBeHidden();
  await expect(page.locator('#btn-showoff')).toBeHidden();
});

test('section navigation focuses its heading and leaves retired navigation out of keyboard order', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-explore-hunt').click();
  await expect(page.locator('#atlas-globe-title')).toBeFocused();
  await expect(page.locator('#explorer-live')).toContainText('Explore mode');
  await page.locator('#btn-activity-home').click();
  await expect(page.locator('#atlas-challenge-title')).toBeFocused();
  await page.locator('#btn-explore-shapes').focus();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => ['btn-mode-explore', 'btn-mode-challenge', 'btn-atlas-globe', 'btn-atlas-shapes'].includes(document.activeElement.id))).toBe(false);
  }
});

test('bundled Sora and Inter fonts load locally', async ({ page }) => {
  await page.goto('/');
  const loaded = await page.evaluate(async () => {
    await Promise.all([document.fonts.load('700 20px Sora'), document.fonts.load('400 16px Inter')]);
    return { sora: document.fonts.check('700 20px Sora'), inter: document.fonts.check('400 16px Inter') };
  });
  expect(loaded).toEqual({ sora: true, inter: true });
});

test('quiz outlines fit their frame and the flag hint stays in its corner', async ({ page }) => {
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    for (let round = 0; round < 8; round++) {
      await expect(page.locator('#silhouette-img')).toBeVisible();
      const fit = await page.evaluate(() => {
        const box = document.getElementById('silhouette-box').getBoundingClientRect();
        const path = document.querySelector('#silhouette-img path').getBoundingClientRect();
        const flag = document.getElementById('flag-hint').getBoundingClientRect();
        return { inside: path.left >= box.left - 1 && path.right <= box.right + 1 && path.top >= box.top - 1 && path.bottom <= box.bottom + 1,
          flagInCorner: flag.right <= box.right && flag.bottom <= box.bottom && flag.left > box.left + box.width / 2 };
      });
      expect(fit).toEqual({ inside: true, flagInCorner: true });
      await page.locator('#btn-skip').click();
    }
  }
});

test('Country Hunt globe turns and the quiz preview changes its outline', async ({ page }) => {
  await page.goto('/');
  const globe = page.locator('canvas.atlas-hunt-preview');
  await expect(globe).toBeVisible();
  const first = await globe.evaluate(canvas => canvas.toDataURL());
  await expect.poll(() => globe.evaluate(canvas => canvas.toDataURL()), { timeout: 4000 }).not.toBe(first);
  const outline = page.locator('#quiz-preview-art .atlas-quiz-shape.is-visible path');
  await expect(outline).toHaveCount(1);
  const initial = await outline.getAttribute('d');
  await expect.poll(() => outline.getAttribute('d'), { timeout: 8000 }).not.toBe(initial);
});

test('previews remain still when reduced motion is preferred', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto('/');
  const globe = page.locator('canvas.atlas-hunt-preview');
  const outline = page.locator('#quiz-preview-art .atlas-quiz-shape.is-visible path');
  await expect(outline).toHaveCount(1);
  const image = await globe.evaluate(canvas => canvas.toDataURL());
  const shape = await outline.getAttribute('d');
  await page.waitForTimeout(4000);
  expect(await globe.evaluate(canvas => canvas.toDataURL())).toBe(image);
  expect(await outline.getAttribute('d')).toBe(shape);
  await context.close();
});

test('Explore and Challenge icons have readable contrast', async ({ page }) => {
  await page.goto('/');
  const ratios = await page.locator('.activity-paths button').evaluateAll(buttons => {
    function luminance(color) {
      const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    }
    return buttons.map(button => {
      const style = getComputedStyle(button);
      const a = luminance(style.color);
      const b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  });
  ratios.forEach(ratio => expect(ratio).toBeGreaterThanOrEqual(4.5));
});

test('existing Atlas APIs remain available alongside activity navigation', async ({ page }) => {
  await page.goto('/');
  const apis = await page.evaluate(() => ['showGlobe', 'showShapes', 'showExplore', 'showChallenge', 'openDailyPuzzle'].every(name => typeof GeoWars.atlas[name] === 'function'));
  expect(apis).toBe(true);
  await page.evaluate(() => GeoWars.atlas.showShapes());
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await page.evaluate(() => GeoWars.activities.home());
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});
