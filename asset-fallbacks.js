/* GeoWars asset-source registry and local fallbacks. Loaded before app.js when asset recovery is enabled. */
(function (global) {
  'use strict';

  var ICON_SPRITE = 'assets/geowars-icons.svg';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ICON_IDS = Object.freeze([
    'geowars-mark', 'mode-sprint', 'mode-practice', 'timer', 'score', 'streak',
    'flag', 'region', 'sound', 'sound-muted', 'quit', 'next', 'retry'
  ]);
  var SOURCE_METADATA = Object.freeze({
    silhouette: Object.freeze({
      source: 'MapsIcon country-outline collection',
      documentationUrl: 'https://github.com/djaiss/mapsicon',
      urlTemplate: 'https://raw.githubusercontent.com/djaiss/mapsicon/master/all/{code}/vector.svg',
      aspectRatio: '1 / 1', fallbackIcon: 'region', fallback: 'Local SVG and “Shape unavailable” state.'
    }),
    flag: Object.freeze({
      source: 'FlagCDN country flags',
      documentationUrl: 'https://flagcdn.com',
      urlTemplate: 'https://flagcdn.com/w160/{code}.png',
      aspectRatio: '3 / 2', fallbackIcon: 'flag', fallback: 'Local SVG and country-name-preserving flag state.'
    }),
    font: Object.freeze({
      source: 'No remote font is essential',
      fallbackStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fallback: 'The system font stack keeps controls readable when a custom font is unavailable.'
    }),
    landingArtwork: Object.freeze({
      source: 'Local GeoWars SVG sprite',
      url: ICON_SPRITE,
      fallback: 'The product wordmark and proposition remain text-first; no remote landing artwork is essential.'
    })
  });
  var FALLBACK_COPY = Object.freeze({
    silhouette: Object.freeze({ title: 'Shape unavailable', detail: 'The country shape could not be loaded.' }),
    flag: Object.freeze({ title: 'Flag unavailable', detail: 'The country name and answer result are still available.' })
  });

  function getCountryCode(cardOrCode) {
    var value = cardOrCode && typeof cardOrCode === 'object'
      ? (cardOrCode.countryCode || cardOrCode.iso2 || cardOrCode.code || cardOrCode.flag)
      : cardOrCode;
    if (typeof value !== 'string') return null;
    var compact = value.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(compact)) return compact;
    var points = Array.from(value).map(function (character) { return character.codePointAt(0); });
    if (points.length < 2 || points[0] < 0x1F1E6 || points[0] > 0x1F1FF || points[1] < 0x1F1E6 || points[1] > 0x1F1FF) return null;
    return String.fromCharCode(points[0] - 0x1F1E6 + 65) + String.fromCharCode(points[1] - 0x1F1E6 + 65);
  }

  function getAssetSource(type, cardOrCode) {
    var metadata = SOURCE_METADATA[type];
    if (!metadata || !metadata.urlTemplate) return null;
    var code = getCountryCode(cardOrCode);
    return Object.freeze({ type: type, code: code, url: code ? metadata.urlTemplate.replace('{code}', code.toLowerCase()) : '', source: metadata.source, documentationUrl: metadata.documentationUrl, aspectRatio: metadata.aspectRatio, fallback: metadata.fallback });
  }

  function reserveSpace(element, type) {
    var metadata = SOURCE_METADATA[type];
    if (!element || !metadata || !metadata.aspectRatio) return element || null;
    element.classList.add('asset-slot', 'asset-slot--' + type);
    element.style.setProperty('--asset-aspect-ratio', metadata.aspectRatio);
    if (!element.style.aspectRatio) element.style.aspectRatio = metadata.aspectRatio;
    return element;
  }

  function createIcon(name, options) {
    options = options || {};
    if (ICON_IDS.indexOf(name) === -1) return null;
    var icon = document.createElementNS(SVG_NS, 'svg');
    var use = document.createElementNS(SVG_NS, 'use');
    icon.setAttribute('class', 'geowars-icon' + (options.className ? ' ' + options.className : ''));
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', String(options.size || 24));
    icon.setAttribute('height', String(options.size || 24));
    icon.setAttribute('focusable', 'false');
    if (options.label) {
      icon.setAttribute('role', 'img');
      var title = document.createElementNS(SVG_NS, 'title');
      title.textContent = options.label;
      icon.appendChild(title);
    } else {
      icon.setAttribute('aria-hidden', 'true');
    }
    use.setAttribute('href', ICON_SPRITE + '#icon-' + name);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', ICON_SPRITE + '#icon-' + name);
    icon.appendChild(use);
    return icon;
  }

  function addFallbackAction(container, action) {
    if (!action || typeof action.label !== 'string' || typeof action.onClick !== 'function') return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'asset-fallback__action' + (action.primary ? ' asset-fallback__action--primary' : '');
    button.dataset.assetAction = action.id || action.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    button.disabled = Boolean(action.disabled);
    if (action.icon) {
      var icon = createIcon(action.icon, { size: 18 });
      if (icon) button.appendChild(icon);
    }
    button.appendChild(document.createTextNode(action.label));
    button.addEventListener('click', action.onClick);
    container.appendChild(button);
  }

  function renderFallback(type, options) {
    options = options || {};
    var copy = FALLBACK_COPY[type];
    var metadata = SOURCE_METADATA[type];
    if (!copy || !metadata) return null;
    var fallback = document.createElement('section');
    fallback.className = 'asset-fallback asset-fallback--' + type + (options.className ? ' ' + options.className : '');
    fallback.dataset.assetFallback = type;
    fallback.setAttribute('role', options.role || 'status');
    fallback.setAttribute('aria-live', options.live || 'polite');
    reserveSpace(fallback, type);
    var icon = createIcon(metadata.fallbackIcon, { size: options.iconSize || 32 });
    if (icon) fallback.appendChild(icon);
    var title = document.createElement('p');
    title.className = 'asset-fallback__title';
    title.textContent = options.title || (type === 'flag' && options.countryName ? options.countryName + ' flag unavailable' : copy.title);
    fallback.appendChild(title);
    var detail = document.createElement('p');
    detail.className = 'asset-fallback__detail';
    detail.textContent = options.detail || copy.detail;
    fallback.appendChild(detail);
    (options.actions || []).forEach(function (action) { addFallbackAction(fallback, action); });
    return fallback;
  }

  function replaceImageWithFallback(image, type, options) {
    if (!image || !image.parentNode) return null;
    var parent = image.parentNode;
    reserveSpace(parent, type);
    var fallback = renderFallback(type, options);
    if (!fallback) return null;
    image.replaceWith(fallback);
    return fallback;
  }

  function bindImageFallback(image, type, options) {
    if (!image) return function () {};
    reserveSpace(image.parentElement || image, type);
    var handled = false;
    function onError() {
      if (handled) return;
      handled = true;
      replaceImageWithFallback(image, type, options);
    }
    image.addEventListener('error', onError, { once: true });
    return function () { image.removeEventListener('error', onError); };
  }

  function prepareImage(image, type, cardOrCode, options) {
    options = options || {};
    var asset = getAssetSource(type, cardOrCode);
    if (!asset || !image) return asset;
    bindImageFallback(image, type, options);
    if (options.alt) image.alt = options.alt;
    if (asset.url) image.src = asset.url;
    else replaceImageWithFallback(image, type, options);
    return asset;
  }

  global.AssetFallbacks = Object.freeze({
    iconSprite: ICON_SPRITE,
    iconIds: ICON_IDS,
    sourceMetadata: SOURCE_METADATA,
    fontFallbackStack: SOURCE_METADATA.font.fallbackStack,
    getCountryCode: getCountryCode,
    getAssetSource: getAssetSource,
    getSilhouetteSource: function (cardOrCode) { return getAssetSource('silhouette', cardOrCode); },
    getFlagSource: function (cardOrCode) { return getAssetSource('flag', cardOrCode); },
    createIcon: createIcon,
    reserveSpace: reserveSpace,
    renderFallback: renderFallback,
    renderSilhouetteFallback: function (options) { return renderFallback('silhouette', options); },
    renderFlagFallback: function (options) { return renderFallback('flag', options); },
    bindImageFallback: bindImageFallback,
    prepareImage: prepareImage,
    replaceImageWithFallback: replaceImageWithFallback
  });
}(window));
