import { expect, test } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  // Keep the test independent of live accounts and image providers.
  await page.route(/^https:\/\//, route => route.abort());
});

async function expectOnScreen(page, selectors) {
  // Check before any Playwright interaction can automatically scroll a target.
  expect(await page.evaluate(() => scrollY)).toBe(0);
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
  }
  const size = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    contentWidth: document.documentElement.scrollWidth,
    contentHeight: document.documentElement.scrollHeight,
  }));
  expect(size.contentWidth).toBeLessThanOrEqual(size.width);
  expect(size.contentHeight).toBeLessThanOrEqual(size.height + 1);
}

// Include space lost to Safari's expanded browser bars, small iPhones and rotation.
for (const viewport of [
  { width: 320, height: 568 }, { width: 375, height: 548 },
  { width: 390, height: 664 }, { width: 430, height: 746 },
  { width: 667, height: 375 }, { width: 844, height: 390 },
]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const view of ['hunt', 'shapes']) {
      test(`${view}: artwork, flag and country essentials fit without scrolling`, async ({ page }) => {
        await page.goto('/');
        await page.locator(`#btn-explore-${view}`).tap();
        // A long country name must wrap without hiding the final facts row.
        const name = 'Saint Vincent and the Grenadines';
        if (view === 'hunt') {
          await page.locator('#explorer-country-search').fill(name);
          await page.getByRole('option', { name: new RegExp(name) }).tap();
          await page.locator('#explorer-country-search').blur();
        } else {
          await page.locator('#atlas-shape-country').selectOption({ label: name });
        }
        await expect(page.locator('#explorer-country-name')).toHaveText(name);
        await expectOnScreen(page, [
          '#btn-activity-home', '#btn-activity-challenge', '#country-sheet-toggle',
          view === 'hunt' ? '#explorer-globe-canvas' : '#atlas-shape-art',
          '#explorer-country-flag', '#explorer-country-name',
          ...['capital', 'population', 'area', 'languages', 'currency'].map(field => `#explorer-country-${field}`),
        ]);
        await page.screenshot({ path: `test-results/phone-${test.info().project.name}-${view}-${viewport.width}.png` });
        await page.locator('#country-sheet-toggle').tap();
        await expect(page.locator('#country-sheet-toggle')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#explorer-country-fact')).toBeVisible();
      });
    }

    test('Country Hunt keeps the target flag, globe controls and guess feedback on screen', async ({ page }) => {
      await page.goto('/');
      await page.locator('#btn-challenge-hunt').tap();
      await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().geometryReady)).toBe(true);
      const selectors = ['#explorer-hunt-target-flag', '#explorer-hunt-target',
        '#explorer-globe-canvas', '#btn-explorer-zoom-in', '#btn-explorer-hunt-exit', '#explorer-hunt-feedback'];
      await expectOnScreen(page, selectors);
      await page.evaluate(() => {
        const target = GeoWars.explorer.getState().huntTargetId;
        GeoWars.explorer.submitCountry(countryCards.find(card => card.id !== target).id);
      });
      await expectOnScreen(page, selectors);
    });

    test('Shape Quiz keeps answer choices and hints on screen', async ({ page }) => {
      await page.goto('/');
      await page.locator('#btn-challenge-shapes').tap();
      await expectOnScreen(page, ['#flag-hint', '#silhouette-box', '#choices', '#btn-show-flag', '#btn-show-region', '#btn-skip']);
      await page.locator('#btn-show-flag').tap();
      await expect(page.locator('#flag-hint')).toHaveClass(/flag-revealed/);
      await page.locator('#btn-show-region').tap();
      await expectOnScreen(page, ['#flag-hint', '#region-reveal-card', '#choices', '#btn-skip']);
    });

    test('Hard quiz fits six choices and revealed hints', async ({ page }) => {
      await page.goto('/');
      await page.locator('#btn-challenge-shapes').tap();
      await page.locator('#btn-game-difficulty').tap();
      await page.locator('[data-level="earthling"]').tap();
      await page.locator('#btn-apply-activity-settings').tap();
      await expectOnScreen(page, ['#btn-i-know', '#btn-show-options', '#flag-hint', '#btn-show-region']);
      await page.locator('#btn-show-options').tap();
      await expect(page.locator('#choices .choice-btn:not(.hidden)')).toHaveCount(6);
      await page.locator('#btn-show-region').tap();
      await expectOnScreen(page, ['#choices', '#region-reveal-card', '#flag-hint', '#btn-skip']);
    });
  });
}
