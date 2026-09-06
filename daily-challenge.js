(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GeoWarsDaily = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  // Daily challenge: a deterministic country set that is the same for every
  // player on a given calendar day, plus a completion streak. app.js reads this
  // through window.GeoWarsDaily (guarded) to launch the challenge and to label
  // the daily button with streak state.
  //
  // Determinism comes from seeding a small PRNG with today's date, so no network
  // or shared state is needed — every device computes the same set independently.
  // Persistence is device-local (localStorage 'geowars-daily'); no Supabase.

  const STORAGE_KEY = 'geowars-daily';
  const DAY_MS = 24 * 60 * 60 * 1000;

  function now() {
    return Date.now();
  }

  // Local calendar day key, e.g. "2026-09-06". Uses local time so "today" matches
  // the player's wall clock rather than UTC.
  function dayKey(timestamp) {
    const d = new Date(typeof timestamp === 'number' ? timestamp : now());
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  // Turn a string into a 32-bit seed (xfnv1a-style hash).
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Mulberry32: tiny, fast, deterministic PRNG. Returns a function yielding
  // floats in [0, 1).
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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

  // Deterministic daily set: seed a shuffle with today's date so the order (and
  // therefore the first `size` picks) is stable for the whole day, everywhere.
  function selectDailySet(ids, size) {
    const pool = Array.isArray(ids)
      ? ids.map(Number).filter((n) => Number.isFinite(n))
      : [];
    const limit = Number.isFinite(Number(size)) ? Math.max(0, Math.floor(Number(size))) : 0;
    if (!pool.length || !limit) return [];

    const rng = makeRng(hashSeed('daily:' + dayKey()));
    // Seeded Fisher-Yates over a copy.
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled.slice(0, Math.min(limit, shuffled.length));
  }

  function isCompletedToday() {
    const state = readState();
    return state.lastCompletedDay === dayKey();
  }

  // { streak } — consecutive calendar days completed, counting today or (if today
  // is not yet done) the run ending yesterday. Returns 0 when the streak lapsed.
  function getStreak() {
    const state = readState();
    const streak = Number(state.streak) || 0;
    const last = state.lastCompletedDay;
    if (!last) return { streak: 0 };

    const today = dayKey();
    const yesterday = dayKey(now() - DAY_MS);
    // A streak is still "live" only if the last completion was today or yesterday.
    if (last === today || last === yesterday) return { streak: streak };
    return { streak: 0 };
  }

  // Mark today's challenge complete and advance the streak. Completing again on
  // the same day is idempotent (streak does not double-count). Returns the new
  // streak state.
  function recordCompletion(result) {
    const state = readState();
    const today = dayKey();

    if (state.lastCompletedDay === today) {
      // Already recorded today; keep the streak, refresh the best result.
      state.lastResult = summarizeResult(result, state.lastResult);
      writeState(state);
      return { streak: Number(state.streak) || 0, alreadyDone: true };
    }

    const yesterday = dayKey(now() - DAY_MS);
    const previousStreak = Number(state.streak) || 0;
    state.streak = state.lastCompletedDay === yesterday ? previousStreak + 1 : 1;
    state.lastCompletedDay = today;
    state.bestStreak = Math.max(Number(state.bestStreak) || 0, state.streak);
    state.lastResult = summarizeResult(result, null);

    writeState(state);
    return { streak: state.streak, alreadyDone: false };
  }

  function summarizeResult(result, previous) {
    if (!result || typeof result !== 'object') return previous || null;
    return {
      score: Number(result.score) || 0,
      correct: Number(result.correct) || 0,
      total: Number(result.total) || 0,
      day: dayKey()
    };
  }

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
    selectDailySet: selectDailySet,
    isCompletedToday: isCompletedToday,
    getStreak: getStreak,
    recordCompletion: recordCompletion,
    reset: reset,
    STORAGE_KEY: STORAGE_KEY
  };
}));
