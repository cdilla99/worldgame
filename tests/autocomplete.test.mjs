import assert from 'node:assert/strict';
import { EventBus } from '../src/core/events.js';
import {
  MAX_SUGGESTIONS,
  MIN_QUERY_LENGTH,
  createAutocomplete,
  getCountrySuggestions
} from '../src/features/autocomplete/index.js';

class FakeClassList {
  constructor(...names) { this.names = new Set(names); }
  add(name) { this.names.add(name); }
  contains(name) { return this.names.has(name); }
  toggle(name, force) {
    if (force === undefined ? !this.names.has(name) : force) this.names.add(name);
    else this.names.delete(name);
  }
}

class FakeElement {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.classList = new FakeClassList('hidden');
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.value = '';
    this.textContent = '';
    this.id = '';
    this.scrollCalls = [];
  }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  removeEventListener(type, handler) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== handler));
  }
  dispatch(type, init = {}) {
    const event = {
      type,
      target: this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...init
    };
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(event);
    return event;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  scrollIntoView(options) { this.scrollCalls.push(options); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
}

function createFixture(countryIndex) {
  const document = { createElement: () => new FakeElement(document) };
  const input = new FakeElement(document);
  const list = new FakeElement(document);
  const events = new EventBus();
  const autocomplete = createAutocomplete({ document, input, list, countryIndex, events });
  return { autocomplete, events, input, list };
}
const sampleCountries = Object.freeze([
  { id: 1, name: 'Canada' },
  { id: 2, name: 'Cambodia' },
  { id: 3, name: 'Cameroon' },
  { id: 4, name: 'Cape Verde' },
  { id: 5, name: 'Central African Republic' },
  { id: 6, name: 'Chad' },
  { id: 7, name: 'Mexico' }
]);

assert.equal(MIN_QUERY_LENGTH, 2);
assert.equal(MAX_SUGGESTIONS, 5);
assert.deepEqual(getCountrySuggestions('c', sampleCountries), [], 'one character does not query suggestions');
assert.deepEqual(
  getCountrySuggestions('  CAM  ', sampleCountries).map(country => country.name),
  ['Cambodia', 'Cameroon'],
  'matching is trimmed, case-insensitive, and performed on country names'
);
assert.deepEqual(
  getCountrySuggestions('c', sampleCountries),
  [],
  'queries shorter than two normalized characters return no countries'
);
assert.deepEqual(
  getCountrySuggestions('a', sampleCountries),
  [],
  'the two-character threshold is enforced before broad matching'
);
assert.equal(getCountrySuggestions('ca', sampleCountries).length, 5, 'results are capped at five');
assert.ok(
  getCountrySuggestions('UNITED').some(country => country.name === 'United States'),
  'the default lookup uses the shared minimal country index'
);
assert.throws(() => getCountrySuggestions('ca', null), TypeError);

const keyboardFixture = createFixture(sampleCountries);
assert.equal(keyboardFixture.input.getAttribute('role'), 'combobox', 'the text field exposes the combobox role');
assert.equal(keyboardFixture.input.getAttribute('aria-autocomplete'), 'list', 'the text field identifies list autocomplete behavior');
assert.equal(keyboardFixture.input.getAttribute('aria-controls'), keyboardFixture.list.id, 'aria-controls references the suggestion list ID');
assert.equal(keyboardFixture.list.id, 'autocomplete-list', 'an unnamed suggestion list receives a stable relationship ID');
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'false', 'the empty suggestion list initializes collapsed');
keyboardFixture.input.value = 'ca';
keyboardFixture.input.dispatch('input');
assert.equal(keyboardFixture.list.children.every(item => item.getAttribute('role') === 'option'), true);
assert.equal(keyboardFixture.list.children.every(item => item.getAttribute('aria-selected') === 'false'), true);
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false);
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'true', 'rendered suggestions expose expanded state');

let keyEvent = keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown' });
assert.equal(keyEvent.defaultPrevented, true, 'ArrowDown prevents cursor movement when suggestions are available');
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-0');
assert.equal(keyboardFixture.list.children[0].getAttribute('aria-selected'), 'true');
assert.deepEqual(keyboardFixture.list.children[0].scrollCalls, [{ block: 'nearest' }]);

keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown' });
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-1', 'ArrowDown advances');
assert.equal(keyboardFixture.list.children[0].getAttribute('aria-selected'), 'false');
assert.equal(keyboardFixture.list.children[1].getAttribute('aria-selected'), 'true');
keyboardFixture.input.dispatch('keydown', { key: 'ArrowUp' });
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-0', 'ArrowUp retreats');
keyboardFixture.input.dispatch('keydown', { key: 'ArrowUp' });
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-4', 'ArrowUp wraps before the first item');
keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown' });
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-0', 'ArrowDown wraps after the last item');

keyEvent = keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown', isComposing: true });
assert.equal(keyEvent.defaultPrevented, false, 'composition keystrokes are left to the input method');
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-0');

