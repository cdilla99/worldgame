import { test, expect } from '@playwright/test';

async function chooser(page) {
  await page.locator('#atlas-utility-menu > summary').click();
  await page.locator('#btn-choose-player').click();
  await expect(page.locator('#player-profile-modal')).toBeVisible();
}

async function mockGoogle(page, { rejected = false } = {}) {
  await page.route(/^https:\/\//, route => route.abort());
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.google = { accounts: { id: {
      initialize(config) { window.__googleConfig = config; sessionStorage.setItem('google-button-nonce', config.nonce); },
      renderButton(container, options) {
        (window.__googleButtons ||= []).push(options);
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = 'Continue with Google';
        button.style.cssText = 'height:44px;max-width:100%;width:' + options.width + 'px;background:white;color:#1f1f1f;border:1px solid #747775;border-radius:4px;font:14px Arial';
        button.addEventListener('click', () => { options.click_listener(); window.__googleConfig.callback({ credential: 'mock-google-id-token', state: options.state }); });
        container.append(button);
      }
    } } };`
  }));
  await page.addInitScript(({ rejected }) => {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'ada@example.test', is_anonymous: false };
    window.__rejectGoogle = rejected;
    window.supabase = { createClient: () => ({
      auth: {
        onAuthStateChange() {}, getSession: async () => ({ data: { session: sessionStorage.getItem('google-verified') ? { user } : null } }),
        signInAnonymously: async () => ({ error: { message: 'disabled' } }),
        signInWithOAuth: async () => { throw new Error('Redirect OAuth must not be used'); },
        signInWithIdToken: async args => {
          sessionStorage.setItem('google-request', JSON.stringify(args));
          if (window.__rejectGoogle) return { error: { message: 'Token rejected' } };
          sessionStorage.setItem('google-verified', 'true');
          return { data: { user, session: { user } } };
        },
        signOut: async () => ({ error: null })
      },
      rpc: async (name, args) => {
        const calls = JSON.parse(sessionStorage.getItem('account-calls') || '[]');
        calls.push(name); sessionStorage.setItem('account-calls', JSON.stringify(calls));
        return name === 'sync_player_progress' ? { data: { learning: args.incoming_learning, daily: args.incoming_daily } } : { data: null };
      },
      from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { display_name: 'Ada', games_played: 0 } }) })
    }) };
  }, { rejected });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}: offline nickname profiles retain guest progress and isolate other players`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route(/^https:\/\//, route => route.abort());
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('geowars-stats', JSON.stringify({ played: 3, totalCorrect: 5, bestStreak: 2 })));
    await chooser(page);
    await page.locator('#player-local-name').fill('Ada');
    await page.locator('#player-local-avatar').selectOption('🦊');
    await page.getByRole('button', { name: 'Create player', exact: true }).click();
    await expect(page.locator('#player-context-name')).toHaveText('🦊 Ada');
    expect(await page.evaluate(async () => (await GeoWarsDB.getStats()).played)).toBe(3);
    await chooser(page);
    await page.locator('#player-local-name').fill('Ben');
    await page.getByRole('button', { name: 'Create player', exact: true }).click();
    await expect(page.locator('#player-context-name')).toHaveText('🌍 Ben');
    expect(await page.evaluate(async () => (await GeoWarsDB.getStats()).played)).toBe(0);
    await chooser(page);
    await page.getByRole('button', { name: '🦊 Ada', exact: true }).click();
    await expect(page.locator('#player-context-name')).toHaveText('🦊 Ada');
    expect(await page.evaluate(async () => (await GeoWarsDB.getStats()).played)).toBe(3);
    await chooser(page);
    await page.screenshot({ path: `test-results/player-accounts-${viewport.width}.png` });
    await page.locator('#btn-close-player-modal').click();
    await expect(page.locator('#atlas-utility-menu > summary')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
test(`${viewport.width}: direct Google sign-in links the selected nickname and transfers progress`, async ({ page }) => {
  await page.setViewportSize(viewport);
  await mockGoogle(page);
  await page.goto('/');
  await chooser(page);
  await page.locator('#player-local-name').fill('Ada');
  await page.getByRole('button', { name: 'Create player', exact: true }).click();
  await expect(page.locator('#player-context-name')).toHaveText('🌍 Ada');
  await page.evaluate(async () => {
    GeoWarsLearning.record(124, true);
    await GeoWarsDB.saveGameSession({ mode: 'practice', score: 100, correct: 1, total: 1, bestStreak: 1 });
  });
  await chooser(page);
  expect(await page.evaluate(() => GeoWarsDB.isClaimed())).toBe(false);
  const google = page.getByRole('button', { name: 'Continue with Google', exact: true });
  await expect(google).toBeVisible();
  await google.scrollIntoViewIfNeeded();
  await expect(google).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  await page.screenshot({ path: `test-results/google-direct-${viewport.width}.png` });
  await google.click();
  await page.waitForFunction(() => window.GeoWarsDB?.isClaimed() === true);
  await expect(page.locator('#player-context-name')).toHaveText('🌍 Ada');
  const request = await page.evaluate(() => JSON.parse(sessionStorage.getItem('google-request')));
  expect(request.provider).toBe('google');
  expect(request.token).toBe('mock-google-id-token');
  expect(request.nonce).toMatch(/^[a-f0-9]{64}$/);
  const hash = await page.evaluate(async nonce => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))), value => value.toString(16).padStart(2, '0')).join(''), request.nonce);
  expect(await page.evaluate(() => sessionStorage.getItem('google-button-nonce'))).toBe(hash);
  expect(page.url()).not.toContain('supabase.co');
  expect(page.url()).not.toContain('player_auth');
  expect(await page.evaluate(() => localStorage.getItem('earthling-google-signin'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('account-calls')).includes('sync_player_progress'))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('account-calls')).includes('save_player_game'))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(GeoWarsProfiles.storageKey('geowars-learning')))['124'].seen)).toBe(1);
});
}

