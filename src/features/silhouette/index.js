import eventBus from '../../core/events.js';

function countryFromRound(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  return payload.country ?? payload.card ?? payload.currentCard ?? payload;
}

/** Subscribe to round starts and maintain the round's single silhouette image. */
export function createSilhouette(options = {}) {
  const documentRef = options.document ?? globalThis.document;
  const container = options.container ?? documentRef?.getElementById?.('silhouette-box');
  const flagHint = options.flagHint ?? documentRef?.getElementById?.('flag-hint');
  const events = options.events ?? eventBus;
  const assetFallbacks = options.assetFallbacks ?? globalThis.AssetFallbacks;
  const recovery = options.recovery ?? documentRef?.getElementById?.('asset-recovery');
  const recoveryMessage = options.recoveryMessage ?? documentRef?.getElementById?.('asset-recovery-message');
  const retryButton = options.retryButton ?? documentRef?.getElementById?.('btn-retry-silhouette');
  const answerPanel = options.answerPanel ?? documentRef?.getElementById?.('answer-interaction-panel');
  if (!documentRef || typeof documentRef.createElement !== 'function') throw new TypeError('Silhouette document must provide createElement()');
  if (!container || typeof container.querySelector !== 'function' || typeof container.insertBefore !== 'function') throw new TypeError('Silhouette container must support DOM insertion');
  if (!events || typeof events.on !== 'function' || typeof events.emit !== 'function') throw new TypeError('Silhouette events must provide on() and emit()');

  let currentImage = null;
  let currentLoadHandler = null;
  let currentErrorHandler = null;
  let disposed = false;

  function setAvailable(element, available) {
    if (!element) return;
    element.classList?.toggle('hidden', !available);
    element.setAttribute?.('aria-hidden', String(!available));
    element.toggleAttribute?.('inert', !available);
    element.inert = !available;
  }

  function setRecoveryVisible(visible) {
    setAvailable(recovery, visible);
    setAvailable(answerPanel, !visible);
  }

  function showRecovery() {
    if (recoveryMessage) recoveryMessage.textContent = 'The country shape could not be loaded. Retry, move on, or return home. This round will not be saved.';
    if (retryButton) retryButton.disabled = false;
    setRecoveryVisible(true);
  }

  function removeCurrent() {
    if (currentImage && currentLoadHandler) currentImage.removeEventListener('load', currentLoadHandler);
    if (currentImage && currentErrorHandler) currentImage.removeEventListener('error', currentErrorHandler);
    if (currentImage?.parentNode === container) currentImage.remove();
    const existingImage = container.querySelector('#silhouette-img');
    const existingFallback = container.querySelector('[data-asset-fallback="silhouette"]');
    if (existingImage) existingImage.remove();
    if (existingFallback) existingFallback.remove();
    currentImage = null;
    currentLoadHandler = null;
    currentErrorHandler = null;
  }

  function load(country) {
    if (disposed) return null;
    if (!country || typeof country !== 'object' || typeof country.silhouette_url !== 'string' || !country.silhouette_url.trim()) throw new TypeError('Round country must provide silhouette_url');
    removeCurrent();
    const image = documentRef.createElement('img');
    image.id = 'silhouette-img';
    image.alt = 'Guess this country';
    let failureHandled = false;

    currentLoadHandler = () => {
      if (disposed || failureHandled || currentImage !== image) return;
      setRecoveryVisible(false);
      events.emit('silhouette:ready', Object.freeze({ countryId: country.id, country, element: image }));
    };
    currentErrorHandler = (eventOrError) => {
      if (disposed || failureHandled || currentImage !== image) return;
      failureHandled = true;
      const error = eventOrError instanceof Error
        ? eventOrError
        : eventOrError?.error instanceof Error
          ? eventOrError.error
          : new Error(`Failed to load silhouette for country ${country.id}`);
      try {
        assetFallbacks?.replaceImageWithFallback?.(image, 'silhouette', { alt: image.alt });
      } catch (fallbackError) {
        console.error('Silhouette: failed to render asset fallback', fallbackError);
      }
      showRecovery();
      events.emit('silhouette:error', Object.freeze({ countryId: country.id, error }));
    };
    image.addEventListener('load', currentLoadHandler, { once: true });
    image.addEventListener('error', currentErrorHandler, { once: true });
    currentImage = image;
    container.insertBefore(image, flagHint?.parentNode === container ? flagHint : null);

    if (typeof assetFallbacks?.prepareImage === 'function') {
      try {
        const source = assetFallbacks.prepareImage(image, 'silhouette', country, { alt: image.alt });
        if (!source?.url) currentErrorHandler(new Error(`No silhouette source is available for country ${country.id}`));
      } catch (error) {
        currentErrorHandler(error);
      }
    } else {
      image.src = country.silhouette_url;
    }
    return image;
  }

  const onRoundStart = payload => load(countryFromRound(payload));
  const unsubscribe = events.on('round:start', onRoundStart);
  function dispose() { if (disposed) return; disposed = true; if (typeof unsubscribe === 'function') unsubscribe(); else events.off?.('round:start', onRoundStart); removeCurrent(); }
  return Object.freeze({ load, getElement: () => currentImage, dispose });
}

const defaultContainer = globalThis.document?.getElementById?.('silhouette-box');
export const silhouette = defaultContainer ? createSilhouette({ container: defaultContainer }) : null;
export default silhouette;
