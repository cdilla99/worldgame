'use strict';

/**
 * GeoWars Globe Explorer
 *
 * A dedicated country-level learning surface. The large geometry asset loads
 * only after Explore opens, keeping the landing page light and preserving the
 * landing globe's region-selection responsibility.
 */
(function installGlobeExplorer(root) {
  const geometryUrl = 'assets/globe-countries.js?v=20260730-territories3';
  const territoryGeometryUrl = 'assets/globe-territories.js?v=20260730-guidance1';
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 9;
  const GEOMETRY_TIMEOUT_MS = 10000;
  const LANDMARK_WIKIPEDIA_CANDIDATES = Object.freeze({
    'Chichen Itza pyramid': Object.freeze(['Chichen Itza']),
    'Christ the Redeemer': Object.freeze(['Christ the Redeemer (statue)']),
    'Meroe pyramids': Object.freeze(['Pyramids of Meroë']),
    'Tigris and Euphrates marshes': Object.freeze(['Mesopotamian Marshes']),
    'Leptis Magna Roman ruins': Object.freeze(['Leptis Magna']),
    'Sahara oases': Object.freeze(['Sahara']),
    'Sahara dunes of the Tenere': Object.freeze(['Ténéré']),
    'Serengeti plains': Object.freeze(['Serengeti']),
    'Białowieża bison reserve': Object.freeze(['Białowieża Forest'])
  });
  const EMPTY_LANDMARK_CANDIDATES = Object.freeze([]);
  const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));
  const toRadians = degrees => degrees * Math.PI / 180;
  const normalizeLongitude = longitude => {
    let result = longitude % 360;
    if (result > 180) result -= 360;
    if (result < -180) result += 360;
    return result;
  };

  function initializeExplorer() {
    const screen = document.getElementById('explorer');
    const openButton = document.getElementById('btn-open-explorer');
    const openHuntButton = document.getElementById('btn-open-explorer-hunt');
    const homeButtons = Array.from(document.querySelectorAll('[data-explorer-home]'));
    const canvas = document.getElementById('explorer-globe-canvas');
    const globeFrame = document.getElementById('explorer-globe-frame');
    const status = document.getElementById('explorer-globe-status');
    const loading = document.getElementById('explorer-globe-loading');
    const error = document.getElementById('explorer-globe-error');
    const errorTitle = document.getElementById('explorer-globe-error-title');
    const errorCopy = document.getElementById('explorer-globe-error-copy');
    const geometryRetryButton = document.getElementById('btn-explorer-globe-retry');
    const searchFallbackButton = document.getElementById('btn-explorer-search-fallback');
    const live = document.getElementById('explorer-live');
    const searchInput = document.getElementById('explorer-country-search');
    const searchList = document.getElementById('explorer-search-results');
    const emptyCard = document.getElementById('explorer-empty-card');
    const countryCard = document.getElementById('explorer-country-card');
    const flag = document.getElementById('explorer-country-flag');
    const name = document.getElementById('explorer-country-name');
    const region = document.getElementById('explorer-country-region');
    const identityKicker = document.getElementById('explorer-country-kicker');
    const territoryStatus = document.getElementById('explorer-country-status');
    const capital = document.getElementById('explorer-country-capital');
    const population = document.getElementById('explorer-country-population');
    const languages = document.getElementById('explorer-country-languages');
    const currency = document.getElementById('explorer-country-currency');
    const area = document.getElementById('explorer-country-area');
    const neighbors = document.getElementById('explorer-country-neighbors');
    const landmark = document.getElementById('explorer-country-landmark');
    const fact = document.getElementById('explorer-country-fact');
    const practiceButton = document.getElementById('btn-explorer-practice');
    const details = document.getElementById('explorer-more-details');
    const landmarkMedia = document.getElementById('explorer-landmark-media');
    const landmarkMediaImage = document.getElementById('explorer-landmark-media-image');
    const landmarkMediaToggle = document.getElementById('explorer-landmark-media-toggle');
    const landmarkLearnMore = document.getElementById('explorer-landmark-learn-more');
    const landmarkMediaSource = document.getElementById('explorer-landmark-media-source');
    const zoomInButton = document.getElementById('btn-explorer-zoom-in');
    const zoomOutButton = document.getElementById('btn-explorer-zoom-out');
    const resetButton = document.getElementById('btn-explorer-reset');
    const musicButton = document.getElementById('btn-explorer-music');
    const musicButtonLabel = musicButton?.querySelector('span');
    const musicButtonUse = musicButton?.querySelector('use');
    const hapticsButton = document.getElementById('btn-explorer-haptics');
    const hapticsButtonLabel = hapticsButton?.querySelector('span');
    const freeModeButton = document.getElementById('btn-explorer-free');
    const huntModeButton = document.getElementById('btn-explorer-hunt');
    const huntHud = document.getElementById('explorer-hunt-hud');
    const huntTime = document.getElementById('explorer-hunt-time');
    const huntTarget = document.getElementById('explorer-hunt-target');
    const huntTargetFlag = document.getElementById('explorer-hunt-target-flag');
    const huntScoreElement = document.getElementById('explorer-hunt-score');
    const huntExitButton = document.getElementById('btn-explorer-hunt-exit');
    const huntCompare = document.getElementById('explorer-hunt-compare');
    const huntPanelTarget = document.getElementById('explorer-hunt-panel-target');
    const huntPanelTargetFlag = document.getElementById('explorer-hunt-panel-target-flag');
    const huntSelectionCard = document.getElementById('explorer-hunt-selection-card');
    const huntSelectedFlag = document.getElementById('explorer-hunt-selected-flag');
    const huntSelectionLabel = document.getElementById('explorer-hunt-selection-label');
    const huntSelectedCountry = document.getElementById('explorer-hunt-selected-country');
    const huntSelectionFeedback = document.getElementById('explorer-hunt-selection-feedback');
    const huntFeedback = document.getElementById('explorer-hunt-feedback');
    const huntFeedbackFlag = document.getElementById('explorer-hunt-feedback-flag');
    const huntFeedbackOutcome = document.getElementById('explorer-hunt-feedback-outcome');
    const huntFeedbackSelected = document.getElementById('explorer-hunt-feedback-selected');
    const huntFeedbackArrow = document.getElementById('explorer-hunt-feedback-arrow');
    const huntFeedbackDistance = document.getElementById('explorer-hunt-feedback-distance');
    const huntFeedbackDirection = document.getElementById('explorer-hunt-feedback-direction');
    const huntGuidance = document.getElementById('explorer-hunt-guidance');
    const huntDirectionArrow = document.getElementById('explorer-hunt-direction-arrow');
    const huntDistance = document.getElementById('explorer-hunt-distance');
    const huntDirection = document.getElementById('explorer-hunt-direction');
    const huntCelebration = document.getElementById('explorer-hunt-celebration');
    const huntCelebrationCountry = document.getElementById('explorer-hunt-celebration-country');
    const huntSummary = document.getElementById('explorer-hunt-summary');
    const huntFinalScore = document.getElementById('explorer-hunt-final-score');
    const huntAgainButton = document.getElementById('btn-explorer-hunt-again');
    const huntFreeButton = document.getElementById('btn-explorer-hunt-free');
    const stageTitle = document.getElementById('explorer-stage-title');
    const stageHeadingCopy = document.querySelector('.explorer-stage-heading > p');
    const emptyCardTitle = emptyCard?.querySelector('h2');
    const emptyCardCopy = emptyCard?.querySelector('p');
    const navigation = root.GeoWars?.navigate;
    const geography = root.GeoWarsGeography;
    const cards = typeof countryCards !== 'undefined' && Array.isArray(countryCards)
      ? countryCards
      : [];
    const territoryCards = Array.isArray(root.GeoWarsExplorerTerritories)
      ? root.GeoWarsExplorerTerritories
      : [];
    const explorerCards = [...cards, ...territoryCards];

    if (
      !screen || !openButton || !canvas || !globeFrame || !status ||
      !searchInput || !searchList || !emptyCard || !countryCard || !cards.length
    ) return;

    const context = canvas.getContext('2d');
    const hitCanvas = document.createElement('canvas');
    const hitContext = hitCanvas.getContext('2d', { willReadFrequently: true });
    if (!context || !hitContext) return;

    const cardsById = new Map(explorerCards.map(card => [card.id, card]));
    const geometryById = new Map();
    const pointers = new Map();
    const prefersReducedMotion = root.matchMedia('(prefers-reduced-motion: reduce)');
    let geometryPromise = null;
    let geometryState = 'idle';
    let geometryLoadAttempt = 0;
    let territoryGeometryReady = false;
    let countries = [];
    let drawOrder = [];
    let size = 560;
    let center = 280;
    let baseRadius = 252;
    let longitude = -16;
    let latitude = 12;
    let zoom = 1;
    let hoveredCountryId = null;
    let selectedCountryId = null;
    let centeredCountryId = null;
    let dragging = false;
    let primaryPointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let dragDistance = 0;
    let pinchDistance = 0;
    let pinchZoom = 1;
    let animationFrame = 0;
    let resizeFrame = 0;
    let searchMatches = [];
    let activeSearchIndex = -1;
    let opened = false;
    let huntActive = false;
    let huntTimeLeft = 60;
    let huntScore = 0;
    let huntTargetId = null;
    let lastHuntTargetId = null;
    let huntDeadline = 0;
    let huntPausedAt = 0;
    let huntInterval = 0;
    let huntAdvanceTimeout = 0;
    let huntSessionId = 0;
    let landmarkMediaRequestId = 0;
    const huntPauseReasons = new Set();

    function getRadius() {
      return baseRadius * zoom;
    }

    function getCountryName(id) {
      return cardsById.get(id)?.name || 'Country';
    }

    function colorForId(id) {
      return [
        id & 255,
        (id >> 8) & 255,
        (id >> 16) & 255
      ];
    }

    function idForColor(pixel) {
      const id = pixel[0] | (pixel[1] << 8) | (pixel[2] << 16);
      return cardsById.has(id) ? id : null;
    }

    function project(longitudeValue, latitudeValue) {
      const radius = getRadius();
      const lambda = toRadians(normalizeLongitude(longitudeValue - longitude));
      const phi = toRadians(latitudeValue);
      const phi0 = toRadians(latitude);
      const cosPhi = Math.cos(phi);
      const visibility = Math.sin(phi0) * Math.sin(phi) +
        Math.cos(phi0) * cosPhi * Math.cos(lambda);
      return {
        x: center + radius * cosPhi * Math.sin(lambda),
        y: center - radius * (
          Math.cos(phi0) * Math.sin(phi) -
          Math.sin(phi0) * cosPhi * Math.cos(lambda)
        ),
        visible: visibility >= -0.012,
        visibility
      };
    }

    function appendProjectedRing(targetContext, ring) {
      let drawing = false;
      ring.forEach(point => {
        const projected = project(point[0], point[1]);
        if (!projected.visible) {
          drawing = false;
          return;
        }
        if (!drawing) targetContext.moveTo(projected.x, projected.y);
        else targetContext.lineTo(projected.x, projected.y);
        drawing = true;
      });
    }

    function appendCountryPath(targetContext, country) {
      country.p.forEach(polygon => {
        polygon.forEach(ring => appendProjectedRing(targetContext, ring));
      });
    }

    function drawOcean(targetContext) {
      const radius = getRadius();
      targetContext.save();
      targetContext.beginPath();
      targetContext.arc(center, center, radius, 0, Math.PI * 2);
      const ocean = targetContext.createRadialGradient(
        center - radius * 0.38,
        center - radius * 0.42,
        Math.max(1, radius * 0.05),
        center,
        center,
        radius * 1.08
      );
      ocean.addColorStop(0, '#65b8ff');
      ocean.addColorStop(0.3, '#246dc9');
      ocean.addColorStop(0.72, '#123b78');
      ocean.addColorStop(1, '#06172f');
      targetContext.fillStyle = ocean;
      targetContext.fill();
      targetContext.restore();
    }

    function drawGraticule(targetContext) {
      const radius = getRadius();
      targetContext.save();
      targetContext.beginPath();
      targetContext.arc(center, center, radius, 0, Math.PI * 2);
      targetContext.clip();
      targetContext.beginPath();
      for (let meridian = -180; meridian < 180; meridian += 30) {
        const points = [];
        for (let parallel = -90; parallel <= 90; parallel += 3) {
          points.push([meridian, parallel]);
        }
        appendProjectedRing(targetContext, points);
      }
      for (let parallel = -60; parallel <= 60; parallel += 30) {
        const points = [];
        for (let meridian = -180; meridian <= 180; meridian += 3) {
          points.push([meridian, parallel]);
        }
        appendProjectedRing(targetContext, points);
      }
      targetContext.strokeStyle = 'rgba(202, 229, 255, 0.15)';
      targetContext.lineWidth = 0.75;
      targetContext.stroke();
      targetContext.restore();
    }

    function drawCountry(targetContext, country, hitTarget) {
      const radius = getRadius();
      const selected = country.i === selectedCountryId;
      const hovered = country.i === hoveredCountryId;
      targetContext.save();
      targetContext.beginPath();
      appendCountryPath(targetContext, country);

      if (hitTarget) {
        const color = colorForId(country.i);
        targetContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        targetContext.strokeStyle = targetContext.fillStyle;
        targetContext.lineWidth = country.s ? 2.4 : 1.2;
        targetContext.fill('evenodd');
        targetContext.stroke();
      } else {
        const land = targetContext.createLinearGradient(
          center - radius,
          center - radius,
          center + radius,
          center + radius
        );
        if (selected) {
          land.addColorStop(0, '#effff6');
          land.addColorStop(0.48, '#78f0b6');
          land.addColorStop(1, '#20a67a');
        } else if (hovered) {
          land.addColorStop(0, '#d5ffe5');
          land.addColorStop(0.55, '#59dba3');
          land.addColorStop(1, '#208d6f');
        } else {
          land.addColorStop(0, '#8be5bc');
          land.addColorStop(0.6, '#35b489');
          land.addColorStop(1, '#176c5a');
        }
        targetContext.fillStyle = land;
        if (selected) {
          targetContext.shadowColor = 'rgba(86, 240, 166, 0.72)';
          targetContext.shadowBlur = 12;
        }
        targetContext.fill('evenodd');
      }
      targetContext.restore();
    }

    function drawCountryOutline(targetContext, country) {
      const selected = country.i === selectedCountryId;
      const hovered = country.i === hoveredCountryId;
      const compactBoost = size <= 430 ? 0.16 : 0;
      const zoomBoost = Math.min(0.36, Math.max(0, zoom - 1) * 0.085);

      targetContext.save();
      targetContext.beginPath();
      appendCountryPath(targetContext, country);
      targetContext.lineJoin = 'round';
      targetContext.lineCap = 'round';

      if (selected) {
        targetContext.strokeStyle = 'rgba(244, 255, 249, 0.98)';
        targetContext.lineWidth = 2.05 + compactBoost;
        targetContext.shadowColor = 'rgba(86, 240, 166, 0.76)';
        targetContext.shadowBlur = 8;
      } else if (hovered) {
        targetContext.strokeStyle = 'rgba(224, 255, 238, 0.94)';
        targetContext.lineWidth = 1.45 + compactBoost;
        targetContext.shadowColor = 'rgba(72, 227, 160, 0.48)';
        targetContext.shadowBlur = 5;
      } else {
        targetContext.strokeStyle = 'rgba(3, 38, 52, 0.76)';
        targetContext.lineWidth = 0.82 + compactBoost + zoomBoost;
      }

      targetContext.stroke();
      targetContext.restore();
    }

    function drawSmallCountryMarkers(targetContext, hitTarget) {
      countries.filter(country => country.s).forEach(country => {
        const projected = project(country.x, country.y);
        if (!projected.visible) return;
        const selected = country.i === selectedCountryId;
        const hovered = country.i === hoveredCountryId;
        const markerRadius = hitTarget
          ? Math.max(8, 11 / Math.sqrt(zoom))
          : selected ? 5.4 : hovered ? 4.7 : zoom >= 1.15 ? 2.7 : 2.25;
        targetContext.save();
        targetContext.beginPath();
        targetContext.arc(projected.x, projected.y, markerRadius, 0, Math.PI * 2);
        if (hitTarget) {
          const color = colorForId(country.i);
          targetContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        } else {
          targetContext.fillStyle = selected
            ? '#f1fff7'
            : hovered
              ? '#b8ffda'
              : 'rgba(218, 255, 237, 0.82)';
          targetContext.strokeStyle = selected
            ? '#45dea0'
            : 'rgba(4, 26, 46, 0.82)';
          targetContext.lineWidth = selected ? 2.2 : 1.1;
          targetContext.shadowColor = 'rgba(72, 227, 160, 0.45)';
          targetContext.shadowBlur = selected || hovered ? 9 : 3;
        }
        targetContext.fill();
        if (!hitTarget) targetContext.stroke();
        targetContext.restore();
      });
    }

    function drawAtmosphere(targetContext) {
      const radius = getRadius();
      targetContext.save();
      targetContext.beginPath();
      targetContext.arc(center, center, radius, 0, Math.PI * 2);
      const shade = targetContext.createRadialGradient(
        center - radius * 0.2,
        center - radius * 0.23,
        radius * 0.38,
        center,
        center,
        radius
      );
      shade.addColorStop(0, 'rgba(255,255,255,0.055)');
      shade.addColorStop(0.64, 'rgba(4,15,38,0)');
      shade.addColorStop(1, 'rgba(1,7,22,0.66)');
      targetContext.fillStyle = shade;
      targetContext.fill();
      targetContext.strokeStyle = 'rgba(185, 225, 255, 0.76)';
      targetContext.lineWidth = 1.25;
      targetContext.stroke();
      targetContext.restore();
    }

    function updateCenteredCountry() {
      let nearestId = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      countries.forEach(country => {
        const projected = project(country.x, country.y);
        if (!projected.visible) return;
        const distance = Math.hypot(projected.x - center, projected.y - center);
        if (distance < nearestDistance) {
          nearestId = country.i;
          nearestDistance = distance;
        }
      });
      centeredCountryId = nearestId;
      if (nearestId) {
        const centeredLabel = huntActive
          ? `Country Hunt globe. Find ${getCountryName(huntTargetId)}. `
          : `Interactive country globe. ${getCountryName(nearestId)} is centered. `;
        canvas.setAttribute(
          'aria-label',
          centeredLabel + 'Use arrow keys to rotate, plus or minus to zoom, and Enter to select.'
        );
      }
    }

    function draw() {
      if (!countries.length) return;
      const devicePixelRatio = Math.min(root.devicePixelRatio || 1, 2);
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);
      hitContext.setTransform(1, 0, 0, 1, 0, 0);
      hitContext.clearRect(0, 0, size, size);

      context.save();
      context.beginPath();
      context.rect(0, 0, size, size);
      context.clip();
      drawOcean(context);
      drawGraticule(context);
      drawOrder.forEach(country => drawCountry(context, country, false));
      drawOrder
        .filter(country => country.i !== hoveredCountryId && country.i !== selectedCountryId)
        .forEach(country => drawCountryOutline(context, country));
      const hoveredCountry = geometryById.get(hoveredCountryId);
      const selectedCountry = geometryById.get(selectedCountryId);
      if (hoveredCountry && hoveredCountry !== selectedCountry) {
        drawCountryOutline(context, hoveredCountry);
      }
      if (selectedCountry) drawCountryOutline(context, selectedCountry);
      drawSmallCountryMarkers(context, false);
      drawAtmosphere(context);
      context.restore();

      hitContext.save();
      hitContext.beginPath();
      hitContext.rect(0, 0, size, size);
      hitContext.clip();
      drawOrder.forEach(country => drawCountry(hitContext, country, true));
      drawSmallCountryMarkers(hitContext, true);
      hitContext.restore();

      updateCenteredCountry();
      syncGlobeControls();
    }

    function resize() {
      const rect = globeFrame.getBoundingClientRect();
      if (!rect.width) return;
      size = Math.max(220, Math.round(Math.min(rect.width, rect.height || rect.width)));
      center = size / 2;
      baseRadius = size * 0.45;
      const devicePixelRatio = Math.min(root.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * devicePixelRatio);
      canvas.height = Math.round(size * devicePixelRatio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      hitCanvas.width = size;
      hitCanvas.height = size;
      draw();
    }

    function setStatus(message) {
      status.textContent = message;
    }

    function syncGlobeControls() {
      const ready = countries.length >= cards.length && geometryState !== 'loading';
      zoomInButton.disabled = !ready || zoom >= MAX_ZOOM;
      zoomOutButton.disabled = !ready || zoom <= MIN_ZOOM;
      resetButton.disabled = !ready;
    }

    function setLoading(active) {
      loading.classList.toggle('hidden', !active);
      canvas.classList.toggle('is-loading', active);
      globeFrame.setAttribute('aria-busy', String(active));
      if (geometryRetryButton) {
        geometryRetryButton.disabled = active;
        if (active) geometryRetryButton.textContent = 'Loading…';
      }
      syncGlobeControls();
    }

    function showGeometryError(loadError) {
      console.warn('[GeoWars Explorer]', loadError);
      geometryState = 'error';
      setLoading(false);
      canvas.classList.add('hidden');
      error.classList.remove('hidden');
      if (errorTitle) errorTitle.textContent = 'The map could not load';
      if (errorCopy) {
        errorCopy.textContent = root.navigator?.onLine === false
          ? 'You appear to be offline. Reconnect, then try again.'
          : 'Check your connection, then try again.';
      }
      if (geometryRetryButton) {
        geometryRetryButton.disabled = false;
        geometryRetryButton.textContent = huntActive ? 'Retry Country Hunt' : 'Try again';
      }
      if (huntActive && huntTarget) huntTarget.textContent = 'Map unavailable';
      const recoveryMessage = huntActive
        ? 'Country Hunt is waiting for the map. Retry when you are ready.'
        : 'The interactive globe is unavailable. You can retry or use country search.';
      setStatus(recoveryMessage);
      live.textContent = recoveryMessage;
      if (opened && !document.hidden) {
        root.requestAnimationFrame(() => geometryRetryButton?.focus({ preventScroll: true }));
      }
    }

    function loadGeometryAsset(globalName, url, errorMessage, expectedCount, attempt) {
      const cachedData = root[globalName];
      if (Array.isArray(cachedData) && cachedData.length === expectedCount) {
        return Promise.resolve(cachedData);
      }
      if (cachedData != null) {
        try { root[globalName] = undefined; } catch (assignmentError) {}
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          root.clearTimeout(timeoutId);
          script.remove();
          callback(value);
        };
        const timeoutId = root.setTimeout(
          () => finish(reject, new Error(errorMessage + ' (timed out)')),
          GEOMETRY_TIMEOUT_MS
        );
        script.src = attempt > 1 ? url + '&retry=' + attempt : url;
        script.async = true;
        script.onload = () => {
          const loadedData = root[globalName];
          if (!Array.isArray(loadedData) || loadedData.length !== expectedCount) {
            finish(reject, new Error(errorMessage + ' (incomplete data)'));
            return;
          }
          finish(resolve, loadedData);
        };
        script.onerror = () => finish(reject, new Error(errorMessage));
        document.head.appendChild(script);
      });
    }

    function loadGeometry() {
      if (countries.length >= cards.length) return Promise.resolve(countries);
      if (geometryPromise) return geometryPromise;
      geometryLoadAttempt += 1;
      geometryState = 'loading';
      setLoading(true);
      error.classList.add('hidden');

      geometryPromise = Promise.allSettled([
        loadGeometryAsset(
          'GeoWarsGlobeCountries',
          geometryUrl,
          'Country geometry failed to load',
          cards.length,
          geometryLoadAttempt
        ),
        loadGeometryAsset(
          'GeoWarsGlobeTerritories',
          territoryGeometryUrl,
          'Territory geometry failed to load',
          territoryCards.length,
          geometryLoadAttempt
        )
      ]).then(results => {
        const countryResult = results[0];
        const territoryResult = results[1];
        if (countryResult.status !== 'fulfilled') throw countryResult.reason;
        const countryData = countryResult.value;
        const territoryData = territoryResult.status === 'fulfilled' ? territoryResult.value : [];
        territoryGeometryReady = territoryData.length === territoryCards.length;
        countries = [...countryData, ...territoryData];
        geometryById.clear();
        countries.forEach(country => geometryById.set(country.i, country));
        drawOrder = [...countries].sort((first, second) => first.s - second.s);
        geometryState = territoryGeometryReady ? 'ready' : 'partial';
        canvas.classList.remove('hidden');
        error.classList.add('hidden');
        setLoading(false);
        root.requestAnimationFrame(resize);
        if (!territoryGeometryReady && !huntActive) {
          setStatus('Country globe ready. Territory outlines are temporarily unavailable.');
        }
        return countries;
      }).catch(loadError => {
        showGeometryError(loadError);
        return [];
      }).finally(() => {
        if (geometryState === 'error') geometryPromise = null;
      });

      return geometryPromise;
    }

    function readCountryAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) * size / rect.width);
      const y = Math.floor((clientY - rect.top) * size / rect.height);
      if (x < 0 || y < 0 || x >= size || y >= size) return null;
      return idForColor(hitContext.getImageData(x, y, 1, 1).data);
    }

    function setRotation(nextLongitude, nextLatitude) {
      longitude = normalizeLongitude(nextLongitude);
      latitude = clamp(nextLatitude, -70, 72);
      draw();
    }

    function setZoom(nextZoom) {
      zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      draw();
    }

    function stopAnimation() {
      if (animationFrame) root.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    function animateToCountry(country) {
      const geometry = geometryById.get(country.id);
      if (!geometry) return;
      stopAnimation();
      const targetLatitude = clamp(geometry.y, -62, 66);
      const targetZoom = geometry.s ? Math.max(zoom, 5.4) : Math.max(zoom, 1.12);
      if (prefersReducedMotion.matches) {
        longitude = geometry.x;
        latitude = targetLatitude;
        zoom = targetZoom;
        draw();
        return;
      }

      const startLongitude = longitude;
      const startLatitude = latitude;
      const startZoom = zoom;
      const deltaLongitude = normalizeLongitude(geometry.x - longitude);
      const started = root.performance.now();
      const duration = 460;
      const step = now => {
        const progress = clamp((now - started) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        longitude = normalizeLongitude(startLongitude + deltaLongitude * eased);
        latitude = startLatitude + (targetLatitude - startLatitude) * eased;
        zoom = startZoom + (targetZoom - startZoom) * eased;
        draw();
        if (progress < 1) animationFrame = root.requestAnimationFrame(step);
        else animationFrame = 0;
      };
      animationFrame = root.requestAnimationFrame(step);
    }

    function setDetailValue(element, value) {
      if (element) element.textContent = value || '—';
    }

    function clearLandmarkMedia() {
      landmarkMedia?.classList.add('hidden');
      landmarkMedia?.classList.remove('is-expanded');
      if (landmarkMediaImage) {
        landmarkMediaImage.onload = null;
        landmarkMediaImage.onerror = null;
        landmarkMediaImage.removeAttribute('src');
        landmarkMediaImage.removeAttribute('alt');
      }
      landmarkMediaToggle?.setAttribute('aria-expanded', 'false');
      landmarkMediaToggle?.removeAttribute('aria-label');
      landmarkLearnMore?.removeAttribute('href');
      if (landmarkLearnMore) landmarkLearnMore.textContent = 'Learn about this landmark';
      landmarkMediaSource?.removeAttribute('href');
    }

    function hideLandmarkMedia() {
      landmarkMediaRequestId += 1;
      clearLandmarkMedia();
    }

    function getApprovedLandmarkCandidates(landmarkName) {
      const candidates = LANDMARK_WIKIPEDIA_CANDIDATES[landmarkName];
      return candidates || (landmarkName ? Object.freeze([landmarkName]) : EMPTY_LANDMARK_CANDIDATES);
    }

    function getLandmarkDirectCandidates(country) {
      const directCandidates = [];
      const seen = new Set();
      const addCandidate = candidate => {
        if (typeof candidate !== 'string') return;
        const title = candidate.trim();
        if (!title || seen.has(title)) return;
        seen.add(title);
        directCandidates.push(title);
      };

      (Array.isArray(country?.landmarks) ? country.landmarks : []).forEach(landmarkName => {
        if (typeof landmarkName !== 'string' || !landmarkName.trim()) return;
        const label = landmarkName.trim();
        getApprovedLandmarkCandidates(label).forEach(addCandidate);
        addCandidate(label);
      });
      return directCandidates;
    }

    function normalizeLandmarkMediaPage(page, candidateTitle, requireResponseTitle = false) {
      const imageUrl = page?.thumbnail?.source;
      const sourceUrl = page?.fullurl || page?.canonicalurl;
      const responseTitle = typeof page?.title === 'string' ? page.title.trim() : '';
      const resolvedTitle = responseTitle || candidateTitle;
      if (typeof imageUrl !== 'string' || !imageUrl
        || typeof sourceUrl !== 'string' || !sourceUrl
        || (requireResponseTitle && !responseTitle)
        || typeof resolvedTitle !== 'string' || !resolvedTitle) return null;

      return Object.freeze({ imageUrl, sourceUrl, resolvedTitle });
    }

    function normalizeLandmarkMediaResponse(data, candidateTitle) {
      const pages = data?.query?.pages;
      if (!pages || typeof pages !== 'object') return null;

      const [page] = Object.values(pages);
      return normalizeLandmarkMediaPage(page, candidateTitle);
    }

    function normalizeLandmarkSearchResponse(data) {
      const pages = data?.query?.pages;
      if (!pages || typeof pages !== 'object') return EMPTY_LANDMARK_CANDIDATES;

      return Object.values(pages)
        .sort((first, second) => {
          const firstIndex = Number.isFinite(first?.index) ? first.index : Number.POSITIVE_INFINITY;
          const secondIndex = Number.isFinite(second?.index) ? second.index : Number.POSITIVE_INFINITY;
          return firstIndex - secondIndex;
        })
        .map(page => normalizeLandmarkMediaPage(page, '', true))
        .filter(Boolean);
    }

    function loadLandmarkMedia(country) {
      const landmarkName = (Array.isArray(country?.landmarks) ? country.landmarks : [])
        .find(candidate => typeof candidate === 'string' && candidate.trim())?.trim();
      hideLandmarkMedia();
      if (!landmarkName || !root.fetch || !landmarkMedia || !landmarkMediaImage) return;

      const requestId = landmarkMediaRequestId;
      const candidates = getLandmarkDirectCandidates(country);
      let candidateIndex = 0;
      let candidateAttemptId = 0;
      let fallbackAttempted = false;

      const displayMedia = (media, isCurrentAttempt, onImageError) => {
        clearLandmarkMedia();
        landmarkMediaImage.onload = () => {
          if (isCurrentAttempt()) landmarkMedia.classList.remove('hidden');
        };
        landmarkMediaImage.onerror = () => {
          if (isCurrentAttempt()) onImageError();
        };
        landmarkMediaImage.alt = `${media.resolvedTitle} in ${country.name}`;
        landmarkMediaToggle?.setAttribute('aria-label', `Expand image of ${media.resolvedTitle}`);
        if (landmarkLearnMore) {
          landmarkLearnMore.href = media.sourceUrl;
          landmarkLearnMore.textContent = `Learn about ${media.resolvedTitle}`;
        }
        if (landmarkMediaSource) landmarkMediaSource.href = media.sourceUrl;
        landmarkMediaImage.src = media.imageUrl;
      };

      const beginFallback = () => {
        if (requestId !== landmarkMediaRequestId || fallbackAttempted) return;
        fallbackAttempted = true;
        const searchAttemptId = ++candidateAttemptId;
        const isCurrentSearchAttempt = () =>
          requestId === landmarkMediaRequestId && searchAttemptId === candidateAttemptId;

        const endpoint = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*'
          + '&generator=search&gsrsearch=' + encodeURIComponent(`${landmarkName} ${country.name}`)
          + '&gsrnamespace=0&gsrlimit=10&prop=pageimages|info'
          + '&piprop=thumbnail&inprop=url&pithumbsize=640';

        root.fetch(endpoint)
          .then(response => isCurrentSearchAttempt() && response.ok ? response.json() : null)
          .then(data => {
            if (!isCurrentSearchAttempt()) return;
            const fallbackCandidates = normalizeLandmarkSearchResponse(data);
            let fallbackCandidateIndex = 0;
            const tryNextFallbackCandidate = () => {
              if (requestId !== landmarkMediaRequestId) return;
              const media = fallbackCandidates[fallbackCandidateIndex++];
              if (!media) {
                clearLandmarkMedia();
                return;
              }

              const imageAttemptId = ++candidateAttemptId;
              const isCurrentImageAttempt = () =>
                requestId === landmarkMediaRequestId && imageAttemptId === candidateAttemptId;
              displayMedia(media, isCurrentImageAttempt, tryNextFallbackCandidate);
            };
            tryNextFallbackCandidate();
          })
          .catch(() => {
            if (isCurrentSearchAttempt()) clearLandmarkMedia();
          });
      };

      const tryNextCandidate = () => {
        if (requestId !== landmarkMediaRequestId) return;
        const wikipediaTitle = candidates[candidateIndex++];
        if (!wikipediaTitle) {
          beginFallback();
          return;
        }

        const attemptId = ++candidateAttemptId;
        const isCurrentAttempt = () =>
          requestId === landmarkMediaRequestId && attemptId === candidateAttemptId;
        const endpoint = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*'
          + '&titles=' + encodeURIComponent(wikipediaTitle)
          + '&redirects=1&prop=pageimages|info&piprop=thumbnail&inprop=url&pithumbsize=640';

        root.fetch(endpoint)
          .then(response => isCurrentAttempt() && response.ok ? response.json() : null)
          .then(data => {
            if (!isCurrentAttempt()) return;
            const media = normalizeLandmarkMediaResponse(data, wikipediaTitle);
            if (!media) {
              tryNextCandidate();
              return;
            }
            displayMedia(media, isCurrentAttempt, tryNextCandidate);
          })
          .catch(() => {
            if (isCurrentAttempt()) tryNextCandidate();
          });
      };

      tryNextCandidate();
    }

    landmarkMediaToggle?.addEventListener('click', () => {
      const expanded = landmarkMedia?.classList.toggle('is-expanded');
      landmarkMediaToggle.setAttribute('aria-expanded', String(expanded));
      const landmarkName = landmarkMediaImage?.alt?.replace(/ in .*$/, '') || 'landmark';
      landmarkMediaToggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} image of ${landmarkName}`);
    });

    function playExplorerSound(method, ...args) {
      if (document.hidden) return;
      const audio = root.AudioEngine;
      if (!audio || typeof audio[method] !== 'function') return;
      try {
        audio.init?.();
        audio[method](...args);
      } catch (audioError) {}
    }

    function renderFlagInto(element, country) {
      if (!element || !country) return;
      element.replaceChildren();
      const flagImage = document.createElement('img');
      flagImage.alt = '';
      element.appendChild(flagImage);
      if (root.AssetFallbacks?.prepareImage) {
        root.AssetFallbacks.prepareImage(flagImage, 'flag', country, {
          countryName: country.name,
          alt: ''
        });
      } else {
        flagImage.remove();
        element.textContent = country.flag;
      }
    }

    function resetHuntFeedback() {
      if (!huntFeedback) return;
      huntFeedback.classList.remove('is-correct', 'is-wrong');
      huntFeedback.classList.add('is-waiting');
      huntFeedbackFlag?.replaceChildren();
      if (huntFeedbackOutcome) huntFeedbackOutcome.textContent = 'Ready for your guess';
      if (huntFeedbackSelected) huntFeedbackSelected.textContent = 'Tap a country';
      if (huntFeedbackArrow) huntFeedbackArrow.textContent = '\u25CE';
      if (huntFeedbackDistance) huntFeedbackDistance.textContent = 'Ready';
      if (huntFeedbackDirection) huntFeedbackDirection.textContent = 'Choose on the globe';
    }

    function renderHuntFeedback(country, correct, hint) {
      if (!huntFeedback || !country) return;
      huntFeedback.classList.remove('is-waiting', 'is-correct', 'is-wrong');
      huntFeedback.classList.add(correct ? 'is-correct' : 'is-wrong');
      renderFlagInto(huntFeedbackFlag, country);
      if (huntFeedbackOutcome) {
        huntFeedbackOutcome.textContent = correct ? 'Correct country' : 'Not the target';
      }
      if (huntFeedbackSelected) huntFeedbackSelected.textContent = country.name;
      if (correct) {
        if (huntFeedbackArrow) huntFeedbackArrow.textContent = '\u2713';
        if (huntFeedbackDistance) huntFeedbackDistance.textContent = '+1 found';
        if (huntFeedbackDirection) huntFeedbackDirection.textContent = 'Next target loading';
        return;
      }
      if (huntFeedbackArrow) huntFeedbackArrow.textContent = hint?.arrow || '\u2192';
      if (huntFeedbackDistance) huntFeedbackDistance.textContent = hint?.displayDistance || 'Keep looking';
      if (huntFeedbackDirection) {
        huntFeedbackDirection.textContent = hint
          ? hint.directionLabel + ' \u00B7 ' + hint.proximity
          : 'Try another country';
      }
    }

    function hideHuntGuidance() {
      huntGuidance?.classList.add('hidden');
      huntGuidance?.removeAttribute('aria-label');
      if (huntDirectionArrow) huntDirectionArrow.textContent = '↗';
      if (huntDistance) huntDistance.textContent = '—';
      if (huntDirection) huntDirection.textContent = 'Direction to the target';
    }

    function renderHuntGuidance(country, target) {
      const selectedGeometry = geometryById.get(country?.id);
      const targetGeometry = geometryById.get(target?.id);
      const hint = geography?.hintBetween?.(selectedGeometry, targetGeometry);
      if (!hint) {
        hideHuntGuidance();
        return null;
      }
      if (huntDirectionArrow) huntDirectionArrow.textContent = hint.arrow;
      if (huntDistance) huntDistance.textContent = hint.displayDistance;
      if (huntDirection) huntDirection.textContent = `${hint.directionLabel} · ${hint.proximity}`;
      if (huntGuidance) {
        huntGuidance.setAttribute(
          'aria-label',
          `${target.name} is approximately ${hint.displayDistance} ${hint.directionLabel} of ${country.name}. ${hint.proximity}.`
        );
        huntGuidance.classList.remove('hidden');
      }
      return hint;
    }

    function resetHuntSelection() {
      huntSelectionCard?.classList.remove('is-correct', 'is-wrong');
      huntSelectionCard?.classList.add('is-empty');
      if (huntSelectedFlag) huntSelectedFlag.replaceChildren();
      if (huntSelectionLabel) huntSelectionLabel.textContent = 'Waiting for your choice';
      if (huntSelectedCountry) huntSelectedCountry.textContent = 'Tap a country';
      if (huntSelectionFeedback) huntSelectionFeedback.textContent = 'Your selection will appear here.';
      hideHuntGuidance();
      resetHuntFeedback();
    }

    function renderHuntTarget(country) {
      if (!country) return;
      if (huntTarget) huntTarget.textContent = country.name;
      if (huntPanelTarget) huntPanelTarget.textContent = country.name;
      renderFlagInto(huntTargetFlag, country);
      renderFlagInto(huntPanelTargetFlag, country);
    }

    function renderHuntSelection(country, correct, target) {
      if (!country || !target) return null;
      huntSelectionCard?.classList.remove('is-empty', 'is-correct', 'is-wrong');
      if (huntSelectionCard) void huntSelectionCard.offsetWidth;
      huntSelectionCard?.classList.add(correct ? 'is-correct' : 'is-wrong');
      renderFlagInto(huntSelectedFlag, country);
      if (huntSelectionLabel) huntSelectionLabel.textContent = correct ? 'Correct country' : 'Not the target';
      if (huntSelectedCountry) huntSelectedCountry.textContent = country.name;
      const hint = correct ? null : renderHuntGuidance(country, target);
      if (correct) hideHuntGuidance();
      renderHuntFeedback(country, correct, hint);
      if (huntSelectionFeedback) {
        huntSelectionFeedback.textContent = correct
          ? `You found ${target.name}. Next country coming up.`
          : hint
            ? `${target.name} is about ${hint.displayDistance} ${hint.directionLabel}. Keep looking.`
            : `${country.name} is not ${target.name}. Keep looking.`;
      }
      return hint;
    }

    function showHuntCelebration(country) {
      if (!huntCelebration || !country) return;
      if (huntCelebrationCountry) huntCelebrationCountry.textContent = country.name;
      huntCelebration.classList.remove('hidden');
      huntCelebration.classList.remove('is-active');
      void huntCelebration.offsetWidth;
      huntCelebration.classList.add('is-active');
      root.Particles?.burst?.(globeFrame, { count: 30, duration: 1700 });
      root.CelebrationText?.show?.(globeFrame);
    }

    function hideHuntCelebration() {
      huntCelebration?.classList.add('hidden');
      huntCelebration?.classList.remove('is-active');
    }
    function renderCountryCard(country) {
      if (!country) return;
      emptyCard.classList.add('hidden');
      countryCard.classList.remove('hidden');
      const isTerritory = country.kind === 'territory';
      if (identityKicker) identityKicker.textContent = isTerritory ? 'Territory selected' : 'Country selected';
      if (territoryStatus) {
        const relationship = country.parentName ? ` · Connected to ${country.parentName}` : '';
        territoryStatus.textContent = isTerritory ? `${country.status}${relationship}. ${country.flagNote}` : '';
        territoryStatus.classList.toggle('hidden', !isTerritory);
      }
      const detailsSummary = details?.querySelector('summary');
      if (detailsSummary) detailsSummary.textContent = isTerritory ? 'More territory details' : 'More country details';
      flag.replaceChildren();
      const flagImage = document.createElement('img');
      flagImage.alt = `${country.name} flag`;
      flag.appendChild(flagImage);
      if (root.AssetFallbacks?.prepareImage) {
        root.AssetFallbacks.prepareImage(flagImage, 'flag', country, {
          countryName: country.name,
          alt: flagImage.alt
        });
      } else {
        flagImage.remove();
        flag.textContent = country.flag;
        flag.setAttribute('aria-label', `${country.name} flag`);
      }
      name.textContent = country.name;
      region.textContent = `${country.continent} · ${country.subregion}`;
      setDetailValue(capital, country.capital);
      setDetailValue(population, country.population_hint);
      setDetailValue(languages, country.main_languages?.join(', '));
      setDetailValue(currency, country.currency);
      setDetailValue(area, country.area_hint);
      setDetailValue(
        neighbors,
        country.neighbors?.length ? country.neighbors.join(', ') : 'No land borders'
      );
      setDetailValue(landmark, country.landmarks?.[0]);
      setDetailValue(fact, country.fun_facts?.[0] || country.built_in_clue);
      loadLandmarkMedia(country);
      details.open = !huntActive;
      const practiceRegion = country.continent === 'South America'
        ? 'Americas'
        : country.continent;
      practiceButton.textContent = `Practice ${practiceRegion}`;
    }

    function selectCountry(countryId, options = {}) {
      const country = cardsById.get(Number(countryId));
      if (!country) return;
      playExplorerSound('playSubmitClick');
      selectedCountryId = country.id;
      hoveredCountryId = country.id;
      renderCountryCard(country);
      dismissSearch();
      searchInput.value = country.name;
      setStatus(`${country.name} ${country.kind === 'territory' ? 'territory' : 'country'} selected.`);
      live.textContent = `${country.name} selected. Capital: ${country.capital}.`;
      if (options.animate !== false) animateToCountry(country);
      else draw();
      root.dispatchEvent(new CustomEvent('geowars:explorer-country', {
        detail: { countryId: country.id, placeId: country.id, kind: country.kind || 'country', source: options.source || 'globe' }
      }));
    }

    function setExplorerMode(mode) {
      const isHunt = mode === 'hunt';
      freeModeButton?.classList.toggle('is-active', !isHunt);
      huntModeButton?.classList.toggle('is-active', isHunt);
      freeModeButton?.setAttribute('aria-pressed', String(!isHunt));
      huntModeButton?.setAttribute('aria-pressed', String(isHunt));
      screen.classList.toggle('is-hunt-active', isHunt);
      huntHud?.classList.toggle('hidden', !isHunt);
      if (stageTitle) stageTitle.textContent = isHunt ? 'Country Hunt' : 'Explore the world';
      if (stageHeadingCopy) {
        stageHeadingCopy.textContent = isHunt
          ? 'Find as many countries as you can.'
          : 'Drag, zoom, or search the world.';
      }
    }

    function clearHuntTimers() {
      if (huntInterval) root.clearInterval(huntInterval);
      if (huntAdvanceTimeout) root.clearTimeout(huntAdvanceTimeout);
      huntInterval = 0;
      huntAdvanceTimeout = 0;
    }

    function resetHuntPauseState() {
      huntPauseReasons.clear();
      huntPausedAt = 0;
      screen.classList.remove('is-hunt-paused');
    }

    function pauseHuntClock(reason) {
      if (!huntActive || huntPauseReasons.has(reason)) return;
      if (huntPauseReasons.size === 0 && huntDeadline) huntPausedAt = Date.now();
      huntPauseReasons.add(reason);
      screen.classList.add('is-hunt-paused');
    }

    function resumeHuntClock(reason) {
      if (!huntPauseReasons.delete(reason)) return;
      if (huntPauseReasons.size > 0) return;
      if (huntPausedAt && huntDeadline) huntDeadline += Date.now() - huntPausedAt;
      huntPausedAt = 0;
      screen.classList.remove('is-hunt-paused');
      updateHuntClock();
    }

    function handleHuntVisibility() {
      if (!huntActive) return;
      if (document.hidden) {
        pauseHuntClock('document-hidden');
        return;
      }
      const wasVisibilityPaused = huntPauseReasons.has('document-hidden');
      resumeHuntClock('document-hidden');
      if (wasVisibilityPaused && huntActive && huntDeadline && !huntPauseReasons.size) {
        live.textContent = 'Country Hunt resumed. ' + huntTimeLeft + ' seconds remain.';
      }
    }

    function chooseNextHuntTarget() {
      if (!huntActive || !cards.length) return;
      const candidates = cards.filter(country => country.id !== lastHuntTargetId);
      const next = candidates[Math.floor(Math.random() * candidates.length)] || cards[0];
      huntTargetId = next.id;
      lastHuntTargetId = next.id;
      selectedCountryId = null;
      hoveredCountryId = null;
      renderHuntTarget(next);
      resetHuntSelection();
      hideHuntCelebration();
      huntCompare?.classList.remove('hidden');
      emptyCard.classList.add('hidden');
      countryCard.classList.add('hidden');
      setStatus(`Find ${next.name}.`);
      live.textContent = `Find ${next.name}. ${huntTimeLeft} seconds remain.`;
      playExplorerSound('playRoundStart', huntScore);
      draw();
    }

    function updateHuntClock() {
      if (!huntActive || !huntDeadline || huntPauseReasons.size) return;
      const nextTime = Math.max(0, Math.ceil((huntDeadline - Date.now()) / 1000));
      if (nextTime !== huntTimeLeft) {
        huntTimeLeft = nextTime;
        if (huntTime) huntTime.textContent = String(huntTimeLeft);
      }
      if (huntTimeLeft <= 0) endHunt(true);
    }

    function startHunt() {
      clearHuntTimers();
      const sessionId = ++huntSessionId;
      stopAnimation();
      longitude = -16;
      latitude = 12;
      zoom = MIN_ZOOM;
      centeredCountryId = null;
      huntActive = true;
      huntDeadline = 0;
      resetHuntPauseState();
      huntTimeLeft = 60;
      huntScore = 0;
      huntTargetId = null;
      lastHuntTargetId = null;
      selectedCountryId = null;
      hoveredCountryId = null;
      dismissSearch();
      searchInput.value = '';
      huntSummary?.classList.add('hidden');
      huntCompare?.classList.add('hidden');
      hideHuntCelebration();
      resetHuntSelection();
      if (huntTime) huntTime.textContent = '60';
      if (huntScoreElement) huntScoreElement.textContent = '0';
      if (huntTarget) huntTarget.textContent = 'Get ready…';
      setExplorerMode('hunt');
      if (document.hidden) pauseHuntClock('document-hidden');
      setStatus('Loading your first country…');
      loadGeometry().then(loadedCountries => {
        if (!huntActive || sessionId !== huntSessionId || loadedCountries.length < cards.length) return;
        huntDeadline = Date.now() + 60000;
        if (huntPauseReasons.size) huntPausedAt = Date.now();
        chooseNextHuntTarget();
        huntInterval = root.setInterval(updateHuntClock, 250);
        canvas.focus({ preventScroll: true });
      });
    }

    function endHunt(showSummary = true) {
      const completedScore = huntScore;
      huntSessionId += 1;
      clearHuntTimers();
      huntActive = false;
      huntDeadline = 0;
      resetHuntPauseState();
      huntTargetId = null;
      hideHuntCelebration();
      huntCompare?.classList.add('hidden');
      setExplorerMode('free');
      if (showSummary) {
        emptyCard.classList.add('hidden');
        countryCard.classList.add('hidden');
        huntSummary?.classList.remove('hidden');
        if (huntFinalScore) huntFinalScore.textContent = String(completedScore);
        setStatus(`Country Hunt complete. ${completedScore} ${completedScore === 1 ? 'country' : 'countries'} found.`);
        live.textContent = `Time. You found ${completedScore} ${completedScore === 1 ? 'country' : 'countries'}.`;
        playExplorerSound('playGameEnd');
      }
      draw();
    }

    function showFreeExplorer() {
      endHunt(false);
      huntSummary?.classList.add('hidden');
      huntCompare?.classList.add('hidden');
      if (selectedCountryId) {
        renderCountryCard(cardsById.get(selectedCountryId));
      } else {
        emptyCard.classList.remove('hidden');
        countryCard.classList.add('hidden');
        if (emptyCardTitle) emptyCardTitle.textContent = 'Select a country or territory';
        if (emptyCardCopy) emptyCardCopy.textContent = 'Its flag, capital, status, and essential facts will appear here.';
      }
      setStatus(geometryState === 'partial'
        ? 'Country globe ready. Territory outlines are temporarily unavailable.'
        : 'Drag to explore. Select a country or territory to learn more.');
      canvas.focus({ preventScroll: true });
    }

    function handleCountryActivation(countryId, options = {}) {
      if (!huntActive) {
        selectCountry(countryId, options);
        return;
      }
      const country = cardsById.get(Number(countryId));
      const target = cardsById.get(huntTargetId);
      if (!country || !target || huntAdvanceTimeout || huntPauseReasons.size) return;
      if (Date.now() >= huntDeadline) {
        endHunt(true);
        return;
      }
      selectedCountryId = country.id;
      hoveredCountryId = country.id;
      if (country.id === target.id) {
        huntScore += 1;
        pauseHuntClock('answer-feedback');
        if (huntScoreElement) huntScoreElement.textContent = String(huntScore);
        renderHuntSelection(country, true, target);
        showHuntCelebration(country);
        playExplorerSound('playCorrect', 3, huntScore);
        root.GeoWarsHaptics?.play?.('correct');
        setStatus(`Correct — ${country.name}.`);
        live.textContent = `Correct. You found ${country.name}. ${huntScore} ${huntScore === 1 ? 'country' : 'countries'} found.`;
        draw();
        huntAdvanceTimeout = root.setTimeout(() => {
          huntAdvanceTimeout = 0;
          resumeHuntClock('answer-feedback');
          chooseNextHuntTarget();
        }, 1600);
      } else {
        const hint = renderHuntSelection(country, false, target);
        if (hint?.proximity === 'Nearby') playExplorerSound('playNearMiss');
        else playExplorerSound('playWrong');
        root.GeoWarsHaptics?.play?.(hint?.proximity === 'Nearby' ? 'near' : 'wrong');
        const guidanceCopy = hint ? ` ${hint.displayDistance} ${hint.directionLabel}.` : '';
        setStatus(`You selected ${country.name}.${guidanceCopy} Keep looking for ${target.name}.`);
        live.textContent = `${country.name} is not the target.${guidanceCopy} Keep looking for ${target.name}.`;
        draw();
      }
    }    function dismissSearch() {
      activeSearchIndex = -1;
      searchMatches = [];
      searchList.replaceChildren();
      searchList.classList.add('hidden');
      searchInput.setAttribute('aria-expanded', 'false');
      searchInput.removeAttribute('aria-activedescendant');
    }

    function chooseSearchResult(index) {
      const country = searchMatches[index];
      if (!country) return;
      selectCountry(country.id, { source: 'search' });
      searchInput.focus({ preventScroll: true });
    }

    function renderSearchResults() {
      if (huntActive) return;
      const query = searchInput.value.trim().toLocaleLowerCase('en');
      searchList.replaceChildren();
      activeSearchIndex = -1;
      if (!query) {
        dismissSearch();
        return;
      }

      searchMatches = explorerCards
        .filter(country => country.name.toLocaleLowerCase('en').includes(query))
        .sort((first, second) => {
          const firstStarts = first.name.toLocaleLowerCase('en').startsWith(query) ? 0 : 1;
          const secondStarts = second.name.toLocaleLowerCase('en').startsWith(query) ? 0 : 1;
          return firstStarts - secondStarts || first.name.localeCompare(second.name);
        })
        .slice(0, 8);

      if (!searchMatches.length) {
        const noResults = document.createElement('p');
        noResults.className = 'explorer-search-empty';
        noResults.textContent = 'No countries or territories found.';
        searchList.appendChild(noResults);
      } else {
        searchMatches.forEach((country, index) => {
          const option = document.createElement('button');
          option.type = 'button';
          option.id = `explorer-search-option-${index}`;
          option.className = 'explorer-search-option';
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');
          const resultType = country.kind === 'territory'
            ? `Territory · ${country.parentName || country.subregion}`
            : country.continent;
          option.innerHTML = `<span aria-hidden="true">${country.flag}</span><strong>${country.name}</strong><small>${resultType}</small>`;
          option.addEventListener('pointerdown', event => {
            event.preventDefault();
            chooseSearchResult(index);
          });
          option.addEventListener('click', () => chooseSearchResult(index));
          searchList.appendChild(option);
        });
      }

      searchList.classList.remove('hidden');
      searchInput.setAttribute('aria-expanded', 'true');
    }

    function setActiveSearchIndex(nextIndex) {
      if (!searchMatches.length) return;
      activeSearchIndex = (nextIndex + searchMatches.length) % searchMatches.length;
      Array.from(searchList.querySelectorAll('[role="option"]')).forEach((option, index) => {
        const active = index === activeSearchIndex;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-selected', String(active));
      });
      const activeOption = document.getElementById(`explorer-search-option-${activeSearchIndex}`);
      if (activeOption) {
        searchInput.setAttribute('aria-activedescendant', activeOption.id);
        activeOption.scrollIntoView({ block: 'nearest' });
      }
    }

    function renderMusicControl(playbackState) {
      if (!musicButton) return;
      const music = root.BackgroundMusic;
      const muted = music?.isMuted?.() || false;
      const playing = typeof playbackState === 'boolean'
        ? playbackState
        : !!music?.isPlaying?.();
      const label = muted ? 'Music off' : playing ? 'Music on' : 'Start music';
      musicButton.setAttribute('aria-pressed', String(muted));
      musicButton.setAttribute('aria-label', muted ? 'Turn music on' : playing ? 'Turn music off' : 'Start music');
      musicButton.dataset.playing = String(playing);
      if (musicButtonLabel) musicButtonLabel.textContent = label;
      if (musicButtonUse) {
        const href = muted
          ? 'assets/geowars-icons.svg#icon-sound-muted'
          : 'assets/geowars-icons.svg#icon-sound';
        musicButtonUse.setAttribute('href', href);
        musicButtonUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', href);
      }
    }

    function startExplorerMusic() {
      const music = root.BackgroundMusic;
      if (!music || music.isMuted?.()) {
        renderMusicControl(false);
        return Promise.resolve(false);
      }
      if (musicButtonLabel) musicButtonLabel.textContent = 'Starting…';
      try {
        return Promise.resolve(music.start()).then(playing => {
          renderMusicControl(!!playing && !!music.isPlaying?.());
          return !!playing;
        });
      } catch (musicError) {
        renderMusicControl(false);
        return Promise.resolve(false);
      }
    }

    function toggleExplorerMusic() {
      const music = root.BackgroundMusic;
      if (!music) return;
      const currentlyMuted = music.isMuted?.() || false;
      try {
        if (currentlyMuted) {
          music.setMuted(false);
          if (!music.isPlaying?.()) startExplorerMusic();
          else renderMusicControl(true);
        } else if (!music.isPlaying?.()) {
          startExplorerMusic();
        } else {
          music.setMuted(true);
          renderMusicControl(false);
        }
      } catch (musicError) {
        renderMusicControl(false);
      }
    }

    function renderHapticsControl() {
      if (!hapticsButton) return;
      const haptics = root.GeoWarsHaptics;
      const supported = !!haptics?.isSupported?.();
      screen.classList.toggle('has-haptics', supported);
      hapticsButton.classList.toggle('hidden', !supported);
      if (!supported) return;
      const enabled = !!haptics.isEnabled?.();
      hapticsButton.setAttribute('aria-pressed', String(enabled));
      hapticsButton.setAttribute('aria-label', enabled ? 'Turn haptics off' : 'Turn haptics on');
      if (hapticsButtonLabel) hapticsButtonLabel.textContent = enabled ? 'Haptics on' : 'Haptics off';
    }

    function toggleExplorerHaptics() {
      root.GeoWarsHaptics?.toggle?.();
      renderHapticsControl();
    }

    function retryGeometry() {
      if (geometryState === 'loading') return;
      if (huntActive) {
        startHunt();
        return;
      }
      loadGeometry().then(loadedCountries => {
        if (loadedCountries.length < cards.length) return;
        root.requestAnimationFrame(() => {
          resize();
          canvas.focus({ preventScroll: true });
        });
      });
    }

    function useSearchFallback() {
      showFreeExplorer();
      setStatus('The map is unavailable. Search for any country or territory to view its facts.');
      searchInput.focus({ preventScroll: true });
    }

    function refreshGeometryErrorCopy() {
      if (error.classList.contains('hidden') || !errorCopy) return;
      errorCopy.textContent = root.navigator?.onLine === false
        ? 'You appear to be offline. Reconnect, then try again.'
        : 'Connection restored. Try loading the map again.';
    }

    function openExplorer() {
      opened = true;
      try { root.AudioEngine?.init?.(); } catch (audioError) {}
      startExplorerMusic();
      navigation?.showExplorer?.();
      setStatus('Drag to explore. Select a country or territory to learn more.');
      loadGeometry().then(() => requestAnimationFrame(() => {
        resize();
        if (selectedCountryId) animateToCountry(cardsById.get(selectedCountryId));
      }));
    }

    function returnHome() {
      stopAnimation();
      endHunt(false);
      try { root.BackgroundMusic?.stop?.(); } catch (musicError) {}
      renderMusicControl(false);
      navigation?.showHome?.();
    }

    function startRegionalPractice() {
      endHunt(false);
      const country = cardsById.get(selectedCountryId);
      if (!country) return;
      const continentValue = country.continent === 'South America'
        ? 'North America'
        : country.continent;
      const regionButton = document.querySelector(
        `#continent-row [data-continent="${continentValue}"]`
      );
      const practiceMode = document.getElementById('btn-showoff');
      const startButton = document.getElementById('btn-start-game');
      regionButton?.click();
      practiceMode?.click();
      startButton?.click();
    }

    openButton.addEventListener('click', () => {
      openExplorer();
      showFreeExplorer();
    });
    renderHapticsControl();
    syncGlobeControls();
    openHuntButton?.addEventListener('click', () => {
      openExplorer();
      startHunt();
    });
    freeModeButton?.addEventListener('click', showFreeExplorer);
    huntModeButton?.addEventListener('click', startHunt);
    huntExitButton?.addEventListener('click', () => endHunt(true));
    huntAgainButton?.addEventListener('click', startHunt);
    huntFreeButton?.addEventListener('click', showFreeExplorer);
    homeButtons.forEach(button => button.addEventListener('click', returnHome));
    practiceButton.addEventListener('click', startRegionalPractice);
    musicButton?.addEventListener('click', toggleExplorerMusic);
    hapticsButton?.addEventListener('click', toggleExplorerHaptics);
    geometryRetryButton?.addEventListener('click', retryGeometry);
    searchFallbackButton?.addEventListener('click', useSearchFallback);
    document.addEventListener('visibilitychange', handleHuntVisibility);
    root.addEventListener('pagehide', () => pauseHuntClock('document-hidden'));
    root.addEventListener('pageshow', () => {
      if (!document.hidden) handleHuntVisibility();
    });
    root.addEventListener('online', refreshGeometryErrorCopy);
    root.addEventListener('offline', refreshGeometryErrorCopy);
    zoomInButton.addEventListener('click', () => setZoom(zoom + (zoom >= 4 ? 0.9 : 0.6)));
    zoomOutButton.addEventListener('click', () => setZoom(zoom - (zoom > 4 ? 0.75 : 0.4)));
    resetButton.addEventListener('click', () => {
      stopAnimation();
      longitude = -16;
      latitude = 12;
      zoom = 1;
      hoveredCountryId = null;
      setStatus(huntActive
        ? `Find ${getCountryName(huntTargetId)}.`
        : selectedCountryId
          ? `${getCountryName(selectedCountryId)} selected.`
          : 'Drag to explore. Select a country or territory to learn more.');
      draw();
      canvas.focus({ preventScroll: true });
    });

    searchInput.addEventListener('input', renderSearchResults);
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) renderSearchResults();
    });
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSearchIndex(activeSearchIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSearchIndex(activeSearchIndex - 1);
      } else if (event.key === 'Enter' && activeSearchIndex >= 0) {
        event.preventDefault();
        chooseSearchResult(activeSearchIndex);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dismissSearch();
      }
    });

    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('.explorer-search')) dismissSearch();
    });

    canvas.addEventListener('pointerdown', event => {
      stopAnimation();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      if (pointers.size === 1) {
        primaryPointerId = event.pointerId;
        dragging = true;
        startX = lastX = event.clientX;
        startY = lastY = event.clientY;
        dragDistance = 0;
      } else if (pointers.size === 2) {
        const [first, second] = [...pointers.values()];
        pinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
        pinchZoom = zoom;
      }
      globeFrame.classList.add('is-dragging');
    });

    canvas.addEventListener('pointermove', event => {
      if (pointers.has(event.pointerId)) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      if (pointers.size >= 2) {
        const [first, second] = [...pointers.values()];
        const nextDistance = Math.hypot(second.x - first.x, second.y - first.y);
        if (pinchDistance > 0) setZoom(pinchZoom * nextDistance / pinchDistance);
        dragDistance = Math.max(dragDistance, 12);
        return;
      }

      if (dragging && event.pointerId === primaryPointerId) {
        const deltaX = event.clientX - lastX;
        const deltaY = event.clientY - lastY;
        dragDistance = Math.max(
          dragDistance,
          Math.hypot(event.clientX - startX, event.clientY - startY)
        );
        const dragScale = Math.sqrt(zoom);
        setRotation(
          longitude - deltaX * 0.38 / dragScale,
          latitude + deltaY * 0.28 / dragScale
        );
        lastX = event.clientX;
        lastY = event.clientY;
        return;
      }

      if (!dragging && countries.length) {
        const nextHovered = readCountryAt(event.clientX, event.clientY);
        if (nextHovered !== hoveredCountryId) {
          hoveredCountryId = nextHovered;
          if (huntActive) {
            setStatus(nextHovered
              ? `Select this country to find ${getCountryName(huntTargetId)}.`
              : `Find ${getCountryName(huntTargetId)}.`);
          } else {
            setStatus(nextHovered
              ? `${getCountryName(nextHovered)}. Select to learn more.`
              : selectedCountryId
                ? `${getCountryName(selectedCountryId)} selected.`
                : 'Drag to explore. Select a country or territory to learn more.');
          }
          draw();
        }
      }
    });

    function finishPointer(event) {
      const wasPrimary = event.pointerId === primaryPointerId;
      const releasePoint = pointers.get(event.pointerId) || {
        x: event.clientX,
        y: event.clientY
      };
      pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      if (!pointers.size) {
        dragging = false;
        primaryPointerId = null;
        pinchDistance = 0;
        globeFrame.classList.remove('is-dragging');
        if (wasPrimary && dragDistance < 7 && countries.length) {
          const countryId = readCountryAt(releasePoint.x, releasePoint.y);
          if (countryId) handleCountryActivation(countryId, { source: event.pointerType || 'pointer' });
        } else if (dragDistance >= 7) {
          setStatus(huntActive
            ? `Find ${getCountryName(huntTargetId)}. Press Enter to choose the centered country.`
            : centeredCountryId
              ? `${getCountryName(centeredCountryId)} centered. Press Enter to select.`
              : 'Drag to explore. Select a country or territory to learn more.');
        }
      } else if (wasPrimary) {
        const [nextPointerId, nextPointer] = pointers.entries().next().value;
        primaryPointerId = nextPointerId;
        startX = lastX = nextPointer.x;
        startY = lastY = nextPointer.y;
      }
    }

    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);
    canvas.addEventListener('pointerleave', event => {
      if (dragging || pointers.has(event.pointerId)) return;
      hoveredCountryId = null;
      setStatus(huntActive
        ? `Find ${getCountryName(huntTargetId)}.`
        : selectedCountryId
          ? `${getCountryName(selectedCountryId)} selected.`
          : 'Drag to explore. Select a country or territory to learn more.');
      draw();
    });
    canvas.addEventListener('wheel', event => {
      if (!countries.length) return;
      event.preventDefault();
      setZoom(zoom * (event.deltaY < 0 ? 1.14 : 1 / 1.14));
    }, { passive: false });
    canvas.addEventListener('keydown', event => {
      const rotation = {
        ArrowLeft: [-10, 0],
        ArrowRight: [10, 0],
        ArrowUp: [0, 7],
        ArrowDown: [0, -7]
      };
      if (rotation[event.key]) {
        event.preventDefault();
        stopAnimation();
        setRotation(
          longitude + rotation[event.key][0] / zoom,
          latitude + rotation[event.key][1] / zoom
        );
        setStatus(huntActive
          ? `Find ${getCountryName(huntTargetId)}. Press Enter to choose the centered country.`
          : centeredCountryId
            ? `${getCountryName(centeredCountryId)} centered. Press Enter to select.`
            : 'Use arrow keys to explore.');
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom(zoom + (zoom >= 4 ? 0.9 : 0.6));
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setZoom(zoom - (zoom > 4 ? 0.75 : 0.4));
      } else if (event.key === 'Home') {
        event.preventDefault();
        resetButton.click();
      } else if ((event.key === 'Enter' || event.key === ' ') && centeredCountryId) {
        event.preventDefault();
        handleCountryActivation(centeredCountryId, { source: 'keyboard' });
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!opened || screen.classList.contains('hidden')) return;
      root.cancelAnimationFrame(resizeFrame);
      resizeFrame = root.requestAnimationFrame(resize);
    });
    resizeObserver.observe(globeFrame);

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.explorer = {
      open: openExplorer,
      close: returnHome,
      selectCountry,
      startHunt,
      endHunt,
      submitCountry: handleCountryActivation,
      getState: () => ({
        opened,
        longitude,
        latitude,
        zoom,
        selectedCountryId,
        hoveredCountryId,
        centeredCountryId,
        huntActive,
        huntTimeLeft,
        huntScore,
        huntTargetId,
        huntPaused: huntPauseReasons.size > 0,
        geometryState,
        geometryReady: countries.length === explorerCards.length,
        territoryGeometryReady
      })
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExplorer, { once: true });
  } else {
    initializeExplorer();
  }
}(window));
