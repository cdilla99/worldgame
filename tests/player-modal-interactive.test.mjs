import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression guard: the "Choose player" listener is registered before the
// accessibility wrappers are installed, so the base open/close functions must
// clear `inert` themselves. Otherwise the visible dialog stays inert and every
// control inside it (close, cancel, inputs) is unclickable and unfocusable.
const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function body(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists`);
  return source.slice(start, source.indexOf('\n}', start));
}

const helper = body('setPlayerModalInteractive');
assert.match(helper, /toggleAttribute\('inert', !interactive\)/, 'helper toggles inert');
assert.match(helper, /aria-hidden', String\(!interactive\)/, 'helper toggles aria-hidden');

const open = body('openPlayerModal');
const close = body('closePlayerModal');
assert.match(open, /setPlayerModalInteractive\(true\)/, 'open clears inert');
assert.match(close, /setPlayerModalInteractive\(false\)/, 'close restores inert');

// The un-inerting must happen before the first await, otherwise the dialog is
// briefly inert while identity lookup resolves.
const openCode = open.replace(/\/\/[^\n]*/g, '');
const openIndex = openCode.indexOf('setPlayerModalInteractive(true)');
const awaitIndex = openCode.indexOf('await');
assert.ok(awaitIndex === -1 || openIndex < awaitIndex, 'inert cleared before await');

// The listener really is registered before the wrapper reassignment; if that
// ever changes, this test should be revisited rather than silently passing.
const listener = source.indexOf("$choosePlayerButton.addEventListener('click', openPlayerModal)");
const wrapper = source.indexOf('openPlayerModal = async function');
assert.ok(listener >= 0 && wrapper >= 0 && listener < wrapper, 'listener precedes wrapper');

console.log('player modal interactive tests passed');
