import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto('/');
});

test('phone starts on Play with a reachable Easy Practice action at small and large sizes', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    await expect(page.locator('#btn-mode-challenge')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-showoff')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-level="cadet"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-start-game')).toContainText('Start practice');
    const nav = await page.locator('.atlas-primary-nav').boundingBox();
    const start = await page.locator('#btn-start-game').boundingBox();
    expect(start.y).toBeGreaterThan(0);
    expect(start.y + start.height).toBeLessThanOrEqual(nav.y);
    expect(nav.y + nav.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#shape-challenge-panel #btn-showoff')).toBeVisible();
    await expect(page.locator('#atlas-utility-menu #btn-showoff')).toHaveCount(0);
  }
});

test('five phone practice rounds show choices immediately and finish with a replay', async ({ page }) => {
  await page.locator('#btn-start-game').click();
  for (let round = 0; round < 5; round++) {
    await expect(page.locator('#game-progress-label')).toHaveText(`Country ${round + 1} of 5`);
    await expect(page.locator('#game-progress-label')).toBeInViewport();
    await expect(page.locator('#game-progress-track')).toHaveAttribute('aria-valuenow', String(round));
    await expect(page.locator('#choices')).toBeVisible();
    await expect(page.locator('#choices button:not(.hidden)')).toHaveCount(4);
    await page.locator('#choices button:not(.hidden)').first().click();
    await expect(page.locator('#feedback-country-name')).not.toHaveText('');
    await expect(page.locator('#feedback-details')).not.toHaveText('');
    if (round === 4) await expect(page.locator('#btn-feedback-next')).toContainText('See your discoveries');
    await page.locator('#btn-feedback-next').click();
  }
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#results-status')).toContainText('You explored 5 countries');
  await expect(page.locator('#results-discovery-mark')).toBeVisible();
  await expect(page.locator('#results-title')).toHaveText('5 countries, discovered.');
  await page.locator('#btn-again').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#choices')).toBeVisible();
  await expect(page.locator('#game-progress-track')).toHaveAttribute('aria-valuenow', '0');
});

test('revealing an answer counts as exploration and View results reaches the results screen', async ({ page }) => {
  await page.locator('#btn-start-game').click();
  await page.locator('#btn-reveal').click();
  await expect(page.locator('#game-progress-track')).toHaveAttribute('aria-valuenow', '1');
  await page.locator('#btn-feedback-results').click();
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#results-status')).toContainText('You explored 1 country');
  await expect(page.locator('#game-review')).toContainText('Revealed');
});

test('quiz choices persist after reload and original controls return to the desktop Menu', async ({ page }) => {
  await page.locator('[data-level="explorer"]').click();
  await page.locator('#btn-sprint').click();
  await page.locator('#challenge-settings > summary').click();
  await page.locator('[data-continent="Europe"]').click();
  await page.reload();
  await expect(page.locator('[data-level="explorer"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#btn-sprint')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-continent="Europe"]')).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#atlas-utility-menu > summary').click();
  await expect(page.locator('#atlas-utility-menu #btn-sprint')).toBeVisible();
  await expect(page.locator('#challenge-settings [data-level="explorer"]')).toBeVisible();
  await expect(page.locator('#atlas-utility-menu #btn-sprint')).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#atlas-utility-menu > summary').click();
  await expect(page.locator('#shape-challenge-panel #btn-sprint')).toBeVisible();
});

test('country sheet expands with touch and keyboard, scrolls through facts, and leaves Hunt unobstructed', async ({ page }) => {
  await page.locator('#btn-mode-explore').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('Egypt');
  await page.getByRole('option', { name: /Egypt/ }).click();
  const sheet = page.locator('.is-country-sheet');
  const toggle = page.locator('#country-sheet-toggle');
  await expect(sheet).toBeVisible();
  await expect(page.locator('#explorer-country-capital')).toBeVisible();
  await expect(page.locator('#explorer-country-population')).toBeHidden();
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#explorer-country-currency').scrollIntoViewIfNeeded();
  await expect(page.locator('#explorer-country-currency')).toBeInViewport();
  await expect(page.locator('#explorer-economics-callout')).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  const handle = await toggle.boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y - 60, { steps: 6 });
  await page.mouse.up();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.press('Escape');
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#btn-mode-challenge').tap();
  await page.locator('#btn-challenge-hunt').tap();
  await expect(page.locator('.is-country-sheet')).toHaveCount(0);
  await expect(page.locator('#explorer-hunt-hud')).toBeVisible();
  await expect(page.locator('#country-sheet-toggle')).toBeHidden();
});

test('Daily renders only real guesses, preserves them across modes, and reveals a fact with an Explore action', async ({ page }) => {
  await page.locator('#btn-open-worldle').tap();
  const input = page.locator('#worldle-guess-input');
  await expect(input).toHaveAttribute('placeholder', 'Country name…');
  await expect(page.locator('.worldle-guess-row')).toHaveCount(0);
  await expect(page.locator('#worldle-empty-hint')).toBeVisible();
  const choices = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    return { target: target.name, wrong: window.countryCards.find(card => card.id !== target.id).name };
  });
  await input.fill(choices.wrong);
  await input.press('Enter');
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await expect(page.locator('#worldle-guesses-remaining')).toHaveText('5 guesses left');
  await expect(page.locator('#worldle-empty-hint')).toBeHidden();
  await page.locator('#btn-mode-challenge').tap();
  await page.locator('#btn-open-worldle').tap();
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await input.fill(choices.target);
  await input.press('Enter');
  await expect(page.locator('#worldle-modal')).toBeVisible();
  await expect(page.locator('#worldle-revealed-fact')).not.toHaveText('');
  await page.locator('#btn-worldle-explore-answer').click();
  await expect(page.locator('#worldle-modal')).toBeHidden();
  await expect(page.locator('#explorer-country-name')).toHaveText(choices.target);
  await expect(page.locator('.is-country-sheet')).toBeVisible();
});
