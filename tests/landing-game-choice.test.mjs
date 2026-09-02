import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('homepage leads with the live Explorer and progressively discloses challenges', () => {
  const html = read('index.html');
  const styles = read('globe-explorer.css');
  const app = read('app.js');

  assert.doesNotMatch(html, /data-selected-game=/);
  assert.match(html, /id="landing"[\s\S]*class="screen landing hidden"/);
  assert.match(html, /id="explorer" class="screen explorer-screen"/);
  assert.match(html, /id="explorer-stage-title"[\s\S]*Explore the world/);
  assert.match(html, /id="explorer-globe-canvas"[\s\S]*id="explorer-country-card"/);
  assert.match(html, /id="explorer-secondary-content"/);
  assert.match(html, /id="landing-challenges-title">Now find them without the labels/);
  assert.match(html, /id="btn-open-explorer-hunt"[\s\S]*Country Hunt/);
  assert.match(html, /id="btn-landing-shape-game"[\s\S]*aria-expanded="false"[\s\S]*Border Outline[\s\S]*Advanced/);
  assert.match(html, /id="shape-challenge-panel"[^>]*hidden/);
  assert.doesNotMatch(html, />Choose a game</);
  assert.match(styles, /\.explorer-layout\s*\{[\s\S]*grid-template-columns/);
  assert.match(styles, /\.explorer-globe-frame\s*\{[\s\S]*width:\s*min\(100%, 540px\)/);
  assert.match(styles, /\.explorer-secondary-content \.landing-challenges\s*\{/);
  assert.match(app, /function composeExplorerHomepage\(\)/);
  assert.match(app, /\$explorerSecondaryContent\.append\(element\)/);
  assert.match(app, /function setShapeChallengeExpanded\(expanded\)/);
  assert.match(app, /\$shapeChallengePanel\.hidden = !expanded/);
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
