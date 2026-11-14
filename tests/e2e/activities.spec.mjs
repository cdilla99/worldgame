import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => { await page.route(/^https:\/\//, route => route.abort()); });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`${viewport.width}: activity home is centered, scales previews and exposes both paths`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
    await expect(page.locator('.atlas-primary-nav')).toBeHidden();
    for (const id of ['btn-explore-hunt', 'btn-challenge-hunt', 'btn-explore-shapes', 'btn-challenge-shapes', 'btn-activity-daily', 'btn-header-google']) await expect(page.locator('#' + id)).toBeVisible();
    for (const button of await page.locator('.activity-paths button').all()) {
      await expect(button).toHaveAccessibleName(/^(Explore|Play) (Country Hunt|Shape Quiz)$/);
      await expect(button.locator('.activity-action-label')).toBeVisible();
      await expect(button.locator('svg')).toBeVisible();
      await expect.poll(() => button.locator('svg').evaluate(svg => svg.getBBox().width)).toBeGreaterThan(0);
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThan(80);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const daily = page.locator('#btn-activity-daily');
    await expect(daily).toHaveAccessibleName('Daily challenge');
    await expect(daily.locator('.activity-action-label')).toBeVisible();
    await expect(daily.locator('svg')).toBeVisible();
    await expect.poll(() => daily.locator('svg').evaluate(svg => svg.getBBox().width)).toBeGreaterThan(0);
    const dailyBox = await daily.boundingBox();
    expect(dailyBox.width).toBeGreaterThan(120);
    expect(dailyBox.height).toBe(44);
    const iconFits = await daily.locator('svg').evaluate(svg => {
      const b = svg.getBBox();
      return b.x >= 0 && b.y >= 0 && b.x + b.width <= 24 && b.y + b.height <= 24;
    });
    expect(iconFits).toBe(true);
    await expect(page.locator('[data-level="cadet"]')).toBeHidden();
    await expect(page.locator('#btn-sprint')).toBeHidden();
    const app = await page.locator('.app').boundingBox();
    expect(Math.abs(app.x - (viewport.width - app.x - app.width))).toBeLessThanOrEqual(1);
    const globe = await page.locator('.atlas-hunt-preview').boundingBox();
    expect(globe.width).toBeGreaterThanOrEqual(viewport.width >= 1024 ? 230 : 100);
    expect(Math.abs(globe.width - globe.height)).toBeLessThanOrEqual(1);
    const cards = await page.locator('.atlas-challenge-card').all();
    for (const card of cards) {
      const preview = await card.locator('.atlas-challenge-stage').boundingBox();
      expect(preview.width).toBeGreaterThan(preview.height * 0.7);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/activity-home-${viewport.width}.png`, fullPage: true });
  });
}

test('action labels remain visible on touch and keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const daily = page.getByRole('button', { name: 'Daily challenge', exact: true });
  await daily.focus();
  await expect(daily.locator('.activity-action-label')).toBeVisible();
  const tooltip = await daily.locator('.activity-action-label').boundingBox();
  expect(tooltip.x).toBeGreaterThanOrEqual(0);
  expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(1280);
  const explore = page.getByRole('button', { name: 'Explore Country Hunt', exact: true });
  await explore.focus();
  await expect(explore.locator('.activity-action-label')).toBeVisible();
  await expect(explore.locator('.activity-action-label')).toHaveText('Explore');
  await page.keyboard.press('Tab');
  const challenge = page.getByRole('button', { name: 'Play Country Hunt', exact: true });
  await expect(challenge).toBeFocused();
  await expect(challenge.locator('.activity-action-label')).toBeVisible();
  await expect(challenge.locator('.activity-action-label')).toHaveText('Play');
  await expect(explore.locator('.activity-action-label')).toBeVisible();
});

test('Shape Quiz challenge puts difficulty in the game header and applies or cancels changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#btn-challenge-shapes').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#game-mode-label')).toBeHidden();
  await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Easy');
  await page.locator('#btn-game-difficulty').click();
  await expect(page.locator('#activity-settings-dialog')).toBeVisible();
  const paused = await page.locator('#timer-text').textContent();
  await page.waitForTimeout(1100);
  await expect(page.locator('#timer-text')).toHaveText(paused);
  await page.locator('[data-level="expert"]').click();
  await page.locator('#btn-cancel-activity-settings').click();
  await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Easy');
  await expect(page.locator('#btn-game-difficulty')).toBeFocused();
  await page.locator('#btn-game-difficulty').click();
  await page.locator('[data-level="expert"]').click();
  await page.locator('#btn-apply-activity-settings').click();
  await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Expert');
  await expect(page.locator('#activity-settings-dialog')).toBeHidden();
  await expect(page.locator('#choices')).toBeHidden();
  await page.screenshot({ path: 'test-results/activity-game-desktop.png', fullPage: true });
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}: active quiz keeps the difficulty button usable without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    await expect(page.locator('#btn-game-difficulty')).toBeInViewport({ ratio: 1 });
    const size = await page.locator('#btn-game-difficulty').boundingBox();
    expect(size.width).toBeGreaterThanOrEqual(100);
    expect(size.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.locator('#btn-game-difficulty').click();
    await expect(page.locator('[data-level="expert"]')).toBeVisible();
    await page.locator('#btn-close-activity-settings').click();
    await expect(page.locator('#btn-game-difficulty')).toBeFocused();
    await page.screenshot({ path: `test-results/activity-game-${viewport.width}.png`, fullPage: true });
  });
}

test('Country Hunt has Explore and Challenge paths with paused, effective difficulty settings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#btn-explore-hunt').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'hunt-explore');
  await expect(page.locator('#btn-activity-difficulty')).toBeHidden();
  await page.locator('#btn-activity-challenge').click();
  await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
  await page.locator('#btn-activity-difficulty').click();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntPaused)).toBe(true);
  await page.locator('[data-level="expert"]').click();
  await page.locator('[data-continent="Europe"]').click();
  await page.locator('#btn-apply-activity-settings').click();
  await expect(page.locator('#btn-activity-difficulty')).toHaveText('Difficulty: Expert');
  await expect.poll(() => page.evaluate(() => {
    const id = GeoWars.explorer.getState().huntTargetId;
    return countryCards.some(c => c.id === id && c.continent === 'Europe' && ['hard', 'expert'].includes(c.difficulty));
  })).toBe(true);
  await page.locator('#btn-activity-home').click();
  await expect(page.locator('#hunt-switch-confirm')).toBeVisible();
  await page.locator('#btn-hunt-switch-yes').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('Shape Quiz Explore and Daily Puzzle are reachable from the activity home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-explore-shapes').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#activity-section-title')).toHaveText('Shape Quiz');
  await page.locator('#btn-activity-home').click();
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  await expect(page.locator('#activity-context')).toBeHidden();
  await page.locator('#btn-explorer-home img').click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('plain Sign in opens the player chooser with Google available inside', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#player-profile-modal')).toBeVisible();
  await expect(page.locator('#player-google-status')).not.toHaveText('');
});

test('a long signed-in name stays inside the phone header', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => renderPlayerContext({ claimed: true, local: true, displayName: 'A very long player name on a shared phone', email: 'player@example.test' }));
  await expect(page.locator('#btn-header-google')).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('flag colours and symbols stay concealed until the hint or answer reveals them', async ({ page }) => {
  await page.route('https://flagcdn.com/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><path fill="#e30a17" d="M0 0h160v100H0z"/><circle fill="white" cx="65" cy="50" r="27"/><circle fill="#e30a17" cx="73" cy="50" r="22"/><path fill="white" d="m110 35 5 10h11l-9 7 3 11-10-6-10 6 3-11-9-7h11z"/></svg>'
  }));
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    await page.evaluate(() => startGame({ deckCardIds: [countryCards.find(c => /turk/i.test(c.name)).id, 2], sessionKind: 'standard' }));
    const hint = page.locator('#flag-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute('aria-label', /Flag hidden/);
    await expect.poll(() => hint.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(hint.locator('img')).toBeHidden();
    await hint.screenshot({ path: `test-results/flag-covered-${viewport.width}.png` });
    await page.locator('#btn-show-flag').click();
    await expect(hint.locator('img')).toBeVisible();
    await expect(hint).toHaveClass(/flag-revealed/);
    await page.evaluate(() => nextRound());
    await expect(hint.locator('img')).toBeHidden();
    await expect(hint).toHaveAttribute('aria-label', /Flag hidden/);
    const answer = await page.evaluate(() => state.currentCard.name);
    if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
    await page.locator('#choices button').filter({ hasText: answer }).click();
    await expect(hint).toHaveClass(/flag-revealed/);
    await expect(page.locator('#feedback-flag img')).toBeVisible();
  }
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: challenge results keep the completed level and replay at the chosen difficulty`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    const answer = await page.evaluate(() => state.currentCard.name);
    if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
    await page.locator('#choices button').filter({ hasText: answer }).click();
    await page.evaluate(() => endGame());
    await expect(page.locator('#results')).toBeVisible();
    const levels = page.locator('#quiz-next-difficulty');
    await expect(levels).toBeVisible();
    await expect(levels.locator('button')).toHaveCount(4);
    await expect(levels.getByRole('button', { name: 'Easy', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await levels.getByRole('button', { name: 'Medium', exact: true }).click();
    await expect(levels.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#res-level')).toHaveText('Easy');
    expect(await page.evaluate(() => state.level)).toBe('cadet');
    await expect(page.locator('#res-correct')).toHaveText('1/1');
    await expect(page.locator('#btn-again')).toHaveText('Play Medium');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/challenge-results-${viewport.width}.png`, fullPage: true });
    await page.locator('#btn-again').click();
    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Medium');
    expect(await page.evaluate(() => state.level)).toBe('explorer');
    await page.evaluate(() => endGame());
    await expect(levels.getByRole('button', { name: 'Medium', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#res-correct')).toHaveText('0/1');
  });
}

test('Country Hunt results replay with a new difficulty and retain the final score', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#btn-challenge-hunt').click();
  await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
  await page.evaluate(() => {
    GeoWars.explorer.submitCountry(GeoWars.explorer.getState().huntTargetId);
    GeoWars.explorer.endHunt(true);
  });
  const levels = page.locator('#hunt-next-difficulty');
  await expect(levels).toBeVisible();
  await levels.getByRole('button', { name: 'Expert', exact: true }).click();
  await expect(page.locator('#explorer-hunt-final-score')).toHaveText('1');
  expect(await page.evaluate(() => GeoWars.activities.getHuntOptions().level)).toBe('cadet');
  await expect(page.locator('#btn-explorer-hunt-again')).toHaveText('Play Expert');
  await page.screenshot({ path: 'test-results/hunt-results-difficulty.png', fullPage: true });
  await page.locator('#btn-explorer-hunt-again').click();
  await expect.poll(() => page.evaluate(() => {
    const target = GeoWars.explorer.getState().huntTargetId;
    return countryCards.some(c => c.id === target && ['hard', 'expert'].includes(c.difficulty));
  })).toBe(true);
  await expect(page.locator('#btn-activity-difficulty')).toHaveText('Difficulty: Expert');
  await expect(levels).toBeHidden();
});
