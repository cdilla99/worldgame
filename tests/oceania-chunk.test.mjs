import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const canonicalSource = await readFile(new URL('../data/countries.js', import.meta.url), 'utf8');
const chunkSource = await readFile(new URL('../src/data/chunks/Oceania.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${canonicalSource}; globalThis.countryCards = countryCards;`, context);
vm.runInContext(chunkSource
  .replace("import '../../../data/countries.js';", '')
  .replace('export const oceaniaCountries', 'const oceaniaCountries')
  .replace('export default oceaniaCountries;', 'globalThis.defaultExport = oceaniaCountries; globalThis.namedExport = oceaniaCountries;'), context);

const oceaniaCountries = context.defaultExport;
const canonicalOceania = JSON.parse(JSON.stringify(context.countryCards.filter(country => country.continent === 'Oceania')));
const requiredFields = [
  'id', 'name', 'difficulty', 'stars', 'continent', 'subregion', 'capital', 'population_hint',
  'size_category', 'area_hint', 'hemisphere', 'coastline_type', 'neighbors', 'main_languages',
  'currency', 'landmarks', 'fun_facts', 'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
];
const normalize = value => JSON.parse(JSON.stringify(value));

assert.strictEqual(oceaniaCountries, context.namedExport, 'default and named exports reference the same chunk');
assert.equal(oceaniaCountries.length, 14, 'Oceania chunk contains all 14 countries');
assert.ok(Object.isFrozen(oceaniaCountries), 'Oceania chunk array is immutable');
assert.deepEqual(normalize(oceaniaCountries.map(country => country.id)), canonicalOceania.map(country => country.id), 'canonical ordering is preserved');
assert.equal(new Set(oceaniaCountries.map(country => country.id)).size, 14, 'country IDs are unique');
assert.equal(new Set(oceaniaCountries.map(country => country.name)).size, 14, 'country names are unique');

for (const [index, country] of oceaniaCountries.entries()) {
  assert.ok(Object.isFrozen(country), `${country.name} record is immutable`);
  assert.equal(country.continent, 'Oceania', `${country.name} is classified as Oceania`);
  for (const field of requiredFields) assert.ok(Object.hasOwn(country, field), `${country.name} includes ${field}`);
  for (const [field, value] of Object.entries(canonicalOceania[index])) {
    assert.deepEqual(normalize(country[field]), value, `${country.name} preserves canonical ${field}`);
  }
  assert.match(country.silhouette_url, /^https:\/\/raw\.githubusercontent\.com\/djaiss\/mapsicon\/master\/all\/[a-z]{2}\/vector\.svg$/, `${country.name} has a flag-derived silhouette URL`);
}

console.log('Oceania chunk unit tests passed');
