import { expect, test } from '@playwright/test';

const initialTime = '2026-11-10T12:00:00Z';
const pausedTime = '2026-11-10T12:01:00Z';
const flag = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><path fill="#009739" d="M0 0h30v20H0z"/><path fill="#ffdf00" d="m15 2 12 8-12 8L3 10z"/><circle fill="#002776" cx="15" cy="10" r="5"/></svg>';

test('hidden legacy globe does not keep repainting behind the activity home', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.legacyGlobePaints = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.id === 'landing-globe-canvas') window.legacyGlobePaints++;
      return clear.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
  await expect(page.locator('#landing-globe-canvas')).toBeHidden();
  await page.waitForTimeout(300);
  const paints = await page.evaluate(() => window.legacyGlobePaints);
  expect(paints).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.legacyGlobePaints)).toBe(paints);
});

async function openDemo(page, { flags = true, reducedMotion = 'reduce' } = {}) {
  await page.route(/^https:\/\//, route => route.abort());
  if (flags) await page.route('https://flagcdn.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: flag }));
  await page.emulateMedia({ reducedMotion });
  await page.clock.install({ time: initialTime });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const preview = page.locator('#quiz-preview-art');
  await expect(preview.locator('.atlas-quiz-shape.is-visible path')).toHaveCount(1);
  await page.clock.pauseAt(pausedTime);
  return preview;
}

async function restartVisiblePhase(page, preview) {
  await preview.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(preview).toBeInViewport({ ratio: 0.8 });
  if (await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await expect(preview).toHaveAttribute('data-preview-phase', 'shape');
}

async function bounds(page) {
  return page.locator('.atlas-challenge-card, .atlas-challenge-stage, .activity-paths, #quiz-preview-art .is-visible svg')
    .evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    }));
}

test('demo reveals its first answer at the staggered 2.55-second point and holds it for 4 seconds', async ({ page }) => {
  const preview = await openDemo(page);
  await restartVisiblePhase(page, preview);
  const answer = preview.locator('.atlas-quiz-answer');
  const name = preview.locator('.atlas-quiz-answer-name');
  const outline = preview.locator('.atlas-quiz-shape.is-visible path');
  const original = await outline.getAttribute('d');
  await expect(name).toHaveText('Brazil');
  await expect(answer.locator('img')).toHaveAttribute('src', /\/br\.png$/);
  await expect.poll(() => answer.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(answer).toBeHidden();

  await page.clock.runFor(2549);
  await expect(answer).toBeHidden();
  await page.clock.runFor(1);
  await expect(answer).toBeVisible();
  await expect(outline).toHaveAttribute('d', original);
  await page.clock.runFor(3999);
  await expect(answer).toBeVisible();
  await expect(name).toHaveText('Brazil');
  await page.clock.runFor(1);
  await page.clock.runFor(32);
  await expect(answer).toBeHidden();
  await expect(name).not.toHaveText('Brazil');
  await expect(outline).not.toHaveAttribute('d', original);
  const expectedCode = await name.evaluate(element => AssetFallbacks.getCountryCode(countryCards.find(card => card.name === element.textContent)).toLowerCase());
  await expect(answer.locator('img')).toHaveAttribute('src', new RegExp(`/${expectedCode}\\.png$`));
});

test('demo does no animation offscreen and rejoins the shared cycle when visible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 300 });
  const preview = await openDemo(page, { reducedMotion: 'no-preference' });
  const answer = preview.locator('.atlas-quiz-answer');
  await expect(preview).not.toBeInViewport({ ratio: 0.5 });
  await page.clock.fastForward(10000);
  await expect(answer).toBeHidden();
  await expect(preview.locator('.atlas-quiz-answer-name')).toHaveText('Brazil');
  await preview.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(preview).toBeInViewport({ ratio: 0.8 });
  await page.clock.runFor(32);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(preview).not.toBeInViewport({ ratio: 0.5 });
  await page.clock.runFor(32);
  const paused = await preview.getAttribute('data-preview-phase');
  const name = await preview.locator('.atlas-quiz-answer-name').textContent();
  await page.clock.fastForward(10000);
  await expect(preview).toHaveAttribute('data-preview-phase', paused);
  await expect(preview.locator('.atlas-quiz-answer-name')).toHaveText(name);
  await preview.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(preview).toBeInViewport({ ratio: 0.8 });
  await page.clock.runFor(7800);
  await expect(preview.locator('.atlas-quiz-answer-name')).not.toHaveText(name);
});

