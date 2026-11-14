/* Two activities, each with a calm Explore path and a timed Challenge path. */
(function (root) {
  'use strict';

  function initialize() {
    const atlas = root.GeoWars?.atlas;
    if (!atlas) return;
    const byId = id => document.getElementById(id);
    const body = document.body;
    const game = byId('game');
    const context = byId('activity-context');
    const dialog = byId('activity-settings-dialog');
    const setup = byId('atlas-menu-setup-slot');
    const settings = byId('challenge-settings');
    let settingsSnapshot = null;
    let opener = null;
    let frame = 0;
    body.classList.add('activity-navigation');

    // Relocate the original controls and preview: no duplicate IDs or state.
    byId('activity-shape-preview').append(byId('quiz-preview-art'));
    byId('activity-legacy-controls').append(byId('shape-challenge-panel'));
    byId('activity-settings-slot').append(setup);
    settings.open = true;
    const difficultyGroup = setup.querySelector('[data-level]')?.closest('fieldset');
    if (difficultyGroup) setup.prepend(difficultyGroup);
    byId('game-utility-region').insertBefore(byId('btn-game-difficulty'), game.querySelector('.game-hud'));

    function selectedLevel() { return setup.querySelector('[data-level].active')?.dataset.level || 'cadet'; }
    function selectedRegion() { return setup.querySelector('[data-continent].active')?.dataset.continent || 'all'; }
    function quizActive() { return !game.classList.contains('hidden'); }
    function isHidden(element, hidden) { if (element && element.hidden !== hidden) element.hidden = hidden; }
    function text(element, value) { if (element && element.textContent !== value) element.textContent = value; }

    function createReplayDifficulty(id, replayId, defaultLabel) {
      const group = byId(id);
      const replay = byId(replayId);
      const label = replay.querySelector('span') || replay;
      const levels = root.GeoWarsDifficulty.listLevels();
      let shown = false;
      let sourceLevel = null;
      let nextLevel = null;
      const buttons = levels.map(level => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.nextLevel = level.id;
        button.textContent = level.name;
        button.addEventListener('click', () => { nextLevel = level.id; render(); });
        group.querySelector('.next-difficulty-options').append(button);
        return button;
      });
      function render() {
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.nextLevel === nextLevel)));
        text(label, nextLevel === sourceLevel ? defaultLabel : 'Play ' + root.GeoWarsDifficulty.getLevelLabel(nextLevel));
      }
      // Keep finished stats attached to their original level. Apply the next
      // selection only at the replay boundary, before the engine starts.
      replay.addEventListener('click', () => {
        if (!group.hidden) setup.querySelector(`[data-level="${nextLevel}"]`)?.click();
      }, { capture: true });
      return function syncReplayDifficulty(visible) {
        isHidden(group, !visible);
        if (visible) {
          if (!shown || sourceLevel !== selectedLevel()) nextLevel = sourceLevel = selectedLevel();
          buttons.forEach(button => {
            button.disabled = root.GeoWarsDifficulty.buildLevelDeck(button.dataset.nextLevel, root.countryCards || [], selectedRegion()).length === 0;
          });
          render();
        }
        shown = visible;
      };
    }
    const syncQuizReplay = createReplayDifficulty('quiz-next-difficulty', 'btn-again', 'Replay');
    const syncHuntReplay = createReplayDifficulty('hunt-next-difficulty', 'btn-explorer-hunt-again', 'Play again');

    function sync() {
      frame = 0;
      const current = atlas.getState();
      const quiz = quizActive();
      const home = !quiz && current.mode === 'challenge' && current.challengeStage === 'panel';
      const daily = !quiz && current.mode === 'daily';
      const shapes = quiz || (current.mode === 'explore' && current.view === 'shapes');
      const challenge = quiz || (current.mode === 'challenge' && !home);
      body.dataset.activity = home ? 'home' : daily ? 'daily' : `${shapes ? 'shapes' : 'hunt'}-${challenge ? 'challenge' : 'explore'}`;
      isHidden(context, home || quiz || daily);
      text(byId('activity-section-title'), daily ? 'Daily Puzzle' : shapes ? 'Shape Quiz' : 'Country Hunt');
      text(byId('activity-section-description'), daily ? 'Daily Puzzle' : challenge ? '60 seconds' : 'Explore');
      isHidden(byId('btn-activity-explore'), daily);
      isHidden(byId('btn-activity-challenge'), daily || challenge);
      isHidden(byId('btn-activity-difficulty'), daily || !challenge);
      byId('btn-activity-explore').setAttribute('aria-pressed', String(!challenge));
      const levelName = root.GeoWarsDifficulty?.getLevelLabel(selectedLevel()) || 'Easy';
      [byId('btn-game-difficulty'), byId('btn-activity-difficulty')].forEach(button => text(button, 'Difficulty: ' + levelName));
      syncQuizReplay(!byId('results').classList.contains('hidden') && state.sessionKind === 'standard' && state.mode === 'sprint');
      syncHuntReplay(current.mode === 'challenge' && current.challengeStage === 'summary');
    }
    function scheduleSync() { if (!frame) frame = root.requestAnimationFrame(sync); }

    function home(options) {
      options = Object.assign({ opener: document.activeElement }, options);
      root.GeoWars.navigate.showExplorer();
      const opened = atlas.showHome ? atlas.showHome(options) : atlas.showChallenge(options);
      if (opened !== false && options.announce !== false) text(byId('explorer-live'), 'All activities. Choose Country Hunt or Shape Quiz, then Explore or Challenge.');
      return opened;
    }
    function explore(view) {
      atlas.showExplore({ view: view === 'shapes' ? 'shapes' : 'globe', focus: true });
      scheduleSync();
    }
    function startQuiz(mode = 'sprint') {
      byId(mode === 'sprint' ? 'btn-sprint' : 'btn-showoff').click();
      byId('btn-start-game').click();
      scheduleSync();
    }
    function startHunt() { byId('btn-challenge-hunt').click(); scheduleSync(); }
    function challengeCurrent() {
      if (atlas.getState().view === 'shapes') startQuiz();
      else startHunt();
    }

    function openSettings() {
      if (dialog.open) return;
      opener = document.activeElement;
      settingsSnapshot = {
        level: selectedLevel(), region: selectedRegion(), quiz: quizActive(),
        hunt: atlas.getState().mode === 'challenge' && atlas.getState().challengeStage !== 'panel',
        timed: typeof state !== 'undefined' && state.mode === 'sprint' && !state.gameOver
      };
      if (settingsSnapshot.quiz && settingsSnapshot.timed) root.clearInterval(state.timer);
      if (settingsSnapshot.hunt) root.GeoWars.explorer.pauseHunt?.('settings');
      settings.open = true;
      text(byId('activity-settings-description'), '');
      dialog.showModal();
      setup.querySelector('[data-level].active')?.focus();
    }
    function closeSettings(apply) {
      if (!dialog.open || !settingsSnapshot) return;
      if (apply && root.GeoWarsDifficulty?.buildLevelDeck(selectedLevel(), root.countryCards || [], selectedRegion()).length === 0) {
        text(byId('activity-settings-description'), 'No countries. Change difficulty or region.');
        return;
      }
      const previous = settingsSnapshot;
      settingsSnapshot = null;
      if (!apply) {
        setup.querySelector(`[data-level="${previous.level}"]`)?.click();
        setup.querySelector(`[data-continent="${previous.region}"]`)?.click();
      }
      dialog.close();
      if (apply && previous.quiz) startQuiz(typeof state !== 'undefined' ? state.mode : 'sprint');
      else if (apply && previous.hunt) startHunt();
      else {
        if (previous.quiz && previous.timed && !state.gameOver && state.timeLeft > 0) root.resumeTimer();
        if (previous.hunt) root.GeoWars.explorer.resumeHunt?.('settings');
      }
      opener?.focus({ preventScroll: true });
      scheduleSync();
    }

    byId('btn-explore-hunt').addEventListener('click', () => explore('globe'));
    byId('btn-explore-shapes').addEventListener('click', () => explore('shapes'));
    byId('btn-challenge-shapes').addEventListener('click', () => startQuiz());
    byId('btn-challenge-hunt').addEventListener('click', scheduleSync);
    byId('btn-activity-home').addEventListener('click', () => home({ focus: true }));
    byId('btn-activity-daily').addEventListener('click', () => atlas.openDailyPuzzle());
    byId('btn-activity-explore').addEventListener('click', () => explore(atlas.getState().view));
    byId('btn-activity-challenge').addEventListener('click', challengeCurrent);
    byId('btn-game-difficulty').addEventListener('click', openSettings);
    byId('btn-activity-difficulty').addEventListener('click', openSettings);
    byId('btn-close-activity-settings').addEventListener('click', () => closeSettings(false));
    byId('btn-cancel-activity-settings').addEventListener('click', () => closeSettings(false));
    byId('btn-apply-activity-settings').addEventListener('click', () => closeSettings(true));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeSettings(false); });
    byId('btn-header-google').addEventListener('click', () => root.openPlayerModal());
    new MutationObserver(scheduleSync).observe(body, { subtree: true, attributes: true, attributeFilter: ['class', 'data-atlas-mode', 'data-atlas-view'] });
    root.GeoWars.activities = Object.freeze({
      home, explore, startQuiz, startHunt, openSettings,
      getHuntOptions: () => ({ level: selectedLevel(), continent: selectedRegion() })
    });
    try {
      if (!localStorage.getItem('earthling-quiz-preferences')) setup.querySelector('[data-level="cadet"]')?.click();
    } catch (_) { /* Defaults remain playable if browser storage is blocked. */ }
    home({ focus: false, announce: false });
    sync();
    root.renderPlayerContext?.();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})(window);
