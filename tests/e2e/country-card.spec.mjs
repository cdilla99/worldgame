import { expect, test } from '@playwright/test';

test.use({ isMobile: true, hasTouch: true, reducedMotion: 'reduce' });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}px: country essentials stay visible and discovery loads only on expansion`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    await page.route(/^https:\/\//, route => route.abort());
    let lookups = 0;
    await page.route('https://en.wikipedia.org/**', route => {
      lookups++;
      return route.fulfill({ contentType: 'application/json', body: '{"query":{"pages":{}}}' });
    });
    for (const view of ['globe', 'shapes']) {
      const startLookups = lookups;
      await page.goto('/');
      await page.evaluate(() => GeoWars.activities.explore('globe'));
      const name = viewport.width === 320 ? 'Saint Vincent and the Grenadines' : 'Canada';
      if (view === 'globe') {
        await page.locator('#explorer-country-search').fill(name);
        await page.getByRole('option', { name: new RegExp(name) }).click();
      } else {
        await page.evaluate(() => GeoWars.activities.explore('shapes'));
        await page.locator('#atlas-shape-country').selectOption({ label: name });
      }
      const expected = await page.evaluate(name => {
        const country = window.countryCards.find(country => country.name === name);
        return { population: country.population_hint, area: country.area_hint, languages: country.main_languages.join(', '), currency: country.currency };
      }, name);
      for (const [field, value] of Object.entries(expected)) {
        await expect(page.locator(`#explorer-country-${field}`)).toBeVisible();
        await expect(page.locator(`#explorer-country-${field}`)).toHaveText(value.replace(/^(?:about|around) /, '~'));
      }
      await expect(page.locator('#explorer-more-details')).toHaveJSProperty('open', false);
      await expect(page.locator('#explorer-country-fact')).toBeHidden();
      await page.locator('#explorer-country-card').screenshot({ path: `test-results/country-${view}-${viewport.width}.png` });
      await expect(page.locator('#explorer-landmark-placeholder')).toBeHidden();
      await expect(page.locator('#explorer-landmark-media-image')).not.toHaveAttribute('src');
      const before = startLookups;
      await page.waitForTimeout(200);
      expect(lookups).toBe(before);
      const mobileToggle = page.locator('#country-sheet-toggle');
      const toggle = await mobileToggle.isVisible() ? mobileToggle : page.locator('#explorer-more-details > summary');
      await toggle.click();
      await expect.poll(() => lookups).toBeGreaterThan(before);
      await expect(page.locator('#explorer-country-fact')).toBeVisible();
      await toggle.click();
      await expect(page.locator('#explorer-country-fact')).toBeHidden();
      for (const field of ['population', 'area', 'languages', 'currency']) await expect(page.locator(`#explorer-country-${field}`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    }
  });
}
