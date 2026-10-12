import assert from 'node:assert/strict';
import test from 'node:test';

function installStubs() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); }
  };
  let clock = new Date(2026, 8, 6, 12, 0, 0).getTime(); // 2026-09-06
  const realNow = Date.now;
  Date.now = () => clock;
  return {
    advanceDays(days) { clock += days * 24 * 60 * 60 * 1000; },
    restore() { Date.now = realNow; }
  };
}

const clock = installStubs();
const worldle = (await import('../daily-worldle.js')).default;

// Mock country cards
const mockCards = [
  { id: 1, name: 'United States', continent: 'North America', latitude: 38, longitude: -97 },
  { id: 2, name: 'Canada', continent: 'North America', latitude: 56, longitude: -106 },
  { id: 3, name: 'France', continent: 'Europe', latitude: 46, longitude: 2 },
  { id: 4, name: 'Japan', continent: 'Asia', latitude: 36, longitude: 138 },
  { id: 5, name: 'Brazil', continent: 'South America', latitude: -14, longitude: -51 }
];

// Mock Geography API
const mockGeography = {
  hintBetween(from, to) {
    return {
      distanceKm: 6000,
      displayDistance: '6,000 km',
      bearingDegrees: 45,
      direction: 'NE',
      directionLabel: 'northeast',
      arrow: '↗'
    };
  }
};

test('selectDailyTarget is deterministic on the same date', () => {
  const target1 = worldle.selectDailyTarget(mockCards, '2026-09-06');
  const target2 = worldle.selectDailyTarget(mockCards, '2026-09-06');
  assert.deepEqual(target1, target2);
  assert.ok(target1 && target1.name);

  const targetNextDay = worldle.selectDailyTarget(mockCards, '2026-09-07');
  // It's a seeded selection across 5 items, so across days it should select based on seed
  assert.ok(targetNextDay && targetNextDay.name);
});

test('calculateProximityPercent correctly translates distance to percentage', () => {
  assert.equal(worldle.calculateProximityPercent(0), 100);
  assert.equal(worldle.calculateProximityPercent(20015), 0);
  assert.ok(worldle.calculateProximityPercent(5000) > 70);
});

test('evaluateGuess gives correct outcome on exact match and proximity on miss', () => {
  const target = mockCards[0];
  const guessCorrect = worldle.evaluateGuess(mockCards[0], target, mockGeography);
  assert.equal(guessCorrect.correct, true);
  assert.equal(guessCorrect.distanceKm, 0);
  assert.equal(guessCorrect.proximityPercent, 100);
  assert.equal(guessCorrect.arrow, '✓');

  const guessWrong = worldle.evaluateGuess(mockCards[2], target, mockGeography);
  assert.equal(guessWrong.correct, false);
  assert.equal(guessWrong.distanceKm, 6000);
  assert.equal(guessWrong.arrow, '↗');
  assert.ok(guessWrong.proximityPercent > 0 && guessWrong.proximityPercent < 100);
});

test('submitGuess manages 6 guesses, win condition, and statistics', () => {
  worldle.reset();
  const game1 = worldle.getDailyGame(mockCards);
  assert.equal(game1.completed, false);
  assert.equal(game1.guesses.length, 0);

  const target = game1.target;
  const wrongCard = mockCards.find(c => c.id !== target.id);

  // Submit wrong guess
  const res1 = worldle.submitGuess(wrongCard, mockCards, mockGeography);
  assert.equal(res1.justCompleted, false);
  assert.equal(res1.game.guesses.length, 1);
  assert.equal(res1.evalResult.correct, false);

  // Submit winning guess
  const resWin = worldle.submitGuess(target, mockCards, mockGeography);
  assert.equal(resWin.justCompleted, true);
  assert.equal(resWin.won, true);
  assert.equal(resWin.game.completed, true);
  assert.equal(resWin.game.guesses.length, 2);

  const stats = worldle.getStats();
  assert.equal(stats.played, 1);
  assert.equal(stats.won, 1);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.guessDistribution[2], 1);

  // Share grid generator
  const shareText = worldle.generateShareEmojiGrid(resWin.game);
  assert.ok(shareText.includes('EARTHLING Daily #'));
  assert.ok(shareText.includes('2/6'));
  assert.ok(shareText.includes('🟩🟩🟩🟩🟩 🎯'));
});

test('consecutive day wins increment streak; loss resets current streak', () => {
  worldle.reset();
  const gameDay1 = worldle.getDailyGame(mockCards);
  worldle.submitGuess(gameDay1.target, mockCards, mockGeography);
  assert.equal(worldle.getStats().currentStreak, 1);

  // Advance 1 day
  clock.advanceDays(1);
  const gameDay2 = worldle.getDailyGame(mockCards);
  worldle.submitGuess(gameDay2.target, mockCards, mockGeography);
  assert.equal(worldle.getStats().currentStreak, 2);
  assert.equal(worldle.getStats().maxStreak, 2);

  // Advance 1 day and lose (6 wrong guesses)
  clock.advanceDays(1);
  const gameDay3 = worldle.getDailyGame(mockCards);
  const wrongCards = mockCards.filter(c => c.id !== gameDay3.target.id);
  for (let i = 0; i < 6; i++) {
    const cardToGuess = wrongCards[i % wrongCards.length];
    // Modify id slightly to avoid duplicate check in test
    worldle.submitGuess({ ...cardToGuess, id: 100 + i }, mockCards, mockGeography);
  }
  const gameDay3After = worldle.getDailyGame(mockCards);
  assert.equal(gameDay3After.completed, true);
  assert.equal(gameDay3After.won, false);
  assert.equal(worldle.getStats().currentStreak, 0);
  assert.equal(worldle.getStats().maxStreak, 2);
});

test.after(() => clock.restore());
