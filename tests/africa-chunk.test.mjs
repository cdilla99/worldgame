import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import africaCountries, { africaCountries as namedExport } from '../src/data/chunks/Africa.js';

const requiredFields = [
  'capital', 'population_hint', 'area_hint', 'hemisphere', 'coastline_type',
  'neighbors', 'main_languages', 'currency', 'landmarks', 'fun_facts',
  'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
];

assert.strictEqual(africaCountries, namedExport, 'default and named exports reference the same chunk');
assert.equal(africaCountries.length, 54, 'Africa chunk contains all 54 canonical countries');
assert.ok(Object.isFrozen(africaCountries), 'Africa chunk array is immutable');
assert.equal(new Set(africaCountries.map(country => country.id)).size, 54, 'country IDs are unique within the chunk');
assert.equal(new Set(africaCountries.map(country => country.name)).size, 54, 'country names are unique within the chunk');

for (const country of africaCountries) {
  assert.equal(country.continent, 'Africa', `${country.name} belongs only to the Africa chunk`);
  assert.ok(Object.isFrozen(country), `${country.name} record is immutable`);
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(country, field), `${country.name} includes ${field}`);
    assert.notEqual(country[field], undefined, `${country.name}.${field} is defined`);
  }
  assert.match(country.silhouette_url, /^https:\/\/raw\.githubusercontent\.com\/djaiss\/mapsicon\/master\/all\/[a-z]{2}\/vector\.svg$/, `${country.name} has a canonical silhouette URL`);
}

const canonicalSource = await readFile(new URL('../data/countries.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${canonicalSource}; globalThis.cards = countryCards;`, context);
const canonicalAfrica = JSON.parse(JSON.stringify(context.cards.filter(country => country.continent === 'Africa')));
const extractedCanonicalFields = africaCountries.map(({ silhouette_url, ...country }) => country);
assert.deepEqual(extractedCanonicalFields, canonicalAfrica, 'chunk preserves canonical order, fields, and values');

console.log('Africa chunk unit tests passed');