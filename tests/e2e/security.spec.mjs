import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__cspViolations.push({ directive: event.effectiveDirective, uri: event.blockedURI });
    });
  });
});

test('security headers allow the game and deny unapproved scripts', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response.headers();
  const reportOnly = process.env.EARTHLING_CSP_REPORT_ONLY === '1';
  expect(headers[reportOnly ? 'content-security-policy-report-only' : 'content-security-policy']).toContain("object-src 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  await page.evaluate(() => GeoWarsDB.init());
  expect(await page.evaluate(() => GeoWarsDB.isReady())).toBe(true);
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.src = 'https://unapproved.example.test/injected.js';
    document.head.append(script);
  });
  await expect.poll(() => page.evaluate(() => window.__cspViolations.some(v => v.uri.includes('unapproved.example.test')))).toBe(true);
  if (!reportOnly) {
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'window.__inlineInjection = true;';
      document.head.append(script);
    });
    await expect.poll(() => page.evaluate(() => window.__cspViolations.some(v => v.uri === 'inline'))).toBe(true);
    expect(await page.evaluate(() => window.__inlineInjection)).toBeUndefined();
  }
});

test('local guests use the bundled SDK without creating cloud accounts', async ({ page }) => {
  const signups = [];
  page.on('request', request => { if (request.url().includes('/auth/v1/signup')) signups.push(request.url()); });
  await page.goto('/');
  await page.evaluate(() => GeoWarsDB.init());
  expect(await page.evaluate(() => GeoWarsDB.isReady())).toBe(true);
  expect(await page.evaluate(() => GeoWarsDB.isClaimed())).toBe(false);
  expect(signups).toEqual([]);
  expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}: restored Daily text cannot inject HTML and gameplay respects CSP`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const payload = '<img src=x onerror="window.__injected=true">';
    await page.evaluate(payload => {
      const day = GeoWarsDailyWorldle.dayKey();
      localStorage.setItem('geowars-daily-worldle', JSON.stringify({ days: { [day]: {
        guesses: [{ card: { ...countryCards[0], name: payload }, correct: false, displayDistance: '100 km', direction: 'N', directionLabel: payload, proximityPercent: 20 }],
        completed: false, won: false
      } } }));
    }, payload);
    await page.locator('#btn-activity-daily').click();
    await expect(page.locator('.worldle-guess-name')).toHaveText(payload);
    await expect(page.locator('.worldle-guess-name img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__injected)).toBeUndefined();
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/security-daily-${viewport.width}.png` });
  });
}
