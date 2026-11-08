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

    // Mode-first navigation (Explore / Challenge / Daily Puzzle). Every lookup
    // is optional so stripped markup and vm harnesses keep working.
    var exploreModeButton = document.getElementById('btn-mode-explore');
    var challengeModeButton = document.getElementById('btn-mode-challenge');
    var dailyModeButton = document.getElementById('btn-open-worldle');
    var dailyWorkspace = document.getElementById('worldle-screen');
    var dailyTitle = document.getElementById('worldle-title');
    var exploreSwitch = document.getElementById('atlas-explore-switch');
    var challengePanel = document.getElementById('atlas-challenge-panel');
    var challengeTitle = document.getElementById('atlas-challenge-title');
    var globeTitle = document.getElementById('atlas-globe-title');
    var challengeHuntButton = document.getElementById('btn-challenge-hunt');

    if (!screen || !globeWorkspace || !shapesWorkspace || !globeButton || !shapesButton) return;
    if (dailyWorkspace && dailyWorkspace.parentNode !== screen) screen.appendChild(dailyWorkspace);

    // Single owner of the Atlas mode state. In memory only, so every page load
    // starts on Explore / Globe.
    var modeState = {
      mode: 'explore',            // 'explore' | 'challenge' | 'daily'
      exploreView: 'globe',       // last Explore view this page session
      challengeStage: 'panel',    // 'panel' | 'hunt' | 'summary' (challenge only)
      dailyReturn: null,          // { mode, exploreView } while Worldle is open
      pendingSwitch: null         // { target, opener } while the hunt dialog is open
    };

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

    // Available: visible, in the accessibility tree, and interactive.
    // Unavailable: hidden, .hidden, inert, and aria-hidden, all four together.
    function setRegionAvailable(region, available) {
      if (!region) return;
      region.hidden = !available;
      region.classList.toggle('hidden', !available);
      region.inert = !available;
      if (available) {
        region.removeAttribute('aria-hidden');
        region.removeAttribute('inert');
      } else {
        region.setAttribute('aria-hidden', 'true');
        region.setAttribute('inert', '');
      }
    }
    // Compatibility alias for the original name.
    var setWorkspaceAvailable = setRegionAvailable;

    function setPressed(button, pressed) {
      if (!button) return;
      button.classList.toggle('is-active', pressed);
      button.setAttribute('aria-pressed', String(pressed));
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
      return renderer.render(shapeArt, card, { padding: 0.08, compactBounds: true })
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

    // Set while atlas itself ends a hunt, so the resulting
    // geowars:explorer-mode event does not re-enter the mode controller.
    var suppressHuntEvents = false;

    // Every hunt end that atlas starts goes through here: no Hunt_Summary, and
    // the lifecycle event it emits is ignored.
    function endHuntQuietly() {
      suppressHuntEvents = true;
      try {
        root.GeoWars?.explorer?.endHunt?.(false);
      } catch (e) {
        /* explorer not ready: nothing to end */
      } finally {
        suppressHuntEvents = false;
      }
    }

    // Confirmation shown when the player switches views mid-hunt. Ending the hunt
    // when switching should be a deliberate choice, not a silent surprise.
    // Generalized for Explore, Shapes, and Daily Puzzle targets.
    var huntSwitchDialog = document.getElementById('hunt-switch-confirm');
    var huntSwitchTitle = document.getElementById('hunt-switch-title');
    var huntSwitchMessage = document.getElementById('hunt-switch-message');
    var huntSwitchYes = document.getElementById('btn-hunt-switch-yes');
    var huntSwitchNo = document.getElementById('btn-hunt-switch-no');

    function isHuntSwitchOpen() {
      return Boolean(huntSwitchDialog) && !huntSwitchDialog.classList.contains('hidden');
    }

    // Dialog message templates per target (design "Hunt_Switch_Dialog texts").
    var HUNT_SWITCH_MESSAGES = {
      explore: 'Switching to Explore will end your current Country Hunt.',
      shapes: 'Switching to Shapes will end your current Country Hunt.',
      daily: 'Opening the Daily Puzzle will end your current Country Hunt.'
    };

    // Request a hunt switch for a specific target. Stores the pending switch and
    // opens the confirmation dialog with the appropriate message.
    function requestHuntSwitch(target, opener) {
      if (!huntSwitchDialog) {
        // No dialog available (e.g. stripped markup): fall back to an announcement
        // rather than trapping the player in the hunt with no path out.
        announce('End Country Hunt before switching views.');
        return;
      }
      var normalizedTarget = target === 'explore' || target === 'shapes' || target === 'daily'
        ? target
        : 'explore';
      modeState.pendingSwitch = {
        target: normalizedTarget,
        opener: opener || document.activeElement
      };
      if (huntSwitchMessage && HUNT_SWITCH_MESSAGES[normalizedTarget]) {
        huntSwitchMessage.textContent = HUNT_SWITCH_MESSAGES[normalizedTarget];
      }
      huntSwitchDialog.classList.remove('hidden');
      huntSwitchDialog.hidden = false;
      (huntSwitchTitle || huntSwitchYes)?.focus?.({ preventScroll: true });
    }

    function cancelHuntSwitch() {
      if (!huntSwitchDialog) return;
      var opener = modeState.pendingSwitch?.opener;
      huntSwitchDialog.classList.add('hidden');
      huntSwitchDialog.hidden = true;
      modeState.pendingSwitch = null;
      if (opener && typeof opener.focus === 'function') {
        opener.focus({ preventScroll: true });
      }
    }

    function confirmHuntSwitch() {
      if (!huntSwitchDialog) return;
      var pending = modeState.pendingSwitch;
      huntSwitchDialog.classList.add('hidden');
      huntSwitchDialog.hidden = true;
      modeState.pendingSwitch = null;
      if (!pending) return;
      endHuntQuietly();
      var target = pending.target;
      if (target === 'daily') {
        openDailyPuzzle({ opener: pending.opener, confirmedEndHunt: true });
      } else if (target === 'shapes') {
        setView('shapes', { focus: true, confirmedEndHunt: true });
      } else {
        // target === 'explore': return to Explore with the remembered view.
        setMode('explore', { focus: true, confirmedEndHunt: true });
      }
    }

    if (huntSwitchYes) huntSwitchYes.addEventListener('click', confirmHuntSwitch);
    if (huntSwitchNo) huntSwitchNo.addEventListener('click', cancelHuntSwitch);
    if (huntSwitchDialog) {
      huntSwitchDialog.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          cancelHuntSwitch();
        }
      });
    }

    // Pure projection from modeState to the DOM (design "Data Models" table).
    // Idempotent: calling it twice leaves the same DOM.
    function applyLayout() {
      var explore = modeState.mode === 'explore';
      var challenge = modeState.mode === 'challenge';
      var daily = modeState.mode === 'daily';
      var showShapes = explore && modeState.exploreView === 'shapes';
      var showGlobe = (explore && modeState.exploreView === 'globe') ||
        (challenge && modeState.challengeStage !== 'panel');
      var showPanel = challenge && modeState.challengeStage === 'panel';
      var wasShapes = screen.dataset.atlasView === 'shapes';
      var view = showShapes ? 'shapes' : 'globe';

      if (!showShapes) stopDemoMode();
      screen.dataset.atlasView = view;
      screen.dataset.atlasMode = modeState.mode;
      if (document.body?.dataset) {
        document.body.dataset.atlasView = view;
        document.body.dataset.atlasMode = modeState.mode;
      }
      // Shapes always opens on its calm study layout, never the quiz setup.
      if (showShapes) root.GeoWars?.shapes?.setQuizSetupOpen?.(false);
      // Both views are dark now; the Shapes view no longer flips to a light paper theme.
      themeColor?.setAttribute('content', '#07111f');
      // Relocate the shared country card so it lives beside whichever stage is
      // active. Move BEFORE toggling inert/hidden so focus/aria stay coherent.
      if (showShapes) moveInfoPanelToShapes();
      else restoreInfoPanel();
      setRegionAvailable(exploreSwitch, explore);
      setRegionAvailable(globeWorkspace, showGlobe);
      setRegionAvailable(shapesWorkspace, showShapes);
      setRegionAvailable(challengePanel, showPanel);
      setRegionAvailable(dailyWorkspace, daily);
      setPressed(exploreModeButton, explore);
      setPressed(challengeModeButton, challenge);
      setPressed(dailyModeButton, daily);
      setPressed(globeButton, modeState.exploreView === 'globe');
      setPressed(shapesButton, modeState.exploreView === 'shapes');
      if (showShapes) {
        if (!wasShapes) startDemoMode();
        else syncCountry({ render: true });
      }
      root.GeoWars?.mobile?.sync?.();
    }

    function focusHeading(target) {
      target?.focus?.({ preventScroll: true });
    }

    function exploreHeading(view) {
      return view === 'shapes'
        ? shapeTitle
        : (globeTitle || document.getElementById('explorer-stage-title'));
    }

    function exploreModeMessage(view) {
      return view === 'shapes' ? 'Explore mode. Shapes view.' : 'Explore mode. Globe view.';
    }

    // Leaving the Hunt_Summary stage hides the summary and restores the card.
    function leaveHuntSummary() {
      if (modeState.mode === 'challenge' && modeState.challengeStage === 'summary') {
        try { root.GeoWars?.explorer?.dismissHuntSummary?.(); } catch (e) { /* explorer not ready */ }
      }
    }

    function setView(view, options) {
      options = options || {};
      var showShapes = view === 'shapes';
      if (showShapes && isHuntActive() && !options.confirmedEndHunt) {
        // A hunt is in progress. Don't switch silently; ask first (unless the
        // caller already confirmed and ended the hunt on the player's behalf).
        requestHuntSwitch('shapes', null);
        return false;
      }
      leaveHuntSummary();
      if (modeState.mode === 'daily') root.GeoWars?.worldle?.close?.();
      modeState.dailyReturn = null;
      // Switching views always lands on that view's calm Explore state, never a
      // restored game mode.
      modeState.mode = 'explore';
      modeState.exploreView = showShapes ? 'shapes' : 'globe';
      modeState.challengeStage = 'panel';
      // Globe -> exit a running hunt silently (showGlobe contract).
      if (isHuntActive()) endHuntQuietly();
      applyLayout();
      if (options.focus) focusHeading(exploreHeading(modeState.exploreView));
      if (options.announce !== false) announce(showShapes ? 'Country shapes view.' : 'Interactive globe view.');
      return true;
    }

    // Mode_Nav switch. Explore shows the remembered Explore view (or
    // options.view); Challenge shows Challenge_Panel.
    function setMode(mode, options) {
      options = options || {};
      var scrollTop = options.focus && options.scroll !== false;
      if (mode === 'challenge') {
        if (isHuntActive()) {
          // A running hunt stays running and keeps Challenge pressed.
          modeState.mode = 'challenge';
          modeState.challengeStage = 'hunt';
          applyLayout();
          if (options.announce !== false) announce('Country Hunt in progress.');
          return false;
        }
        leaveHuntSummary();
        if (modeState.mode === 'daily') root.GeoWars?.worldle?.close?.();
        modeState.dailyReturn = null;
        modeState.mode = 'challenge';
        modeState.challengeStage = 'panel';
        applyLayout();
        if (options.focus) focusHeading(challengeTitle);
        if (scrollTop) root.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
        if (options.announce !== false) announce('Challenge mode. Choose Country Hunt or Shape Quiz.');
        return true;
      }
      var view = options.view === 'shapes' || options.view === 'globe'
        ? options.view
        : modeState.exploreView;
      if (isHuntActive() && !options.confirmedEndHunt) {
        // Never end a running hunt from Explore without asking first.
        requestHuntSwitch('explore', options.opener || null);
        return false;
      }
      if (!setView(view, { announce: false, confirmedEndHunt: options.confirmedEndHunt })) return false;
      if (options.focus) focusHeading(exploreHeading(view));
      if (scrollTop) root.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
      if (options.announce !== false) announce(exploreModeMessage(view));
      return true;
    }

    // Hunt lifecycle from globe-explorer.js (design "Atlas reaction to the
    // event" table). Idempotent: returnHome() emits two free events in a row.
    function handleExplorerModeEvent(detail) {
      detail = detail || {};
      if (suppressHuntEvents) return;
      if (detail.mode === 'hunt') {
        // Panel start, "Play again", or the explorer.startHunt() API. No focus
        // change: startHunt focuses the canvas itself.
        modeState.mode = 'challenge';
        modeState.challengeStage = 'hunt';
        applyLayout();
        return;
      }
      if (detail.mode !== 'free') return;
      if (detail.summary) {
        // Timer expiry or End hunt: stay in Challenge on the summary.
        modeState.mode = 'challenge';
        modeState.challengeStage = 'summary';
        applyLayout();
        if (isHuntSwitchOpen()) {
          // Summary arrived while the dialog was open: close it, clear pending,
          // and focus the opener.
          var opener = modeState.pendingSwitch?.opener;
          huntSwitchDialog.classList.add('hidden');
          huntSwitchDialog.hidden = true;
          modeState.pendingSwitch = null;
          if (opener && typeof opener.focus === 'function') {
            opener.focus({ preventScroll: true });
          }
        }
        return;
      }
      // "Explore freely", the hidden #btn-explorer-free, or returnHome: leave
      // Challenge for Explore Globe. Already in Explore means nothing to do.
      if (modeState.mode !== 'challenge') return;
      if (isHuntSwitchOpen()) {
        modeState.pendingSwitch = null;
        cancelHuntSwitch();
      }
      setMode('explore', { view: 'globe' });
    }

    // Challenge_Panel "Start hunt". Show the globe stage first so the engine
    // starts against a visible canvas, then hand off to the hunt engine.
    function startCountryHunt() {
      var explorer = root.GeoWars?.explorer;
      if (!explorer || typeof explorer.startHunt !== 'function') {
        announce('Country Hunt is unavailable.');
        return false;
      }
      modeState.mode = 'challenge';
      modeState.challengeStage = 'hunt';
      applyLayout();
      try {
        explorer.startHunt();
      } catch (e) {
        if (!isHuntActive()) {
          modeState.challengeStage = 'panel';
          applyLayout();
          announce('Country Hunt is unavailable.');
          return false;
        }
      }
      return true;
    }

    // Keep the remembered mode for the puzzle's back control while direct
    // navigation can move to either Explore or Challenge.
    function openDailyPuzzle(options) {
      options = options || {};
      if (isHuntActive() && !options.confirmedEndHunt) {
        requestHuntSwitch('daily', options.opener || null);
        return false;
      }
      if (root.GeoWars?.worldle?.open) {
        if (modeState.mode !== 'daily') {
          stopDemoMode();
          leaveHuntSummary();
          modeState.dailyReturn = {
            mode: modeState.mode,
            exploreView: modeState.exploreView
          };
        }
        modeState.mode = 'daily';
        modeState.challengeStage = 'panel';
        root.GeoWars?.navigate?.showExplorer?.();
        applyLayout();
        root.GeoWars.worldle.open({ embedded: true });
        focusHeading(dailyTitle);
        root.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
        announce('Daily Puzzle. Identify the mystery country.');
        return true;
      }
      announce('Daily Puzzle is unavailable.');
      return false;
    }

    // Returns from the Daily Puzzle to the remembered state.
    function returnFromDailyPuzzle() {
      var returnState = modeState.dailyReturn;
      modeState.dailyReturn = null;
      if (returnState && returnState.mode === 'challenge') {
        // Challenge always returns to Challenge_Panel.
        setMode('challenge', { focus: true, announce: false });
        announce('Back to Challenge.');
      } else {
        // null or explore: return to Explore with the remembered view.
        var view = returnState?.exploreView || 'globe';
        setView(view, { focus: true, announce: false });
        announce('Back to Explore.');
      }
      var worldleButton = document.getElementById('btn-open-worldle');
      if (worldleButton && typeof worldleButton.focus === 'function') {
        worldleButton.focus({ preventScroll: true });
      }
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
    exploreModeButton?.addEventListener('click', function () {
      setMode('explore', { view: modeState.exploreView, focus: true, opener: exploreModeButton });
    });
    challengeModeButton?.addEventListener('click', function () {
      setMode('challenge', { focus: true });
    });
    challengeHuntButton?.addEventListener('click', startCountryHunt);
    root.addEventListener?.('geowars:explorer-mode', function (event) {
      handleExplorerModeEvent(event?.detail);
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
    // First_Load: Explore with Globe (or Shapes if the markup preset it), and
    // Challenge_Panel unavailable.
    setView(screen.dataset.atlasView === 'shapes' ? 'shapes' : 'globe', { announce: false });
    if (root.matchMedia?.('(max-width: 767px)').matches) {
      setMode('challenge', { focus: false, announce: false });
    }
    if (isHuntActive()) handleExplorerModeEvent({ mode: 'hunt', summary: false });

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
          demoActive: demoActive,
          mode: modeState.mode,
          exploreView: modeState.exploreView,
          challengeStage: modeState.challengeStage,
          dailyReturn: modeState.dailyReturn
            ? { mode: modeState.dailyReturn.mode, exploreView: modeState.dailyReturn.exploreView }
            : null
        };
      },
      showExplore: function (options) {
        return setMode('explore', Object.assign({ focus: true }, options));
      },
      showChallenge: function (options) {
        return setMode('challenge', Object.assign({ focus: true }, options));
      },
      openDailyPuzzle: openDailyPuzzle,
      returnFromDailyPuzzle: returnFromDailyPuzzle
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAtlas, { once: true });
  } else {
    initializeAtlas();
  }
}(window));
