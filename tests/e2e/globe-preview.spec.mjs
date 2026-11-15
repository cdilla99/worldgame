import { expect, test } from '@playwright/test';

const flag = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><path fill="#007749" d="M0 0h30v20H0z"/></svg>';

async function openGlobe(page, { flags = true, reducedMotion = 'no-preference' } = {}) {
  await page.route(/^https:\/\//, route => route.abort());
  if (flags) await page.route('https://flagcdn.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: flag }));
  await page.emulateMedia({ reducedMotion });
  await page.clock.install({ time: new Date('2026-11-10T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-10T12:00:01Z'));
  await page.goto('/');
  const preview = page.locator('#activity-hunt-preview');
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  await page.clock.runFor(32);
  return preview;
}

test('globe centres and highlights a country before revealing its matching flag, offset from Shape Quiz', async ({ page }) => {
  const preview = await openGlobe(page);
  const answer = preview.locator('.atlas-hunt-answer');
  await expect(preview).toHaveAttribute('data-preview-phase', 'turn');
  await expect(answer).toBeHidden();
  await page.clock.runFor(2600);
  await expect(preview).toHaveAttribute('data-preview-phase', 'shape');
  await expect(answer).toBeHidden();
  await expect(page.locator('#quiz-preview-art .atlas-quiz-answer')).toBeVisible();
  await page.clock.runFor(1400);
  await expect(answer).toBeVisible();
  await expect(answer).toContainText('South Africa');
  await expect(answer.locator('img')).toHaveAttribute('src', /\/za\.png$/);
  await page.clock.runFor(3000);
  await expect(answer).toBeVisible();
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  await page.clock.runFor(1000);
  await expect(preview).toHaveAttribute('data-preview-phase', 'turn');
  await expect(answer).toBeHidden();
  await expect(preview).not.toHaveAttribute('data-preview-country', '18');
  const name = await answer.locator('strong').textContent();
  const match = await preview.evaluate((element, expectedName) => {
    const card = countryCards.find(card => card.id === Number(element.dataset.previewCountry));
    return card.name === expectedName && card.difficulty === 'easy';
  }, name);
  expect(match).toBe(true);
});

test('hidden tabs pause turns and answer holds without skipping the current country', async ({ page }) => {
  const preview = await openGlobe(page);
  const canvas = preview.locator('canvas');
  const hide = value => page.evaluate(hidden => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
  await page.clock.runFor(800);
  await hide(true);
  const paused = await canvas.evaluate(canvas => canvas.toDataURL());
  await page.clock.fastForward(10000);
  expect(await canvas.evaluate(canvas => canvas.toDataURL())).toBe(paused);
  await expect(preview).toHaveAttribute('data-preview-phase', 'turn');
  await hide(false);
  await page.clock.runFor(3100);
  await expect(preview).toHaveAttribute('data-preview-phase', 'answer');
  await hide(true);
  await page.clock.fastForward(10000);
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  await expect(preview).toHaveAttribute('data-preview-phase', 'answer');
  await hide(false);
  await page.clock.runFor(4100);
  await expect(preview).not.toHaveAttribute('data-preview-country', '18');
});

test('reduced motion keeps the highlighted country and answer still, including preference changes', async ({ page }) => {
  const preview = await openGlobe(page, { reducedMotion: 'reduce' });
  const canvas = preview.locator('canvas');
  const still = await canvas.evaluate(canvas => canvas.toDataURL());
  await expect(preview.locator('.atlas-hunt-answer')).toBeVisible();
  await page.clock.runFor(20000);
  expect(await canvas.evaluate(canvas => canvas.toDataURL())).toBe(still);
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(preview).toHaveAttribute('data-preview-phase', 'turn');
  await page.clock.runFor(3800);
  await expect(preview).toHaveAttribute('data-preview-phase', 'answer');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(20000);
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  expect(await canvas.evaluate(canvas => canvas.toDataURL())).toBe(still);
});

test('a blocked flag keeps the country name and compact country-code fallback', async ({ page }) => {
  const preview = await openGlobe(page, { flags: false, reducedMotion: 'reduce' });
  await expect(preview.locator('.atlas-hunt-answer')).toContainText('South Africa');
  await expect(preview.locator('.asset-fallback__code')).toHaveText('ZA');
});

test('scrolling away freezes drawing and returning rejoins the shared cycle', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 300 });
  const preview = await openGlobe(page);
  const canvas = preview.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toBeInViewport({ ratio: 0.8 });
  await page.clock.runFor(2200);
  await expect(preview).toHaveAttribute('data-preview-phase', 'shape');
  await page.locator('#btn-challenge-shapes').scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(canvas).not.toBeInViewport({ ratio: 0.5 });
  await page.clock.runFor(32);
  const paused = await canvas.evaluate(canvas => canvas.toDataURL());
  await page.clock.fastForward(20000);
  await expect(preview).toHaveAttribute('data-preview-country', '18');
  await expect(preview).toHaveAttribute('data-preview-phase', 'shape');
  expect(await canvas.evaluate(canvas => canvas.toDataURL())).toBe(paused);
  await canvas.scrollIntoViewIfNeeded();
  // Let the real IntersectionObserver resume the timer before advancing fake time.
  await expect(canvas).toBeInViewport({ ratio: 0.5 });
  await page.clock.runFor(2200);
  await expect(preview).not.toHaveAttribute('data-preview-country', '18');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: globe reveal is centred and keeps controls fixed`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const preview = await openGlobe(page, { reducedMotion: 'reduce' });
    const bounds = () => page.locator('.atlas-challenge-card, .activity-paths, canvas.atlas-hunt-preview').evaluateAll(elements => elements.map(element => {
      const r = element.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height];
    }));
    const before = await bounds();
    const placement = await preview.evaluate(element => {
      const panel = element.querySelector('.atlas-hunt-answer').getBoundingClientRect();
      const globe = element.querySelector('canvas').getBoundingClientRect();
      const stage = element.getBoundingClientRect();
      return {
        centred: Math.abs(panel.x + panel.width / 2 - globe.x - globe.width / 2) < 1,
        verticallyCentred: Math.abs(panel.y + panel.height / 2 - globe.y - globe.height / 2) < 1,
        inside: panel.left >= stage.left && panel.right <= stage.right && panel.top >= stage.top && panel.bottom <= stage.bottom
      };
    });
    expect(placement).toEqual({ centred: true, verticallyCentred: true, inside: true });
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    await expect(preview.locator('img')).toHaveCount(1);
    await expect(page.locator('#btn-explore-hunt')).toBeVisible();
    await page.screenshot({ path: `test-results/globe-answer-${viewport.width}.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.runFor(2000);
    expect(await bounds()).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}
