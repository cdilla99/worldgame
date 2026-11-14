import { expect, test } from '@playwright/test';

test('Shape Quiz Explore enters the library and Challenge launches timed play on mobile', async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openShapes(page);

  await expect(page.locator('#atlas-shapes-workspace')).toBeVisible();
  await expect(page.locator('#atlas-shape-toolbar')).toBeVisible();
  await expect(page.locator('.atlas-shape-study')).toBeVisible();

  await page.locator('#btn-activity-challenge').click();
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#btn-game-difficulty')).toBeVisible();
  await expect(page.locator('#timer-container')).toBeVisible();
});

async function blockExternalRequests(page) {
  await page.route(/^https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
}

async function openShapes(page) {
  await page.goto('/');
  await page.locator('#btn-explore-shapes').click();
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

test('Canada outline keeps natural proportions and fits inside the plate', async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openShapes(page);
  await page.locator('#atlas-shape-country').selectOption({ label: 'Canada' });
  const outline = page.locator('#atlas-shape-art svg');
  await expect(outline).toHaveAttribute('aria-label', 'Canada border outline');

  const [, , width, height] = (await outline.getAttribute('viewBox')).split(' ').map(Number);
  expect(width / height).toBeGreaterThan(0.85);
  expect(width / height).toBeLessThan(1.25);

  const plate = await page.locator('.atlas-shape-plate').boundingBox();
  const shape = await outline.boundingBox();
  expect(shape.x).toBeGreaterThanOrEqual(plate.x);
  expect(shape.x + shape.width).toBeLessThanOrEqual(plate.x + plate.width);
  await expect(page.locator('.atlas-plate-axis')).toBeHidden();
});

test('Shapes keeps shared facts synchronized through the real explorer API', async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openShapes(page);
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');

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

  await page.locator('#btn-activity-home').click();
  await page.locator('#btn-explore-hunt').click();
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#atlas-globe-workspace')).toBeVisible();
  expect(await page.locator('.explorer-info-panel').evaluate(element => element.parentElement.classList.contains('explorer-layout'))).toBe(true);
  await page.locator('#btn-activity-home').click();
  await page.locator('#btn-explore-shapes').click();
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
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
  await expect(page.locator('#btn-mode-explore')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#activity-section-title')).toHaveText('Shape Quiz');
  await page.screenshot({ path: '.scratch/task-01-shapes-390x844.png', fullPage: true });
});

test('Shape Quiz Explore control remains readable when disabled', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  const shapes = page.locator('#btn-explore-shapes');
  await shapes.evaluate(element => {
    element.disabled = true;
    element.setAttribute('aria-disabled', 'true');
  });
  await expect(shapes).toBeDisabled();
  await expect(shapes).toHaveAttribute('aria-disabled', 'true');
  expect(await shapes.evaluate(element => getComputedStyle(element).opacity)).toBe('0.48');
});
