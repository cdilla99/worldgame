import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 390, height: 844 });
});

test('Daily Puzzle shares the Atlas navigation and preserves guesses across mode switches', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-explore').click();
  await page.locator('#btn-atlas-shapes').click();
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#explorer')).toBeVisible();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  await expect(page.locator('#btn-open-worldle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#worldle-title')).toBeFocused();
  await expect(page.locator('#explorer-live')).toContainText('Daily Puzzle');
  await expect(page.locator('#atlas-shapes-workspace')).toBeHidden();

  const wrong = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    return window.countryCards.find(card => card.id !== target.id).name;
  });
  await page.locator('#worldle-guess-input').fill(wrong);
  await page.locator('#worldle-guess-input').press('Enter');
  await expect(page.locator('.worldle-guess-row').first()).toContainText(wrong);

  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
  await expect(page.locator('#worldle-screen')).toBeHidden();
  await expect(page.locator('#btn-open-worldle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('.worldle-guess-row').first()).toContainText(wrong);
  await page.locator('#btn-mode-explore').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#worldle-screen')).toHaveAttribute('inert', '');
  await expect(page.locator('#worldle-screen')).toHaveAttribute('aria-hidden', 'true');
});

test('leaving a completed puzzle cancels the delayed result dialog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-open-worldle').click();
  const target = await page.evaluate(() => window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target.name);
  await page.locator('#worldle-guess-input').fill(target);
  await page.locator('#worldle-guess-input').press('Enter');
  await expect(page.locator('#worldle-guess-input')).toBeDisabled();
  await page.locator('#btn-mode-challenge').click();
  await page.waitForTimeout(1000);
  await expect(page.locator('#worldle-modal')).toBeHidden();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#worldle-modal')).toBeVisible();
});

test('shared navigation leaves Daily Puzzle for Explore or Challenge', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-explore').click();
  await page.locator('#btn-atlas-shapes').click();
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  await expect(page.locator('#btn-worldle-home')).toHaveCount(0);
  await page.locator('#btn-mode-explore').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#landing')).toBeHidden();

  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
  await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#landing')).toBeHidden();
});

test('Explore during a hunt requires confirmation and cancel restores focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-explore').click();
  await page.locator('#btn-atlas-shapes').click();
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-mode-explore').click();
  await expect(page.locator('#hunt-switch-confirm')).toBeVisible();
  await expect(page.locator('#hunt-switch-message')).toContainText('end your current Country Hunt');
  await page.locator('#btn-hunt-switch-no').click();
  await expect(page.locator('#btn-mode-explore')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(true);

  await page.locator('#btn-mode-explore').click();
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#explorer-hunt-summary')).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(false);
});

test('Daily Puzzle can end a hunt only after confirmation and navigate to Challenge', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-open-worldle').click();
  await expect(page.locator('#hunt-switch-confirm')).toBeVisible();
  await expect(page.locator('#hunt-switch-message')).toContainText('Daily Puzzle');
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(false);

  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
  await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#explorer-hunt-summary')).toBeHidden();
});

test('Challenge navigation does not end an active Country Hunt', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#btn-mode-challenge')).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(true);
  await expect(page.locator('#explorer-hunt-summary')).toBeHidden();
});

test('hunt summary actions preserve Challenge state and restore Explore Globe', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-challenge-hunt').click();
  await page.locator('#btn-explorer-hunt-exit').click();
  await expect(page.locator('#explorer-hunt-summary')).toBeVisible();
  await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#btn-explorer-hunt-again').click();
  await expect.poll(() => page.evaluate(() => window.GeoWars.explorer.getState().huntActive)).toBe(true);
  await page.locator('#btn-explorer-hunt-exit').click();
  await page.locator('#btn-explorer-hunt-free').click();
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
  await expect(page.locator('#explorer-hunt-summary')).toBeHidden();
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#btn-mode-challenge').click();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();
});

test('Shape Quiz settings update the summary and launch the selected practice', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-showoff').click();
  await page.locator('#atlas-menu-setup-slot .diff-btn[data-level="cadet"]').click();
  await page.locator('#challenge-settings > summary').click();
  await page.locator('#challenge-settings .diff-btn[data-continent="Europe"]').click();
  await expect(page.locator('#btn-showoff')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-level="cadet"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-continent="Europe"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#challenge-settings > summary').click();
  await expect(page.locator('#atlas-challenge-panel')).toBeVisible();

  await page.locator('#btn-start-game').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#game-mode-label')).toContainText('Easy');
  await expect(page.locator('#game-mode-label')).toContainText('Practice');
  await page.locator('#btn-show-region').click();
  await expect(page.locator('#continent-hint')).toContainText('Europe');
});

test('home controls return to Explore Globe without showing the legacy landing screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-explorer-home').click();
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#landing')).toBeHidden();

  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-start-game').click();
  await expect(page.locator('#game')).toBeVisible();
  await page.locator('#btn-quit').click();
  await page.locator('#btn-quit-yes').click();
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();

  await page.locator('#btn-mode-challenge').click();
  await page.locator('#btn-start-game').click();
  await expect(page.locator('#game')).toBeVisible();
  await page.evaluate(() => window.endGame());
  await expect(page.locator('#results')).toBeVisible();
  await page.locator('#btn-home').click();
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
  await expect(page.locator('#landing')).toBeHidden();
});

function blockExternalRequests(page) {
  return page.route(/^https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
}
