import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto('/');
});

test('phones open on two activity cards with difficulty hidden until a challenge starts', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
    await expect(page.locator('#btn-explore-hunt')).toBeInViewport();
    await expect(page.locator('#btn-challenge-hunt')).toBeInViewport();
    await expect(page.locator('#btn-explore-shapes')).toBeVisible();
    await expect(page.locator('#btn-challenge-shapes')).toBeVisible();
    await expect(page.locator('[data-level="cadet"]')).toBeHidden();
    await expect(page.locator('#btn-showoff')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

// Untimed review remains an engine capability even though the public Explore
// path now opens the country library, rather than a second game-mode selector.
test('five phone review rounds show choices immediately and finish with a replay', async ({ page }) => {
  await page.evaluate(() => GeoWars.activities.startQuiz('showoff'));
  for (let round = 0; round < 5; round++) {
    await expect(page.locator('#game-progress-label')).toHaveText(`Country ${round + 1} of 5`);
    await expect(page.locator('#game-progress-label')).toBeInViewport();
    await expect(page.locator('#game-progress-track')).toHaveAttribute('aria-valuenow', String(round));
    await expect(page.locator('#choices button:not(.hidden)')).toHaveCount(4);
    await page.locator('#choices button:not(.hidden)').first().click();
    await expect(page.locator('#feedback-country-name')).not.toHaveText('');
    await expect(page.locator('#feedback-details')).not.toHaveText('');
    if (round === 4) await expect(page.locator('#btn-feedback-next')).toHaveText('Results');
    await page.locator('#btn-feedback-next').click();
  }
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#results-status')).toHaveText('5 countries completed.');
  await expect(page.locator('#results-discovery-mark')).toBeVisible();
  await expect(page.locator('#results-title')).toHaveText('Results');
  await page.locator('#btn-again').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#choices')).toBeVisible();
});

test('revealing an answer counts as exploration and View results reaches the results screen', async ({ page }) => {
  await page.evaluate(() => GeoWars.activities.startQuiz('showoff'));
  await page.locator('#btn-reveal').click();
  await expect(page.locator('#game-progress-track')).toHaveAttribute('aria-valuenow', '1');
  await page.locator('#btn-feedback-results').click();
  await expect(page.locator('#results-status')).toHaveText('1 country completed.');
  await expect(page.locator('#game-review')).toContainText('Revealed');
});

test('challenge settings persist and stay in the same dialog after resizing', async ({ page }) => {
  await page.locator('#btn-home-difficulty').click();
  await page.locator('[data-level="explorer"]').click();
  await page.locator('#btn-home-region').click();
  await page.locator('[data-continent="Europe"]').click();
  await page.reload();
  await page.locator('#btn-challenge-shapes').click();
  await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Medium');
  await page.locator('#btn-game-difficulty').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('#activity-settings-dialog [data-level="explorer"]')).toBeVisible();
  await expect(page.locator('#activity-settings-dialog [data-continent="Europe"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#atlas-utility-panel [data-level]')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#activity-settings-dialog [data-level="explorer"]')).toBeVisible();
});

test('country sheet supports touch and keyboard and leaves Hunt unobstructed', async ({ page }) => {
  await page.locator('#btn-explore-hunt').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('Egypt');
  await page.getByRole('option', { name: /Egypt/ }).click();
  const toggle = page.locator('#country-sheet-toggle');
  await expect(page.locator('.is-country-sheet')).toBeVisible();
  for (const field of ['capital', 'population', 'area']) await expect(page.locator('#explorer-country-' + field)).toBeVisible();
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#explorer-country-currency').scrollIntoViewIfNeeded();
  await expect(page.locator('#explorer-country-currency')).toBeInViewport();
  await expect(page.locator('#explorer-economics-callout')).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const handle = await toggle.boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y - 60, { steps: 6 });
  await page.mouse.up();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.press('Escape');
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#btn-activity-challenge').tap();
  await expect(page.locator('.is-country-sheet')).toHaveCount(0);
  await expect(page.locator('#explorer-hunt-hud')).toBeVisible();
  await expect(page.locator('#country-sheet-toggle')).toBeHidden();
});

test('Daily keeps real guesses across activities and reveals a fact with an Explore action', async ({ page }) => {
  await page.locator('#btn-activity-daily').tap();
  const input = page.locator('#worldle-guess-input');
  await expect(page.locator('.worldle-guess-row')).toHaveCount(0);
  await expect(page.locator('#worldle-empty-hint')).toBeVisible();
  const choices = await page.evaluate(() => {
    const target = GeoWarsDailyWorldle.getDailyGame(countryCards).target;
    return { target: target.name, wrong: countryCards.find(card => card.id !== target.id).name };
  });
  await input.fill(choices.wrong);
  await input.press('Enter');
  await expect(page.locator('#worldle-guesses-remaining')).toHaveText('5 guesses left');
  await page.locator('#btn-explorer-home img').tap();
  await page.locator('#btn-activity-daily').tap();
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await input.fill(choices.target);
  await input.press('Enter');
  await expect(page.locator('#worldle-modal')).toBeVisible();
  await expect(page.locator('#worldle-revealed-fact')).not.toHaveText('');
  await page.locator('#btn-worldle-explore-answer').click();
  await expect(page.locator('#explorer-country-name')).toHaveText(choices.target);
  await expect(page.locator('.is-country-sheet')).toBeVisible();
});
