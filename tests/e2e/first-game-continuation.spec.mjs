import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => { await page.route(/^https:\/\//, route => route.abort()); });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: Hunt results expose replay and Home before settings`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-hunt').click();
    await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
    await page.evaluate(() => {
      GeoWars.explorer.submitCountry(GeoWars.explorer.getState().huntTargetId);
      GeoWars.explorer.endHunt(true);
    });
    await expect(page.locator('#explorer-hunt-summary-title')).toBeFocused();
    await expect(page.locator('#btn-explorer-hunt-again')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#btn-explorer-hunt-free')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.explorer-stage')).toBeHidden();
    await page.screenshot({ path: `test-results/hunt-continuation-${viewport.width}.png`, fullPage: true });
    await page.locator('#btn-explorer-hunt-free').click();
    await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
    await page.locator('#btn-explore-hunt').click();
    await expect(page.locator('.explorer-stage')).toBeVisible();
  });
}

test('Daily shows the actual winning guess count, keeps completed state, and resets next day', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 14, 12) });
  await page.goto('/');
  await expect(page.locator('#activity-daily-status')).toBeHidden();
  await page.locator('#btn-activity-daily').click();
  const target = await page.evaluate(() => GeoWarsDailyWorldle.getDailyGame(countryCards).target.name);
  await page.locator('#worldle-guess-input').fill(target);
  await page.locator('#worldle-guess-input').press('Enter');
  await expect(page.locator('#worldle-round-counter')).toHaveText('Guesses 1/6');
  await page.reload();
  await expect(page.locator('#activity-daily-status')).toHaveText('Solved · 1 guess');
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('#worldle-guess-input')).toBeDisabled();
  await expect(page.locator('#worldle-round-counter')).toHaveText('Guesses 1/6');
  await page.locator('#btn-explorer-home').click();
  await page.clock.fastForward(12 * 60 * 60 * 1000 + 1000);
  await expect(page.locator('#activity-daily-status')).toBeHidden();
  await expect(page.locator('#btn-activity-daily')).toHaveAccessibleName('Daily challenge');
});

test('Daily exhausted guesses show a completed result rather than an unplayed challenge', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-activity-daily').click();
  const wrongNames = await page.evaluate(() => {
    const target = GeoWarsDailyWorldle.getDailyGame(countryCards).target;
    return countryCards.filter(card => card.id !== target.id).slice(0, 6).map(card => card.name);
  });
  for (const name of wrongNames) {
    await page.locator('#worldle-guess-input').fill(name);
    await page.locator('#worldle-guess-input').press('Enter');
    await expect(page.locator('.worldle-guess-row:not(.is-empty)').last()).toContainText(name);
  }
  await expect(page.locator('#worldle-round-counter')).toHaveText('Guesses 6/6');
  await page.reload();
  await expect(page.locator('#activity-daily-status')).toHaveText('Completed · 6 guesses');
});

test('wrong-answer feedback retains the exact outline beside the correct name', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.locator('#btn-challenge-shapes').click();
  await expect(page.locator('#silhouette-img')).toBeVisible();
  const original = await page.locator('#silhouette-img').innerHTML();
  const name = await page.evaluate(() => state.currentCard.name);
  if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
  const choices = page.locator('#choices .choice-btn');
  for (const choice of await choices.all()) {
    if ((await choice.innerText()).trim() !== name) { await choice.click(); break; }
  }
  await expect(page.locator('#feedback-country-name')).toHaveText(name);
  await expect(page.locator('#feedback-outline svg')).toBeInViewport({ ratio: 1 });
  expect(await page.locator('#feedback-outline svg').innerHTML()).toBe(original);
  await expect(page.locator('#btn-feedback-next')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'test-results/wrong-feedback-outline-320.png', fullPage: true });
});
