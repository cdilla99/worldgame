import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.addInitScript(() => {
    window.soundStarts = 0;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (...args) {
      const oscillator = create.apply(this, args);
      const start = oscillator.start;
      oscillator.start = function (...values) { window.soundStarts++; return start.apply(this, values); };
      return oscillator;
    };
  });
});

test('home is silent until activation and gives one cue per keyboard or pointer action', async ({ page }) => {
  const music = [];
  await page.route('**/sounds/**', route => { music.push(route.request().url()); return route.abort(); });
  await page.goto('/');
  test.skip(!await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext)), 'This browser build does not expose Web Audio; fallback navigation is tested separately.');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => soundStarts)).toBe(0);
  await page.locator('#btn-home-difficulty').hover();
  expect(await page.evaluate(() => soundStarts)).toBe(0);
  await page.locator('#btn-home-difficulty').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#activity-settings-dialog')).toBeVisible();
  expect(await page.evaluate(() => soundStarts)).toBe(1);
  await page.locator('#btn-cancel-activity-settings').click();
  expect(await page.evaluate(() => soundStarts)).toBe(2);
  await page.locator('#btn-explore-shapes').click();
  expect(await page.evaluate(() => soundStarts)).toBe(3);
  expect(music).toEqual([]);
});

test('sound-effects preference persists and is shared with the game mute control', async ({ page }) => {
  await page.goto('/');
  const supportsAudio = await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext));
  await page.locator('#atlas-utility-menu > summary').click();
  const effects = page.getByRole('switch', { name: 'Sound effects', exact: true });
  await expect(effects).toHaveAttribute('aria-checked', 'true');
  await effects.click();
  await expect(effects).toHaveAttribute('aria-checked', 'false');
  const before = await page.evaluate(() => soundStarts);
  await page.locator('#btn-close-player-panel').click();
  await page.locator('#btn-home-difficulty').click();
  expect(await page.evaluate(() => soundStarts)).toBe(before);
  await page.reload();
  expect(await page.evaluate(() => soundStarts)).toBe(0);
  await page.locator('#btn-challenge-shapes').click();
  expect(await page.evaluate(() => soundStarts)).toBe(0);
  await expect(page.locator('#btn-mute')).toHaveAccessibleName('Enable sound effects');
  await page.locator('#btn-mute').click();
  expect(await page.evaluate(() => soundStarts)).toBe(supportsAudio ? 1 : 0);
  await expect(page.locator('#btn-mute')).toHaveAccessibleName('Mute sound effects');
  await page.evaluate(() => endGame());
  await page.locator('#btn-home').click();
  await page.locator('#atlas-utility-menu > summary').click();
  await expect(effects).toHaveAttribute('aria-checked', 'true');
});

test('navigation works when Web Audio is unavailable', async ({ page }) => {
  await page.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#btn-home-region').click();
  await expect(page.locator('#activity-settings-dialog')).toBeVisible();
  await page.locator('#btn-cancel-activity-settings').click();
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('#worldle-screen')).toBeVisible();
  expect(errors).toEqual([]);
});
