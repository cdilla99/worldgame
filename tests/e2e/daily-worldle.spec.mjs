import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto('/');
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('#worldle-shape-art svg')).toBeVisible();
});

test('real guesses give geographic hints, survive reload, and complete the puzzle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const countries = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    return {
      target: target.name,
      wrong: window.countryCards.filter(card => card.id !== target.id).slice(0, 2).map(card => card.name)
    };
  });
  const input = page.locator('#worldle-guess-input');
  const rows = page.locator('.worldle-guess-row');

  await expect(page.locator('#worldle-shape-art svg')).toHaveAttribute('aria-label', 'Mystery country outline');
  await page.locator('#btn-worldle-stats').click();
  await expect(page.locator('#worldle-revealed-name')).toHaveText('Mystery country');
  await expect(page.locator('#btn-worldle-share')).toBeHidden();
  await page.locator('#btn-worldle-modal-close').click();

  await input.fill('not a country');
  await page.locator('#worldle-guess-submit').click();
  await expect(page.locator('#worldle-toast')).toHaveText('Unknown country name');
  await input.fill(countries.wrong[0]);
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#worldle-guess-submit').click();
  await expect(rows.first()).toContainText(countries.wrong[0]);
  const expected = await page.evaluate(name => {
    const game = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards);
    const guess = window.countryCards.find(card => card.name === name);
    const byId = new Map(window.GeoWarsGlobeCountries.map(country => [country.i, country]));
    return window.GeoWarsGeography.hintBetween(byId.get(guess.id), byId.get(game.target.id));
  }, countries.wrong[0]);
  expect(expected.distanceKm).toBeGreaterThan(0);
  await expect(rows.first().locator('.worldle-guess-distance')).toHaveText(expected.displayDistance);
  await expect(rows.first().locator('.worldle-guess-direction')).toHaveAttribute('aria-label', expected.directionLabel);
  await expect(rows.first().locator('.worldle-guess-direction svg')).toBeVisible();
  await expect(rows.first().locator('.worldle-proximity-label')).toHaveText(`${Math.round((20015 - expected.distanceKm) / 20015 * 100)}%`);

  await input.fill(countries.wrong[0]);
  await input.press('Enter');
  await expect(page.locator('#worldle-toast')).toHaveText('Already guessed!');
  await expect(page.locator('.worldle-guess-row:not(.is-empty)')).toHaveCount(1);
  await input.fill(countries.wrong[1]);
  await page.getByRole('option', { name: new RegExp(countries.wrong[1]) }).click();
  await expect(rows.nth(1)).toContainText(countries.wrong[1]);

  await page.reload();
  await page.locator('#btn-activity-daily').click();
  await expect(rows.first().locator('.worldle-guess-distance')).toHaveText(expected.displayDistance);
  await expect(rows.nth(1)).toContainText(countries.wrong[1]);
  await input.fill(countries.target);
  await input.press('Enter');
  await expect(page.locator('#worldle-modal')).toBeVisible();
  await expect(page.locator('#worldle-revealed-name')).toHaveText(countries.target);
  await expect(page.locator('#btn-worldle-share')).toBeVisible();
  await expect(input).toBeDisabled();
  expect(errors).toEqual([]);
});

test('Daily opening panel fits its content on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const [guidance, panel] = await page.evaluate(() => [
    document.querySelector('#worldle-guidance').getBoundingClientRect().bottom,
    document.querySelector('.worldle-play-panel').getBoundingClientRect().bottom
  ]);
  expect(panel - guidance).toBeGreaterThan(0);
  expect(panel - guidance).toBeLessThan(50);
});

test('Daily uses the logo to return home and shows geographic guidance without slogans', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.worldle-guess-row')).toHaveCount(0);
    await expect(page.locator('#worldle-guidance')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('#worldle-guidance-title')).toContainText('distance and direction');
    await expect(page.locator('#worldle-history-heading')).toBeHidden();
    await expect(page.locator('#worldle-guess-input')).toBeVisible();
    await expect(page.locator('#worldle-day-label')).toHaveText(/^#\d+$/);
    await expect(page.locator('#activity-context')).toBeHidden();
    await expect(page.locator('#btn-explorer-home')).toBeInViewport({ ratio: 1 });
    expect(await page.locator('#worldle-screen').innerText()).not.toMatch(/Daily discovery|Trust your first instinct|Your adventure starts here/);
    await page.screenshot({ path: `test-results/daily-home-guidance-${width}.png`, fullPage: true });
    await page.locator('#btn-explorer-home img').click();
    await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
    await page.locator('#btn-activity-daily').click();
  }
});

