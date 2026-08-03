import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  }
};

const require = createRequire(import.meta.url);
const progress = require('../ladder-progress.js');

assert.equal(progress.getLastLevel(), null);
progress.setLastLevel('explorer');
assert.equal(progress.getLastLevel(), 'explorer');

const summary = progress.recordRun('earthling', {
  score: 480,
  bestStreak: 5,
  correct: 9,
  total: 10,
  mode: 'sprint'
});

assert.equal(summary.lastScore, 480);
assert.equal(summary.bestStreak, 5);
assert.equal(summary.correct, 9);
assert.equal(summary.total, 10);
assert.equal(summary.mode, 'sprint');
assert.equal(progress.getLevelSummary('earthling').lastScore, 480);
assert.equal(progress.readProgress().lastLevel, 'earthling');

console.log('ladder progress unit tests passed');
