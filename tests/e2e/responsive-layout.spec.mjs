import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

async function expectTappable(locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeInViewport({ ratio: 1 });
  expect(await locator.evaluate(element => {
    const r = element.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}×${viewport.height}: globe controls and expanded facts remain reachable`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => GeoWars.activities.explore('globe'));
    await page.locator('#explorer-country-search').fill('Saint Vincent');
    await page.getByRole('option', { name: /Saint Vincent/ }).click();
    for (const button of await page.locator('.explorer-globe-controls button').all()) await expectTappable(button);
    await page.locator('#country-sheet-toggle').click();
    await page.locator('#explorer-country-currency').scrollIntoViewIfNeeded();
    await expect(page.locator('#explorer-country-currency')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });

  test(`${viewport.width}×${viewport.height}: Daily suggestions fit without manual page scrolling`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-activity-daily').click();
    await page.locator('#worldle-guess-input').fill('united');
    await expect(page.locator('#worldle-suggestions')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#worldle-guess-input')).toBeInViewport({ ratio: 1 });
    await page.locator('#worldle-guess-input').press('ArrowDown');
    await expect(page.locator('#worldle-suggestions [aria-selected="true"]')).toBeInViewport({ ratio: 1 });
    await page.getByRole('option', { name: 'United Arab Emirates' }).click();
    await expect(page.locator('.worldle-guess-row')).toContainText('United Arab Emirates');
  });

  test(`${viewport.width}×${viewport.height}: practice feedback keeps Next country visible`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => GeoWars.activities.startQuiz('showoff'));
    await page.locator('#btn-reveal').click();
    await expect(page.locator('#btn-feedback-next')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#feedback-country-name')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#feedback-facts')).not.toHaveAttribute('open');
    await page.locator('#feedback-facts > summary').click();
    await expect(page.locator('#feedback-details')).toBeVisible();
    await page.locator('#btn-feedback-next').click();
    await expect(page.locator('#silhouette-box')).toBeVisible();
  });
}

test('landscape phone keeps all activity paths inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  for (const selector of ['#btn-explore-hunt', '#btn-challenge-hunt', '#btn-explore-shapes', '#btn-challenge-shapes']) {
    const button = page.locator(selector);
    await expect(button).toBeInViewport({ ratio: 1 });
    const box = await button.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }
});

test('Daily guess names wrap fully on narrow phones and desktop columns', async ({ page }) => {
  for (const width of [320, 390, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('#btn-activity-daily').click();
    const name = await page.evaluate(() => {
      const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
      return window.countryCards.filter(card => card.id !== target.id).sort((a,b) => b.name.length - a.name.length)[0].name;
    });
    await page.locator('#worldle-guess-input').fill(name);
    await page.locator('#worldle-guess-input').press('Enter');
    const label = page.locator('.worldle-guess-name').first();
    await expect(label).toHaveText(name);
    expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
});
