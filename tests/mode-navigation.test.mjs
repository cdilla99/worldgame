import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Feature: mode-first-navigation. Markup contract for Mode_Nav, Explore_View_Switch,
// Challenge_Panel, the retired toggle groups, and the classic script order.

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

// Strip comments so commented-out markup never counts as live markup.
const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');

function parseAttributes(openTag) {
  const attributes = {};
  const pattern = /\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const body = openTag.replace(/^<[a-zA-Z0-9-]+/, '').replace(/\/?>$/, '');
  let match;
  while ((match = pattern.exec(` ${body}`)) !== null) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attributes;
}

// Returns the element whose opening tag starts at `startIndex`, with its full outer markup,
// using same-tag depth counting to find the matching close tag.
function elementAt(source, startIndex) {
  const openTag = source.slice(startIndex, source.indexOf('>', startIndex) + 1);
  const tagName = /^<([a-zA-Z0-9-]+)/.exec(openTag)[1].toLowerCase();
  const tagPattern = new RegExp(`<(/?)${tagName}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = startIndex;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(source)) !== null) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      const end = match.index + match[0].length;
      return {
        tagName,
        openTag,
        attributes: parseAttributes(openTag),
        outer: source.slice(startIndex, end),
        inner: source.slice(startIndex + openTag.length, match.index)
      };
    }
  }
  throw new Error(`Unclosed <${tagName}> at ${startIndex}`);
}

function elementById(source, id) {
  const match = new RegExp(`<[a-zA-Z0-9-]+\\b[^>]*\\sid="${id}"[^>]*>`).exec(source);
  assert.ok(match, `expected an element with id="${id}"`);
  return elementAt(source, match.index);
}

function elementByOpenTag(source, openPattern) {
  const match = openPattern.exec(source);
  assert.ok(match, `expected markup matching ${openPattern}`);
  return elementAt(source, match.index);
}

function childButtons(source) {
  const buttons = [];
  const pattern = /<button\b[^>]*>/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const button = elementAt(source, match.index);
    buttons.push(button);
    pattern.lastIndex = match.index + button.outer.length;
  }
  return buttons;
}

const strongLabel = button => {
  const desktopMarkup = button.inner.replace(/<span class="mobile-nav-label">[\s\S]*?<\/span>/g, '').replace(/<span class="desktop-nav-label">([^<]*)<\/span>/g, '$1');
  const match = /<strong>([^<]*)<\/strong>/.exec(desktopMarkup);
  return match ? match[1] : null;
};

const classList = element => (element.attributes.class || '').split(/\s+/).filter(Boolean);

const allIds = () => [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);

test('Mode_Nav is named "Atlas modes" with Explore, Challenge, Daily Puzzle in order', () => {
  const nav = elementByOpenTag(html, /<nav\b[^>]*class="atlas-primary-nav"[^>]*>/);
  assert.equal(nav.attributes['aria-label'], 'Atlas modes');

  const buttons = childButtons(nav.inner);
  assert.deepEqual(buttons.map(button => button.attributes.id), [
    'btn-mode-explore',
    'btn-mode-challenge',
    'btn-open-worldle'
  ]);
  assert.deepEqual(buttons.map(strongLabel), ['Explore', 'Challenge', 'Daily Puzzle']);

  for (const button of buttons) {
    assert.equal(button.attributes.type, 'button', `${button.attributes.id} is type="button"`);
    const visible = strongLabel(button);
    const name = button.attributes['aria-label'];
    assert.ok(name, `${button.attributes.id} has an aria-label`);
    assert.ok(name.startsWith(visible), `"${name}" starts with its visible label "${visible}"`);
  }

  const [explore, challenge, daily] = buttons;
  assert.equal(explore.attributes['aria-pressed'], 'true');
  assert.ok(classList(explore).includes('is-active'));
  assert.equal(explore.attributes['aria-controls'], 'atlas-globe-workspace atlas-shapes-workspace');

  assert.equal(challenge.attributes['aria-pressed'], 'false');
  assert.ok(!classList(challenge).includes('is-active'));
  assert.equal(challenge.attributes['aria-controls'], 'atlas-challenge-panel');

  assert.ok(daily.attributes['aria-label'].includes('Daily Puzzle'));
  assert.ok(daily.attributes['aria-label'].includes('Worldle'));
  assert.equal(daily.attributes['aria-pressed'], 'false');
  assert.equal(daily.attributes['aria-controls'], 'worldle-screen');
  assert.ok(classList(daily).includes('atlas-nav-worldle'));
});

test('Explore_View_Switch is a named group outside Mode_Nav controlling each workspace', () => {
  const nav = elementByOpenTag(html, /<nav\b[^>]*class="atlas-primary-nav"[^>]*>/);
  const group = elementById(html, 'atlas-explore-switch');
  assert.equal(group.attributes.role, 'group');
  assert.equal(group.attributes['aria-label'], 'Explore views');

  const headerClose = html.indexOf('</header>', html.indexOf('class="explorer-utility atlas-header"'));
  assert.ok(html.indexOf('id="atlas-explore-switch"') > headerClose, 'legacy view switch stays outside the utility header');

  const buttons = childButtons(group.inner);
  assert.deepEqual(buttons.map(button => button.attributes.id), ['btn-atlas-globe', 'btn-atlas-shapes']);
  assert.deepEqual(buttons.map(strongLabel), ['Globe', 'Shapes']);
  assert.ok(!nav.inner.includes('btn-atlas-globe'));
  assert.ok(!nav.inner.includes('btn-atlas-shapes'));

  const [globe, shapes] = buttons;
  assert.equal(globe.attributes['aria-pressed'], 'true');
  assert.equal(globe.attributes['aria-controls'], 'atlas-globe-workspace');
  assert.ok(globe.attributes['aria-label'].startsWith('Globe'));
  assert.equal(shapes.attributes['aria-pressed'], 'false');
  assert.equal(shapes.attributes['aria-controls'], 'atlas-shapes-workspace');
  assert.ok(shapes.attributes['aria-label'].startsWith('Shapes'));

  const globeWorkspace = elementById(html, 'atlas-globe-workspace');
  assert.equal(globeWorkspace.attributes['aria-labelledby'], 'atlas-globe-title');
  assert.match(globeWorkspace.inner, /^\s*<h2 id="atlas-globe-title" class="sr-only" tabindex="-1">Globe<\/h2>/);
});

test('retired explorer and shapes toggle groups stay in the DOM but hidden and inert', () => {
  const retired = [
    { pattern: /<div\b[^>]*class="explorer-mode-switch[^"]*"[^>]*>/, ids: ['btn-explorer-free', 'btn-explorer-hunt'], label: 'World Explorer mode' },
    { pattern: /<div\b[^>]*class="atlas-shape-mode-switch[^"]*"[^>]*>/, ids: ['btn-atlas-shape-explore'], label: 'Shapes mode' }
  ];
  for (const { pattern, ids, label } of retired) {
    const group = elementByOpenTag(html, pattern);
    assert.ok('hidden' in group.attributes, `${label} carries hidden`);
    assert.ok('inert' in group.attributes, `${label} carries inert`);
    assert.ok(classList(group).includes('hidden'), `${label} carries class hidden`);
    assert.equal(group.attributes['aria-label'], label);
    for (const id of ids) assert.match(group.inner, new RegExp(`id="${id}"`));
  }
});

test('Challenge_Panel starts hidden with a Country Hunt card and a Shape Quiz card', () => {
  const panel = elementById(html, 'atlas-challenge-panel');
  assert.equal(panel.tagName, 'section');
  assert.ok('hidden' in panel.attributes);
  assert.ok('inert' in panel.attributes);
  assert.equal(panel.attributes['aria-hidden'], 'true');
  assert.ok(classList(panel).includes('hidden'));
  assert.equal(panel.attributes['aria-labelledby'], 'atlas-challenge-title');

  const title = elementById(panel.outer, 'atlas-challenge-title');
  assert.equal(title.attributes.tabindex, '-1');
  assert.equal(title.inner.trim(), 'Activities');

  // Sits between the Explore view switch and the globe workspace.
  const switchIndex = html.indexOf('id="atlas-explore-switch"');
  const panelIndex = html.indexOf('id="atlas-challenge-panel"');
  const globeIndex = html.indexOf('id="atlas-globe-workspace"');
  assert.ok(switchIndex < panelIndex && panelIndex < globeIndex);

  const cards = [...panel.inner.matchAll(/<article\b[^>]*class="atlas-challenge-card(?:\s[^"]*)?"[^>]*>/g)]
    .map(match => elementAt(panel.inner, match.index));
  assert.equal(cards.length, 2);

  const [hunt, quiz] = cards;
  assert.equal(hunt.attributes['aria-labelledby'], 'atlas-challenge-hunt-title');
  assert.equal(elementById(hunt.outer, 'atlas-challenge-hunt-title').inner.trim(), 'Country Hunt');
  const huntDescription = elementById(hunt.outer, 'atlas-challenge-hunt-desc').inner.trim();
  assert.ok(huntDescription.length > 0 && !/\n/.test(huntDescription));
  const huntButton = elementById(hunt.outer, 'btn-challenge-hunt');
  assert.equal(huntButton.attributes.type, 'button');
  assert.equal(huntButton.attributes['aria-describedby'], 'atlas-challenge-hunt-desc');
  assert.ok(huntButton.inner.trim().length > 0);

  assert.equal(quiz.attributes['aria-labelledby'], 'atlas-challenge-quiz-title');
  assert.equal(elementById(quiz.outer, 'atlas-challenge-quiz-title').inner.trim(), 'Shape Quiz');
  const quizDescription = /<p\b[^>]*>([^<]*)<\/p>/.exec(quiz.inner);
  assert.ok(quizDescription && quizDescription[1].trim().length > 0 && !/\n/.test(quizDescription[1].trim()));
  const slot = elementById(quiz.outer, 'atlas-challenge-quiz-slot');
  assert.equal(slot.inner.trim(), '', 'quiz slot starts empty; app.js moves the setup panel in');
});

test('classic engines retain their order and the activity controller loads last', () => {
  const scripts = [...html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g)]
    .map(match => match[1].replace(/\?v=[^"]*$/, ''));
  assert.deepEqual(scripts, [
    'data/countries.js',
    'data/territories.js',
    'difficulty-ladder.js',
    'ladder-progress.js',
    'player-profiles.js',
    'learning-progress.js',
    'daily-challenge.js',
    'daily-worldle.js',
    'anthems.js',
    'supabase-client.js',
    'google-signin.js',
    'audio-engine.js',
    'haptics.js',
    'particles.js',
    'celebration-text.js',
    'background-music.js',
    'asset-fallbacks.js',
    'shape-geometry.js',
    'app.js',
    'assets/globe-data.js',
    'interactive-globe.js',
    'geography.js',
    'globe-explorer.js',
    'atlas.js',
    'worldle.js',
    'challenge-previews.js',
    'mobile-experience.js',
    'activities.js'
  ]);

  const scriptSources = [...html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"/g)].map(match => match[1]);
  const stylesheets = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(match => parseAttributes(match[0]))
    .filter(attributes => (attributes.rel || '').split(/\s+/).includes('stylesheet'))
    .map(attributes => attributes.href);
  assert.ok(stylesheets.length > 0);
  for (const source of [...scriptSources, ...stylesheets]) {
    assert.doesNotMatch(source, /^(https?:)?\/\//i, `${source} must be a local asset`);
  }
});

test('every id is unique and the new controls reference existing ids', () => {
  const ids = allIds();
  const seen = new Set();
  const duplicates = ids.filter(id => (seen.has(id) ? true : (seen.add(id), false)));
  assert.deepEqual(duplicates, []);

  const scopes = [
    elementByOpenTag(html, /<nav\b[^>]*class="atlas-primary-nav"[^>]*>/),
    elementById(html, 'atlas-explore-switch'),
    elementById(html, 'atlas-challenge-panel'),
    elementById(html, 'atlas-globe-workspace').openTag
  ];
  const references = [];
  for (const scope of scopes) {
    const markup = typeof scope === 'string' ? scope : scope.outer;
    for (const match of markup.matchAll(/\saria-(controls|labelledby|describedby)="([^"]+)"/g)) {
      for (const id of match[2].split(/\s+/).filter(Boolean)) references.push({ attribute: match[1], id });
    }
  }
  assert.ok(references.length >= 8);
  for (const { attribute, id } of references) {
    assert.ok(seen.has(id), `aria-${attribute} references missing id "${id}"`);
  }
});

// Source-level integration assertions for the Worldle rebase integration.
// These verify the wiring between worldle.js, app.js, atlas.js, and globe-explorer.js.

test('Daily Puzzle uses the shared navigation instead of a separate back button', () => {
  const puzzle = elementById(html, 'worldle-screen');
  assert.equal(elementById(puzzle.outer, 'worldle-title').inner.trim(), 'Daily Puzzle');
  assert.ok(puzzle.inner.includes('id="btn-worldle-stats"'));
  assert.ok(!puzzle.inner.includes('id="btn-worldle-home"'));
});

test('app.js #btn-open-worldle handler routes through openDailyPuzzle with fallback', () => {
  const app = read('app.js');
  // Match the entire if ($btnOpenWorldle) { ... } block including nested braces
  const worldleHandlerPattern = /if\s*\(\s*\$btnOpenWorldle\s*\)\s*\{[\s\S]*?worldle\?\.open[\s\S]*?\}\s*\}/;
  const worldleHandler = worldleHandlerPattern.exec(app);
  assert.ok(worldleHandler, '#btn-open-worldle click handler exists');
  const handlerBlock = worldleHandler[0];
  assert.match(handlerBlock, /atlas\.openDailyPuzzle/, 'handler routes through atlas.openDailyPuzzle');
  assert.match(handlerBlock, /worldle\?\.open/, 'handler has worldle.open fallback');
});

test('composeExplorerHomepage references the quiz slot for Shape Quiz setup', () => {
  const app = read('app.js');
  const composePattern = /function composeExplorerHomepage\(\)\s*\{[\s\S]*?\n\}/;
  const composeMatch = composePattern.exec(app);
  assert.ok(composeMatch, 'composeExplorerHomepage function exists');
  const composeBlock = composeMatch[0];
  assert.match(composeBlock, /\$atlasChallengeQuizSlot/, 'composeExplorerHomepage references $atlasChallengeQuizSlot');
});

test('globe-explorer.js does not read state.level or state.continent (Country Hunt ignores difficulty and region)', () => {
  const globeExplorer = read('globe-explorer.js');
  assert.doesNotMatch(globeExplorer, /state\.level/, 'globe-explorer.js does not read state.level');
  assert.doesNotMatch(globeExplorer, /state\.continent/, 'globe-explorer.js does not read state.continent');
});
