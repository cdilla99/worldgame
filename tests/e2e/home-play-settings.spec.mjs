import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 1440, height: 900 },
]) {
  test(`${viewport.width}x${viewport.height}: shared Play settings stay readable and usable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const group = page.getByRole('group', { name: 'Play settings', exact: true });
    await expect(group).toHaveCount(1);
    await expect(page.locator('.atlas-challenge-card #btn-home-difficulty')).toHaveCount(0);
    await expect(page.locator('.atlas-challenge-card #btn-home-region')).toHaveCount(0);
    await expect(page.locator('#btn-home-difficulty')).toHaveAccessibleName(/Difficulty.*Auto/);
    await expect(page.locator('#btn-home-region')).toHaveAccessibleName(/Region.*Worldwide/);
    for (const selector of ['#btn-home-difficulty', '#btn-home-region']) {
      const button = page.locator(selector);
      await expect(button).toBeInViewport({ ratio: 1 });
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const activity of ['hunt', 'shapes']) {
      const play = page.locator(`#btn-challenge-${activity}`);
      await expect(play.locator('.activity-action-label')).toHaveText('Play');
      await expect(play.locator('.activity-duration')).toHaveCount(0);
      await expect(page.locator(`#btn-explore-${activity}`)).not.toContainText('60s');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/home-play-settings-${viewport.width}.png`, fullPage: true });
  });
}

test('each shared control focuses its own selected field, and Escape restores focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-home-difficulty').click();
  await expect(page.locator('#activity-settings-dialog')).toBeVisible();
  await expect(page.locator('#activity-settings-dialog [data-level].active')).toBeFocused();
  await expect(page.locator('#btn-apply-activity-settings')).toHaveText('Apply');
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-home-difficulty')).toBeFocused();
  await page.locator('#btn-home-region').click();
  await expect(page.locator('#activity-settings-dialog [data-continent].active')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-home-region')).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});

test('applied settings persist while cancelled drafts leave the home summary unchanged', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-home-difficulty').click();
  await page.locator('#activity-settings-dialog [data-level="adaptive"]').click();
  await page.locator('#activity-settings-dialog [data-continent="Asia"]').click();
  await page.locator('#btn-apply-activity-settings').click();
  await expect(page.locator('#home-difficulty-value')).toHaveText('Auto');
  await expect(page.locator('#home-region-value')).toHaveText('Asia');
  await expect(page.locator('#game')).toBeHidden();
  expect(await page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).toBeNull();

  const saved = await page.evaluate(() => localStorage.getItem('earthling-quiz-preferences'));
  await page.locator('#btn-home-region').click();
  await page.locator('#activity-settings-dialog [data-level="expert"]').click();
  await page.locator('#activity-settings-dialog [data-continent="Europe"]').click();
  await expect(page.locator('#home-difficulty-value')).toHaveText('Auto');
  await expect(page.locator('#home-region-value')).toHaveText('Asia');
  await page.keyboard.press('Escape');
  await expect(page.locator('#btn-home-region')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('earthling-quiz-preferences'))).toBe(saved);
  await page.reload();
  await expect(page.locator('#home-difficulty-value')).toHaveText('Auto');
  await expect(page.locator('#home-region-value')).toHaveText('Asia');
});

for (const activity of ['hunt', 'shapes']) {
  test(`shared settings apply to ${activity} Play`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-home-difficulty').click();
    await page.locator('#activity-settings-dialog [data-level="expert"]').click();
    await page.locator('#activity-settings-dialog [data-continent="Europe"]').click();
    await page.locator('#btn-apply-activity-settings').click();
    await expect(page.locator('#btn-home-difficulty')).toHaveAccessibleName(/Difficulty.*Expert/);
    await expect(page.locator('#btn-home-region')).toHaveAccessibleName(/Region.*Europe/);
    await page.locator(`#btn-challenge-${activity}`).click();
    if (activity === 'shapes') {
      await expect(page.locator('#btn-game-difficulty')).toHaveText('Difficulty: Expert');
      expect(await page.evaluate(() => ({ level: state.level, region: state.currentCard.continent })))
        .toEqual({ level: 'expert', region: 'Europe' });
    } else {
      await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
      expect(await page.evaluate(() => GeoWars.activities.getHuntOptions()))
        .toEqual({ level: 'expert', continent: 'Europe' });
      expect(await page.evaluate(() => {
        const target = countryCards.find(card => card.id === GeoWars.explorer.getState().huntTargetId);
        return target.continent === 'Europe' && ['hard', 'expert'].includes(target.difficulty);
      })).toBe(true);
    }
  });
}
