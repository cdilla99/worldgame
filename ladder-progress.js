(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GeoWarsLadderProgress = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const STORAGE_KEY = 'geowars-level-progress';

  function readProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress || {}));
      return true;
    } catch {
      return false;
    }
  }

  function getLastLevel() {
    const progress = readProgress();
    return typeof progress.lastLevel === 'string' ? progress.lastLevel : null;
  }

  function setLastLevel(levelId) {
    const progress = readProgress();
    progress.lastLevel = levelId;
    writeProgress(progress);
    return levelId;
  }

  function recordRun(levelId, result) {
    const progress = readProgress();
    progress.lastLevel = levelId;
    progress[levelId] = {
      ...(progress[levelId] || {}),
      lastRunAt: new Date().toISOString(),
      lastScore: result && typeof result.score === 'number' ? result.score : 0,
      bestStreak: result && typeof result.bestStreak === 'number' ? result.bestStreak : 0,
      correct: result && typeof result.correct === 'number' ? result.correct : 0,
      total: result && typeof result.total === 'number' ? result.total : 0,
      mode: result && typeof result.mode === 'string' ? result.mode : 'showoff'
    };
    writeProgress(progress);
    return progress[levelId];
  }

  function getLevelSummary(levelId) {
    const progress = readProgress();
    return progress[levelId] || null;
  }

  return Object.freeze({
    STORAGE_KEY,
    readProgress,
    writeProgress,
    getLastLevel,
    setLastLevel,
    recordRun,
    getLevelSummary
  });
}));
