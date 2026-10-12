/* Playable Atlas controller: workspace navigation and country-shape study. */
(function (root) {
  'use strict';

  function initializeAtlas() {
    var screen = document.getElementById('explorer');
    var globeWorkspace = document.getElementById('atlas-globe-workspace');
    var shapesWorkspace = document.getElementById('atlas-shapes-workspace');
    var globeButton = document.getElementById('btn-atlas-globe');
    var shapesButton = document.getElementById('btn-atlas-shapes');
    var shapeTitle = document.getElementById('atlas-shapes-title');
    var shapeSelect = document.getElementById('atlas-shape-country');
    var previousButton = document.getElementById('btn-atlas-shape-previous');
    var nextButton = document.getElementById('btn-atlas-shape-next');
    var shapeArt = document.getElementById('atlas-shape-art');
    var shapeIndex = document.getElementById('atlas-shape-index');
    var shapeStatus = document.getElementById('atlas-shape-status');
    // Legacy hidden stubs kept so existing writes/tests stay valid; the visible
    // facts now come from the shared, relocated country card.
    var shapeRegion = document.getElementById('atlas-shape-region');
    var shapeName = document.getElementById('atlas-shape-name');
    var shapeCapital = document.getElementById('atlas-shape-capital');
    var shapeBorders = document.getElementById('atlas-shape-borders');
    var shapeArea = document.getElementById('atlas-shape-area');
    var live = document.getElementById('explorer-live');
    var themeColor = document.querySelector?.('meta[name="theme-color"]');

    // The shared rich country card and the slot in the Shapes view that hosts it.
    var infoPanel = typeof document.querySelector === 'function'
      ? document.querySelector('.explorer-info-panel')
      : null;
    var infoHome = infoPanel ? infoPanel.parentNode : null;
    var infoSlot = document.getElementById('atlas-shape-info-slot');
    var shapeExploreButton = document.getElementById('btn-atlas-shape-explore');
    var shapeChallengeButton = document.getElementById('btn-atlas-shape-challenge');

    if (!screen || !globeWorkspace || !shapesWorkspace || !globeButton || !shapesButton) return;

    var cards = typeof countryCards !== 'undefined' && Array.isArray(countryCards)
      ? countryCards.slice().sort(function (a, b) { return a.name.localeCompare(b.name); })
      : [];
    // Open on Canada (id 2) rather than the alphabetical-first card
    // (Afghanistan). Fall back to the first card if Canada is missing.
    var defaultIndex = cards.findIndex(function (card) { return card.id === 2; });
    var currentIndex = defaultIndex >= 0 ? defaultIndex : 0;
    var renderSequence = 0;
    var shapeRendered = false;
    var demoTimer = null;
    var demoActive = false;

    function setWorkspaceAvailable(workspace, available) {
      workspace.hidden = !available;
      workspace.classList.toggle('hidden', !available);
      workspace.inert = !available;
      if (available) {
        workspace.removeAttribute('aria-hidden');
        workspace.removeAttribute('inert');
      } else {
        workspace.setAttribute('aria-hidden', 'true');
        workspace.setAttribute('inert', '');
      }
    }

    function announce(message) {
      if (live) live.textContent = message;
    }

    function setShapeStatus(message) {
      if (shapeStatus) shapeStatus.textContent = message;
    }

    function stopDemoMode() {
      var wasActive = demoActive || demoTimer !== null;
      demoActive = false;
      if (demoTimer !== null) {
        root.clearInterval?.(demoTimer);
        demoTimer = null;
      }
      if (wasActive) setShapeStatus('Preview paused - use the controls to browse.');
    }

    function selectRandomCountry() {
      if (cards.length < 2) return;
      var nextIndex = Math.floor(Math.random() * cards.length);
      if (nextIndex === currentIndex) nextIndex = (nextIndex + 1) % cards.length;
      selectIndex(nextIndex, { announce: false });
    }

    function startDemoMode() {
      stopDemoMode();
      if (cards.length < 2 || typeof root.setInterval !== 'function') {
        syncCountry({ render: true });
        setShapeStatus('Use the controls to browse.');
        return;
      }
      demoActive = true;
      setShapeStatus('Preview mode is on - click to take over.');
      // Open on the default country (Canada) so it is the visible default, then
      // begin rotating through random countries on each timer tick.
      syncCountry({ render: true });
      demoTimer = root.setInterval(function () {
        if (!demoActive || screen.dataset.atlasView !== 'shapes') {
          stopDemoMode();
          return;
        }
        selectRandomCountry();
      }, 5000);
    }

    function stopDemoOnInteraction() {
      stopDemoMode();
    }

    // Move the one rich country card into the Shapes view (single source of
    // truth) or back to its globe home. Guarded so a missing node never throws.
    function moveInfoPanelToShapes() {
      if (infoPanel && infoSlot && infoPanel.parentNode !== infoSlot) {
        infoSlot.appendChild(infoPanel);
      }
    }
    function restoreInfoPanel() {
      if (infoPanel && infoHome && infoPanel.parentNode !== infoHome) {
        infoHome.appendChild(infoPanel);
      }
    }

    // Populate the shared card with the current country via the explorer's
    // single render path (no camera move, fires the economics event).
    function renderSharedCard(card) {
      if (!card) return;
      try {
        root.GeoWars?.explorer?.renderCountry?.(card.id, { source: 'atlas-shapes' });
      } catch (e) { /* explorer not ready: the shape still renders */ }
    }

    function renderShape(card) {
      if (!shapeArt || !card) return Promise.resolve(null);
      var sequence = ++renderSequence;
      shapeArt.setAttribute('aria-busy', 'true');
      shapeArt.textContent = 'Loading border…';
      var renderer = root.GeoWarsShapeGeometry;
      if (!renderer || typeof renderer.render !== 'function') {
        shapeArt.removeAttribute('aria-busy');
        shapeArt.textContent = 'Border outline unavailable.';
        return Promise.resolve(null);
      }
      return renderer.render(shapeArt, card, { padding: 0.08, compactBounds: document.body?.classList?.contains('design-review') })
        .then(function (element) {
          if (sequence !== renderSequence) return null;
          shapeArt.removeAttribute('aria-busy');
          shapeRendered = true;
          return element;
        })
        .catch(function () {
          if (sequence !== renderSequence) return null;
          shapeArt.removeAttribute('aria-busy');
          shapeArt.textContent = 'Border outline unavailable.';
          announce(card.name + ' border outline could not be loaded.');
          return null;
        });
    }

    function syncCountry(options) {
      options = options || {};
      var card = cards[currentIndex];
      if (!card) return;
      if (shapeSelect) shapeSelect.value = String(card.id);
      if (document.body?.classList?.contains('design-review')) {
        var countryHeading = document.getElementById('atlas-shape-toolbar-title');
        if (countryHeading) countryHeading.textContent = card.name;
      }
      if (shapeIndex) {
        // Editorial position marker rather than a zero-padded id: the letter the
        // current country sorts under, so browsing feels alphabetical, not numeric.
        shapeIndex.textContent = (card.name.charAt(0) || '').toUpperCase();
      }
      // Keep the legacy hidden stubs in sync (compatibility + tests).
      if (shapeRegion) shapeRegion.textContent = card.subregion || card.continent || 'World';
      if (shapeName) shapeName.textContent = card.name;
      if (shapeCapital) shapeCapital.textContent = card.capital || 'No official capital';
      if (shapeBorders) {
        var borderCount = Array.isArray(card.neighbors) ? card.neighbors.length : 0;
        shapeBorders.textContent = borderCount ? String(borderCount) : 'None';
      }
      if (shapeArea) shapeArea.textContent = card.area_hint || 'Area unavailable';
      // Visible facts come from the shared rich card (flag, capital, population,
      // languages, currency, fun fact, landmark, economics — formatted once).
      // Only populate it while the Shapes view owns the panel, so the initial
      // globe view keeps its own empty-until-selected card behaviour.
      if (screen.dataset.atlasView === 'shapes') renderSharedCard(card);
      if (options.render !== false) renderShape(card);
      if (options.announce) announce('Studying ' + card.name + ', ' + (currentIndex + 1) + ' of ' + cards.length + '.');
    }

    function selectIndex(index, options) {
      if (!cards.length) return;
      currentIndex = (index + cards.length) % cards.length;
      syncCountry(options);
    }

    function isHuntActive() {
      return Boolean(root.GeoWars?.explorer?.getState?.().huntActive);
    }

    // Confirmation shown when the player taps Shapes mid-hunt. Ending the hunt
    // when switching views should be a deliberate choice, not a silent surprise.
    var huntSwitchDialog = document.getElementById('hunt-switch-confirm');
    var huntSwitchTitle = document.getElementById('hunt-switch-title');
    var huntSwitchYes = document.getElementById('btn-hunt-switch-yes');
    var huntSwitchNo = document.getElementById('btn-hunt-switch-no');
    var huntSwitchReturnFocus = null;

    function isHuntSwitchOpen() {
      return Boolean(huntSwitchDialog) && !huntSwitchDialog.classList.contains('hidden');
    }

    function requestShapesDuringHunt() {
      // No dialog available (e.g. stripped markup): fall back to an announcement
      // rather than trapping the player in the hunt with no path out.
      if (!huntSwitchDialog) {
        announce('End Country Hunt before opening country shapes.');
        return;
      }
      huntSwitchReturnFocus = document.activeElement;
      huntSwitchDialog.classList.remove('hidden');
      huntSwitchDialog.hidden = false;
      (huntSwitchTitle || huntSwitchYes)?.focus?.({ preventScroll: true });
    }

    function closeHuntSwitchDialog(restoreFocus) {
      if (!huntSwitchDialog) return;
      huntSwitchDialog.classList.add('hidden');
      huntSwitchDialog.hidden = true;
      if (restoreFocus && huntSwitchReturnFocus && typeof huntSwitchReturnFocus.focus === 'function') {
        huntSwitchReturnFocus.focus({ preventScroll: true });
      }
      huntSwitchReturnFocus = null;
    }

    function confirmEndHuntAndShowShapes() {
      closeHuntSwitchDialog(false);
      // End the hunt first, then switch with the confirmed flag so setView's
      // guard lets it through.
      root.GeoWars?.explorer?.endHunt?.(false);
      setView('shapes', { focus: true, confirmedEndHunt: true });
    }

    if (huntSwitchYes) huntSwitchYes.addEventListener('click', confirmEndHuntAndShowShapes);
    if (huntSwitchNo) huntSwitchNo.addEventListener('click', function () { closeHuntSwitchDialog(true); });
    if (huntSwitchDialog) {
      huntSwitchDialog.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeHuntSwitchDialog(true);
        }
      });
    }

    function syncHuntAvailability(active) {
      var huntActive = typeof active === 'boolean' ? active : isHuntActive();
      // The Shapes button stays enabled during a hunt: clicking it now prompts a
      // confirmation (see requestView) instead of being silently blocked.
      shapesButton.disabled = false;
      shapesButton.removeAttribute('aria-disabled');
      if (huntActive && screen.dataset.atlasView === 'shapes') {
        setView('globe', { announce: false });
      }
    }

    function setView(view, options) {
      options = options || {};
      var showShapes = view === 'shapes';
      var wasShapes = screen.dataset.atlasView === 'shapes';
      if (showShapes && isHuntActive() && !options.confirmedEndHunt) {
        // A hunt is in progress. Don't switch silently; ask first (unless the
        // caller already confirmed and ended the hunt on the player's behalf).
        requestShapesDuringHunt();
        return false;
      }
      if (!showShapes) stopDemoMode();
      screen.dataset.atlasView = showShapes ? 'shapes' : 'globe';
      if (document.body?.dataset) document.body.dataset.atlasView = showShapes ? 'shapes' : 'globe';
      // Switching views always lands on that view's calm Explore sub-mode, never
      // a restored game mode. Globe -> exit any hunt (endHunt calls
      // setExplorerMode('free')); Shapes -> collapse the quiz setup.
      if (showShapes) root.GeoWars?.shapes?.setQuizSetupOpen?.(false);
      else root.GeoWars?.explorer?.endHunt?.(false);
      // Both views are dark now; the Shapes view no longer flips to a light paper theme.
      themeColor?.setAttribute('content', '#07111f');
      // Relocate the shared country card so it lives beside whichever stage is
      // active. Move BEFORE toggling inert/hidden so focus/aria stay coherent.
      if (showShapes) moveInfoPanelToShapes();
      else restoreInfoPanel();
      setWorkspaceAvailable(globeWorkspace, !showShapes);
      setWorkspaceAvailable(shapesWorkspace, showShapes);
      globeButton.classList.toggle('is-active', !showShapes);
      shapesButton.classList.toggle('is-active', showShapes);
      globeButton.setAttribute('aria-pressed', String(!showShapes));
      shapesButton.setAttribute('aria-pressed', String(showShapes));
      if (showShapes) {
        if (!wasShapes) startDemoMode();
        else syncCountry({ render: true });
      }
      if (options.focus) {
        var focusTarget = showShapes ? shapeTitle : document.getElementById('explorer-stage-title');
        focusTarget?.focus({ preventScroll: true });
      }
      if (options.announce !== false) announce(showShapes ? 'Country shapes view.' : 'Interactive globe view.');
      return true;
    }

    if (shapeSelect) {
      cards.forEach(function (card) {
        var option = document.createElement('option');
        option.value = String(card.id);
        option.textContent = card.name;
        shapeSelect.appendChild(option);
      });
      shapeSelect.addEventListener('change', function () {
        stopDemoOnInteraction();
        var index = cards.findIndex(function (card) { return card.id === Number(shapeSelect.value); });
        if (index >= 0) selectIndex(index, { announce: true });
      });
    }

    shapesWorkspace.addEventListener('pointerdown', stopDemoOnInteraction);
    shapesWorkspace.addEventListener('click', stopDemoOnInteraction);
    shapesWorkspace.addEventListener('keydown', stopDemoOnInteraction);

    globeButton.addEventListener('click', function () { setView('globe', { focus: true }); });
    shapesButton.addEventListener('click', function () { setView('shapes', { focus: true }); });
    root.addEventListener?.('geowars:explorer-mode', function (event) {
      syncHuntAvailability(event.detail?.mode === 'hunt');
    });
    previousButton?.addEventListener('click', function () {
      stopDemoOnInteraction();
      selectIndex(currentIndex - 1, { announce: true });
    });
    nextButton?.addEventListener('click', function () {
      stopDemoOnInteraction();
      selectIndex(currentIndex + 1, { announce: true });
    });

    // Explore is the calm browse mode (default). It's the mirror of the globe's
    // Explore tab; the Shape Quiz button (wired in app.js) launches the game.
    shapeExploreButton?.addEventListener('click', function () {
      stopDemoOnInteraction();
      shapeExploreButton.classList.add('is-active');
      shapeExploreButton.setAttribute('aria-pressed', 'true');
      shapeChallengeButton?.classList.remove('is-active');
      shapeChallengeButton?.setAttribute('aria-pressed', 'false');
      announce('Explore mode. Browse country shapes at your pace.');
    });
    shapeChallengeButton?.addEventListener('click', stopDemoOnInteraction);

    syncCountry({ render: false });
    setView(screen.dataset.atlasView === 'shapes' ? 'shapes' : 'globe', { announce: false });
    syncHuntAvailability();

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.atlas = Object.freeze({
      showGlobe: function (options) { setView('globe', Object.assign({ focus: true }, options)); },
      showShapes: function (options) { setView('shapes', Object.assign({ focus: true }, options)); },
      selectCountry: function (countryId) {
        var index = cards.findIndex(function (card) { return card.id === Number(countryId); });
        if (index >= 0) selectIndex(index, { announce: true });
      },
      getState: function () {
        return {
          view: screen.dataset.atlasView,
          countryId: cards[currentIndex]?.id || null,
          countryCount: cards.length,
          demoActive: demoActive
        };
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAtlas, { once: true });
  } else {
    initializeAtlas();
  }
}(window));
