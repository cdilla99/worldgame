import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('landing presents Explorer first and keeps Country Hunt as a secondary challenge', () => {
  const html = read('index.html');
  const app = read('app.js');

  assert.match(html, /Interactive world atlas/);
  assert.match(html, /Explore the world\./);
  assert.match(html, /class="[^"]*landing-explorer-showcase[^"]*"/);
  assert.doesNotMatch(html, />Choose a game</);
  assert.match(html, /id="btn-landing-shape-game"[\s\S]*Border Outline/);
  assert.match(html, /id="world-explorer-panel"[\s\S]*id="btn-open-explorer"/);
  assert.match(html, /id="shape-challenge-panel"/);
  assert.match(html, /id="btn-open-explorer"/);
  assert.match(html, /id="btn-open-explorer-hunt"/);
  assert.ok(
    html.indexOf('landing-explorer-showcase') < html.indexOf('id="btn-open-explorer-hunt"'),
    'World Explorer should appear before the challenge actions'
  );
  assert.match(app, /function setShapeChallengeExpanded\(expanded\)/);
  assert.match(app, /setShapeChallengeExpanded\(false\)/);
});

test('Country Hunt exposes a complete 60-second game loop', () => {
  const html = read('index.html');
  const script = read('globe-explorer.js');

  assert.match(html, /id="btn-explorer-free"/);
  assert.match(html, /id="btn-explorer-hunt"/);
  assert.match(html, /id="explorer-hunt-time">60/);
  assert.match(html, /id="explorer-hunt-target"/);
  assert.match(html, /id="explorer-hunt-score"/);
  assert.match(html, /id="explorer-hunt-summary"/);
  assert.match(script, /function startHunt\(\)/);
  assert.match(script, /function startHunt\(\) \{[\s\S]*longitude = -16;[\s\S]*latitude = 12;[\s\S]*zoom = MIN_ZOOM;/);
  assert.match(script, /huntDeadline = Date\.now\(\) \+ 60000/);
  assert.match(script, /function handleCountryActivation/);
  assert.match(script, /country\.id === target\.id/);
  assert.match(script, /huntScore \+= 1/);
  assert.match(script, /function endHunt/);
  assert.match(script, /clearInterval\(huntInterval\)/);
  assert.match(script, /submitCountry: handleCountryActivation/);
});

test('Country Hunt is responsive and does not reveal country names on hover', () => {
  const styles = read('globe-explorer.css');
  const script = read('globe-explorer.js');

  assert.match(styles, /\.explorer-hunt-hud\s*\{[\s\S]*grid-template-columns/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*\.explorer-hunt-hud/);
  assert.match(styles, /\.explorer-screen\.is-hunt-active \.explorer-search/);
  assert.match(script, /Select this country to find/);
  assert.match(script, /Country Hunt globe\. Find/);
});

test('Country Hunt separates the target from the selected country', () => {
  const html = read('index.html');
  const styles = read('globe-explorer.css');
  const script = read('globe-explorer.js');

  assert.match(html, /id="explorer-hunt-target-flag"/);
  assert.match(html, /id="explorer-hunt-compare"/);
  assert.match(html, /Target country[\s\S]*You selected/);
  assert.match(html, /id="explorer-hunt-selected-country"/);
  assert.match(styles, /\.explorer-hunt-compare\s*\{[\s\S]*grid-template-rows/);
  assert.match(styles, /\.explorer-hunt-selection-card\.is-wrong/);
  assert.match(styles, /\.explorer-hunt-selection-card\.is-correct/);
  assert.match(script, /function renderHuntSelection/);
  assert.match(script, /is not \$\{target\.name\}\. Keep looking\./);
});

test('Country Hunt has a focused mobile feedback surface beside the globe', () => {
  const html = read('index.html');
  const styles = read('globe-explorer.css');
  const script = read('globe-explorer.js');

  assert.match(html, /id="explorer-hunt-feedback"/);
  assert.match(html, /id="explorer-hunt-feedback-selected"/);
  assert.match(html, /id="explorer-hunt-feedback-outcome"/);
  assert.match(html, /id="explorer-hunt-feedback-distance"/);
  assert.match(html, /id="explorer-hunt-feedback-direction"/);
  assert.ok(
    html.indexOf('explorer-globe-frame') < html.indexOf('explorer-hunt-feedback')
      && html.indexOf('explorer-hunt-feedback') < html.indexOf('explorer-stage-footer'),
    'Hunt feedback should be placed alongside the globe, before the stage footer'
  );

  assert.match(styles, /\.explorer-hunt-feedback\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.explorer-screen\.is-hunt-active \.explorer-stage-heading\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.explorer-screen\.is-hunt-active \.explorer-mode-switch\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.explorer-screen\.is-hunt-active #explorer-hunt-feedback\s*\{[\s\S]*?display:\s*(?:grid|block|flex)/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.explorer-screen\.is-hunt-active \.explorer-hunt-target-card\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.explorer-globe-controls button\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?#btn-explorer-hunt-exit\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(styles, /@media \(max-width: 359px\)[\s\S]*?\.explorer-music-toggle,[\s\S]*?\.explorer-home-action\s*\{[\s\S]*?width:\s*44px[\s\S]*?min-height:\s*44px/);

  assert.match(script, /function resetHuntFeedback\(\)/);
  assert.match(script, /function renderHuntFeedback\([^)]*hint[^)]*\)/);
  assert.match(script, /const hint = geography\?\.hintBetween\?/);
  assert.match(script, /renderHuntFeedback\([\s\S]*?hint\)/);
});

test('Country Hunt composes background and answer-feedback pauses without losing time', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /const huntPauseReasons = new Set\(\)/);
  assert.match(script, /function pauseHuntClock\(reason\)/);
  assert.match(script, /function resumeHuntClock\(reason\)/);
  assert.match(script, /huntDeadline \+= Date\.now\(\) - huntPausedAt/);
  assert.match(script, /pauseHuntClock\('answer-feedback'\)/);
  assert.match(script, /resumeHuntClock\('answer-feedback'\)/);
  assert.match(script, /document\.addEventListener\('visibilitychange', handleHuntVisibility\)/);
  assert.match(script, /addEventListener\('pagehide'/);
  assert.match(script, /addEventListener\('pageshow'/);
  assert.match(script, /const sessionId = \+\+huntSessionId/);
  assert.match(script, /sessionId !== huntSessionId/);
});

test('Country Hunt exposes opt-in haptics without crowding the Hunt HUD', () => {
  const html = read('index.html');
  const styles = read('globe-explorer.css');
  const script = read('globe-explorer.js');

  assert.match(html, /id="btn-explorer-haptics"/);
  assert.match(html, /haptics\.js\?v=/);
  assert.ok(
    html.indexOf('btn-explorer-haptics') < html.indexOf('explorer-hunt-hud'),
    'The haptics preference should live outside the compact Hunt HUD'
  );
  assert.match(script, /function renderHapticsControl\(\)/);
  assert.match(script, /GeoWarsHaptics\?\.play\?\.\('correct'\)/);
  assert.match(script, /GeoWarsHaptics\?\.play\?\.\(hint\?\.proximity === 'Nearby' \? 'near' : 'wrong'\)/);
  assert.match(styles, /\.explorer-screen\.has-haptics \.explorer-haptics-toggle/);
});

test('Country Hunt uses game audio, celebration, and a paused success beat', () => {
  const html = read('index.html');
  const styles = read('globe-explorer.css');
  const script = read('globe-explorer.js');

  assert.match(html, /particles\.js/);
  assert.match(html, /celebration-text\.js/);
  assert.match(html, /id="explorer-hunt-celebration"/);
  assert.match(script, /playExplorerSound\('playWrong'\)/);
  assert.match(script, /playExplorerSound\('playCorrect'/);
  assert.match(script, /huntPausedAt = Date\.now\(\)/);
  assert.match(script, /}, 1600\)/);
  assert.match(script, /Particles\?\.burst/);
  assert.match(styles, /@keyframes explorer-confetti-burst/);
});

test('Explorer supports deep manual zoom while auto-framing preserves geographic context', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /const MAX_ZOOM = 60/);
  assert.match(script, /clamp\(nextZoom, MIN_ZOOM, MAX_ZOOM\)/);
  assert.match(script, /zoom >= MAX_ZOOM/);
  assert.match(script, /const AUTO_FIT_MAX_ZOOM = 8/);
  assert.match(script, /const targetZoom = fitZoomForCountry\(geometry\)/);
  // Multiplicative steps keep the whole manual range reachable without dozens of taps.
  assert.match(script, /setZoom\(zoom \* ZOOM_STEP\)/);
  assert.match(script, /setZoom\(zoom \/ ZOOM_STEP\)/);
});
test('Explorer music is preloaded and its label follows actual playback', () => {
  const music = read('background-music.js');
  const explorer = read('globe-explorer.js');

  assert.match(music, /function prepare\(\)/);
  assert.match(music, /audio\.preload = 'auto'/);
  assert.match(music, /return playback\.then\(function \(\) \{ return true; \}\)/);
  assert.match(music, /prepare\(\);\s*\n\}\)\(\);/);
  assert.match(explorer, /music\.isPlaying/);
  assert.match(explorer, /playing \? 'Music on' : 'Start music'/);
  assert.match(explorer, /renderMusicControl\(false\);\s*\n\s*navigation\?\.showExplorer/);
});
