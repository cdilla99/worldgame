import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { countries } from '../src/data/index.js';

const require = createRequire(import.meta.url);
const ladder = require('../difficulty-ladder.js');
const syntheticPool = [
	{ id: 1, name: 'Alpha', continent: 'Europe', difficulty: 'easy' },
	{ id: 2, name: 'Bravo', continent: 'Asia', difficulty: 'easy' },
	{ id: 3, name: 'Charlie', continent: 'Europe', difficulty: 'medium' },
	{ id: 4, name: 'Delta', continent: 'Africa', difficulty: 'hard' },
	{ id: 5, name: 'Echo', continent: 'Europe', difficulty: 'expert' }
];

assert.deepEqual(ladder.LEVEL_ORDER, ['cadet', 'explorer', 'earthling', 'expert']);
assert.equal(ladder.getLevel('cadet').name, 'Cadet');
assert.ok(ladder.getLevel('cadet').allowedModes.includes('sprint'), 'cadet keeps Sprint available');
assert.equal(ladder.getLevel('cadet').showSprintTimer, true, 'cadet Sprint uses the timer');
assert.equal(ladder.getLevel('explorer').showSprintTimer, true, 'explorer Sprint uses the timer');
assert.equal(ladder.getLevel('earthling').showTypedAnswer, true);
assert.equal(ladder.getLevel('expert').showFlagHint, false);
assert.equal(ladder.getDefaultLevel(false), 'cadet');
assert.equal(ladder.getDefaultLevel(true), 'earthling');

const cadetDeck = ladder.buildLevelDeck('cadet', countries, 'all');
assert.ok(cadetDeck.length > 0, 'cadet level produces a playable deck');
assert.ok(cadetDeck.every(country => country.id >= 1 && country.id <= 25), 'cadet uses the curated beginner pool');

const cadetEuropeDeck = ladder.buildLevelDeck('cadet', syntheticPool, 'Europe');
assert.deepEqual(cadetEuropeDeck.map(country => country.name), ['Alpha', 'Charlie', 'Echo'], 'continent filters still apply to the level deck');

const expertDeck = ladder.buildLevelDeck('expert', countries, 'all');
assert.ok(expertDeck.length > 0, 'expert level produces a playable deck');
assert.ok(expertDeck.every(country => country.difficulty === 'hard' || country.difficulty === 'expert'), 'expert level narrows the pool to harder countries');

const sampleCard = syntheticPool[0];
const choiceSet = ladder.createChoices(sampleCard, syntheticPool, 4);
assert.equal(choiceSet.length, 4, 'choice generation respects the requested count');
assert.equal(choiceSet.filter(country => country.id === sampleCard.id).length, 1, 'the correct answer appears exactly once');
assert.equal(new Set(choiceSet.map(country => country.id)).size, choiceSet.length, 'choice generation does not duplicate countries');

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
assert.match(appSource, /state\.choices\[i\]\?\.id === state\.currentCard\.id/, 'choice feedback tolerates hidden unused option buttons');
assert.match(appSource, /function renderLocalSilhouette\(card\)/, 'remote silhouette failures use the bundled country geometry fallback');
assert.match(appSource, /renderLocalSilhouette\(card\)\.catch\(\(\) => handleSilhouetteAssetFailure\(card\)\)/, 'the recovery panel is shown only after the local fallback also fails');

console.log('difficulty ladder unit tests passed');
