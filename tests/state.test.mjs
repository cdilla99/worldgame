import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.NODE_ENV = 'development';
const source = await readFile(new URL('../src/core/state.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const store = await import(moduleUrl);

const expectedKeys = [
  'mode', 'difficulty', 'continent', 'deck', 'currentCard', 'score', 'streak',
  'bestStreak', 'timeRemaining', 'timerPaused', 'hintsUsed', 'roundHistory',
  'player', 'isOnline'
];
assert.deepEqual(Object.keys(store.state), expectedKeys, 'state exposes the required properties');

const firstSnapshot = store.getState();
assert.notStrictEqual(firstSnapshot, store.state, 'getState returns a snapshot');
assert.equal(firstSnapshot.mode, 'sprint');
assert.equal(firstSnapshot.timeRemaining, 60);

let emitted;
const unsubscribe = store.onStateChange((updates, state) => { emitted = { updates, state }; });
const suppliedDeck = [{ id: 1, name: 'Testland' }];
const updated = store.setState({ score: 12, streak: 2, deck: suppliedDeck });
assert.equal(store.state.score, 12, 'setState updates the singleton state');
assert.equal(updated.streak, 2, 'setState returns the updated snapshot');
assert.deepEqual(emitted.updates, { score: 12, streak: 2, deck: suppliedDeck });
assert.equal(emitted.state.score, 12, 'setState emits the updated state');

assert.throws(() => { store.state.score = 99; }, TypeError, 'state cannot be assigned directly');
assert.throws(() => { updated.deck.push({ id: 2 }); }, TypeError, 'development snapshots are deeply frozen');
suppliedDeck[0].name = 'Changed externally';
assert.equal(store.getState().deck[0].name, 'Testland', 'updates are detached from caller objects');
unsubscribe();
assert.throws(() => store.setState(null), TypeError, 'invalid updates are rejected');

console.log('state unit tests passed');