test('real guesses turn the compass, celebrate getting warmer and retain the closest clue after a worse guess', async ({ page }) => {
  const route = await page.evaluate(async () => {
    const geometry = await window.GeoWarsShapeGeometry.loadGeometry();
    const byId = new Map(geometry.map(country => [country.i, country]));
    const game = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards);
    const candidates = window.countryCards.filter(card => card.id !== game.target.id)
      .map(card => ({ card, hint: window.GeoWarsGeography.hintBetween(byId.get(card.id), byId.get(game.target.id)) }))
      .sort((a, b) => a.hint.distanceKm - b.hint.distanceKm);
    return { far: candidates.at(-1), near: candidates[0], middle: candidates[Math.floor(candidates.length / 2)] };
  });
  const input = page.locator('#worldle-guess-input');
  await input.fill(route.far.card.name);
  await input.press('Enter');
  await expect(page.locator('.worldle-guess-row')).toHaveCount(1);
  await expect(page.locator('#worldle-guidance')).toHaveAttribute('data-state', 'searching');
  await expect(page.locator('#worldle-guidance-copy')).toContainText(route.far.hint.displayDistance);
  const needleBearing = await page.locator('#worldle-compass-needle').evaluate(element =>
    Number(element.style.transform.match(/rotate\(([-\d.]+)deg\)/)[1]));
  expect(needleBearing).toBeCloseTo(route.far.hint.bearingDegrees, 2);
  await input.fill(route.near.card.name);
  await input.press('Enter');
  await expect(page.locator('#worldle-guidance-title')).toHaveText('Closer');
  await expect(page.locator('#worldle-closest-label')).toHaveText(route.near.hint.displayDistance);
  await input.fill(route.middle.card.name);
  await input.press('Enter');
  await expect(page.locator('#worldle-guidance-kicker')).toHaveText('A different direction');
  await expect(page.locator('#worldle-closest-label')).toHaveText(route.near.hint.displayDistance);
  await expect(page.locator('.worldle-guess-row')).toHaveCount(3);
  await expect(page.locator('.worldle-guess-row.is-empty')).toHaveCount(0);
  await page.reload();
  await page.locator('#btn-activity-daily').click();
  await expect(page.locator('#worldle-closest-label')).toHaveText(route.near.hint.displayDistance);
  await expect(page.locator('.worldle-guess-row')).toHaveCount(3);
});

test('puzzle uses SVG controls and flag images with an offline fallback', async ({ page }) => {
  await page.route('https://flagcdn.com/*.svg', route => route.fulfill({
    status: 200, contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><rect width="30" height="20" fill="red"/></svg>'
  }));
  const wrong = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    return window.countryCards.find(card => card.id !== target.id).name;
  });
  for (const selector of ['#btn-worldle-stats', '#worldle-guess-submit']) {
    await expect(page.locator(`${selector} svg`)).toBeVisible();
  }
  await page.locator('#btn-worldle-stats').click();
  await expect(page.locator('.worldle-revealed-country')).toBeHidden();
  await expect(page.locator('#btn-worldle-modal-close svg')).toBeVisible();
  await page.locator('#btn-worldle-modal-close').click();
  await page.locator('#worldle-guess-input').fill(wrong);
  const option = page.locator('#worldle-suggestions [role="option"]').filter({ hasText: wrong });
  const flag = option.locator('.worldle-autocomplete-flag img');
  await expect(flag).toHaveAttribute('src', /flagcdn\.com\/[a-z]{2}\.svg/);
  await expect.poll(() => flag.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await option.click();
  await expect(page.locator('.worldle-guess-row:not(.is-empty) .worldle-guess-flag img')).toBeVisible();

  await page.unroute('https://flagcdn.com/*.svg');
  await page.reload();
  await page.locator('#btn-activity-daily').click();
  const offlineFlag = page.locator('.worldle-guess-row:not(.is-empty) .worldle-guess-flag');
  await expect(offlineFlag.locator('[data-asset-fallback="flag"]')).toBeVisible();
  await expect(offlineFlag.locator('.asset-fallback__code')).toHaveText(/^[A-Z]{2}$/);
});

