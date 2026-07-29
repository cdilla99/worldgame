import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import asiaCountries, { asiaCountries as namedExport } from '../src/data/chunks/Asia.js';
import { countries } from '../src/data/index.js';

const requiredFields = [
  'capital', 'population_hint', 'area_hint', 'hemisphere', 'coastline_type',
  'neighbors', 'main_languages', 'currency', 'landmarks', 'fun_facts',
  'built_in_clue', 'nearby_country_clue', 'flag', 'silhouette_url'
];

assert.strictEqual(asiaCountries, namedExport, 'default and named exports reference the same chunk');
assert.equal(asiaCountries.length, 48, 'Asia chunk contains all 48 canonical countries');
assert.ok(Object.isFrozen(asiaCountries), 'Asia chunk array is immutable');
assert.equal(new Set(asiaCountries.map(country => country.id)).size, 48, 'country IDs are unique within the chunk');
assert.equal(new Set(asiaCountries.map(country => country.name)).size, 48, 'country names are unique within the chunk');

for (const country of asiaCountries) {
  assert.equal(country.continent, 'Asia', `${country.name} belongs to the Asia chunk`);
  assert.ok(Object.isFrozen(country), `${country.name} record is immutable`);
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(country, field), `${country.name} includes ${field}`);
    assert.notEqual(country[field], undefined, `${country.name}.${field} is defined`);
  }
  assert.match(country.silhouette_url, /^https:\/\/raw\.githubusercontent\.com\/djaiss\/mapsicon\/master\/all\/[a-z]{2}\/vector\.svg$/, `${country.name} has a canonical silhouette URL`);
}

const russia = asiaCountries.find(country => country.name === 'Russia');
assert.ok(russia, 'Russia is included in the Asia chunk');
assert.equal(russia.continent, 'Asia', 'Russia uses its required primary Asia classification');

const canonicalSource = await readFile(new URL('../data/countries.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${canonicalSource}; globalThis.cards = countryCards;`, context);
const canonicalAsia = JSON.parse(JSON.stringify(context.cards.filter(country => country.continent === 'Asia')));
const extractedCanonicalFields = asiaCountries.map(({ silhouette_url, ...country }) => country);
assert.deepEqual(extractedCanonicalFields, canonicalAsia, 'chunk preserves canonical order, fields, and values');

const indexedCanonicalAsia = countries.slice(0, 195).filter(country => country.continent === 'Asia');
assert.deepEqual(
  asiaCountries.map(({ id, name, continent, difficulty }) => ({ id, name, continent, difficulty })),
  indexedCanonicalAsia,
  'the chunk and canonical portion of the minimal index use the same 48-country classification'
);

console.log('Asia chunk unit tests passed');
