import eventBus from '../../core/events.js';
import { getIndex } from '../../data/index.js';

export const MIN_QUERY_LENGTH = 2;
export const MAX_SUGGESTIONS = 5;

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('en') : '';
}

/** Return matching minimal-index records in index order. */
export function getCountrySuggestions(query, countryIndex = getIndex()) {
  if (!Array.isArray(countryIndex)) {
    throw new TypeError('Autocomplete countryIndex must be an array');
  }

  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) return [];

  return countryIndex
    .filter(country => country && typeof country.name === 'string' &&
      normalize(country.name).includes(normalizedQuery))
    .slice(0, MAX_SUGGESTIONS);
}

/** Bind suggestion rendering and pointer selection to an answer field. */
export function createAutocomplete(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  const input = options.input ?? documentRef?.getElementById?.('answer-input');
  const list = options.list ?? documentRef?.getElementById?.('autocomplete-list');
  const countryIndex = options.countryIndex ?? getIndex();
  const events = options.events ?? eventBus;
  const panel = typeof list?.closest === 'function' ? list.closest('.answer-interaction-panel') : null;

  if (!input || typeof input.addEventListener !== 'function' ||
      typeof input.removeEventListener !== 'function') {
    throw new TypeError('Autocomplete input must support DOM events');
  }
  if (!list || typeof list.replaceChildren !== 'function' ||
      typeof list.appendChild !== 'function' || !list.classList) {
    throw new TypeError('Autocomplete list must be a DOM element');
  }
  if (!documentRef || typeof documentRef.createElement !== 'function') {
    throw new TypeError('Autocomplete document must provide createElement()');
  }
  if (!events || typeof events.emit !== 'function') {
    throw new TypeError('Autocomplete events must provide emit()');
  }

  const listId = typeof list.id === 'string' && list.id.trim()
    ? list.id
    : 'autocomplete-list';
  list.id = listId;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listId);

  let suggestions = [];
  let renderedOptions = [];
  let activeIndex = -1;
  let disposed = false;

  function setListVisibility(visible) {
    list.classList.toggle('hidden', !visible);
    panel?.classList.toggle('has-autocomplete', visible);
    input.setAttribute('aria-expanded', String(visible));
  }

  function dismiss() {
    suggestions = [];
    renderedOptions = [];
    activeIndex = -1;
    list.replaceChildren();
    setListVisibility(false);
    input.removeAttribute('aria-activedescendant');
  }

  function select(country) {
    if (!country || !suggestions.includes(country)) return false;
    input.value = country.name;
    dismiss();
    events.emit('autocomplete:select', { country });
    return true;
  }

  function setActiveSuggestion(index) {
    if (suggestions.length === 0) return false;

    activeIndex = (index + suggestions.length) % suggestions.length;
    renderedOptions.forEach((option, optionIndex) => {
      const selected = optionIndex === activeIndex;
      option.setAttribute('aria-selected', String(selected));
      if (selected && typeof option.scrollIntoView === 'function') {
        option.scrollIntoView({ block: 'nearest' });
      }
    });
    input.setAttribute('aria-activedescendant', renderedOptions[activeIndex].id);
    return true;
  }

  function render() {
    if (disposed) return [];
    suggestions = getCountrySuggestions(input.value, countryIndex);
    renderedOptions = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');
    list.replaceChildren();

    suggestions.forEach((country, index) => {
      const suggestion = documentRef.createElement('button');
      suggestion.id = `autocomplete-option-${index}`;
      suggestion.type = 'button';
      suggestion.className = 'autocomplete-item';
      suggestion.textContent = country.name;
      suggestion.setAttribute('role', 'option');
      suggestion.setAttribute('aria-selected', 'false');
      suggestion.addEventListener('pointerdown', event => {
        event.preventDefault();
        select(country);
      });
      suggestion.addEventListener('click', () => select(country));
      renderedOptions.push(suggestion);
      list.appendChild(suggestion);
    });

    setListVisibility(suggestions.length > 0);
    return [...suggestions];
  }

  function handleKeydown(event) {
    if (disposed || event.isComposing) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (list.classList.contains('hidden') || suggestions.length === 0) render();
      if (suggestions.length === 0) return;

      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = activeIndex === -1
        ? (direction === 1 ? 0 : suggestions.length - 1)
        : activeIndex + direction;
      setActiveSuggestion(nextIndex);
      return;
    }

    if (event.key === 'Escape' && !list.classList.contains('hidden')) {
      event.preventDefault();
      dismiss();
      return;
    }

    if (event.key === 'Enter' && activeIndex !== -1 && suggestions.length > 0) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    }
  }

  function getSuggestions() {
    return [...suggestions];
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    input.removeEventListener('input', render);
    input.removeEventListener('keydown', handleKeydown);
    dismiss();
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', handleKeydown);
  dismiss();

  return Object.freeze({ render, dismiss, select, getSuggestions, dispose });
}

function createDefaultAutocomplete() {
  const documentRef = globalThis.document;
  const input = documentRef?.getElementById?.('answer-input');
  const list = documentRef?.getElementById?.('autocomplete-list');
  return input && list ? createAutocomplete({ document: documentRef, input, list }) : null;
}

export const autocomplete = createDefaultAutocomplete();
export default autocomplete;