test('previously recorded placeholder hints are corrected without erasing progress', async ({ page }) => {
  const wrong = await page.evaluate(() => {
    const api = window.GeoWarsDailyWorldle;
    const game = api.getDailyGame(window.countryCards);
    const card = window.countryCards.find(c => c.id !== game.target.id);
    api.submitGuess(card, window.countryCards, {
      hintBetween: () => ({ distanceKm: 0, displayDistance: '0 km', bearingDegrees: 0, direction: 'N', directionLabel: '', arrow: '↑' })
    });
    return card.name;
  });
  await page.reload();
  await page.locator('#btn-activity-daily').click();
  const first = page.locator('.worldle-guess-row').first();
  await expect(first).toContainText(wrong);
  await expect(first.locator('.worldle-guess-distance')).not.toHaveText('0 km');
  expect(await page.evaluate(() => window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).guesses.length)).toBe(1);
});

test('six incorrect guesses complete a loss and reveal the answer', async ({ page }) => {
  const { target, wrong } = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    return {
      target: target.name,
      wrong: window.countryCards.filter(card => card.id !== target.id).slice(0, 6).map(card => card.name)
    };
  });
  const input = page.locator('#worldle-guess-input');
  for (const [index, name] of wrong.entries()) {
    await input.fill(name);
    await input.press('Enter');
    await expect(page.locator('.worldle-guess-row:not(.is-empty)')).toHaveCount(index + 1);
  }
  await expect(page.locator('#worldle-modal')).toBeVisible();
  await expect(page.locator('#worldle-revealed-name')).toHaveText(target);
  await expect(page.locator('#worldle-modal-title')).toHaveText('Not solved');
  await expect(input).toBeDisabled();
});

test('storage failures show an error without consuming the guess', async ({ page }) => {
  const wrong = await page.evaluate(() => {
    const target = window.GeoWarsDailyWorldle.getDailyGame(window.countryCards).target;
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
    return window.countryCards.find(card => card.id !== target.id).name;
  });
  const input = page.locator('#worldle-guess-input');
  await input.fill(wrong);
  await input.press('Enter');
  await expect(page.locator('#worldle-toast')).toContainText('Could not save your guess');
  await expect(input).toHaveValue(wrong);
  await expect(page.locator('.worldle-guess-row:not(.is-empty)')).toHaveCount(0);
});

test('puzzle layout keeps the outline, input and suggestions usable at every size', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      };
      const input = document.querySelector('#worldle-guess-input');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        figure: rect('.worldle-silhouette-card'),
        outline: rect('#worldle-shape-art svg'),
        panel: rect('.worldle-play-panel'),
        input: rect('#worldle-guess-input'),
        button: rect('#worldle-guess-submit'),
        inputPadding: parseFloat(getComputedStyle(input).paddingRight)
      };
    });
    expect(layout.scrollWidth, `${width}px has no horizontal overflow`).toBeLessThanOrEqual(width);
    expect(layout.outline.left).toBeGreaterThanOrEqual(layout.figure.left);
    expect(layout.outline.right).toBeLessThanOrEqual(layout.figure.right);
    expect(layout.outline.top).toBeGreaterThanOrEqual(layout.figure.top);
    expect(layout.outline.bottom).toBeLessThanOrEqual(layout.figure.bottom);
    expect(layout.inputPadding).toBeGreaterThanOrEqual(layout.input.right - layout.button.left);
    if (width > 850) {
      expect(layout.panel.left).toBeGreaterThanOrEqual(layout.figure.right);
    } else {
      expect(layout.panel.top).toBeGreaterThanOrEqual(layout.figure.bottom);
    }

    await page.locator('#worldle-guess-input').fill('can');
    const suggestions = page.locator('#worldle-suggestions');
    await expect(suggestions).toBeVisible();
    const box = await suggestions.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.locator('#worldle-guess-input').fill('');
  }
});
