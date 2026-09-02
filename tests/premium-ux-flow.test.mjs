import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Explorer-first landing uses canonical content and discloses the shape challenge', () => {
  const html = read('index.html');
  const app = read('app.js');
  const styles = read('ux-polish.css');
  const explorerStyles = read('globe-explorer.css');

  assert.ok(html.includes('id="landing-shape-preview"'));
  assert.ok(html.includes('id="landing-shape-preview-flag"'));
  assert.ok(html.includes('id="landing-shape-preview-country"'));
  assert.ok(html.includes('class="landing-shape-preview-answer"'));
  assert.ok(html.includes('id="explorer-stage-title"'));
  assert.ok(html.includes('>Explore the world<'));
  assert.ok(html.includes('id="explorer-globe-canvas"'));
  assert.ok(html.includes('id="explorer-country-card"'));
  assert.ok(html.includes('id="explorer-secondary-content"'));
  assert.ok(html.includes('id="setup-title">Choose a mode'));
  assert.ok(html.includes('id="landing-preview-country"'));
  assert.ok(html.includes('id="shape-challenge-panel" class="landing-game-panel landing-border-outline-setup hidden"'));
  assert.equal(html.includes('Test your country knowledge'), false);

  const disclosureStart = app.indexOf('function setShapeChallengeExpanded(expanded)');
  const disclosureEnd = app.indexOf('syncLandingShapePreviewDisclosure();', disclosureStart);
  const disclosureFlow = app.slice(disclosureStart, disclosureEnd);
  assert.ok(disclosureFlow.includes('$shapeChallengePanel.hidden = !expanded'));
  assert.ok(disclosureFlow.includes("setAttribute('aria-expanded', String(expanded))"));
  assert.ok(app.includes('function composeExplorerHomepage()'));
  assert.ok(app.includes('$explorerSecondaryContent.append(element)'));

  assert.ok(styles.includes('.landing-shape-preview-stage'));
  assert.ok(styles.includes('.landing-shape-preview-answer'));
  assert.ok(styles.includes('.landing-shape-preview-marker img'));
  assert.ok(styles.includes('@keyframes landing-shape-swap'));
  assert.ok(styles.includes('@keyframes landing-shape-title'));
  assert.ok(app.includes('const LANDING_PREVIEW_COUNTRY_IDS'));
  assert.ok(app.includes('const cards = shuffle(LANDING_PREVIEW_COUNTRY_IDS'));
  assert.ok(styles.includes('.landing-challenge-grid'));
  assert.ok(explorerStyles.includes('#explorer-stage-title'));
  assert.ok(explorerStyles.includes('.explorer-secondary-content .landing-challenges'));
});

test('region reveal uses the answer panel without changing score or timer state', () => {
  const html = read('index.html');
  const app = read('app.js');
  const styles = read('ux-polish.css');

  assert.ok(html.includes('id="continent-hint" class="pill-sm region-hint-status sr-only hidden"'));
  assert.ok(html.includes('id="region-reveal-card"'));
  assert.ok(html.includes('id="region-reveal-title"'));
  assert.ok(html.includes('id="region-reveal-context"'));
  const legacyHintStart = html.indexOf('id="continent-hint"');
  const legacyHintMarkup = html.slice(legacyHintStart, legacyHintStart + 180);
  assert.equal(legacyHintMarkup.includes('aria-live'), false);

  const rendererStart = app.indexOf('function renderRegionReveal(card)');
  const rendererEnd = app.indexOf('function nextRound()', rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);
  assert.ok(renderer.includes('$regionRevealTitle.textContent = subregion || continent'));
  assert.ok(renderer.includes("$regionRevealContext.textContent = subregion ? 'Part of ' + continent : 'Continent'"));
  assert.equal(renderer.includes('state.score'), false);
  assert.equal(renderer.includes('state.streak'), false);
  assert.equal(renderer.includes('state.timeLeft'), false);
  assert.equal(renderer.includes('pauseTimer'), false);

  const revealStart = app.indexOf("$btnShowRegion.addEventListener('click'");
  const revealEnd = app.indexOf('// GAME END', revealStart);
  const revealFlow = app.slice(revealStart, revealEnd);
  assert.ok(revealFlow.includes('renderRegionReveal(state.currentCard)'));
  assert.ok(revealFlow.includes("setControlLabel($btnShowRegion, 'Region revealed')"));
  assert.ok(app.includes('resetRegionReveal();'));

  assert.ok(styles.includes('.region-reveal-card'));
  assert.ok(styles.includes('min-height: 148px'));
  assert.ok(styles.includes('@media (max-width: 767px)'));
});
