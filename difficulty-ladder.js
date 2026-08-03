(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GeoWarsDifficulty = api;
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  const CADet_POOL_IDS = Object.freeze([
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10,
    11, 12, 13, 14, 15,
    16, 17, 18, 19, 20,
    21, 22, 23, 24, 25
  ]);

  const LEVEL_ORDER = Object.freeze(['cadet', 'explorer', 'earthling', 'expert']);

  const LEVELS = Object.freeze({
    cadet: Object.freeze({
      id: 'cadet',
      name: 'Cadet',
      recommendation: 'Start with familiar countries, multiple-choice answers and helpful clues.',
      description: 'Start with familiar countries, multiple-choice answers and helpful clues.',
      answerFormat: '4-choice multiple choice',
      timerStatus: '60-second sprint available',
      hintStatus: 'Optional visual hint',
      difficultyLabel: 'Gentle',
      recommended: true,
      defaultMode: 'showoff',
      allowedModes: Object.freeze(['showoff', 'sprint']),
      choiceCount: 4,
      promptRegion: true,
      showRegionHint: true,
      showFlagHint: true,
      showAnswerMap: true,
      showTypedAnswer: false,
      showSprintTimer: true,
      streakPenalty: 0,
      answerLabel: 'Pick the country',
      poolKind: 'curated',
      poolIds: CADet_POOL_IDS
    }),
    explorer: Object.freeze({
      id: 'explorer',
      name: 'Explorer',
      recommendation: 'Explore more of the world with fewer clues.',
      description: 'Explore more of the world with fewer clues.',
      answerFormat: '4-choice multiple choice',
      timerStatus: '60-second sprint available',
      hintStatus: 'Reduced hints',
      difficultyLabel: 'Moderate',
      recommended: false,
      defaultMode: 'showoff',
      allowedModes: Object.freeze(['showoff', 'sprint']),
      choiceCount: 4,
      promptRegion: true,
      showRegionHint: true,
      showFlagHint: true,
      showAnswerMap: true,
      showTypedAnswer: false,
      showSprintTimer: true,
      streakPenalty: 0,
      answerLabel: 'Pick the country',
      poolKind: 'broader',
      poolIds: null
    }),
    earthling: Object.freeze({
      id: 'earthling',
      name: 'Earthling',
      recommendation: 'No labels. Name the country from its shape.',
      description: 'No labels. Name the country from its shape.',
      answerFormat: 'Typed answer or current advanced mechanic',
      timerStatus: '60-second sprint available',
      hintStatus: 'Limited hints',
      difficultyLabel: 'Core',
      recommended: true,
      defaultMode: 'sprint',
      allowedModes: Object.freeze(['showoff', 'sprint']),
      choiceCount: 6,
      promptRegion: true,
      showRegionHint: true,
      showFlagHint: true,
      showAnswerMap: false,
      showTypedAnswer: true,
      showSprintTimer: true,
      streakPenalty: 0,
      answerLabel: 'Name this country',
      poolKind: 'full',
      poolIds: null
    }),
    expert: Object.freeze({
      id: 'expert',
      name: 'Expert Verification',
      recommendation: 'Hard countries. No clues. One mistake can end the run.',
      description: 'Hard countries. No clues. One mistake can end the run.',
      answerFormat: 'Typed answer only',
      timerStatus: '60-second verification run',
      hintStatus: 'No visual hints',
      difficultyLabel: 'Hardest',
      recommended: false,
      defaultMode: 'sprint',
      allowedModes: Object.freeze(['showoff', 'sprint']),
      choiceCount: 0,
      promptRegion: false,
      showRegionHint: false,
      showFlagHint: false,
      showAnswerMap: false,
      showTypedAnswer: true,
      showSprintTimer: true,
      streakPenalty: 1,
      answerLabel: 'Type your answer',
      poolKind: 'hardest',
      poolIds: null,
      endRunOnWrongSprint: true
    })
  });

  function normalizeLevelId(levelId) {
    return Object.prototype.hasOwnProperty.call(LEVELS, levelId) ? levelId : 'earthling';
  }

  function cloneLevel(level) {
    return Object.freeze({
      ...level,
      allowedModes: Object.freeze([...level.allowedModes]),
      poolIds: Array.isArray(level.poolIds) ? Object.freeze([...level.poolIds]) : null
    });
  }

  function listLevels() {
    return LEVEL_ORDER.map(levelId => cloneLevel(LEVELS[levelId]));
  }

  function getLevel(levelId) {
    return cloneLevel(LEVELS[normalizeLevelId(levelId)]);
  }

  function getLevelPool(levelId, countryIndex) {
    if (!Array.isArray(countryIndex)) {
      throw new TypeError('countryIndex must be an array');
    }

    const level = LEVELS[normalizeLevelId(levelId)];
    if (level.poolKind === 'curated') {
      const ids = new Set(level.poolIds || []);
      return countryIndex.filter(country => ids.has(country.id));
    }
    if (level.poolKind === 'broader') {
      return countryIndex.filter(country => country && country.difficulty !== 'expert');
    }
    if (level.poolKind === 'hardest') {
      return countryIndex.filter(country => country && (country.difficulty === 'hard' || country.difficulty === 'expert'));
    }
    return [...countryIndex];
  }

  function applyContinentFilter(pool, continent) {
    if (!continent || continent === 'all') return [...pool];
    return pool.filter(country => {
      if (continent === 'North America') {
        return country.continent === 'North America' || country.continent === 'South America';
      }
      return country.continent === continent;
    });
  }

  function buildLevelDeck(levelId, countryIndex, continent = 'all') {
    return applyContinentFilter(getLevelPool(levelId, countryIndex), continent);
  }

  function uniqueById(countries) {
    const seen = new Set();
    const result = [];
    for (const country of countries) {
      if (!country || seen.has(country.id)) continue;
      seen.add(country.id);
      result.push(country);
    }
    return result;
  }

  function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function createChoices(correctCard, pool, choiceCount) {
    if (!correctCard || typeof correctCard !== 'object') {
      throw new TypeError('correctCard must be an object');
    }
    if (!Array.isArray(pool)) {
      throw new TypeError('pool must be an array');
    }

    const count = Math.max(2, Number.isInteger(choiceCount) ? choiceCount : 4);
    const distractors = uniqueById(pool.filter(country => country.id !== correctCard.id));
    const selectedDistractors = shuffle(distractors).slice(0, Math.max(0, count - 1));
    return shuffle([correctCard, ...selectedDistractors]).slice(0, count);
  }

  function getLevelLabel(levelId) {
    return getLevel(levelId).name;
  }

  function getLevelRecommendation(levelId) {
    return getLevel(levelId).recommendation;
  }

  function getDefaultLevel(hasHistory) {
    return hasHistory ? 'earthling' : 'cadet';
  }

  return Object.freeze({
    LEVEL_ORDER,
    LEVELS,
    getLevel,
    listLevels,
    getLevelPool,
    buildLevelDeck,
    createChoices,
    getLevelLabel,
    getLevelRecommendation,
    getDefaultLevel,
    applyContinentFilter,
    normalizeLevelId
  });
}));
