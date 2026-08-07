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

test('More country details has unique ordered content sections with economics final', () => {
  const html = read('index.html');
  const detailsBody = html.match(/<details\s+id="explorer-more-details"[^>]*>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(detailsBody, '#explorer-more-details must exist');

  const ids = ['explorer-more-details', 'explorer-landmark-media', 'explorer-economics-callout'];
  ids.forEach(id => {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1, `#${id} must be unique`);
  });

  const directContentOrder = [...detailsBody.matchAll(/^\s{14}<(dl|section|figure)\b([^>]*)>/gm)].map(([, , attributes]) => {
    const id = attributes.match(/\bid="([^"]+)"/)?.[1];
    if (id) return `#${id}`;
    const className = attributes.match(/\bclass="([^"]+)"/)?.[1]?.split(/\s+/)[0];
    return `.${className}`;
  });
  assert.deepEqual(directContentOrder, [
    '.explorer-more-facts',
    '#explorer-landmark-media',
    '#explorer-economics-callout'
  ]);
  assert.equal(directContentOrder.at(-1), '#explorer-economics-callout', 'no direct content section may follow economics');
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

test('free exploration opens selected-country details by default', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /details\.open = !huntActive;/);
  assert.match(script, /function showFreeExplorer\(\)[\s\S]*renderCountryCard\(cardsById\.get\(selectedCountryId\)\)/);
});

test('Explorer loads an optional expandable landmark image with information and source links', () => {
  const html = read('index.html');
  const script = read('globe-explorer.js');
  const styles = read('globe-explorer.css');

  assert.match(html, /id="explorer-landmark-media" class="explorer-landmark-media hidden"/);
  assert.match(html, /id="explorer-landmark-media-toggle" class="explorer-landmark-media-toggle" type="button" aria-expanded="false"/);
  assert.match(html, /id="explorer-landmark-learn-more"[\s\S]*Learn about this landmark/);
  assert.match(html, /id="explorer-landmark-media-source"[\s\S]*Wikipedia/);
  assert.match(script, /https:\/\/en\.wikipedia\.org\/w\/api\.php/);
  assert.match(script, /const LANDMARK_WIKIPEDIA_CANDIDATES = Object\.freeze\(/);
  assert.match(script, /'Chichen Itza pyramid': Object\.freeze\(\['Chichen Itza'\]\)/);
  assert.match(script, /function getApprovedLandmarkCandidates\(landmarkName\)/);
  assert.match(script, /function normalizeLandmarkMediaResponse\(data, candidateTitle\)/);
  assert.match(script, /'&titles='\s*\+\s*encodeURIComponent\(wikipediaTitle\)\s*\+\s*'&redirects=1/);
  assert.match(script, /prop=pageimages\|info/);
  assert.match(script, /piprop=thumbnail/);
  assert.match(script, /const imageUrl = page\?\.thumbnail\?\.source;/);
  assert.match(script, /landmarkMediaImage\.alt = `\$\{media\.resolvedTitle\} in \$\{country\.name\}`/);
  assert.match(script, /landmarkLearnMore\.href = media\.sourceUrl;/);
  assert.match(script, /landmarkMediaSource\.href = media\.sourceUrl;/);
  assert.match(script, /landmarkMediaToggle\?\.addEventListener\('click'/);
  assert.match(styles, /\.explorer-landmark-media-toggle\s*\{[\s\S]*width: min\(100%, 180px\);/);
  assert.match(styles, /\.explorer-landmark-media\.is-expanded \.explorer-landmark-media-toggle\s*\{[\s\S]*width: 100%;/);
  assert.match(styles, /\.explorer-landmark-media img\s*\{[\s\S]*height: auto;[\s\S]*object-fit: contain;/);
});

test('geometry loading is timeout-bounded and retryable after a terminal failure', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /const GEOMETRY_TIMEOUT_MS = 10000/);
  assert.match(script, /root\.setTimeout\([\s\S]*GEOMETRY_TIMEOUT_MS/);
  assert.match(script, /function showGeometryError\(loadError\)/);
  assert.match(script, /geometryState = 'error'/);
  assert.match(script, /\.finally\(\(\) => \{[\s\S]*if \(geometryState === 'error'\) geometryPromise = null/);
  assert.match(script, /function retryGeometry\(\)/);
  assert.match(script, /geometryRetryButton\?\.addEventListener\('click', retryGeometry\)/);
});

test('country geometry remains required while territory geometry can degrade gracefully', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /Promise\.allSettled\(/);
  assert.match(script, /if \(countryResult\.status !== 'fulfilled'\) throw countryResult\.reason/);
  assert.match(script, /const territoryData = territoryResult\.status === 'fulfilled' \? territoryResult\.value : \[\]/);
  assert.match(script, /geometryState = territoryGeometryReady \? 'ready' : 'partial'/);
  assert.match(script, /Country globe ready\. Territory outlines are temporarily unavailable\./);
});

test('geometry recovery restores the canvas and exposes accessible mobile escape controls', () => {
  const html = read('index.html');
  const script = read('globe-explorer.js');
  const styles = read('globe-explorer.css');

  assert.match(html, /id=\x22explorer-globe-error\x22[^>]*role=\x22alert\x22/);
  assert.match(html, /id=\x22btn-explorer-globe-retry\x22[\s\S]*id=\x22btn-explorer-search-fallback\x22/);
  assert.match(script, /canvas\.classList\.add\('hidden'\)[\s\S]*canvas\.classList\.remove\('hidden'\)/);
  assert.match(script, /searchFallbackButton\?\.addEventListener\('click', useSearchFallback\)/);
  assert.match(styles, /\.explorer-globe-error-actions button\s*\{[^}]*min-height:\s*44px;/);
});

test('country boundaries remain clear across zoom, mobile, hover, and selection states', () => {
  const explorer = read('globe-explorer.js');
  const landingGlobe = read('interactive-globe.js');

  assert.match(explorer, /function drawCountryOutline/);
  assert.match(explorer, /size <= 430 \? 0\.16 : 0/);
  assert.match(explorer, /Math\.min\(0\.36, Math\.max\(0, zoom - 1\) \* 0\.085\)/);
  assert.match(explorer, /rgba\(3, 38, 52, 0\.76\)/);
  assert.match(explorer, /drawCountryOutline\(context, selectedCountry\)/);
  assert.match(landingGlobe, /rgba\(3, 38, 52, 0\.68\)/);
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
