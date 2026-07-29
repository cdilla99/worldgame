import '../../../timer-ring.js';
import eventBus from '../../core/events.js';

/** Existing visual component, retained on the backward-compatible global. */
export const TimerRing = globalThis.TimerRing;

export const TIMER_DURATIONS = Object.freeze({
  blitz: 60,
  sprint: 120,
  zen: null
});

const systemClock = Object.freeze({
  setInterval: (callback, milliseconds) => globalThis.setInterval(callback, milliseconds),
  clearInterval: (timer) => globalThis.clearInterval(timer)
});

/** Create an event-driven countdown timer with injectable dependencies. */
export function createTimer({ events = eventBus, clock = systemClock, timerRing = TimerRing } = {}) {
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') {
    throw new TypeError('Timer events must provide on() and emit()');
  }
  if (!clock || typeof clock.setInterval !== 'function' || typeof clock.clearInterval !== 'function') {
    throw new TypeError('Timer clock must provide setInterval() and clearInterval()');
  }
  if (!timerRing || typeof timerRing.update !== 'function') {
    throw new TypeError('Timer ring must provide update()');
  }

  let timer = null;
  let remaining = null;

  function clearTimer() {
    if (timer !== null) clock.clearInterval(timer);
    timer = null;
  }

  function getState() {
    return Object.freeze({ timer, remaining });
  }

  function tick() {
    remaining -= 1;
    events.emit('timer:tick', { remaining });

    if (remaining < 10 && remaining > 5) {
      events.emit('timer:warning', { level: 'medium' });
    } else if (remaining <= 5) {
      events.emit('timer:warning', { level: 'high' });
    }

    if (remaining === 0) {
      events.emit('timer:expired');
      clearTimer();
    }
  }

  function resume() {
    if (timer !== null || remaining === null || remaining <= 0) return getState();
    timer = clock.setInterval(tick, 1000);
    return getState();
  }

  function pause() {
    clearTimer();
    return getState();
  }

  function end() {
    clearTimer();
    remaining = null;
    return getState();
  }

  function start(mode) {
    if (!Object.hasOwn(TIMER_DURATIONS, mode)) {
      throw new RangeError(`Unknown timer mode: ${String(mode)}`);
    }

    clearTimer();
    remaining = TIMER_DURATIONS[mode];
    if (remaining !== null && typeof timerRing.reset === 'function') {
      timerRing.reset(remaining);
    }
    return resume();
  }

  const unsubscribers = [
    events.on('timer:tick', ({ remaining: nextRemaining } = {}) => timerRing.update(nextRemaining)),
    events.on('game:start', ({ mode } = {}) => start(mode)),
    events.on('game:pause', pause),
    events.on('game:resume', resume),
    events.on('game:end', end)
  ];

  function dispose() {
    clearTimer();
    for (const unsubscribe of unsubscribers) unsubscribe();
  }

  return Object.freeze({ start, getState, dispose });
}

export const timer = createTimer();
export default timer;
