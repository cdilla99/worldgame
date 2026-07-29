import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const legacyCards = require('../data/countries.js');
const facade = globalThis.GeoWars.data;

assert.ok(Array.isArray(legacyCards), 'the historical CommonJS export remains an array');
assert.strictEqual(legacyCards, globalThis.countryCards, 'the historical global uses the same array');
assert.equal(legacyCards.length, 195, 'the complete legacy card collection is unchanged');
assert.strictEqual(facade.countryCards, legacyCards, 'the facade preserves full legacy records');
assert.strictEqual(globalThis.GeoWars.Data, facade, 'the namespaced compatibility alias is stable');
assert.strictEqual(globalThis.GeoWarsData, facade, 'the legacy-style compatibility alias is stable');
assert.strictEqual(legacyCards.getIndex, facade.getIndex, 'CommonJS consumers can access facade functions');
assert.deepEqual(Object.keys(legacyCards), Array.from({ length: 195 }, (_, i) => String(i)), 'facade members do not alter array enumeration');

const index = facade.getIndex();
assert.ok(Array.isArray(index), 'index access is synchronous');
assert.strictEqual(facade.getIndex(), index, 'synchronous index identity is stable');
assert.strictEqual(facade.countries, index, 'countries exposes the synchronous index');
assert.equal(index.length, 197, 'the facade exposes the complete modular index');
assert.deepEqual(index.at(-2), { id: 196, name: 'Cyprus', continent: 'Europe', difficulty: 'hard' });
assert.deepEqual(index.at(-1), { id: 197, name: 'Palestine', continent: 'Asia', difficulty: 'hard' });
assert.ok(facade.filterIndex({ continent: 'Africa' }).every(country => country.continent === 'Africa'));
assert.strictEqual(facade.findCountryByName('  united STATES '), index[0]);
assert.throws(() => facade.filterIndex(null), TypeError);

const unitedStates = await facade.getCountry(1);
assert.equal(unitedStates.capital, 'Washington, D.C.', 'full lookup delegates to the modular API');
const southAmerica = await facade.getContinentCountries('South_America');
assert.equal(southAmerica.length, 12, 'continent lookup delegates to the modular API');
assert.strictEqual(await facade.loadChunk('south america'), southAmerica, 'chunk loading delegates to the cached modular loader');
assert.strictEqual(globalThis.GeoWars.data, facade, 'modular imports do not replace the published facade');
assert.strictEqual(globalThis.countryCards, legacyCards, 'modular imports do not replace the legacy global');

console.log('countries facade compatibility tests passed');
