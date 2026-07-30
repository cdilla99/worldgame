import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('GeoWars uses the dedicated SVG lockup on landing and as an in-game home control', () => {
  const html = read('index.html');
  const logo = read('assets', 'geowars-logo.svg');
  const app = read('app.js');

  assert.match(logo, /<svg[\s\S]*viewBox="0 0 276 64"/);
  assert.match(logo, /<title id="title">GeoWars<\/title>/);
  assert.match(logo, /WORLD SHAPE ARENA/);
  assert.match(html, /class="brand-logo" src="assets\/geowars-logo\.svg" alt="GeoWars"/);
  assert.match(html, /id="btn-game-home"[\s\S]*aria-label="Return to the GeoWars home page"/);
  assert.match(app, /\$gameHomeLogo\.addEventListener\('click'/);
  assert.match(app, /showScreen\(\$landing\)/);
});

test('globe selection is repeated in persistent, live, and ready-to-play surfaces', () => {
  const html = read('index.html');
  const app = read('app.js');
  const globe = read('interactive-globe.js');
  const styles = read('ux-polish.css');

  assert.match(html, /class="globe-scope-switch" role="group" aria-label="Challenge scope"/);
  assert.match(html, /id="btn-globe-region-mode"[\s\S]*aria-pressed="false"/);
  assert.match(html, /id="globe-region-toggle-label">Regions</);
  assert.match(html, /id="btn-globe-worldwide"[\s\S]*195 countries/);
  assert.match(html, /id="globe-selection-card" class="globe-selection-card" aria-live="polite"/);
  assert.match(html, /id="globe-selection-label">Worldwide</);
  assert.match(html, /class="globe-selection-applied">Selected</);
  assert.match(app, /\$globeSelectionLabel\.textContent = continentLabel/);
  assert.match(app, /Sprint · 60 seconds · \$\{diffLabel\} · \$\{continentLabel\}/);
  assert.match(globe, /selected\./);
  assert.match(globe, /confirmSelection\(\)/);
  assert.match(globe, /regionModeButton\.setAttribute\('aria-pressed'/);
  assert.match(globe, /regionModeLabel\.textContent = isWorldwide/);
  assert.match(styles, /\.landing-globe-status\s*\{[\s\S]*height: 2\.8em;[\s\S]*min-height: 2\.8em;/);
  assert.match(styles, /\.globe-scope-switch\s*\{/);
  assert.match(styles, /\.globe-scope-worldwide\.is-active/);
});

test('landing copy leads with Explorer and keeps the shape game concise', () => {
  const html = read('index.html');
  const app = read('app.js');
  const fallbacks = read('asset-fallbacks.js');

  assert.match(html, /Interactive world atlas/);
  assert.match(html, /Explore the world\./);
  assert.match(html, /Discover 195 countries\. Then race to find them\./);
  assert.match(html, /Name countries from their shapes\./);
  assert.match(html, /Country shape game/);
  assert.doesNotMatch(html, /Country silhouette challenge/);
  assert.doesNotMatch(html, /Recognize country shapes in a 60-second sprint/);
  assert.doesNotMatch(html, /Pick a pace, then jump straight into the world/);
  assert.match(app, /Sprint · 60 seconds · \$\{diffLabel\} · \$\{continentLabel\}/);
  assert.match(fallbacks, /title: 'Shape unavailable'/);
});
test('gameplay polish preserves responsive and focused-task contracts', () => {
  const html = read('index.html');
  const app = read('app.js');
  const styles = read('ux-polish.css');

  assert.ok(html.indexOf('styles.css?v=') < html.indexOf('ux-polish.css?v='));
  assert.match(html, /id="round-display"[\s\S]*Round 1/);
  assert.match(html, /class="answer-path-btn know-btn"/);
  assert.match(html, /class="feedback-country-card"/);
  assert.match(html, /id="feedback-continue-hint"/);
  assert.match(app, /Array\.from\(document\.querySelectorAll\('\.choice-btn'\)\)/);
  assert.match(app, /classList\.add\('has-feedback'\)/);
  assert.match(app, /document\.createElement\('button'\)/);
  assert.match(app, /classList\.add\('has-autocomplete'\)/);
  assert.match(app, /classList\.remove\('has-autocomplete'\)/);
  assert.match(app, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(styles, /@media \(min-width: 1024px\)/);
  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(styles, /\.answer-interaction-panel\.has-feedback > :not\(\.feedback\)/);
  assert.match(styles, /\.answer-interaction-panel\.has-autocomplete\s*\{[\s\S]*z-index: 100;/);
  assert.match(styles, /@media \(min-width: 768px\)[\s\S]*\.autocomplete-list[\s\S]*top: calc\(100% \+ 6px\)/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.type-answer[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /\.game-utility\s*\{[\s\S]*position: sticky;/);
  assert.match(styles, /grid-template-columns: minmax\(0, 1\.04fr\) minmax\(470px, 0\.96fr\)/);
  assert.match(styles, /\.silhouette-box\s*\{[\s\S]*width: 100%;/);
  assert.match(styles, /\.landing-tagline\s*\{[\s\S]*max-width: 10\.5ch;/);
});

test('the page retains unique element ids after the UX markup expansion', () => {
  const html = read('index.html');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});
