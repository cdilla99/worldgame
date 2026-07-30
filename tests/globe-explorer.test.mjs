import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function flagToIso2(flag) {
  return Array.from(flag)
    .map(character => String.fromCharCode(character.codePointAt(0) - 127397))
    .join('');
}

test('country globe geometry covers the canonical 195-country dataset', () => {
  const geometrySource = read('assets/globe-countries.js');
  const dataSource = `${read('data/countries.js')}\nthis.__cards = countryCards;`;
  const geometryContext = { window: {} };
  const dataContext = {};

  vm.createContext(geometryContext);
  vm.createContext(dataContext);
  vm.runInContext(geometrySource, geometryContext);
  vm.runInContext(dataSource, dataContext);

  const geometry = geometryContext.window.GeoWarsGlobeCountries;
  const cards = dataContext.__cards;
  assert.equal(geometry.length, 195);
  assert.equal(cards.length, 195);
  assert.equal(new Set(geometry.map(country => country.i)).size, 195);
  assert.equal(new Set(geometry.map(country => country.c)).size, 195);
  assert.deepEqual(
    Array.from(geometry, country => country.i).sort((a, b) => a - b),
    Array.from({ length: 195 }, (_, index) => index + 1)
  );
  assert.deepEqual(
    Array.from(geometry, country => country.c).sort(),
    Array.from(cards, card => flagToIso2(card.flag)).sort()
  );

  geometry.forEach(country => {
    assert.ok(Number.isFinite(country.x) && country.x >= -180 && country.x <= 180);
    assert.ok(Number.isFinite(country.y) && country.y >= -90 && country.y <= 90);
    assert.ok(country.s === 0 || country.s === 1);
    assert.ok(Array.isArray(country.p) && country.p.length > 0);
    country.p.flat(2).forEach(([longitude, latitude]) => {
      assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
      assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90);
    });
  });

  assert.ok(geometry.filter(country => country.s).length >= 40);
  assert.ok(geometrySource.length < 450000, 'country geometry should remain a compact lazy-loaded asset');
});

test('explorer markup exposes search, globe controls, facts, and home navigation', () => {
  const html = read('index.html');
  const explorerScript = html.indexOf('globe-explorer.js?v=');
  const gameScript = html.indexOf('app.js?v=');

  assert.match(html, /World Explorer[\s\S]*id="btn-open-explorer"[\s\S]*id="btn-open-explorer-hunt"/);
  assert.match(html, /id="explorer" class="screen hidden explorer-screen"/);
  assert.match(html, /id="explorer-globe-canvas"[\s\S]*tabindex="0"/);
  assert.match(html, /id="explorer-country-search"[\s\S]*role="combobox"/);
  assert.match(html, /id="explorer-search-results"[\s\S]*role="listbox"/);
  assert.match(html, /id="explorer-country-card"[\s\S]*id="explorer-country-capital"/);
  assert.match(html, /id="btn-explorer-zoom-out"[\s\S]*id="btn-explorer-reset"[\s\S]*id="btn-explorer-zoom-in"/);
  assert.ok((html.match(/data-explorer-home/g) || []).length >= 2);
  assert.ok(gameScript > -1 && explorerScript > gameScript);
});

test('explorer controller lazy-loads geometry and supports pointer, touch, keyboard, and search', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /assets\/globe-countries\.js\?v=/);
  assert.match(script, /createElement\('script'\)/);
  assert.match(script, /hitContext\.getImageData/);
  assert.match(script, /addEventListener\('pointerdown'/);
  assert.match(script, /pointers\.size === 2/);
  assert.match(script, /addEventListener\('wheel'/);
  assert.match(script, /addEventListener\('keydown'/);
  assert.match(script, /option\.addEventListener\('pointerdown'/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /root\.GeoWars\.explorer/);
  assert.match(script, /startRegionalPractice/);
});

test('all four screens participate in navigation and accessibility state', () => {
  const script = read('app.js');

  assert.match(script, /const \$explorer = document\.getElementById\('explorer'\)/);
  assert.match(script, /\[\$landing, \$explorer, \$game, \$results\]/);
  assert.match(script, /showExplorer: \(\) => showScreen\(\$explorer\)/);
  assert.match(script, /if \(screen === \$explorer\) return \$explorerTitle/);
});

test('explorer layout has a desktop composition and mobile reflow', () => {
  const styles = read('globe-explorer.css');

  assert.match(styles, /\.explorer-layout\s*\{[\s\S]*grid-template-columns/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(styles, /\.explorer-globe-canvas/);
  assert.match(styles, /\.explorer-country-card/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