test('tab visibility pauses both phases instead of skipping countries', async ({ page }) => {
  const preview = await openDemo(page);
  await restartVisiblePhase(page, preview);
  const answer = preview.locator('.atlas-quiz-answer');
  const setHidden = hidden => page.evaluate(value => {
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await page.clock.runFor(1000);
  await setHidden(true);
  await page.clock.runFor(10000);
  await expect(answer).toBeHidden();
  await setHidden(false);
  await page.clock.runFor(1549);
  await expect(answer).toBeHidden();
  await page.clock.runFor(1);
  await expect(answer).toBeVisible();
  await page.clock.runFor(1000);
  await setHidden(true);
  await page.clock.runFor(10000);
  await expect(preview.locator('.atlas-quiz-answer-name')).toHaveText('Brazil');
  await setHidden(false);
  await page.clock.runFor(2999);
  await expect(answer).toBeVisible();
  await page.clock.runFor(33);
  await expect(preview.locator('.atlas-quiz-answer-name')).not.toHaveText('Brazil');
});

test('reduced motion shows a static answer and responds to preference changes', async ({ page }) => {
  const preview = await openDemo(page, { reducedMotion: 'reduce' });
  const answer = preview.locator('.atlas-quiz-answer');
  const original = await preview.locator('.is-visible path').getAttribute('d');
  await expect(answer).toBeVisible();
  expect(await answer.evaluate(element => element.getAnimations().length)).toBe(0);
  await page.clock.runFor(10000);
  await expect(preview.locator('.is-visible path')).toHaveAttribute('d', original);
  await restartVisiblePhase(page, preview);
  await page.clock.runFor(1000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(answer).toBeVisible();
  await page.clock.runFor(10000);
  await expect(preview.locator('.is-visible path')).toHaveAttribute('d', original);
});

test('flag failures retain the country name and compact fallback', async ({ page }) => {
  const preview = await openDemo(page, { flags: false });
  await restartVisiblePhase(page, preview);
  await page.clock.runFor(2550);
  await expect(preview.locator('.atlas-quiz-answer')).toBeVisible();
  await expect(preview.locator('.atlas-quiz-answer-name')).toHaveText('Brazil');
  await expect(preview.locator('.asset-fallback__code')).toHaveText('BR');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: reveal keeps images and controls fixed`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const preview = await openDemo(page);
    await restartVisiblePhase(page, preview);
    const before = await bounds(page);
    await page.screenshot({ path: `test-results/demo-shape-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
    await page.clock.runFor(2550);
    await expect(preview.locator('.atlas-quiz-answer')).toBeVisible();
    await preview.locator('.atlas-quiz-answer').evaluate(element => element.getAnimations().forEach(animation => animation.finish()));
    const placement = await preview.evaluate(element => {
      const panel = element.querySelector('.atlas-quiz-answer').getBoundingClientRect();
      const image = element.querySelector('.is-visible svg').getBoundingClientRect();
      const style = getComputedStyle(element.querySelector('.atlas-quiz-answer'));
      return {
        dx: Math.abs(panel.x + panel.width / 2 - image.x - image.width / 2),
        dy: Math.abs(panel.y + panel.height / 2 - image.y - image.height / 2),
        background: style.backgroundColor,
        opacity: style.opacity,
        animation: style.animationName,
        withinImage: panel.x >= image.x && panel.y >= image.y && panel.right <= image.right && panel.bottom <= image.bottom
      };
    });
    expect(placement.dx).toBeLessThanOrEqual(0.1);
    expect(placement.dy).toBeLessThanOrEqual(0.1);
    expect(placement.withinImage).toBe(true);
    expect(placement.background).toBe('rgba(10, 15, 22, 0.8)');
    expect(placement.opacity).toBe('1');
    expect(placement.animation).toBe('preview-answer-reveal');
    expect(await bounds(page)).toEqual(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await expect(preview.locator('.atlas-quiz-answer-flag img')).toBeVisible();
    await page.screenshot({ path: `test-results/demo-answer-${viewport.width}.png`, fullPage: true, animations: 'disabled' });
  });
}
