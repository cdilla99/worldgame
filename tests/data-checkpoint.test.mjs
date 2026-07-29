import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { countries } from '../src/data/index.js';
import loadChunk from '../src/data/loader.js';

const require = createRequire(import.meta.url);
const legacyCards = require('../data/countries.js');
const expectedChunkSizes = Object.freeze({
  Africa: 54,
  Asia: 48,
  Europe: 44,
  'North America': 23,
  'South America': 12,
  Oceania: 14
});

for (const [continent, expectedSize] of Object.entries(expectedChunkSizes)) {
  const chunk = await loadChunk(continent);
  assert.equal(chunk.length, expectedSize, `${continent} lazy-loads all expected countries`);
  assert.ok(chunk.every(country => country.continent === continent), `${continent} lazy-loads only its own records`);
  assert.ok(chunk.every(country => country.capital && country.silhouette_url), `${continent} lazy-loads complete records`);
  assert.strictEqual(await loadChunk(continent.replaceAll(' ', '_')), chunk, `${continent} lazy-load is cached`);
}

const autocompleteIndex = globalThis.GeoWars.data.getIndex();
assert.strictEqual(autocompleteIndex, countries, 'autocomplete facade returns the shared minimal index');
assert.ok(autocompleteIndex.every(country => Object.keys(country).length === 4), 'autocomplete index contains only minimal fields');
const suggestions = query => autocompleteIndex
  .map(country => country.name)
  .sort()
  .filter(name => name.toLowerCase().includes(query.trim().toLowerCase()))
  .slice(0, 5);
assert.deepEqual(suggestions('united'), ['United Arab Emirates', 'United Kingdom', 'United States'], 'autocomplete matches minimal-index names');
assert.ok(suggestions('cy').includes('Cyprus'), 'autocomplete includes countries supplied only by the complete 197-entry index');

const canonicalIndex = countries.slice(0, legacyCards.length);
const difficulties = ['all', 'easy', 'medium', 'hard', 'expert'];
const continents = ['all', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
const select = (records, difficulty, continent) => records.filter(country =>
  (difficulty === 'all' || country.difficulty === difficulty) &&
  (continent === 'all' || (continent === 'North America'
    ? country.continent === 'North America' || country.continent === 'South America'
    : country.continent === continent))
);
for (const difficulty of difficulties) {
  for (const continent of continents) {
    assert.deepEqual(
      select(legacyCards, difficulty, continent).map(country => country.id),
      select(canonicalIndex, difficulty, continent).map(country => country.id),
      `country selection remains aligned for ${difficulty}/${continent}`
    );
  }
}
assert.ok(select(legacyCards, 'medium', 'Europe').every(country => country.capital), 'game selection retains complete country records');

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
assert.match(appSource, /autocompleteCountryIndex\s*=\s*window\.GeoWars\?\.data\?\.getIndex\?\.\(\)\s*\|\|\s*countryCards/, 'app autocomplete consumes the minimal index with a compatibility fallback');
assert.match(appSource, /let cards = \[\.\.\.countryCards\]/, 'game deck selection continues to consume complete legacy records');

console.log('data extraction checkpoint tests passed (6 chunks, autocomplete index, 35 selection combinations)');