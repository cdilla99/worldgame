import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

test('bundled globe geometry covers every selectable world region', () => {
  const source = fs.readFileSync(path.join(root, 'assets', 'globe-data.js'), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);

  const regions = context.window.GeoWarsGlobeRegions;
  assert.deepEqual(
    Object.keys(regions).sort(),
    ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']
  );

  const rings = Object.values(regions).flat();
  const points = rings.flat();
  assert.ok(rings.length > 250, 'simplified geometry should retain recognizable islands and coastlines');
  assert.ok(points.length > 2500, 'simplified geometry should retain enough points for a convincing globe');
  assert.ok(source.length < 80000, 'globe geometry should stay lightweight');

  points.forEach(([longitude, latitude]) => {
    assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
    assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90);
  });
});

test('landing markup exposes an accessible interactive globe with local fallback', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appScript = html.indexOf('app.js?v=');
  const dataScript = html.indexOf('assets/globe-data.js?v=');
  const globeScript = html.indexOf('interactive-globe.js?v=');

  assert.match(html, /id="landing-globe-canvas"[\s\S]*tabindex="0"[\s\S]*role="button"/);
  assert.match(html, /class="landing-globe-art" src="assets\/landing-globe\.svg"/);
  assert.match(html, /id="challenge-settings" class="game-setup"/);
  assert.match(html, /class="globe-scope-switch" role="group" aria-label="Challenge scope"/);
  assert.match(html, /id="btn-globe-region-mode"[\s\S]*aria-pressed="false"/);
  assert.match(html, /id="btn-globe-worldwide"[\s\S]*aria-pressed="true"/);
  assert.ok(appScript > -1 && appScript < dataScript && dataScript < globeScript);
});

test('globe has restrained idle motion that stops on interaction and supports reduced motion', () => {
  const script = fs.readFileSync(path.join(root, 'interactive-globe.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

  assert.doesNotMatch(script, /setInterval\s*\(/);
  assert.doesNotMatch(styles, /landing-globe-spin/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /function startIdleRotation\(\)/);
  assert.match(script, /function stopIdleRotation\(\)/);
  assert.match(script, /idleRotationActive = false/);
  assert.match(script, /canvas\.addEventListener\('pointerdown'[\s\S]*stopIdleRotation\(\)/);
  assert.doesNotMatch(script, /function project[\s\S]*function startIdleRotation[\s\S]*const visibility/);
  assert.match(script, /addEventListener\('pointermove'/);
  assert.match(script, /addEventListener\('keydown'/);
  assert.match(script, /root\.GeoWars\.globe/);
});
