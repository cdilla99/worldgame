import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const start = source.indexOf('/* AUTOCOMPLETE_FACADE_START */');
const end = source.indexOf('/* AUTOCOMPLETE_FACADE_END */') + '/* AUTOCOMPLETE_FACADE_END */'.length;
assert.ok(start >= 0 && end > start, 'app.js contains the autocomplete compatibility facade');
const facadeSource = source.slice(start, end);
const calls = [];
const selected = { id: 2, name: 'Canada' };
const autocomplete = {
  isVisible: () => true,
  render: () => { calls.push(['render']); return 'rendered'; },
  dismiss: () => { calls.push(['dismiss']); return 'dismissed'; },
  setActiveSuggestion: index => { calls.push(['active', index]); return index; },
  getSuggestions: () => [selected],
  select: country => { calls.push(['select', country]); return country; }
};
const module = {
  autocompleteModule: autocomplete,
  getCountrySuggestions: (query, index) => [query, index],
  createAutocomplete: options => ({ options })
};
const legacy = {
  autocompleteIsVisible: () => false,
  dismissAutocomplete: () => 'legacy-dismiss',
  setActiveSuggestion: index => ['legacy-active', index],
  selectAutocompleteSuggestion: index => ['legacy-select', index],
  renderAutocomplete: () => 'legacy-render'
};
const window = { GeoWars: { existingExport: true, ready: Promise.resolve() }, GeoWarsAutocomplete: module, ...legacy };
vm.runInNewContext(facadeSource, { window, Promise, Number });
await window.GeoWars.autocompleteReady;
assert.equal(window.GeoWars.existingExport, true);
assert.equal(window.GeoWars.autocomplete, autocomplete);
assert.equal(window.GeoWars.autocompleteIsVisible.length, 0);
assert.equal(window.GeoWars.setActiveSuggestion.length, 1);
assert.equal(window.GeoWars.selectAutocompleteSuggestion.length, 1);
assert.equal(window.GeoWars.getCountrySuggestions.length, 2);
assert.equal(window.GeoWars.createAutocomplete.length, 1);
assert.deepEqual(window.GeoWars.getCountrySuggestions('ca'), ['ca', undefined]);
assert.deepEqual(window.GeoWars.createAutocomplete({ test: true }), { options: { test: true } });
assert.equal(window.GeoWars.autocompleteIsVisible(), true);
assert.equal(window.GeoWars.renderAutocomplete(), 'rendered');
assert.equal(window.GeoWars.dismissAutocomplete(), 'dismissed');
assert.equal(window.GeoWars.setActiveSuggestion(3), 3);
assert.strictEqual(window.GeoWars.selectAutocompleteSuggestion(0), selected);
assert.deepEqual(calls, [['render'], ['dismiss'], ['active', 3], ['select', selected]]);
assert.strictEqual(window.autocompleteIsVisible, legacy.autocompleteIsVisible);

const fallbackCalls = [];
const fallbackWindow = { GeoWars: {}, autocompleteIsVisible: () => true,
  dismissAutocomplete: () => fallbackCalls.push(['dismiss']),
  setActiveSuggestion: index => fallbackCalls.push(['active', index]),
  selectAutocompleteSuggestion: index => fallbackCalls.push(['select', index]),
  renderAutocomplete: () => fallbackCalls.push(['render']) };
vm.runInNewContext(facadeSource, { window: fallbackWindow, Promise, Number });
await fallbackWindow.GeoWars.autocompleteReady;
fallbackWindow.GeoWars.dismissAutocomplete();
fallbackWindow.GeoWars.setActiveSuggestion(2);
fallbackWindow.GeoWars.selectAutocompleteSuggestion(1);
fallbackWindow.GeoWars.renderAutocomplete();
assert.deepEqual(fallbackCalls, [['dismiss'], ['active', 2], ['select', 1], ['render']]);
console.log('autocomplete facade compatibility tests passed (module delegation + classic fallback)');
