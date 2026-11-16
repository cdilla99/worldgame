import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}: Auto explains itself and opens with easy four-choice questions`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-home-difficulty').click();
    await expect(page.locator('[data-level="adaptive"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#auto-difficulty-help')).toHaveText('Adjusts as you play.');
    await page.screenshot({ path: `test-results/auto-settings-${viewport.width}.png` });
    await page.locator('[data-level="cadet"]').click();
    await expect(page.locator('#auto-difficulty-help')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#home-difficulty-value')).toHaveText('Auto');
    await page.locator('#btn-challenge-shapes').click();
    for (let answer = 0; answer < 4; answer++) {
      await expect(page.locator('#choices .choice-btn:visible')).toHaveCount(4);
      expect(await page.evaluate(() => state.currentCard.difficulty)).toBe('easy');
      const name = await page.evaluate(() => state.currentCard.name);
      await page.locator('#choices .choice-btn').filter({ hasText: name }).click();
      await page.locator('#btn-feedback-next').click();
    }
  });
}

for (const [level, label] of [['cadet', 'Easy'], ['explorer', 'Medium'], ['earthling', 'Hard'], ['expert', 'Expert'], ['adaptive', 'Auto']]) {
  test(`saved ${level} and region survive reload`, async ({ page }) => {
    await page.addInitScript(({ level }) => localStorage.setItem('earthling-quiz-preferences', JSON.stringify({ level, continent: 'Europe', mode: 'sprint' })), { level });
    await page.goto('/');
    await expect(page.locator('#home-difficulty-value')).toHaveText(label);
    await expect(page.locator('#home-region-value')).toHaveText('Europe');
    await page.reload();
    await expect(page.locator('#home-difficulty-value')).toHaveText(label);
    await expect(page.locator('#home-region-value')).toHaveText('Europe');
  });
}

test('Country Hunt also starts Auto with an easy target', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-challenge-hunt').click();
  await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
  expect(await page.evaluate(() => GeoWars.activities.getHuntOptions().level)).toBe('adaptive');
  expect(await page.evaluate(() => countryCards.find(card => card.id === GeoWars.explorer.getState().huntTargetId).difficulty)).toBe('easy');
});
