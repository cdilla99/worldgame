import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
});

test('Daily Puzzle preserves guesses after visiting another activity', async ({ page }) => {
  await page.locator('#btn-activity-daily').click();
  const wrong = await page.evaluate(() => {
    const target = GeoWarsDailyWorldle.getDailyGame(countryCards).target;
    return countryCards.find(card => card.id !== target.id).name;
  });
  await page.locator('#worldle-guess-input').fill(wrong);
  await page.locator('#worldle-guess-submit').click();
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await page.locator('#btn-explorer-home img').click();
  await page.locator('#btn-explore-shapes').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await page.locator('#btn-activity-home').click();
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await expect(page.locator('.worldle-guess-row')).toContainText(wrong);
  await expect(page.locator('#worldle-title')).toBeFocused();
});

test('leaving a completed puzzle cancels its delayed result dialog', async ({ page }) => {
  await page.locator('#btn-activity-daily').click();
  const answer = await page.evaluate(() => GeoWarsDailyWorldle.getDailyGame(countryCards).target.name);
  await page.locator('#worldle-guess-input').fill(answer);
  await page.locator('#worldle-guess-submit').click();
  await page.locator('#btn-explorer-home img').click();
  await page.waitForTimeout(1600);
  await expect(page.locator('#worldle-modal')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('Explore during Country Hunt requires confirmation and cancel restores focus', async ({ page }) => {
  await page.locator('#btn-challenge-hunt').click();
  await expect(page.locator('#explorer-hunt-hud')).toBeVisible();
  await page.locator('#btn-activity-explore').click();
  await expect(page.locator('#hunt-switch-confirm')).toBeVisible();
  await page.locator('#btn-hunt-switch-no').click();
  await expect(page.locator('#btn-activity-explore')).toBeFocused();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(true);
  await page.locator('#btn-activity-explore').click();
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'hunt-explore');
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(false);
});

test('All activities requires confirmation before ending Country Hunt', async ({ page }) => {
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-activity-home').click();
  await expect(page.locator('#hunt-switch-message')).toContainText('Returning to all activities');
  await page.locator('#btn-hunt-switch-no').click();
  await expect(page.locator('#btn-activity-home')).toBeFocused();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(true);
  await page.locator('#btn-activity-home').click();
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('legacy navigation API cannot silently end a hunt for Daily Puzzle', async ({ page }) => {
  await page.locator('#btn-challenge-hunt').click();
  await page.evaluate(() => GeoWars.atlas.openDailyPuzzle());
  await expect(page.locator('#hunt-switch-confirm')).toBeVisible();
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(false);
});

test('hunt summary can replay at a new difficulty or return Home', async ({ page }) => {
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-explorer-hunt-exit').click();
  await expect(page.locator('#explorer-hunt-summary')).toBeVisible();
  await page.locator('#btn-explorer-hunt-again').click();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(true);
  await page.locator('#btn-explorer-hunt-exit').click();
  await page.locator('#hunt-next-difficulty').getByRole('button', { name: 'Medium', exact: true }).click();
  await page.locator('#btn-explorer-hunt-again').click();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntActive)).toBe(true);
  await expect(page.locator('#btn-activity-difficulty')).toHaveText('Difficulty: Medium');
  await page.locator('#btn-explorer-hunt-exit').click();
  await page.locator('#btn-explorer-hunt-free').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('difficulty and region persist without appearing on the activity home', async ({ page }) => {
  await page.locator('#btn-challenge-shapes').click();
  await page.locator('#btn-game-difficulty').click();
  await page.locator('[data-level="explorer"]').click();
  await page.locator('[data-continent="Europe"]').click();
  await page.locator('#btn-apply-activity-settings').click();
  await page.reload();
  await expect(page.locator('[data-level="explorer"]')).toBeHidden();
  await page.locator('#btn-challenge-shapes').click();
  await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Medium');
  expect(await page.evaluate(() => state.currentCard.continent)).toBe('Europe');
});

test('home logo clears globe selection and returns to both activity cards', async ({ page }) => {
  await page.locator('#btn-explore-hunt').click();
  await page.locator('#explorer-country-search').fill('Canada');
  await page.getByRole('option', { name: /Canada/ }).click();
  await page.locator('#btn-explorer-home').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
  expect(await page.evaluate(() => GeoWars.explorer.getState().selectedCountryId)).toBeNull();
  await expect(page.locator('#btn-explore-shapes')).toBeVisible();
  await expect(page.locator('#landing')).toBeHidden();
});
