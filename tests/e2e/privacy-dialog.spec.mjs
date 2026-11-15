import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: privacy closes in place with X and Escape`, async ({ page, context }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const footerLink = page.locator('.activity-home-footer a[href="/privacy.html"]');
    await footerLink.scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => scrollY);
    await footerLink.click();
    const dialog = page.getByRole('dialog', { name: 'Privacy', exact: true });
    await expect(dialog).toBeVisible();
    const dialogBox = await dialog.boundingBox();
    expect(Math.abs(dialogBox.x + dialogBox.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialogBox.y + dialogBox.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
    await expect(dialog.getByRole('link', { name: 'info@thinkabacus.ca' })).toBeVisible();
    const close = dialog.getByRole('button', { name: 'Close privacy', exact: true });
    await expect(close).toBeInViewport({ ratio: 1 });
    await expect(close).toBeFocused();
    const box = await close.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(context.pages()).toHaveLength(1);
    await page.screenshot({ path: `test-results/privacy-dialog-${viewport.width}.png` });
    await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(footerLink).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
    await page.locator('#btn-header-google').click();
    const playerDialog = page.locator('#player-profile-modal');
    const playerLink = playerDialog.locator('a[href="/privacy.html"]');
    await playerLink.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(playerDialog).toBeVisible();
    await expect(playerLink).toBeFocused();
  });
}

test('standalone privacy keeps a visible top-right return control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/privacy.html');
  const close = page.getByRole('link', { name: 'Close privacy and return to Earthling' });
  await expect(close).toBeInViewport({ ratio: 1 });
  await close.click();
  await expect(page.locator('body')).toHaveAttribute('data-activity', 'home');
});
