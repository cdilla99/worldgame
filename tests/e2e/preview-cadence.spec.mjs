import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
test(`${viewport.width}: home previews keep staggered reveals across repeated cycles and stop for reduced motion`, async ({ page }) => {
  await page.setViewportSize(viewport);
  await page.route(/^https:\/\//, route => route.abort());
  const start = new Date('2026-11-14T12:00:00Z');
  await page.clock.install({ time: start });
  await page.goto('/');
  await expect(page.locator('#activity-hunt-preview')).not.toHaveAttribute('data-preview-phase', 'loading');
  await expect(page.locator('#quiz-preview-art')).not.toHaveAttribute('data-preview-phase', 'loading');
  await page.clock.pauseAt(new Date(start.getTime() + 10000));
  await page.evaluate(() => {
    window.previewEvents = [];
    for (const id of ['activity-hunt-preview', 'quiz-preview-art']) {
      const element = document.getElementById(id);
      let previous = element.dataset.previewPhase;
      new MutationObserver(() => {
        const phase = element.dataset.previewPhase;
        if (phase !== previous) {
          window.previewEvents.push({ id, phase, time: performance.now() });
          previous = phase;
        }
      }).observe(element, { attributes: true, attributeFilter: ['data-preview-phase'] });
    }
  });
  await page.clock.runFor(25000);
  const events = await page.evaluate(() => window.previewEvents);
  const huntReveals = events.filter(event => event.id === 'activity-hunt-preview' && event.phase === 'answer');
  const shapeReveals = events.filter(event => event.id === 'quiz-preview-art' && event.phase === 'answer');
  expect(huntReveals.length).toBeGreaterThanOrEqual(3);
  expect(shapeReveals.length).toBeGreaterThanOrEqual(3);
  for (const reveal of huntReveals) {
    const earlierShape = shapeReveals.filter(event => event.time < reveal.time).at(-1);
    if (!earlierShape) continue;
    expect(reveal.time - earlierShape.time).toBeGreaterThanOrEqual(1200);
    expect(reveal.time - earlierShape.time).toBeLessThanOrEqual(1300);
  }
  for (const reveals of [huntReveals, shapeReveals]) {
    for (let index = 1; index < reveals.length; index++) {
      expect(reveals[index].time - reveals[index - 1].time).toBeGreaterThanOrEqual(7750);
      expect(reveals[index].time - reveals[index - 1].time).toBeLessThanOrEqual(7850);
    }
    for (const reveal of reveals) {
      const next = events.find(event => event.id === reveal.id && event.time > reveal.time && event.phase !== 'answer');
      if (next) expect(next.time - reveal.time).toBeCloseTo(4000, -2);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const previews = page.locator('#activity-hunt-preview, #quiz-preview-art');
  await expect(previews.nth(0)).toHaveAttribute('data-preview-phase', 'answer');
  await expect(previews.nth(1)).toHaveAttribute('data-preview-phase', 'answer');
  const countries = await previews.evaluateAll(elements => elements.map(element => element.textContent));
  await page.clock.runFor(20000);
  expect(await previews.evaluateAll(elements => elements.map(element => element.textContent))).toEqual(countries);
});
}
