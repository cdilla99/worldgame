import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('EARTHLING uses the dedicated SVG lockup on landing and as an in-game home control', () => {
  const html = read('index.html');
  const logo = read('assets', 'geowars-logo.svg');
  const app = read('app.js');
  const explorer = read('globe-explorer.js');

  assert.match(logo, /<svg[\s\S]*viewBox="0 0 276 64"/);
  assert.match(logo, /<title id="title">EARTHLING<\/title>/);
  assert.match(logo, /WORLD GEOGRAPHY GAME/);
  assert.match(html, /id="btn-landing-home" class="brand-lockup" type="button" aria-label="Return to the EARTHLING home page"/);
  assert.match(html, /class="brand-logo" src="assets\/geowars-logo\.svg" alt="EARTHLING"/);
  assert.match(html, /class="explorer-home-logo"[\s\S]*src="assets\/geowars-logo\.svg" alt="EARTHLING"/);
  assert.match(html, /id="btn-game-home"[\s\S]*aria-label="Return to the EARTHLING home page"/);
  assert.match(app, /\$landingHomeLogo\.addEventListener\('click', showExplorerFirstLanding\)/);
  assert.match(app, /\$gameHomeLogo\.addEventListener\('click'/);
  assert.match(app, /showExplorerFirstLanding\(\)/);
  assert.match(explorer, /homeButtons\.forEach\(button => button\.addEventListener\('click', returnHome\)\)/);
});

test('Explorer preview stays lightweight while shape settings retain region state', () => {
  const html = read('index.html');
  const app = read('app.js');
  const globe = read('interactive-globe.js');
  const styles = read('ux-polish.css');

  assert.match(html, /class="landing-globe-legacy-controls" hidden aria-hidden="true"/);
  assert.match(html, /id="btn-globe-region-mode"[\s\S]*aria-pressed="false"/);
  assert.match(html, /id="globe-region-toggle-label">Regions</);
  assert.match(html, /id="btn-globe-worldwide"[\s\S]*Worldwide/);
  assert.match(html, /id="globe-selection-card"/);
  assert.match(html, /id="globe-selection-label">Worldwide</);
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

test('homepage copy leads with educational Explorer value and labels the shape game advanced', () => {
  const html = read('index.html');
  const app = read('app.js');
  const fallbacks = read('asset-fallbacks.js');

  assert.match(html, /id="explorer-stage-title"[\s\S]*Explore the world/);
  assert.match(html, /id="explorer-globe-canvas"/);
  assert.match(html, /id="explorer-country-card"/);
  assert.match(app, /function composeExplorerHomepage\(\)/);
  assert.match(html, /Border Outline <em>Advanced<\/em>/);
  assert.doesNotMatch(html, /Country silhouette challenge/);
  assert.doesNotMatch(html, /Recognize country shapes in a 60-second sprint/);
  assert.doesNotMatch(html, /Pick a pace, then jump straight into the world/);
  assert.match(app, /Sprint · 60 seconds · \$\{diffLabel\} · \$\{continentLabel\}/);
  assert.match(fallbacks, /title: 'Shape unavailable'/);
});

test('the shape preview is disclosed only after choosing the advanced challenge', () => {
  const html = read('index.html');
  const styles = read('ux-polish.css');
  const app = read('app.js');

  assert.match(html, /<details id="landing-shape-preview" class="landing-shape-preview"/);
  assert.match(html, /<summary class="landing-shape-preview-toggle">See a sample round<\/summary>/);
  assert.match(html, /landing-shape-preview-kicker-desktop">Sample round</);
  assert.match(html, /landing-shape-preview-kicker-mobile">How it works</);
  assert.match(app, /function syncLandingShapePreviewDisclosure\(\)[\s\S]*\$landingShapePreview\.open = !\$shapeChallengePanel\?\.hidden && landingShapePreviewDesktopQuery\.matches;/);
  assert.match(app, /landingShapePreviewDesktopQuery\?\.addEventListener\?\.\('change', syncLandingShapePreviewDisclosure\)/);
  assert.match(styles, /@media \(min-width: 1024px\)[\s\S]*\.landing-shape-preview-stage\s*\{[\s\S]*minmax\(350px, 1fr\)[\s\S]*min-height: 470px;/);
  assert.match(styles, /@media \(min-width: 1024px\)[\s\S]*\.landing-shape-preview-art svg\s*\{[\s\S]*width: 300px;[\s\S]*max-height: none;/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.landing-shape-preview-toggle\s*\{[\s\S]*display: flex;/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.landing-shape-preview-kicker-mobile\s*\{[\s\S]*display: block;/);
});

test('desktop homepage gives Explorer a dominant split and stacks on smaller screens', () => {
  const styles = read('globe-explorer.css');

  assert.match(styles, /\.explorer-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1\.1fr\) minmax\(340px, 0\.9fr\)/);
  assert.match(styles, /\.explorer-globe-frame\s*\{[\s\S]*width:\s*min\(100%, 540px\)/);
  assert.match(styles, /\.explorer-info-panel\s*\{[\s\S]*border:\s*1px solid/);
  assert.match(styles, /\.explorer-secondary-content \.landing-challenges\s*\{/);
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*\.explorer-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test('landing statistics are available through a subtle collapsed disclosure', () => {
  const html = read('index.html');
  const styles = read('ux-polish.css');

  assert.match(html, /<details class="landing-statistics-disclosure">/);
  assert.match(html, /<summary class="landing-statistics-toggle"><span id="statistics-title" class="statistics-heading">Your best<\/span><\/summary>/);
  assert.match(html, /id="btn-reset-stats"[\s\S]*aria-haspopup="dialog"/);
  assert.match(styles, /\.landing-statistics-toggle::after\s*\{[\s\S]*content: '\+';/);
  assert.match(styles, /\.landing-statistics-disclosure\[open\] \.landing-statistics-toggle::after\s*\{[\s\S]*content: '-';/);
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