test('Google provider errors keep the device profile intact and allow retry', async ({ page }) => {
  await mockGoogle(page, { rejected: true });
  await page.goto('/');
  await chooser(page);
  const google = page.getByRole('button', { name: 'Continue with Google' });
  await google.click();
  await expect(page.locator('#player-google-status')).toContainText('Your device profile is safe');
  await expect(google).toBeEnabled();
  expect(await page.evaluate(() => GeoWarsDB.isClaimed())).toBe(false);
  await page.evaluate(() => { window.__rejectGoogle = false; });
  await google.click();
  await page.waitForFunction(() => window.GeoWarsDB?.isClaimed() === true);
});

test('closing the chooser ignores unsolicited or late Google credentials', async ({ page }) => {
  await mockGoogle(page);
  await page.goto('/');
  await chooser(page);
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
  await page.evaluate(() => window.__googleConfig.callback({ credential: 'unsolicited-token' }));
  expect(await page.evaluate(() => sessionStorage.getItem('google-request'))).toBeNull();
  await page.locator('#btn-close-player-modal').click();
  await page.evaluate(() => window.__googleConfig.callback({ credential: 'late-token' }));
  expect(await page.evaluate(() => sessionStorage.getItem('google-request'))).toBeNull();
  expect(await page.evaluate(() => GeoWarsDB.isClaimed())).toBe(false);
});

test('a blocked Google script can be retried without redirecting or losing a nickname', async ({ page }) => {
  await mockGoogle(page);
  await page.route('https://accounts.google.com/gsi/client', route => route.abort());
  await page.goto('/');
  await chooser(page);
  await expect(page.locator('#player-google-status')).toContainText('could not load');
  await expect(page.getByRole('button', { name: 'Retry Google sign-in' })).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.getItem('google-request'))).toBeNull();
  await page.unroute('https://accounts.google.com/gsi/client');
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: 'window.google={accounts:{id:{initialize(){},renderButton(c){const b=document.createElement("button");b.textContent="Continue with Google";c.append(b)}}}};' }));
  await page.getByRole('button', { name: 'Retry Google sign-in' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
  expect(await page.evaluate(() => GeoWarsDB.isClaimed())).toBe(false);
});

test('a late response from an earlier chooser cannot complete a new sign-in attempt', async ({ page }) => {
  await mockGoogle(page);
  await page.goto('/');
  await chooser(page);
  await expect(page.getByRole('button', { name: 'Continue with Google', exact: true })).toBeVisible();
  await page.evaluate(() => window.__googleButtons.at(-1).click_listener());
  await page.locator('#btn-close-player-modal').click();
  await chooser(page);
  await expect.poll(() => page.evaluate(() => window.__googleButtons.length)).toBe(2);
  await page.evaluate(async () => {
    window.__googleButtons.at(-1).click_listener();
    await window.__googleConfig.callback({ credential: 'stale-token', state: window.__googleButtons[0].state });
  });
  expect(await page.evaluate(() => sessionStorage.getItem('google-request'))).toBeNull();
  await page.evaluate(() => window.__googleConfig.callback({ credential: 'mock-google-id-token', state: window.__googleButtons.at(-1).state }));
  await page.waitForFunction(() => window.GeoWarsDB?.isClaimed() === true);
});
