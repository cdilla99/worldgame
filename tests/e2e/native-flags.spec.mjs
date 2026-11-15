import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  for (const code of ['ca', 'ch', 'qa', 'va', 'lk']) {
    const body = await readFile(new URL(`../fixtures/flags/${code}.svg`, import.meta.url), 'utf8');
    await page.route(`https://flagcdn.com/w160/${code}.png`, route => route.fulfill({ contentType: 'image/svg+xml', body }));
    await page.route(`https://flagcdn.com/${code}.svg`, route => route.fulfill({ contentType: 'image/svg+xml', body }));
  }
});

async function expectNativeNepal(image) {
  await expect(image).toHaveAttribute('src', /assets\/flags\/np\.svg$/);
  await expect(image).toHaveClass(/is-nonrect-flag/);
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  const style = await image.evaluate(img => ({
    fit: getComputedStyle(img).objectFit,
    corners: getComputedStyle(img).borderRadius,
    background: getComputedStyle(img.parentElement).backgroundColor,
    nativeRatio: img.naturalWidth / img.naturalHeight
  }));
  expect(style.fit).toBe('contain');
  expect(style.corners).toBe('0px');
  expect(style.background).toBe('rgba(0, 0, 0, 0)');
  expect(style.nativeRatio).toBeCloseTo(726 / 885, 2);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: globe flag slot fits wide, square, and native pennant flags`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const preview = page.locator('#activity-hunt-preview');
    await expect(preview).toHaveAttribute('data-preview-phase', 'answer');
    for (const name of ['Canada', 'Switzerland', 'Nepal', 'Qatar', 'Vatican City', 'Sri Lanka']) {
      await preview.evaluate((element, name) => {
        const card = countryCards.find(card => card.name === name);
        const slot = element.querySelector('.atlas-quiz-answer-flag');
        slot.replaceChildren();
        const img = document.createElement('img');
        slot.append(img);
        AssetFallbacks.prepareImage(img, 'flag', card, { variant: 'compact' });
        element.querySelector('strong').textContent = name;
      }, name);
      const image = preview.locator('.atlas-hunt-answer img');
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const fit = await image.evaluate(img => {
        const r = img.getBoundingClientRect(), slot = img.parentElement.getBoundingClientRect();
        return { inside: r.left >= slot.left - .1 && r.right <= slot.right + .1 && r.top >= slot.top - .1 && r.bottom <= slot.bottom + .1,
          ratio: r.width / r.height, nativeRatio: img.naturalWidth / img.naturalHeight,
          imageBounds: { x: r.x, y: r.y, width: r.width, height: r.height }, slotBounds: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
          corners: getComputedStyle(img).borderRadius, fit: getComputedStyle(img).objectFit };
      });
      expect(fit.inside, name + ': ' + JSON.stringify(fit)).toBe(true);
      expect(fit.ratio).toBeCloseTo(fit.nativeRatio, 1);
      expect(fit.corners).toBe('0px');
      expect(fit.fit).toBe('contain');
      if (name === 'Nepal') await expectNativeNepal(image);
      await preview.screenshot({ path: `test-results/globe-flag-${name}-${viewport.width}.png` });
    }
  });

  test(`${viewport.width}: Nepal stays complete in Explore, quiz hint/feedback, and Daily flags`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-explore-hunt').click();
    await page.locator('#explorer-country-search').fill('Nepal');
    await expectNativeNepal(page.locator('.explorer-search-option-flag img').first());
    await page.getByRole('option', { name: /Nepal/ }).click();
    await expectNativeNepal(page.locator('#explorer-country-flag img'));
    await page.locator('#explorer-country-card').screenshot({ path: `test-results/nepal-explore-${viewport.width}.png` });
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    await page.evaluate(() => startGame({ deckCardIds: [87, 2], sessionKind: 'standard' }));
    await expect(page.locator('#flag-hint img')).toBeHidden();
    await page.locator('#btn-show-flag').click();
    await expectNativeNepal(page.locator('#flag-hint img'));
    if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
    await page.locator('#choices button').filter({ hasText: 'Nepal' }).click();
    await expectNativeNepal(page.locator('#feedback-flag img'));
    await page.locator('#feedback-flag').screenshot({ path: `test-results/nepal-feedback-${viewport.width}.png` });
    await page.goto('/');
    await page.locator('#btn-activity-daily').click();
    await page.locator('#worldle-guess-input').fill('Nepal');
    await expectNativeNepal(page.locator('.worldle-autocomplete-flag img').first());
    await page.locator('#worldle-guess-submit').click();
    await expectNativeNepal(page.locator('.worldle-guess-flag img').first());
    await page.locator('.worldle-guess-flag').first().screenshot({ path: `test-results/nepal-daily-${viewport.width}.png` });
  });

  test(`${viewport.width}: square and wide flags keep their proportions in country details and Daily`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-explore-hunt').click();
    for (const name of ['Switzerland', 'Qatar', 'Vatican City']) {
      await page.locator('#explorer-country-search').fill(name);
      await page.getByRole('option', { name: new RegExp(name) }).click();
      const image = page.locator('#explorer-country-flag img');
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const ratio = await image.evaluate(img => { const r = img.getBoundingClientRect(); return { painted: r.width / r.height, native: img.naturalWidth / img.naturalHeight }; });
      expect(ratio.painted).toBeCloseTo(ratio.native, 1);
      await page.locator('#explorer-country-flag').screenshot({ path: `test-results/details-flag-${name}-${viewport.width}.png` });
    }
    await page.goto('/');
    await page.locator('#btn-activity-daily').click();
    await page.locator('#worldle-guess-input').fill('Qatar');
    const image = page.locator('.worldle-autocomplete-flag img').first();
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const ratio = await image.evaluate(img => { const r = img.getBoundingClientRect(); return { painted: r.width / r.height, native: img.naturalWidth / img.naturalHeight }; });
    expect(ratio.painted).toBeCloseTo(ratio.native, 1);
  });

  test(`${viewport.width}: Hunt feedback preserves Nepal and Qatar without cropping`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-hunt').click();
    await expect.poll(() => page.evaluate(() => GeoWars.explorer.getState().huntTargetId)).not.toBeNull();
    for (const name of ['Nepal', 'Qatar']) {
      await page.evaluate(name => GeoWars.explorer.submitCountry(countryCards.find(card => card.name === name).id), name);
      // Desktop shows the selection card; phones show the compact feedback bar.
      const image = page.locator(viewport.width >= 1024 ? '#explorer-hunt-selected-flag img' : '#explorer-hunt-feedback-flag img');
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const ratio = await image.evaluate(img => { const r = img.getBoundingClientRect(); return { painted: r.width / r.height, native: img.naturalWidth / img.naturalHeight }; });
      expect(ratio.painted).toBeCloseTo(ratio.native, 1);
      if (name === 'Nepal') await expectNativeNepal(image);
      await image.locator('..').screenshot({ path: `test-results/hunt-flag-${name}-${viewport.width}.png` });
    }
  });
}
