import eventBus from '../../core/events.js';

export const BASE_POINTS = Object.freeze({ easy: 100, medium: 150, hard: 200 });
export const MULTIPLIERS = Object.freeze({ typed: 3, bail: 2, options: 1 });

/** Calculate the points awarded for one correct answer. */
export function calculatePoints(difficulty, answerType) {
  if (!Object.hasOwn(BASE_POINTS, difficulty)) {
    throw new RangeError(`Unknown scoring difficulty: ${String(difficulty)}`);
  }
  if (!Object.hasOwn(MULTIPLIERS, answerType)) {
    throw new RangeError(`Unknown scoring answer type: ${String(answerType)}`);
  }
  return BASE_POINTS[difficulty] * MULTIPLIERS[answerType];
}

/** Create an event-driven scoring instance with isolated session state. */
export function createScoring({ events = eventBus } = {}) {
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Scoring events must provide on() and emit()');
  }

  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let hotStreakEmitted = false;

  function emitUpdate(delta) {
    const update = Object.freeze({ score, delta, streak });
    events.emit('score:update', update);
    return update;
  }

  function emitHotStreak() {
    events.emit('streak:hot', { streak });
  }

  function emitStreakReset(previousStreak) {
    events.emit('streak:reset', { previousStreak });
  }

  function handleCorrect(payload = {}) {
    const answerType = payload.answerType ?? payload.type ?? payload.method;
    const delta = calculatePoints(payload.difficulty, answerType);
    score += delta;
    streak += 1;
    if (streak >= 3 && !hotStreakEmitted) {
      emitHotStreak();
      hotStreakEmitted = true;
    }
    if (streak > bestStreak) {
      bestStreak = streak;
    }
    return emitUpdate(delta);
  }

  function handleIncorrect() {
    const previousStreak = streak;
    streak = 0;
    hotStreakEmitted = false;
    if (previousStreak > 0) {
      emitStreakReset(previousStreak);
    }
    return emitUpdate(0);
  }

  const unsubscribers = [
    events.on('answer:correct', handleCorrect),
    events.on('answer:incorrect', handleIncorrect)
  ];

  function getState() {
    return Object.freeze({ score, streak, bestStreak });
  }

  function dispose() {
    for (const unsubscribe of unsubscribers) unsubscribe();
  }

  return Object.freeze({ getState, dispose });
}

export const scoring = createScoring();
export default scoring;
