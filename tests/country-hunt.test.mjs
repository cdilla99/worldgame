import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('World Explorer leads the landing page with free and timed paths', () => {
  const html = read('index.html');

  assert.match(html, /Interactive world atlas/);
  assert.match(html, /Explore the world\./);
  assert.match(html, /class="landing-explore-feature"/);
  assert.match(html, /id="btn-open-explorer"/);
  assert.match(html, /id="btn-open-explorer-hunt"/);
  assert.ok(
    html.indexOf('landing-explore-feature') < html.indexOf('landing-setup-panel'),
    'Explorer should appear before the shape challenge'
  );
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

test('Explorer supports deep globe zoom for small countries', () => {
  const script = read('globe-explorer.js');

  assert.match(script, /const MAX_ZOOM = 9/);
  assert.match(script, /clamp\(nextZoom, MIN_ZOOM, MAX_ZOOM\)/);
  assert.match(script, /zoom >= MAX_ZOOM/);
  assert.match(script, /geometry\.s \? Math\.max\(zoom, 5\.4\)/);
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
  assert.match(explorer, /startExplorerMusic\(\);\s*\n\s*navigation\?\.showExplorer/);
});
