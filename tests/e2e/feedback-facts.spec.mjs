import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', hasTouch: true });
test.beforeEach(async ({ page }) => { await page.route(/^https:\/\//, route => route.abort()); });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: facts keep feedback open and Next advances once`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('#btn-challenge-shapes').click();
    if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
    const answer = await page.evaluate(() => state.currentCard.name);
    const originalOutline = await page.locator('#silhouette-img').innerHTML();
    await page.locator('#choices .choice-btn').filter({ hasText: answer }).click();
    await expect(page.locator('#btn-feedback-next')).toBeVisible();
    await expect(page.locator('#feedback-outline svg')).toBeVisible();
    expect(await page.locator('#feedback-outline svg').innerHTML()).toBe(originalOutline);
    await expect(page.locator('#silhouette-img')).toHaveCount(1);
    await expect(page.locator('#btn-feedback-results')).toBeHidden();
    await expect(page.locator('#btn-feedback-home')).toBeHidden();
    const round = await page.evaluate(() => state.total);
    const time = await page.locator('#timer-text').textContent();
    const facts = page.locator('#feedback-facts');
    await facts.locator('summary').click();
    await expect.poll(() => page.evaluate(() => state.total)).toBe(round);
    await facts.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => state.total)).toBe(round);
    await facts.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => state.total)).toBe(round);
    // Open facts stay available beyond the original three-second auto-advance.
    await facts.evaluate(element => { element.open = true; });
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => state.total)).toBe(round);
    await expect(page.locator('#feedback')).toBeVisible();
    await expect(page.locator('#timer-text')).toHaveText(time);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/atlas-feedback-${viewport.width}.png`, fullPage: true });
    await page.locator('#btn-feedback-next').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#feedback')).toBeHidden();
    expect(await page.evaluate(() => state.total)).toBe(round + 1);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => state.total)).toBe(round + 1);
  });
}

test('untouched timed feedback still advances automatically', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-challenge-shapes').click();
  if (await page.locator('#btn-show-options').isVisible()) await page.locator('#btn-show-options').click();
  await page.locator('#choices .choice-btn:not(.hidden)').first().click();
  const round = await page.evaluate(() => state.total);
  await expect.poll(() => page.evaluate(() => state.total), { timeout: 5000 }).toBe(round + 1);
  await expect(page.locator('#feedback')).toBeHidden();
});
