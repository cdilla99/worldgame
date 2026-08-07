import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

async function blockExternalRequests(page) {
  await page.route(/^https:\/\/(?!127\.0\.0\.1)/, route => route.abort());
}

async function openEgypt(page) {
  await page.goto('/');
  await page.locator('#btn-landing-explorer-game').click();
  await page.locator('#btn-open-explorer').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('Egypt');
  await page.getByRole('option', { name: /Egypt/ }).click();
  await expect(page.locator('#explorer-country-name')).toHaveText('Egypt');
  await expect(page.locator('#explorer-economics-callout')).toBeVisible();
}

async function expectLandmarkBeforeEconomics(page) {
  const order = await page.locator('#explorer-more-details').evaluate(details =>
    Array.from(details.children)
      .filter(child => child.matches('.explorer-more-facts, #explorer-landmark-media, #explorer-economics-callout'))
      .map(child => child.id ? `#${child.id}` : '.explorer-more-facts')
  );
  expect(order).toEqual([
    '.explorer-more-facts',
    '#explorer-landmark-media',
    '#explorer-economics-callout'
  ]);
  expect(order.at(-1)).toBe('#explorer-economics-callout');
}

async function fulfillWikipedia(route, imageUrl = 'https://fixture.test/nile.png') {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ query: { pages: { 1: {
      title: 'Nile River',
      thumbnail: { source: imageUrl },
      fullurl: 'https://en.wikipedia.org/wiki/Nile'
    } } } })
  });
}

test('economics is final when landmark media is loaded', async ({ page }) => {
  await blockExternalRequests(page);
  await page.route('https://en.wikipedia.org/**', route => fulfillWikipedia(route));
  await page.route('https://fixture.test/**', route => route.fulfill({ contentType: 'image/png', body: tinyPng }));
  await openEgypt(page);
  await expect(page.locator('#explorer-landmark-media')).toBeVisible();
  await expectLandmarkBeforeEconomics(page);
});

test('economics is final while the landmark request is pending', async ({ page }) => {
  await blockExternalRequests(page);
  let heldRoute;
  let markRequested;
  const requested = new Promise(resolve => { markRequested = resolve; });
  await page.route('https://en.wikipedia.org/**', route => {
    heldRoute = route;
    markRequested();
  });
  try {
    await openEgypt(page);
    await requested;
    await expect(page.locator('#explorer-landmark-media')).toBeHidden();
    await expectLandmarkBeforeEconomics(page);
  } finally {
    await heldRoute?.abort().catch(() => {});
  }
});

test('economics is final when landmark media is unavailable after a request failure', async ({ page }) => {
  await blockExternalRequests(page);
  let requests = 0;
  await page.route('https://en.wikipedia.org/**', route => {
    requests += 1;
    return route.abort('failed');
  });
  await openEgypt(page);
  await expect.poll(() => requests).toBeGreaterThan(0);
  await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  await expectLandmarkBeforeEconomics(page);
});

test('economics is final after a landmark image failure', async ({ page }) => {
  await blockExternalRequests(page);
  let imageRequests = 0;
  await page.route('https://en.wikipedia.org/**', route => fulfillWikipedia(route, 'https://fixture.test/fail.png'));
  await page.route('https://fixture.test/**', route => {
    imageRequests += 1;
    return route.abort('failed');
  });
  await openEgypt(page);
  await expect.poll(() => imageRequests).toBeGreaterThan(0);
  await expect.poll(() => page.locator('#explorer-landmark-media-image').getAttribute('src')).toBeNull();
  await expect(page.locator('#explorer-landmark-media')).toBeHidden();
  await expectLandmarkBeforeEconomics(page);
});

test('Big Mac shows a modeled-estimate prefix and no separate tooltip', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-landing-explorer-game').click();
  await page.locator('#btn-open-explorer').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('Andorra');
  await page.getByRole('option', { name: /Andorra/ }).click();
  await expect(page.locator('#explorer-country-name')).toHaveText('Andorra');
  const bigMac = page.locator('#explorer-economics-big-mac');
  await expect(bigMac).toHaveText('~$6.53');
  await expect(bigMac).not.toHaveAttribute('title');
});

test('Big Mac shows "No McDonald\'s" for a country with no market', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-landing-explorer-game').click();
  await page.locator('#btn-open-explorer').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('Afghanistan');
  await page.getByRole('option', { name: /Afghanistan/ }).click();
  await expect(page.locator('#explorer-country-name')).toHaveText('Afghanistan');
  const bigMac = page.locator('#explorer-economics-big-mac');
  await expect(bigMac).toHaveText("No McDonald's");
  await expect(bigMac).not.toHaveAttribute('title');
});

