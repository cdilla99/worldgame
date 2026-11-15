import { expect, test } from '@playwright/test';

const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
test.use({ isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}px: Player holds preferences and difficulty is absent from the home page`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => GeoWars.activities.home());
    await expect(page.locator('#btn-showoff')).toBeHidden();
    await expect(page.locator('[data-level="cadet"]')).toBeHidden();
    const player = page.locator('#atlas-utility-menu > summary');
    await expect(player).toHaveAccessibleName('Player menu for Guest');
    await expect(player.locator('.player-avatar')).toBeVisible();
    const box = await player.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await player.tap();
    const menuBox = await page.locator('#atlas-utility-panel').boundingBox();
    expect(menuBox.y).toBeGreaterThanOrEqual(box.y + box.height);
    expect(menuBox.y - (box.y + box.height)).toBeLessThanOrEqual(12);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await expect(page.locator('#atlas-utility-panel #btn-sprint')).toHaveCount(0);
    await expect(page.locator('#btn-choose-player')).toBeHidden();
    await page.evaluate(async () => {
      GeoWarsProfiles.create('Ada', '🌍', false);
      await renderPlayerContext({ local: true, displayName: 'Ada', claimed: false });
    });
    await expect(page.locator('#btn-choose-player')).toBeVisible();
    const playerRow = await page.locator('#btn-choose-player').boundingBox();
    const playerSlot = await page.locator('#atlas-player-slot').boundingBox();
    expect(Math.abs(playerRow.width - playerSlot.width)).toBeLessThanOrEqual(1);
    await expect(page.locator('#btn-explorer-music span').first()).toBeVisible();
    expect((await page.locator('#btn-explorer-music').boundingBox()).width).toBeGreaterThan(100);
    await player.press('Escape');
    await expect(page.locator('#atlas-utility-menu')).toHaveJSProperty('open', false);
    await expect(player).toBeFocused();
    await page.evaluate(() => GeoWars.activities.explore('globe'));
    await player.tap();
    // Every visible control must receive hits above search and globe layers.
    const close = page.getByRole('button', { name: 'Close player panel' });
    await expect(close).toBeInViewport();
    await page.screenshot({ path: `test-results/player-panel-${viewport.width}.png` });
    await close.click();
    await expect(page.locator('#atlas-utility-menu')).toHaveJSProperty('open', false);
    await expect(player).toBeFocused();
    await player.tap();
    await page.locator('#btn-choose-player').click();
    await expect(page.locator('#player-profile-modal')).toBeVisible();
    await expect(page.getByRole('button', { name: '🌍 Ada · Current', exact: true })).toBeDisabled();
    await page.locator('#btn-close-player-modal').click();
    if (viewport.width === 390) {
      await player.tap();
      await page.locator('#btn-choose-player').click();
      await expect(page.locator('#player-profile-modal')).toBeVisible();
      await expect(page.locator('#atlas-utility-menu')).toHaveJSProperty('open', false);
      await page.locator('#btn-close-player-modal').click();
      await expect(player).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

test('phone player menu stays beneath its icon, shows full names, traps focus and dismisses', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(async () => {
    await renderPlayerContext({ local: true, displayName: 'Alexandra Long Player Name', claimed: false });
    let playing = false;
    let muted = false;
    window.BackgroundMusic = {
      isPlaying: () => playing,
      isMuted: () => muted,
      setMuted: value => { muted = value; },
      start: () => { playing = true; return Promise.resolve(true); },
    };
  });
  const trigger = page.locator('#atlas-utility-menu > summary');
  await expect(trigger.locator('.player-initial')).toBeVisible();
  await expect(trigger.locator('.player-initial')).toHaveText('A');
  await expect(trigger.locator('.player-avatar')).toBeHidden();
  await trigger.click();
  const sheet = page.locator('#atlas-utility-panel');
  await expect(sheet).toHaveAttribute('aria-modal', 'true');
  const sheetBox = await sheet.boundingBox();
  const triggerBox = await trigger.boundingBox();
  expect(Math.abs(sheetBox.y - triggerBox.y - triggerBox.height - 8)).toBeLessThanOrEqual(1);
  expect(sheetBox.y + sheetBox.height).toBeLessThanOrEqual(844);
  await expect(page.locator('#player-context-name')).toContainText('Alexandra Long Player Name');
  expect(await page.locator('#player-context-name').evaluate(element => getComputedStyle(element).textOverflow)).toBe('clip');
  const music = page.getByRole('switch', { name: 'Music', exact: true });
  await music.click();
  await expect(music).toHaveAttribute('aria-checked', 'true');
  await music.click();
  await expect(music).toHaveAttribute('aria-checked', 'false');
  const close = page.locator('#btn-close-player-panel');
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.landing-statistics-toggle')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.locator('#player-menu-backdrop').click({ position: { x: 10, y: 10 } });
  await expect(page.locator('#atlas-utility-menu')).toHaveJSProperty('open', false);
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/player-sheet-open/);
});

for (const view of ['globe', 'shapes']) {
  test(`phone ${view}: loading and loaded landmark photo use the same visible space`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const held = [];
    await page.route('https://en.wikipedia.org/**', route => held.push(route));
    await page.route('https://upload.wikimedia.org/test-fixtures/**', route => route.fulfill({ contentType: 'image/png', body: photo }));
    try {
      await page.goto('/');
      await page.evaluate(() => GeoWars.activities.explore('globe'));
      if (view === 'shapes') {
        await page.evaluate(() => GeoWars.activities.explore('shapes'));
        await page.locator('#atlas-shape-country').selectOption({ label: 'Egypt' });
      } else {
        await page.locator('#explorer-country-search').fill('Egypt');
        await page.getByRole('option', { name: /Egypt/ }).click();
      }
      const pending = page.locator('#explorer-landmark-placeholder');
      await expect(pending).toBeHidden();
      expect(held.length).toBe(0);
      await page.locator('#country-sheet-toggle').tap();
      await expect(pending).toBeVisible();
      expect(await page.locator('#explorer-landmark-placeholder').evaluate(element => element.parentElement.id)).toBe('explorer-more-details');
      await expect(page.locator('#explorer-landmark-status')).toHaveText('Loading photo…');
      await expect(page.locator('#explorer-landmark-media-image')).toHaveAttribute('loading', 'lazy');
      await pending.scrollIntoViewIfNeeded();
      const before = await pending.boundingBox();
      await expect.poll(() => held.length).toBeGreaterThan(0);
      for (const route of held.splice(0)) await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ query: { pages: { 1: {
        title: 'Nile River', thumbnail: { source: 'https://upload.wikimedia.org/test-fixtures/nile.png' }, fullurl: 'https://en.wikipedia.org/wiki/Nile'
      } } } }) });
      const loaded = page.locator('#explorer-landmark-media');
      await expect(loaded).toBeVisible();
      const after = await loaded.boundingBox();
      expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
      expect(await page.locator('#explorer-landmark-media-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(page.locator('#explorer-landmark-learn-more')).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Nile');
      await expect(pending).toBeHidden();
      await page.locator('#explorer-landmark-media-toggle').click();
      await expect(loaded).toHaveClass(/is-expanded/);
    } finally {
      for (const route of held) await route.abort().catch(() => {});
    }
  });
}

test('failed landmark photos keep an informative Wikipedia link in the phone card', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => GeoWars.activities.explore('globe'));
  await page.locator('#explorer-country-search').fill('Egypt');
  await page.getByRole('option', { name: /Egypt/ }).click();
  await page.locator('#country-sheet-toggle').tap();
  await expect(page.locator('#explorer-landmark-status')).toContainText('Photo unavailable');
  await expect(page.locator('#explorer-landmark-placeholder')).toBeVisible();
  await expect(page.locator('#explorer-landmark-placeholder-link')).toHaveAttribute('href', /https:\/\/en.wikipedia.org\/w\/index.php\?search=/);
  await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