keyboardFixture.input.value = 'me';
keyboardFixture.input.dispatch('input');
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false, 'new input resets stale active state');
keyboardFixture.input.dispatch('keydown', { key: 'ArrowUp' });
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-1', 'initial ArrowUp selects the last item');
keyEvent = keyboardFixture.input.dispatch('keydown', { key: 'Escape' });
assert.equal(keyEvent.defaultPrevented, true, 'Escape consumes the key while the list is visible');
assert.equal(keyboardFixture.list.classList.contains('hidden'), true, 'Escape dismisses suggestions');
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'false', 'Escape exposes collapsed state');
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false, 'Escape clears active descendant');
assert.deepEqual(keyboardFixture.autocomplete.getSuggestions(), []);
assert.equal(keyboardFixture.input.dispatch('keydown', { key: 'Escape' }).defaultPrevented, false, 'Escape is untouched when dismissed');

let keyboardSelection;
keyboardFixture.events.on('autocomplete:select', payload => { keyboardSelection = payload; });
keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown' });
assert.equal(keyboardFixture.list.classList.contains('hidden'), false, 'Arrow navigation can reopen matches for the current query');
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'true', 'reopened suggestions expose expanded state');
assert.equal(keyboardFixture.input.getAttribute('aria-activedescendant'), 'autocomplete-option-0');
keyEvent = keyboardFixture.input.dispatch('keydown', { key: 'Enter' });
assert.equal(keyEvent.defaultPrevented, true, 'Enter consumes the key when an item is active');
assert.equal(keyboardFixture.input.value, 'Cameroon', 'Enter selects the active suggestion');
assert.strictEqual(keyboardSelection.country, sampleCountries[2]);
assert.equal(keyboardFixture.list.classList.contains('hidden'), true);
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'false', 'selection collapses the suggestion state');
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false);
assert.equal(keyboardFixture.input.dispatch('keydown', { key: 'Enter' }).defaultPrevented, false, 'Enter is untouched without an active suggestion');

keyboardFixture.input.value = 'zz';
keyEvent = keyboardFixture.input.dispatch('keydown', { key: 'ArrowDown' });
assert.equal(keyEvent.defaultPrevented, false, 'Arrow keys retain native behavior when there are no suggestions');
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'false', 'no-match queries remain collapsed');
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false);
keyboardFixture.autocomplete.dispose();
assert.equal((keyboardFixture.input.listeners.get('keydown') ?? []).length, 0, 'dispose removes the keyboard subscription');
assert.equal(keyboardFixture.input.getAttribute('aria-expanded'), 'false', 'dispose leaves the combobox collapsed');
assert.equal(keyboardFixture.input.hasAttribute('aria-activedescendant'), false, 'dispose clears active descendant state');

const { autocomplete, events, input, list } = createFixture(sampleCountries);
input.value = 'c';
input.dispatch('input');
assert.equal(list.children.length, 0, 'input subscriptions keep suggestions hidden before two characters');
assert.equal(list.classList.contains('hidden'), true);

input.value = 'CA';
input.dispatch('input');
assert.deepEqual(
  list.children.map(item => item.textContent),
  ['Canada', 'Cambodia', 'Cameroon', 'Cape Verde', 'Central African Republic'],
  'two characters render at most five matching country names'
);
assert.equal(list.classList.contains('hidden'), false, 'the suggestion list becomes visible');
assert.equal(list.children.every(item => item.className === 'autocomplete-item'), true);
let selectedPayload;
events.on('autocomplete:select', payload => { selectedPayload = payload; });
list.children[1].dispatch('click');
assert.equal(input.value, 'Cambodia', 'clicking a suggestion fills the answer field');
assert.strictEqual(selectedPayload.country, sampleCountries[1], 'selection emits the minimal country record');
assert.deepEqual(autocomplete.getSuggestions(), [], 'selection dismisses current suggestions');
assert.equal(list.children.length, 0);
assert.equal(list.classList.contains('hidden'), true);

input.value = 'me';
input.dispatch('input');
assert.equal(list.children.length, 2, 'later input events refresh suggestions');
autocomplete.dispose();
assert.equal((input.listeners.get('input') ?? []).length, 0, 'dispose removes the input subscription');
assert.equal(list.children.length, 0, 'dispose clears rendered suggestions');
input.value = 'ca';
input.dispatch('input');
assert.equal(list.children.length, 0, 'disposed autocomplete no longer reacts to input');
autocomplete.dispose();

assert.throws(
  () => createAutocomplete({ document: {}, input, list, countryIndex: sampleCountries, events }),
  TypeError,
  'invalid document dependencies are rejected'
);
assert.throws(
  () => createAutocomplete({ document: input.ownerDocument, input: {}, list, countryIndex: sampleCountries, events }),
  TypeError,
  'invalid input dependencies are rejected'
);

console.log('autocomplete suggestion unit tests passed');
