import eventBus from '../../core/events.js';

export const HINT_TYPES = Object.freeze(['flag', 'region']);

/** Bind one-use flag and region hint actions for the current round. */
export function createHints(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  const flagButton = options.flagButton ?? documentRef?.getElementById?.('btn-show-flag');
  const regionButton = options.regionButton ?? documentRef?.getElementById?.('btn-show-region');
  const events = options.events ?? eventBus;

  if (!events || typeof events.emit !== 'function' || typeof events.on !== 'function') {
    throw new TypeError('Hint events must provide emit() and on()');
  }

  const buttons = { flag: flagButton, region: regionButton };
  for (const [type, button] of Object.entries(buttons)) {
    if (!button || typeof button.addEventListener !== 'function' ||
        typeof button.removeEventListener !== 'function' ||
        typeof button.setAttribute !== 'function') {
      throw new TypeError(`${type} hint button must support DOM events and attributes`);
    }
  }

  let flagUsed = false;
  let regionUsed = false;
  let disposed = false;

  function updateButton(type, used) {
    const button = buttons[type];
    button.disabled = used;
    button.setAttribute('aria-disabled', String(used));
    button.setAttribute('aria-pressed', String(used));
  }

  function resetRound() {
    flagUsed = false;
    regionUsed = false;
    updateButton('flag', false);
    updateButton('region', false);
  }

  function reveal(type) {
    if (!HINT_TYPES.includes(type)) throw new RangeError(`Unknown hint type: ${String(type)}`);
    if (disposed || (type === 'flag' ? flagUsed : regionUsed)) return null;
    if (type === 'flag') flagUsed = true;
    else regionUsed = true;
    updateButton(type, true);
    const payload = Object.freeze({ type });
    events.emit('hint:reveal', payload);
    return payload;
  }

  const revealFlag = () => reveal('flag');
  const revealRegion = () => reveal('region');
  flagButton.addEventListener('click', revealFlag);
  regionButton.addEventListener('click', revealRegion);
  const unsubscribeRoundStart = events.on('round:start', resetRound);
  resetRound();

  function getState() {
    return Object.freeze({ flagUsed, regionUsed });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    flagButton.removeEventListener('click', revealFlag);
    regionButton.removeEventListener('click', revealRegion);
    if (typeof unsubscribeRoundStart === 'function') unsubscribeRoundStart();
    else events.off?.('round:start', resetRound);
  }

  return Object.freeze({ reveal, getState, dispose });
}

function createDefaultHints() {
  const documentRef = globalThis.document;
  const flagButton = documentRef?.getElementById?.('btn-show-flag');
  const regionButton = documentRef?.getElementById?.('btn-show-region');
  return flagButton && regionButton
    ? createHints({ document: documentRef, flagButton, regionButton })
    : null;
}

export const hints = createDefaultHints();
export default hints;