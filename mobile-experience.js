/* Phone layout enhancements. Existing controllers continue to own game state. */
(function (root) {
  'use strict';

  function initializeMobileExperience() {
    const phone = root.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 500px) and (pointer: coarse)');
    const panel = document.querySelector('.explorer-info-panel');
    const card = document.getElementById('explorer-country-card');
    const toggle = document.getElementById('country-sheet-toggle');
    const label = document.getElementById('country-sheet-label');
    const placeDetails = document.getElementById('explorer-more-details');
    const setup = document.getElementById('atlas-menu-setup-slot');
    const quiz = document.getElementById('shape-challenge-panel');
    const start = document.getElementById('btn-start-game');
    const settings = document.getElementById('challenge-settings');
    const difficulty = settings?.querySelector('fieldset');
    const settingsTitle = settings?.querySelector('.game-setup-title');
    const playerMenu = document.getElementById('atlas-utility-menu');
    const playerButton = playerMenu?.querySelector('summary');
    const playerPanel = document.getElementById('atlas-utility-panel');
    const playerBackdrop = document.getElementById('player-menu-backdrop');
    function closePlayerMenu() {
      if (playerMenu) playerMenu.open = false;
      syncPlayerMenu();
      playerButton?.focus({ preventScroll: true });
    }
    function syncPlayerMenu() {
      const modal = Boolean(phone.matches && playerMenu?.open);
      document.body.classList.toggle('player-sheet-open', modal);
      if (playerBackdrop) playerBackdrop.hidden = !modal;
      if (modal) {
        const anchor = playerButton.getBoundingClientRect();
        playerPanel?.style.setProperty('--player-menu-top', `${Math.max(8, anchor.bottom + 8)}px`);
        playerPanel?.style.setProperty('--player-menu-right', `${Math.max(12, root.innerWidth - anchor.right)}px`);
        playerPanel?.setAttribute('role', 'dialog');
        playerPanel?.setAttribute('aria-modal', 'true');
        if (!playerPanel?.contains(document.activeElement)) {
          document.getElementById('btn-close-player-panel')?.focus({ preventScroll: true });
        }
      } else {
        playerPanel?.removeAttribute('role');
        playerPanel?.removeAttribute('aria-modal');
      }
    }
    playerMenu?.addEventListener('toggle', syncPlayerMenu);
    phone.addEventListener('change', syncPlayerMenu);
    root.addEventListener('resize', () => { if (playerMenu?.open) syncPlayerMenu(); });
    document.getElementById('btn-close-player-panel')?.addEventListener('click', closePlayerMenu);
    playerBackdrop?.addEventListener('click', closePlayerMenu);
    let expanded = false;
    let lastMode = '';
    let dragStart = null;
    let dragClickUntil = 0;

    function expandSheet(value) {
      expanded = Boolean(value);
      panel?.classList.toggle('is-expanded', expanded);
      toggle?.setAttribute('aria-expanded', String(expanded));
      if (label) label.textContent = expanded ? 'Less' : 'Details';
      if (placeDetails) placeDetails.open = expanded;
      if (!expanded && panel) panel.scrollTop = 0;
    }

    function sync() {
      const mode = document.body.dataset.atlasMode;
      const view = document.body.dataset.atlasView;
      const eligible = phone.matches && mode === 'explore' && ['globe', 'shapes'].includes(view)
        && card && !card.classList.contains('hidden');
      panel?.classList.toggle('is-country-sheet', Boolean(eligible));
      if (lastMode !== `${mode}:${view}` || !eligible) expandSheet(false);
      else if (placeDetails && expanded !== placeDetails.open) expandSheet(placeDetails.open);
      lastMode = `${mode}:${view}`;
    }

    function syncLayout() {
      // Move the original controls; no parallel state or duplicate element IDs.
      if (quiz && setup && start && !document.body.classList.contains('activity-navigation')) {
        quiz.insertBefore(setup, start);
        if (difficulty) setup.insertBefore(difficulty, setup.querySelector('.game-setup-wrap'));
        if (settings) settings.open = false;
        if (settingsTitle) settingsTitle.textContent = 'Choose a region';
      }
      const playButton = document.getElementById('btn-mode-challenge');
      playButton?.setAttribute('aria-label', phone.matches ? 'Play, Country Hunt and Shape Quiz' : 'Challenge, Country Hunt and Shape Quiz');
      const dailyButton = document.getElementById('btn-open-worldle');
      dailyButton?.setAttribute('aria-label', phone.matches ? 'Daily, identify the mystery country' : 'Daily Puzzle, identify the mystery country');
      const timedLabel = document.querySelector('#btn-sprint .mode-title');
      if (timedLabel) timedLabel.textContent = phone.matches ? 'Timed' : 'Sprint';
      sync();
    }

    toggle?.addEventListener('click', event => {
      if (event.detail === 0 || Date.now() > dragClickUntil) expandSheet(!expanded);
    });
    toggle?.addEventListener('pointerdown', event => {
      dragStart = event.clientY;
      toggle.setPointerCapture(event.pointerId);
    });
    toggle?.addEventListener('pointerup', event => {
      if (dragStart === null) return;
      const distance = event.clientY - dragStart;
      dragStart = null;
      if (Math.abs(distance) > 25) {
        expandSheet(distance < 0);
        // The pointer gesture already performed the action; suppress its click.
        dragClickUntil = Date.now() + 300;
      }
    });
    toggle?.addEventListener('pointercancel', () => { dragStart = null; });
    panel?.addEventListener('keydown', event => {
      if (event.key === 'Escape' && expanded) {
        expandSheet(false);
        toggle?.focus({ preventScroll: true });
      }
    });
    root.addEventListener('geowars:explorer-country', event => {
      expandSheet(false);
      sync();
    });
    phone.addEventListener('change', syncLayout);
    placeDetails?.addEventListener('toggle', () => {
      if (phone.matches && panel?.classList.contains('is-country-sheet') && expanded !== placeDetails.open) expandSheet(placeDetails.open);
    });
    playerMenu?.addEventListener('keydown', event => {
      if (event.key === 'Escape' && playerMenu.open) {
        event.preventDefault();
        closePlayerMenu();
      }
      if (event.key === 'Tab' && phone.matches && playerMenu.open) {
        const controls = Array.from(playerPanel.querySelectorAll('button, a[href], summary, input, select, [tabindex="0"]'))
          .filter(element => !element.disabled && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !playerPanel.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    document.addEventListener('pointerdown', event => {
      if (playerMenu?.open && !playerMenu.contains(event.target)) playerMenu.open = false;
    });

    // A real keyboard can cover the viewport without changing the layout size.
    // Keep the guess field and suggestions in view using the visual viewport.
    const viewport = root.visualViewport;
    function syncKeyboard() {
      const input = document.getElementById('worldle-guess-input');
      const typing = phone.matches && document.activeElement === input;
      const covered = viewport ? root.innerHeight - viewport.height - viewport.offsetTop : 0;
      document.body.classList.toggle('is-phone-keyboard', typing && covered > 100);
      if (typing && covered > 100) input.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    viewport?.addEventListener('resize', syncKeyboard);
    document.addEventListener('focusin', syncKeyboard);
    document.addEventListener('focusout', () => root.requestAnimationFrame(syncKeyboard));

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.mobile = Object.freeze({ sync });
    syncLayout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMobileExperience, { once: true });
  else initializeMobileExperience();
})(window);