test('Explorer still hides economics for territories', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-landing-explorer-game').click();
  await page.locator('#btn-open-explorer').click();
  const search = page.locator('#explorer-country-search');
  await search.fill('French Guiana');
  await page.getByRole('option', { name: /French Guiana/ }).click();
  await expect(page.locator('#explorer-country-name')).toHaveText('French Guiana');
  await expect(page.locator('#explorer-economics-callout')).toBeHidden();
});


test('preservation: country values and territory exclusion ignore sibling order', async ({ page }) => {
  await blockExternalRequests(page);
  await openEgypt(page);

  const economics = page.locator('#explorer-economics-callout');
  await expect(page.locator('#explorer-economics-title')).toHaveText('Economic comparison');
  await expect(economics.locator('small')).toHaveText('2026 · USD');
  await expect(economics.locator('dt')).toHaveText([
    'Annual net salary', 'Big Mac', 'Coke · 330 ml'
  ]);
  await expect(page.locator('#explorer-economics-salary')).toHaveText('$1,737');
  await expect(page.locator('#explorer-economics-big-mac')).toHaveText('$2.65');
  await expect(page.locator('#explorer-economics-coke')).toHaveText('$0.34');

  const contentNodeSet = await page.locator('#explorer-more-details').evaluate(details =>
    Array.from(details.children)
      .filter(child => child.matches('.explorer-more-facts, #explorer-landmark-media, #explorer-economics-callout'))
      .map(child => child.id || 'explorer-more-facts')
      .sort()
  );
  expect(contentNodeSet).toEqual([
    'explorer-economics-callout', 'explorer-landmark-media', 'explorer-more-facts'
  ]);

  const search = page.getByRole('combobox', { name: 'Find a country or territory' });
  await search.fill('French Guiana');
  await page.getByRole('option', { name: /French Guiana/ }).click();
  await expect(page.locator('#explorer-country-name')).toHaveText('French Guiana');
  await expect(economics).toBeHidden();
  await expect(page.locator('#explorer-economics-title')).toBeHidden();
  for (const label of await economics.locator('dt').all()) await expect(label).toBeHidden();
  for (const value of await economics.locator('dd').all()) await expect(value).toBeHidden();
});

test('preservation: selection, disclosure, hunt, keyboard, focus, roles, and names remain stable', async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto('/');
  await page.locator('#btn-landing-explorer-game').click();
  await page.locator('#btn-open-explorer').click();

  const search = page.getByRole('combobox', { name: 'Find a country or territory' });
  const canvas = page.locator('#explorer-globe-canvas');
  const details = page.locator('#explorer-more-details');
  const summary = details.locator('summary');

  await expect(page.getByRole('group', { name: 'World Explorer mode' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Place search results', includeHidden: true })).toBeAttached();
  await expect(canvas).toHaveAccessibleName(
    /^Interactive country globe\. .+ is centered\. Use arrow keys to rotate, plus or minus to zoom, and Enter to select\.$/
  );
  const centeredNameBeforeSelection = await canvas.getAttribute('aria-label');
  expect(centeredNameBeforeSelection).not.toBeNull();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();

  await page.evaluate(() => window.GeoWars.explorer.selectCountry(31, { animate: false, source: 'globe' }));
  await expect(page.locator('#explorer-country-name')).toHaveText('Egypt');
  await expect(canvas).toHaveAccessibleName(centeredNameBeforeSelection);
  await expect(details).toHaveJSProperty('open', true);
  await expect(page.getByRole('button', { name: 'Practice Africa' })).toBeVisible();

  await summary.focus();
  await summary.press('Enter');
  await expect(details).toHaveJSProperty('open', false);
  await expect(summary).toBeFocused();
  await summary.press('Enter');
  await expect(details).toHaveJSProperty('open', true);

  await search.fill('Egypt');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('#explorer-country-name')).toHaveText('Egypt');
  await expect(canvas).toHaveAccessibleName(
    'Interactive country globe. Egypt is centered. Use arrow keys to rotate, plus or minus to zoom, and Enter to select.'
  );
  await expect(search).toBeFocused();

  await canvas.focus();
  await canvas.press('ArrowRight');
  await canvas.press('+');
  await expect(canvas).toBeFocused();

  const hunt = page.getByRole('button', { name: /Country Hunt/ });
  await hunt.click();
  await expect(hunt).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('timer', { name: 'Country Hunt time remaining' })).toBeVisible();
  await expect(canvas).toBeFocused();
  const endHunt = page.locator('#btn-explorer-hunt-exit');
  await endHunt.click();
  await expect(hunt).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});
