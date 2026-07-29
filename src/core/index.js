import state, { getState, setState, onStateChange, deepFreeze } from './state.js';
import eventBus, { EventBus } from './events.js';
import domRefs, { get as getDomRef, clear as clearDomRefs, preload as preloadDomRefs } from './dom-refs.js';

export const CORE_EVENTS = Object.freeze([
  'data:loading', 'data:ready', 'data:error',
  'game:start', 'game:pause', 'game:resume', 'game:end',
  'round:start',
  'timer:tick', 'timer:warning', 'timer:expired',
  'autocomplete:select',
  'answer:correct', 'answer:incorrect',
  'score:update', 'score:final',
  'streak:hot', 'streak:reset',
  'hint:reveal',
  'silhouette:ready', 'silhouette:error'
]);

export function createEventBus() {
  return new EventBus();
}

export {
  state, getState, setState, onStateChange, deepFreeze,
  EventBus, eventBus,
  domRefs, getDomRef, clearDomRefs, preloadDomRefs
};

export default Object.freeze({
  state, getState, setState, onStateChange,
  EventBus, eventBus, createEventBus,
  domRefs, getDomRef, clearDomRefs, preloadDomRefs,
  CORE_EVENTS
});
