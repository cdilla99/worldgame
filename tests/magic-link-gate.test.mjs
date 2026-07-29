import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// Reproduces the reported bug: when Supabase anonymous sign-in is unavailable,
// no guest session exists, so the old `online` gate disabled "Send magic link"
// forever. Magic links only need a reachable client.
const source = await readFile(new URL('../supabase-client.js', import.meta.url), 'utf8');

function loadClient({ anonymousFails = true, otpError = null } = {}) {
  const calls = [];
  const auth = {
    onAuthStateChange() {},
    async getSession() { return { data: { session: null } }; },
    async signInAnonymously() {
      calls.push('anon');
      return anonymousFails
        ? { error: { message: 'Anonymous sign-ins are disabled' } }
        : { data: { user: { id: 'guest-1', is_anonymous: true } } };
    },
    async signInWithOtp() {
      calls.push('otp');
      return otpError ? { error: { message: otpError } } : { error: null, data: {} };
    }
  };

  const window = {
    supabase: { createClient: () => ({ auth, from: () => ({}) }) },
    location: { protocol: 'https:', href: 'https://worldgame2025.netlify.app/' }
  };
  const context = { window, document: { head: { appendChild() {} }, createElement: () => ({}) }, console };
  vm.runInNewContext(source, context);
  return { db: window.GeoWarsDB, calls };
}

// Anonymous sign-in disabled: no session, but the client is usable.
const disabled = loadClient({ anonymousFails: true });
await disabled.db.init();
assert.equal(disabled.db.isOnline(), false, 'no guest session was created');
assert.equal(disabled.db.isReady(), true, 'client is still ready for magic links');

const sent = await disabled.db.sendPlayerMagicLink('to99@outlook.com', 'test');
assert.equal(sent.error, undefined, 'magic link is not blocked by the missing guest session');
assert.equal(sent.success, true, 'magic link reports success');
assert.ok(disabled.calls.includes('otp'), 'the OTP request actually reached the client');

// Real provider errors must still surface to the user.
const failing = loadClient({ anonymousFails: true, otpError: 'rate limited' });
await failing.db.init();
assert.equal((await failing.db.sendPlayerMagicLink('a@b.com')).error, 'rate limited');

// Empty email is still rejected before any network call.
const empty = loadClient();
await empty.db.init();
assert.match((await empty.db.sendPlayerMagicLink('   ')).error, /Enter an email/);

// Normal path: guest session available.
const healthy = loadClient({ anonymousFails: false });
await healthy.db.init();
assert.equal(healthy.db.isOnline(), true);
assert.equal(healthy.db.isReady(), true);

console.log('magic link gate tests passed');
