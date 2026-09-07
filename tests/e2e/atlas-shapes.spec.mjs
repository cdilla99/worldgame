import { expect, test } from '@playwright/test';

test('quiz setup replaces Explore and launches practice on mobile', async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openShapes(page);
  await page.locator('#btn-atlas-shape-challenge').click();
  await expect(page.locator('#atlas-shape-toolbar')).toBeHidden();
  await expect(page.locator('.atlas-shape-study')).toBeHidden();
  await expect(page.locator('#shape-challenge-panel')).toBeVisible();
  const settings = page.locator('#btn-change-settings');
  const settingsBox = await settings.boundingBox();
  expect(settingsBox.width).toBeGreaterThan(240);
  expect(settingsBox.height).toBeGreaterThanOrEqual(44);
  await settings.click();
  await expect(page.locator('#atlas-utility-menu')).toHaveJSProperty('open', true);
  await page.locator('#atlas-utility-menu > summary').click();
  await page.locator('#btn-atlas-shape-explore').click();
  await expect(page.locator('#atlas-shape-toolbar')).toBeVisible();
  await expect(page.locator('.atlas-shape-study')).toBeVisible();
  await page.locator('#btn-atlas-shape-challenge').click();
  await page.locator('#btn-showoff').click();
  await page.locator('#btn-start-game').click();
  await expect(page.locator('#game')).toBeVisible();
});

async function blockExternalRequests(page) {
  await page.route(/^https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
}

async function openShapes(page) {
  await page.goto('/');
  await page.locator('#btn-atlas-shapes').click();
  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#explorer-country-card')).toBeVisible();
  await expect(page.locator('#explorer-country-name')).not.toHaveText('');
  await expect(page.locator('#explorer-country-capital')).not.toHaveText('');
  await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  await expect(page.locator('#atlas-shape-art svg')).toHaveAttribute(
    'aria-label',
    / border outline$/
  );
}

test('Shapes keeps shared facts synchronized through the real explorer API', async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openShapes(page);

  const card = page.locator('#explorer-country-card');
  const name = page.locator('#explorer-country-name');
  const capital = page.locator('#explorer-country-capital');
  const outline = page.locator('#atlas-shape-art svg');
  const select = page.locator('#atlas-shape-country');
  const next = page.locator('#btn-atlas-shape-next');
  const previous = page.locator('#btn-atlas-shape-previous');

  expect(await page.locator('.explorer-info-panel').evaluate(element => element.parentElement.id)).toBe('atlas-shape-info-slot');
  expect(await page.locator('.explorer-info-panel').count()).toBe(1);

  const automaticName = await name.textContent();
  await expect.poll(() => name.textContent(), { timeout: 6500 }).not.toBe(automaticName);
  const previewName = await name.textContent();
  await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  await expect(capital).not.toHaveText('');
  await expect(outline).toHaveAttribute('aria-label', `${previewName} border outline`);

  await next.click();
  const nextName = await name.textContent();
  await expect(nextName).not.toBe(previewName);
  await expect(capital).not.toHaveText('');
  await expect(outline).toHaveAttribute('aria-label', `${nextName} border outline`);

  await previous.click();
  await expect(name).toHaveText(previewName);
  await expect(outline).toHaveAttribute('aria-label', `${previewName} border outline`);

  await select.selectOption({ label: 'Japan' });
  await expect(name).toHaveText('Japan');
  await expect(capital).toHaveText('Tokyo');
  await expect(outline).toHaveAttribute('aria-label', 'Japan border outline');

  const selectedShapesBackground = await page.locator('#btn-atlas-shapes').evaluate(element => getComputedStyle(element).backgroundColor);
  await page.locator('#btn-atlas-shapes').focus();
  await page.locator('#btn-atlas-shapes').hover();
  await expect.poll(() => page.locator('#btn-atlas-shapes').evaluate(element => getComputedStyle(element).backgroundColor)).toBe(selectedShapesBackground);
  await expect(page.locator('#btn-atlas-shapes')).toBeFocused();
  expect(await page.locator('#btn-atlas-shapes').evaluate(element => getComputedStyle(element).color)).toBe('rgb(7, 17, 31)');

  const unselectedGlobe = page.locator('#btn-atlas-globe');
  await unselectedGlobe.hover();
  await expect.poll(() => unselectedGlobe.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(18, 36, 58)');

  await unselectedGlobe.click();
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
  await expect.poll(() => unselectedGlobe.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(67, 220, 158)');
  await unselectedGlobe.hover();
  await expect.poll(() => unselectedGlobe.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(67, 220, 158)');
  expect(await unselectedGlobe.evaluate(element => getComputedStyle(element).color)).toBe('rgb(7, 17, 31)');
  expect(await page.locator('.explorer-info-panel').evaluate(element => element.parentElement.classList.contains('explorer-layout'))).toBe(true);
  await unselectedGlobe.focus();
  await expect(unselectedGlobe).toBeFocused();

  await page.locator('#btn-atlas-shapes').click();
  await expect(page.locator('#explorer-country-card')).toBeVisible();
  expect(await page.locator('.explorer-info-panel').evaluate(element => element.parentElement.id)).toBe('atlas-shape-info-slot');
  const duplicateIds = await page.locator('[id]').evaluateAll(elements => {
    const counts = new Map();
    elements.forEach(element => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
  });
  expect(duplicateIds).toEqual([]);
  const restoredName = await page.locator('#explorer-country-name').textContent();
  expect(restoredName).not.toBe('');
  await expect(page.locator('#atlas-shape-art svg')).toHaveAttribute('aria-label', `${restoredName} border outline`);

  await page.screenshot({ path: '.scratch/task-01-shapes-1440x900.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await openShapes(page);
  await expect(page.locator('#btn-atlas-shapes')).toBeVisible();
  await page.screenshot({ path: '.scratch/task-01-shapes-390x844.png', fullPage: true });
});

test('Shapes navigation remains readable when disabled', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  const shapes = page.locator('#btn-atlas-shapes');
  await shapes.evaluate(element => {
    element.disabled = true;
    element.setAttribute('aria-disabled', 'true');
  });
  await expect(shapes).toBeDisabled();
  await expect(shapes).toHaveAttribute('aria-disabled', 'true');
  expect(await shapes.evaluate(element => getComputedStyle(element).opacity)).toBe('0.48');
});
