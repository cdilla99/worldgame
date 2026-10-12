'use strict';

(function (root) {
  function initWorldleGame() {
    const screen = document.getElementById('worldle-screen');
    const shapeArt = document.getElementById('worldle-shape-art');
    const input = document.getElementById('worldle-guess-input');
    const submitBtn = document.getElementById('worldle-guess-submit');
    const suggestionsList = document.getElementById('worldle-suggestions');
    const guessesContainer = document.getElementById('worldle-guesses-container');
    const roundCounter = document.getElementById('worldle-round-counter');
    const homeBtn = document.getElementById('btn-worldle-home');
    const statsBtn = document.getElementById('btn-worldle-stats');
    const modal = document.getElementById('worldle-modal');
    const modalClose = document.getElementById('btn-worldle-modal-close');
    const shareBtn = document.getElementById('btn-worldle-share');
    const toast = document.getElementById('worldle-toast');

    if (!screen || !shapeArt || !input || !submitBtn || !guessesContainer) return;

    const cards = Array.isArray(window.countryCards) ? window.countryCards : [];
    const worldleApi = root.GeoWarsDailyWorldle;
    const geoApi = root.GeoWarsGeography;
    const shapeApi = root.GeoWarsShapeGeometry;
    const audioEngine = root.AudioEngine;

    let activeSuggestionIdx = -1;
    let filteredCards = [];

    function updateGuessesView(game) {
      if (!guessesContainer) return;
      guessesContainer.innerHTML = '';

      const max = game.maxGuesses || 6;
      const guesses = game.guesses || [];

      for (let i = 0; i < max; i++) {
        const guess = guesses[i];
        const row = document.createElement('div');
        row.className = 'worldle-guess-row';

        if (guess) {
          if (guess.correct) row.classList.add('is-correct');
          const pct = guess.proximityPercent || 0;
          row.innerHTML = `
            <div class="worldle-guess-country">
              <span class="worldle-guess-flag">${guess.card.flag || '🌍'}</span>
              <span class="worldle-guess-name">${guess.card.name}</span>
            </div>
            <span class="worldle-guess-distance">${guess.displayDistance}</span>
            <div class="worldle-guess-direction" title="${guess.directionLabel || ''}">${guess.arrow}</div>
            <div class="worldle-proximity-meter">
              <div class="worldle-meter-track"><div class="worldle-meter-fill" style="width: ${pct}%"></div></div>
              <span class="worldle-proximity-label">${pct}%</span>
            </div>
          `;
        } else {
          row.classList.add('is-empty');
          row.innerHTML = `
            <div class="worldle-guess-country"><span class="worldle-guess-name">—</span></div>
            <span class="worldle-guess-distance">—</span>
            <div class="worldle-guess-direction">—</div>
            <div class="worldle-proximity-meter"><div class="worldle-meter-track"></div><span class="worldle-proximity-label">—</span></div>
          `;
        }

        guessesContainer.appendChild(row);
      }

      if (roundCounter) {
        roundCounter.innerHTML = `Attempt <strong>${Math.min(max, guesses.length + 1)}/${max}</strong>`;
      }

      if (game.completed) {
        input.disabled = true;
        submitBtn.disabled = true;
        input.placeholder = game.won ? 'Solved! Great job.' : `Game over. It was ${game.target ? game.target.name : ''}`;
      } else {
        input.disabled = false;
        submitBtn.disabled = false;
        input.placeholder = 'Search country or territory...';
      }
    }

    function renderTargetSilhouette(target) {
      if (!shapeArt || !target) return;
      if (shapeApi && typeof shapeApi.render === 'function') {
        shapeArt.textContent = 'Loading outline...';
        shapeApi.render(shapeArt, target, { padding: 0.1 }).catch(() => {
          shapeArt.textContent = 'Outline unavailable.';
        });
      }
    }

    function showOutcomeModal(game) {
      if (!modal) return;
      const target = game.target;
      const stats = worldleApi ? worldleApi.getStats() : {};

      const kicker = document.getElementById('worldle-modal-kicker');
      const title = document.getElementById('worldle-modal-title');
      const flagEl = document.getElementById('worldle-revealed-flag');
      const nameEl = document.getElementById('worldle-revealed-name');
      const regionEl = document.getElementById('worldle-revealed-region');
      const playedEl = document.getElementById('worldle-stat-played');
      const winPctEl = document.getElementById('worldle-stat-win-pct');
      const streakEl = document.getElementById('worldle-stat-streak');
      const maxStreakEl = document.getElementById('worldle-stat-max-streak');

      if (kicker) kicker.textContent = game.won ? 'VICTORY' : 'NICE TRY';
      if (title) title.textContent = game.won ? 'Target Identified!' : 'Better Luck Tomorrow!';

      if (target) {
        if (flagEl) flagEl.textContent = target.flag || '🌍';
        if (nameEl) nameEl.textContent = target.name;
        if (regionEl) regionEl.textContent = `${target.continent || ''} · ${target.subregion || ''}`;
      }

      if (playedEl) playedEl.textContent = stats.played || 0;
      const winPct = stats.played ? Math.round(((stats.won || 0) / stats.played) * 100) : 0;
      if (winPctEl) winPctEl.textContent = `${winPct}%`;
      if (streakEl) streakEl.textContent = stats.currentStreak || 0;
      if (maxStreakEl) maxStreakEl.textContent = stats.maxStreak || 0;

      modal.classList.remove('hidden');
    }

    function refresh() {
      if (!worldleApi) return;
      const game = worldleApi.getDailyGame(cards);
      renderTargetSilhouette(game.target);
      updateGuessesView(game);
      if (game.completed) {
        setTimeout(() => showOutcomeModal(game), 600);
      }
    }

    function dismissSuggestions() {
      if (suggestionsList) {
        suggestionsList.innerHTML = '';
        suggestionsList.classList.add('hidden');
      }
      activeSuggestionIdx = -1;
    }

    function handleInput() {
      const query = input.value.trim().toLowerCase();
      if (!query || query.length < 2) {
        dismissSuggestions();
        return;
      }

      filteredCards = cards
        .filter(c => c.name.toLowerCase().includes(query))
        .slice(0, 5);

      if (!filteredCards.length) {
        dismissSuggestions();
        return;
      }

      suggestionsList.innerHTML = '';
      filteredCards.forEach((c, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'worldle-autocomplete-item';
        item.setAttribute('role', 'option');
        item.innerHTML = `
          <span class="worldle-autocomplete-flag">${c.flag || '🌍'}</span>
          <span>${c.name}</span>
        `;
        item.addEventListener('click', () => {
          input.value = c.name;
          dismissSuggestions();
          submitCurrentGuess();
        });
        suggestionsList.appendChild(item);
      });

      suggestionsList.classList.remove('hidden');
    }

    function submitCurrentGuess() {
      const name = input.value.trim().toLowerCase();
      if (!name || !worldleApi) return;

      const guessedCard = cards.find(c => c.name.toLowerCase() === name);
      if (!guessedCard) {
        if (toast) {
          toast.textContent = 'Unknown country name';
          setTimeout(() => { toast.textContent = ''; }, 2000);
        }
        return;
      }

      const res = worldleApi.submitGuess(guessedCard, cards, geoApi);
      if (res.duplicate) {
        if (toast) {
          toast.textContent = 'Already guessed!';
          setTimeout(() => { toast.textContent = ''; }, 2000);
        }
        return;
      }

      input.value = '';
      dismissSuggestions();

      if (res.evalResult) {
        if (res.evalResult.correct) {
          if (audioEngine) audioEngine.playCorrect(100, 1);
        } else {
          if (audioEngine) audioEngine.playWrong();
        }
      }

      updateGuessesView(res.game);

      if (res.justCompleted) {
        setTimeout(() => showOutcomeModal(res.game), 800);
      }
    }

    // Event listeners
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!suggestionsList.classList.contains('hidden') && activeSuggestionIdx >= 0 && filteredCards[activeSuggestionIdx]) {
          input.value = filteredCards[activeSuggestionIdx].name;
          dismissSuggestions();
          submitCurrentGuess();
        } else {
          submitCurrentGuess();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const items = suggestionsList.querySelectorAll('.worldle-autocomplete-item');
        if (items.length) {
          activeSuggestionIdx = (activeSuggestionIdx + 1) % items.length;
          items.forEach((it, i) => it.setAttribute('aria-selected', String(i === activeSuggestionIdx)));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = suggestionsList.querySelectorAll('.worldle-autocomplete-item');
        if (items.length) {
          activeSuggestionIdx = (activeSuggestionIdx - 1 + items.length) % items.length;
          items.forEach((it, i) => it.setAttribute('aria-selected', String(i === activeSuggestionIdx)));
        }
      } else if (e.key === 'Escape') {
        dismissSuggestions();
      }
    });

    submitBtn.addEventListener('click', submitCurrentGuess);

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        const landing = document.getElementById('landing');
        if (root.GeoWars?.showScreen && landing) {
          root.GeoWars.showScreen(landing);
        } else if (typeof root.showScreen === 'function' && landing) {
          root.showScreen(landing);
        }
      });
    }

    if (statsBtn) {
      statsBtn.addEventListener('click', () => {
        if (worldleApi) {
          const game = worldleApi.getDailyGame(cards);
          showOutcomeModal(game);
        }
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!worldleApi) return;
        const game = worldleApi.getDailyGame(cards);
        const text = worldleApi.generateShareEmojiGrid(game);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            if (toast) {
              toast.textContent = 'Results copied to clipboard! 📋';
              setTimeout(() => { toast.textContent = ''; }, 3000);
            }
          });
        }
      });
    }

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.worldle = Object.freeze({
      open: function () {
        const screens = [
          document.getElementById('landing'),
          document.getElementById('explorer'),
          document.getElementById('game'),
          document.getElementById('results'),
          screen
        ];
        screens.filter(Boolean).forEach(s => s.classList.add('hidden'));
        screen.classList.remove('hidden');
        refresh();
      },
      refresh: refresh
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorldleGame, { once: true });
  } else {
    initWorldleGame();
  }
}(window));
