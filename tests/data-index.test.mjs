import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { countries, getIndex, filterIndex, findCountryByName } from '../src/data/index.js';

assert.equal(countries.length, 197, 'the synchronous index contains all 197 countries');
assert.strictEqual(getIndex(), countries, 'getIndex returns the exported synchronous array');
assert.ok(Object.isFrozen(countries), 'the shared index cannot be structurally mutated');

const allowedKeys = ['continent', 'difficulty', 'id', 'name'];
for (const country of countries) {
  assert.deepEqual(Object.keys(country).sort(), allowedKeys, `${country.name} contains only minimal index fields`);
  assert.ok(Object.isFrozen(country), `${country.name} cannot be mutated through the shared index`);
}
assert.equal(new Set(countries.map(country => country.id)).size, 197, 'country IDs are unique');
assert.equal(new Set(countries.map(country => country.name)).size, 197, 'country names are unique');
assert.deepEqual(countries.map(country => country.id), Array.from({ length: 197 }, (_, index) => index + 1), 'country IDs are contiguous');

const canonicalSource = await readFile(new URL('../data/countries.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${canonicalSource}; globalThis.cards = countryCards;`, context);
const canonicalMinimal = JSON.parse(JSON.stringify(
  context.cards.map(({ id, name, continent, difficulty }) => ({ id, name, continent, difficulty }))
));
assert.deepEqual(countries.slice(0, 195), canonicalMinimal, 'the existing 195 country records preserve canonical order and fields');
assert.deepEqual(countries.slice(195), [
  { id: 196, name: 'Cyprus', continent: 'Europe', difficulty: 'hard' },
  { id: 197, name: 'Palestine', continent: 'Asia', difficulty: 'hard' }
], 'the 197-country index includes Cyprus and Palestine');

const asia = filterIndex(country => country.continent === 'Asia');
assert.ok(asia.length > 0 && asia.every(country => country.continent === 'Asia'), 'callback predicates filter by continent');
const hardEurope = filterIndex({ continent: 'Europe', difficulty: 'hard' });
assert.ok(hardEurope.length > 0 && hardEurope.every(country => country.continent === 'Europe' && country.difficulty === 'hard'), 'filter objects combine continent and difficulty');
assert.equal(filterIndex({ continent: 'Atlantis' }).length, 0, 'unknown filter values return an empty result');
assert.throws(() => filterIndex(null), TypeError, 'invalid predicates are rejected');

assert.strictEqual(findCountryByName('  united STATES '), countries[0], 'name lookup is trimmed and case-insensitive');
assert.equal(findCountryByName('not a country'), undefined, 'unknown names have no result');
assert.equal(findCountryByName('   '), undefined, 'empty names have no result');
assert.equal(findCountryByName(null), undefined, 'non-string names have no result');

console.log('country index unit tests passed');
