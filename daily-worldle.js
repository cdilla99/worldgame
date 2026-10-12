(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GeoWarsDailyWorldle = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const STORAGE_KEY = 'geowars-daily-worldle';
  const MAX_GUESSES = 6;
  const MAX_EARTH_DISTANCE_KM = 20015; // Max half-circumference (antipodal distance)

  function now() {
    return Date.now();
  }

  function dayKey(timestamp) {
    const d = new Date(typeof timestamp === 'number' ? timestamp : now());
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function dayNumber(timestamp) {
    // Day count since epoch start (Jan 1, 2026)
    const start = new Date(2026, 0, 1).getTime();
    const current = typeof timestamp === 'number' ? timestamp : now();
    return Math.max(1, Math.floor((current - start) / (24 * 60 * 60 * 1000)) + 1);
  }

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

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

  // Pick deterministic target country card for the given day from the countries pool
  function selectDailyTarget(cards, targetDayKey) {
    const pool = Array.isArray(cards) ? cards.filter(c => c && Number.isFinite(Number(c.id))) : [];
    if (!pool.length) return null;
    const key = targetDayKey || dayKey();
    const rng = makeRng(hashSeed('worldle-target:' + key));
    const index = Math.floor(rng() * pool.length);
    return pool[index];
  }

  // Calculate percentage proximity (100% is exact match, 0% is antipodal)
  function calculateProximityPercent(distanceKm) {
    if (!Number.isFinite(distanceKm)) return 0;
    if (distanceKm <= 0) return 100;
    const pct = Math.max(0, Math.round(((MAX_EARTH_DISTANCE_KM - distanceKm) / MAX_EARTH_DISTANCE_KM) * 100));
    return Math.min(100, pct);
  }

  // Evaluate a guess against target using GeoWarsGeography
  function evaluateGuess(guessedCard, targetCard, geographyApi) {
    if (!guessedCard || !targetCard) return null;
    const isCorrect = Number(guessedCard.id) === Number(targetCard.id);

    if (isCorrect) {
      return {
        card: guessedCard,
        correct: true,
        distanceKm: 0,
        displayDistance: '0 km',
        bearingDegrees: 0,
        direction: '🎉',
        directionLabel: 'Exact match',
        arrow: '✓',
        proximityPercent: 100
      };
    }

    const geo = geographyApi || root.GeoWarsGeography;
    let hint = null;
    if (geo && typeof geo.hintBetween === 'function') {
      hint = geo.hintBetween(guessedCard, targetCard);
    }

    const dist = hint ? hint.distanceKm : 0;
    const proximity = calculateProximityPercent(dist);

    return {
      card: guessedCard,
      correct: false,
      distanceKm: dist,
      displayDistance: hint ? hint.displayDistance : `${Math.round(dist)} km`,
      bearingDegrees: hint ? hint.bearingDegrees : 0,
      direction: hint ? hint.direction : 'N',
      directionLabel: hint ? hint.directionLabel : '',
      arrow: hint ? hint.arrow : '↑',
      proximityPercent: proximity
    };
  }

  function getDailyGame(cards) {
    const today = dayKey();
    const state = readState();
    const dayHistory = state.days && state.days[today] ? state.days[today] : null;
    const target = selectDailyTarget(cards, today);

    return {
      dayKey: today,
      dayNumber: dayNumber(),
      target: target,
      guesses: dayHistory ? (dayHistory.guesses || []) : [],
      completed: dayHistory ? Boolean(dayHistory.completed) : false,
      won: dayHistory ? Boolean(dayHistory.won) : false,
      maxGuesses: MAX_GUESSES
    };
  }

  function submitGuess(guessedCard, cards, geographyApi) {
    if (!guessedCard) return { error: 'Invalid guess' };
    const today = dayKey();
    const target = selectDailyTarget(cards, today);
    if (!target) return { error: 'No target available' };

    const state = readState();
    state.days = state.days || {};
    const dayHistory = state.days[today] || {
      dayKey: today,
      targetId: target.id,
      guesses: [],
      completed: false,
      won: false
    };

    if (dayHistory.completed) {
      return { game: getDailyGame(cards), alreadyCompleted: true };
    }

    // Check if duplicate guess
    if (dayHistory.guesses.some(g => Number(g.card.id) === Number(guessedCard.id))) {
      return { game: getDailyGame(cards), duplicate: true };
    }

    const evalResult = evaluateGuess(guessedCard, target, geographyApi);
    dayHistory.guesses.push(evalResult);

    if (evalResult.correct) {
      dayHistory.completed = true;
      dayHistory.won = true;
    } else if (dayHistory.guesses.length >= MAX_GUESSES) {
      dayHistory.completed = true;
      dayHistory.won = false;
    }

    // Update streaks and statistics when game completes
    if (dayHistory.completed) {
      state.stats = state.stats || {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      };

      state.stats.played += 1;
      if (dayHistory.won) {
        state.stats.won += 1;
        const lastWinDay = state.lastWinDay;
        const yesterday = dayKey(now() - 24 * 60 * 60 * 1000);
        if (lastWinDay === yesterday) {
          state.stats.currentStreak += 1;
        } else {
          state.stats.currentStreak = 1;
        }
        state.stats.maxStreak = Math.max(state.stats.maxStreak, state.stats.currentStreak);
        state.lastWinDay = today;

        const guessCount = dayHistory.guesses.length;
        if (state.stats.guessDistribution[guessCount] !== undefined) {
          state.stats.guessDistribution[guessCount] += 1;
        }
      } else {
        state.stats.currentStreak = 0;
      }
    }

    state.days[today] = dayHistory;
    writeState(state);

    return {
      game: getDailyGame(cards),
      evalResult: evalResult,
      justCompleted: dayHistory.completed,
      won: dayHistory.won
    };
  }

  function getStats() {
    const state = readState();
    return state.stats || {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  }

  function generateShareEmojiGrid(game) {
    if (!game || !game.guesses) return '';
    const num = game.dayNumber || dayNumber();
    const scoreText = game.won ? `${game.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    const header = `EARTHLING Daily #${num} ${scoreText}`;

    const rows = game.guesses.map(g => {
      if (g.correct) {
        return '🟩🟩🟩🟩🟩 🎯';
      }
      const pct = g.proximityPercent || 0;
      const greenSquares = Math.round((pct / 100) * 5);
      const yellowSquares = 5 - greenSquares;
      const squares = '🟩'.repeat(greenSquares) + '⬛'.repeat(yellowSquares);
      return `${squares} ${g.arrow || ''}`;
    });

    return `${header}\n\n${rows.join('\n')}\n\nhttps://earthling.game`;
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
    dayKey: dayKey,
    dayNumber: dayNumber,
    selectDailyTarget: selectDailyTarget,
    calculateProximityPercent: calculateProximityPercent,
    evaluateGuess: evaluateGuess,
    getDailyGame: getDailyGame,
    submitGuess: submitGuess,
    getStats: getStats,
    generateShareEmojiGrid: generateShareEmojiGrid,
    reset: reset,
    STORAGE_KEY: STORAGE_KEY,
    MAX_GUESSES: MAX_GUESSES
  };
}));
