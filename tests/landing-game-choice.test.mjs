import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('landing exposes two responsive peer game choices with progressive disclosure', () => {
  const html = read('index.html');
  const styles = read('styles.css');
  const app = read('app.js');

  assert.match(html, /id="landing-games-title">Choose a game/);
  assert.match(html, /id="btn-landing-shape-game"[\s\S]*aria-controls="shape-challenge-panel"/);
  assert.match(html, /id="btn-landing-explorer-game"[\s\S]*aria-controls="world-explorer-panel"/);
  assert.match(html, /id="shape-challenge-panel"[\s\S]*id="world-explorer-panel"[\s\S]*id="btn-open-explorer-hunt"/);
  assert.match(styles, /\.landing-game-switch\s*\{[\s\S]*grid-template-columns:\s*repeat\(2/);
  assert.match(styles, /@media \(max-width: 420px\)[\s\S]*\.landing-game-switch\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(app, /\$shapeChallengePanel\.hidden = !shapeSelected/);
  assert.match(app, /\$worldExplorerPanel\.hidden = shapeSelected/);
});

test('Your Best reset is confirmed, device-only, and never mutates Supabase', () => {
  const html = read('index.html');
  const app = read('app.js');
  const clientSource = read('supabase-client.js');

  assert.match(html, /id="btn-reset-stats"[\s\S]*aria-haspopup="dialog"/);
  assert.match(html, /id="stats-reset-dialog"[\s\S]*Supabase and signed-in profile records will not change/);
  assert.match(app, /async function resetDeviceStats\(\)/);
  assert.match(app, /GeoWarsDB\.resetLocalStats\(\)/);
  assert.match(app, /canResetDeviceStats = hasRecords && !identity\.claimed/);

  const resetBlock = app.slice(
    app.indexOf('async function resetDeviceStats()'),
    app.indexOf('function saveStats()')
  );
  assert.doesNotMatch(resetBlock, /\.from\(|supabase/i);
  assert.match(clientSource, /!online \|\| !supabase \|\| !currentUser \|\| !isClaimed\(\)/);
});

test('local stats reset removes only the device record', () => {
  const source = read('supabase-client.js');
  const calls = [];
  const context = {
    console: { log() {}, warn() {} },
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem(key) { calls.push(['removeItem', key]); }
    },
    window: {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);

  assert.equal(context.window.GeoWarsDB.resetLocalStats(), true);
  assert.deepEqual(calls, [['removeItem', 'geowars-stats']]);
});
