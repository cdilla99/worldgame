(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GeoWarsLearning = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  // Spaced-repetition learning store for country recognition.
  //
  // Each answered round feeds record(id, correct); the store keeps a lightweight
  // Leitner-style box per country and schedules the next review. app.js reads
  // this through window.GeoWarsLearning (guarded — the game runs fine without it)
  // to drive the "Learn all countries" progress panel and daily review deck.
  //
  // Persistence is device-local (localStorage 'geowars-learning'), matching the
  // guest-owned stats model. Nothing here touches Supabase or claimed profiles.

  const STORAGE_KEY = 'geowars-learning';
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Leitner box intervals in days. A correct answer promotes a country to the
  // next box (longer wait); a miss sends it back to box 0 (see again soon).
  const BOX_INTERVALS = [0, 1, 3, 7, 16, 40];
  // Reaching this box counts a country as "mastered" for the progress meter.
  const MASTERED_BOX = 4;

  function now() {
    return Date.now();
  }

  function getStore() {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  function readState() {
    const store = getStore();
    if (!store) return {};
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeState(state) {
    const store = getStore();
    if (!store) return false;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state || {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function normalizeId(id) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }

  // Record one answered round. Correct answers promote the country up a box and
  // push its next-due date out; misses reset it to the first box so it resurfaces
  // in the next review. Returns the updated per-country entry (or null on bad id).
  function record(id, correct) {
    const key = normalizeId(id);
    if (key === null) return null;

    const state = readState();
    const entry = state[key] || { box: 0, seen: 0, correct: 0, due: 0, last: 0 };

    entry.seen += 1;
    if (correct) {
      entry.correct += 1;
      entry.box = Math.min(entry.box + 1, BOX_INTERVALS.length - 1);
    } else {
      entry.box = 0;
    }
    entry.last = now();
    entry.due = entry.last + BOX_INTERVALS[entry.box] * DAY_MS;

    state[key] = entry;
    writeState(state);
    return entry;
  }

  // Pick up to `size` country ids to study next, restricted to the supplied
  // universe of ids. Ordering: countries already due (most overdue first), then
  // never-seen countries, so a review session reinforces weak spots before
  // introducing new material. Returns an array of numeric ids.
  function selectStudyBatch(ids, size) {
    const universe = Array.isArray(ids)
      ? ids.map(normalizeId).filter((id) => id !== null)
      : [];
    const limit = Number.isFinite(Number(size)) ? Math.max(0, Math.floor(Number(size))) : 0;
    if (!universe.length || !limit) return [];

    const state = readState();
    const currentTime = now();

    const due = [];
    const unseen = [];
    universe.forEach((id) => {
      const entry = state[id];
      if (!entry || !entry.seen) {
        unseen.push(id);
      } else if ((entry.due || 0) <= currentTime) {
        due.push({ id, due: entry.due || 0 });
      }
    });

    due.sort((a, b) => a.due - b.due); // most overdue first
    const ordered = due.map((item) => item.id).concat(unseen);
    return ordered.slice(0, limit);
  }

  // Summarize progress across the supplied universe of ids. `groupOf(id)` maps a
  // country to a bucket (e.g. its continent) for the per-region breakdown.
  // Returns counts app.js#renderLearningProgress renders directly.
  function getSummary(ids, options) {
    options = options || {};
    const groupOf = typeof options.groupOf === 'function' ? options.groupOf : null;
    const universe = Array.isArray(ids)
      ? ids.map(normalizeId).filter((id) => id !== null)
      : [];

    const state = readState();
    const currentTime = now();

    let seen = 0;
    let learning = 0;
    let mastered = 0;
    let dueCount = 0;
    const groups = {};

    universe.forEach((id) => {
      const entry = state[id];
      const isSeen = !!(entry && entry.seen);
      const isMastered = !!(entry && entry.box >= MASTERED_BOX);
      const isDue = isSeen && (entry.due || 0) <= currentTime;

      if (isSeen) seen += 1;
      if (isMastered) mastered += 1;
      else if (isSeen) learning += 1;
      if (isDue) dueCount += 1;

      if (groupOf) {
        const groupName = groupOf(id) || 'Other';
        if (!groups[groupName]) groups[groupName] = { total: 0, mastered: 0 };
        groups[groupName].total += 1;
        if (isMastered) groups[groupName].mastered += 1;
      }
    });

    return {
      total: universe.length,
      seen: seen,
      learning: learning,
      mastered: mastered,
      dueCount: dueCount,
      groups: groups
    };
  }

  // Clear all learning history. Device-local only.
  function reset() {
    const store = getStore();
    if (!store) return false;
    try {
      store.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    record: record,
    selectStudyBatch: selectStudyBatch,
    getSummary: getSummary,
    reset: reset,
    STORAGE_KEY: STORAGE_KEY,
    MASTERED_BOX: MASTERED_BOX
  };
}));
