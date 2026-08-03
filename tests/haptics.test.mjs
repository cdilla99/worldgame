import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.resolve(testDirectory, '..', 'haptics.js'), 'utf8');

function loadHaptics(options = {}) {
  const calls = [];
  const values = new Map();
  if (options.stored != null) values.set('geowars-haptics-enabled', String(options.stored));
  const localStorage = {
    getItem(key) {
      if (options.storageThrows) throw new Error('storage unavailable');
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      if (options.storageThrows) throw new Error('storage unavailable');
      values.set(key, value);
    }
  };
  const navigator = {
    maxTouchPoints: options.supported === false ? 0 : 5
  };
  if (options.supported !== false) {
    navigator.vibrate = pattern => {
      calls.push(pattern);
      return options.vibrateResult !== false;
    };
  }
  const window = {
    localStorage,
    navigator,
    matchMedia: () => ({ matches: !!options.reducedMotion })
  };
  vm.runInNewContext(source, { window });
  return { api: window.GeoWarsHaptics, calls, values };
}

test('haptics are supported only on vibration-capable touch devices and default off', () => {
  const supported = loadHaptics();
  assert.equal(supported.api.isSupported(), true);
  assert.equal(supported.api.isEnabled(), false);
  assert.equal(supported.api.play('correct'), false);
  assert.deepEqual(supported.calls, []);

  const unsupported = loadHaptics({ supported: false });
  assert.equal(unsupported.api.isSupported(), false);
  assert.equal(unsupported.api.play('wrong'), false);
});

test('haptics preference toggles, persists, and uses restrained feedback patterns', () => {
  const session = loadHaptics();
  assert.equal(session.api.toggle(), true);
  assert.equal(session.values.get('geowars-haptics-enabled'), 'true');
  assert.equal(session.api.play('correct'), true);
  assert.deepEqual(Array.from(session.calls[0]), [18, 32, 28]);
  assert.equal(session.api.play('near'), true);
  assert.equal(session.calls[1], 10);
  assert.equal(session.api.play('wrong'), true);
  assert.equal(session.calls[2], 14);

  assert.equal(session.api.setEnabled(false), false);
  assert.equal(session.values.get('geowars-haptics-enabled'), 'false');
  assert.equal(session.calls[3], 0);

  const restored = loadHaptics({ stored: true });
  assert.equal(restored.api.isEnabled(), true);
});

test('haptics fail safely when storage is unavailable or reduced motion is requested', () => {
  const privateSession = loadHaptics({ storageThrows: true });
  assert.doesNotThrow(() => privateSession.api.toggle());
  assert.equal(privateSession.api.isEnabled(), true);

  const reducedMotion = loadHaptics({ stored: true, reducedMotion: true });
  assert.equal(reducedMotion.api.play('correct'), false);
  assert.deepEqual(reducedMotion.calls, []);
});
