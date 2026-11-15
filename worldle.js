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
    let geometryById = null;
    let submitting = false;
    let active = false;
    let outcomeTimer = null;
    let openSequence = 0;
    let suggestionFrame = null;

    function positionSuggestions(ensureVisible = false) {
      if (!suggestionsList || suggestionsList.classList.contains('hidden')) return;
      const viewport = root.visualViewport;
      const top = (viewport?.offsetTop || 0) + 10;
      let bottom = (viewport?.offsetTop || 0) + (viewport?.height || root.innerHeight) - 10;
      const nav = document.querySelector('.atlas-primary-nav');
      if (nav && getComputedStyle(nav).position === 'fixed' && getComputedStyle(nav).visibility !== 'hidden') {
        bottom = Math.min(bottom, nav.getBoundingClientRect().top - 10);
      }
      let rect = input.getBoundingClientRect();
      if (ensureVisible && (rect.top < top || rect.bottom > bottom || Math.max(rect.top - top, bottom - rect.bottom) < 60)) {
        root.scrollBy({ top: rect.top - (top + Math.max(0, (bottom - top - rect.height) / 2)), behavior: 'instant' });
        rect = input.getBoundingClientRect();
      }
      const above = Math.max(0, rect.top - top - 6);
      const below = Math.max(0, bottom - rect.bottom - 6);
      const opensAbove = below < Math.min(180, suggestionsList.scrollHeight) && above > below;
      suggestionsList.style.left = `${rect.left}px`;
      suggestionsList.style.right = 'auto';
      suggestionsList.style.width = `${rect.width}px`;
      suggestionsList.style.maxHeight = `${Math.min(252, opensAbove ? above : below)}px`;
      const height = suggestionsList.getBoundingClientRect().height;
      suggestionsList.style.top = `${opensAbove ? rect.top - height - 6 : rect.bottom + 6}px`;
    }

    function scheduleSuggestionPosition() {
      if (suggestionFrame !== null) return;
      suggestionFrame = root.requestAnimationFrame(() => {
        suggestionFrame = null;
        positionSuggestions();
      });
    }

    function scheduleOutcome(game, delay) {
      clearTimeout(outcomeTimer);
      outcomeTimer = setTimeout(() => {
        outcomeTimer = null;
        if (active) showOutcomeModal(game);
      }, delay);
    }

    function renderFlag(container, card) {
      if (!container) return;
      container.replaceChildren();
      container.setAttribute('aria-hidden', 'true');
      const assets = root.AssetFallbacks;
      if (!card) {
        container.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
        return;
      }
      const source = assets?.getFlagSource(card);
      if (!source?.url) {
        container.textContent = assets?.getCountryCode(card) || '—';
        return;
      }
      const image = document.createElement('img');
      image.alt = '';
      if (source.code === 'NP') image.classList.add('is-nonrect-flag');
      container.appendChild(image);
      const urls = source.code === 'NP' ? [...source.urls] : [...source.urls].reverse();
      assets.bindImageFallback(image, 'flag', {
        sources: urls.slice(1), code: source.code, countryName: card.name, variant: 'compact'
      });
      image.src = urls[0];
    }

    function directionIcon(guess) {
      if (guess.correct) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
      }
      const angles = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
      const angle = Number.isFinite(angles[guess.direction]) ? angles[guess.direction] : 0;
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform: rotate(${angle}deg)"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>`;
    }

    function showMessage(message) {
      if (toast) toast.textContent = message;
    }

    async function loadGuidance() {
      if (geometryById) return;
      if (!shapeApi || typeof shapeApi.loadGeometry !== 'function' || !geoApi) {
        throw new Error('Geographic guidance is unavailable.');
      }
      const geometry = await shapeApi.loadGeometry();
      geometryById = new Map(geometry.map(country => [country.i, country]));
    }

    const guidance = {
      hintBetween(from, to) {
        return geoApi.hintBetween(geometryById.get(from.id), geometryById.get(to.id));
      }
    };

    function withCorrectedGuesses(game) {
      if (!geometryById || !game.target) return game;
      return {
        ...game,
        guesses: game.guesses.map(guess =>
          worldleApi.evaluateGuess(guess.card, game.target, guidance) || guess)
      };
    }

    function updateGuessesView(game) {
      if (!guessesContainer) return;
      guessesContainer.innerHTML = '';

      const max = game.maxGuesses || 6;
      const guesses = game.guesses || [];

      for (let i = 0; i < guesses.length; i++) {
        const guess = guesses[i];
        const row = document.createElement('div');
        row.className = 'worldle-guess-row';

          if (guess.correct) row.classList.add('is-correct');
          const pct = Math.max(0, Math.min(100, Number(guess.proximityPercent) || 0));
          row.innerHTML = `
            <div class="worldle-guess-country">
              <span class="worldle-guess-flag"></span>
              <span class="worldle-guess-name"></span>
            </div>
            <span class="worldle-guess-distance"></span>
            <div class="worldle-guess-direction" role="img">${directionIcon(guess)}</div>
            <div class="worldle-proximity-meter">
              <div class="worldle-meter-track"><div class="worldle-meter-fill" style="width: ${pct}%"></div></div>
              <span class="worldle-proximity-label">${pct}%</span>
            </div>
          `;
          row.querySelector('.worldle-guess-name').textContent = guess.card.name;
          row.querySelector('.worldle-guess-distance').textContent = guess.displayDistance;
          row.querySelector('.worldle-guess-direction').setAttribute('aria-label', guess.directionLabel || '');
          row.querySelector('.worldle-guess-direction').title = guess.directionLabel || '';
          renderFlag(row.querySelector('.worldle-guess-flag'), guess.card);

        guessesContainer.appendChild(row);
      }

      if (roundCounter) {
        roundCounter.innerHTML = `${game.completed ? 'Guesses' : 'Attempt'} <strong>${Math.min(max, guesses.length + (game.completed ? 0 : 1))}/${max}</strong>`;
      }
      const remaining = document.getElementById('worldle-guesses-remaining');
      if (remaining) remaining.textContent = game.completed ? (game.won ? 'Solved' : 'Complete') : `${max - guesses.length} guesses left`;
      const emptyHint = document.getElementById('worldle-empty-hint');
      if (emptyHint) emptyHint.hidden = guesses.length > 0;
      updateGuidance(game);

      if (game.completed) {
        input.disabled = true;
        submitBtn.disabled = true;
        input.placeholder = game.won ? 'Solved' : 'Complete';
      } else {
        input.disabled = false;
        submitBtn.disabled = false;
        input.placeholder = 'Country';
      }
    }

    function updateGuidance(game) {
      const guesses = game.guesses || [];
      const latest = guesses.at(-1);
      const panel = document.getElementById('worldle-guidance');
      const title = document.getElementById('worldle-guidance-title');
      const kicker = document.getElementById('worldle-guidance-kicker');
      const copy = document.getElementById('worldle-guidance-copy');
      const needle = document.getElementById('worldle-compass-needle');
      const closest = document.getElementById('worldle-closest');
      const history = document.getElementById('worldle-history-heading');
      const hint = document.getElementById('worldle-direction-hint');
      const dayLabel = document.getElementById('worldle-day-label');
      if (dayLabel) dayLabel.textContent = `#${game.dayNumber}`;
      if (history) history.hidden = guesses.length === 0;
      if (hint) hint.hidden = guesses.length === 0;
      if (copy) copy.hidden = !latest;
      if (closest) closest.hidden = !latest;
      if (!panel || !title || !kicker || !copy) return;

      if (!latest) {
        panel.dataset.state = 'ready';
        kicker.textContent = 'How to play';
        title.textContent = 'Each guess shows distance and direction.';
        if (needle) needle.style.transform = 'rotate(-35deg)';
        return;
      }

      const best = guesses.reduce((nearest, guess) => guess.distanceKm < nearest.distanceKm ? guess : nearest, latest);
      const previous = guesses.slice(0, -1);
      const previousBest = previous.length ? Math.min(...previous.map(guess => guess.distanceKm)) : null;
      panel.dataset.state = game.won ? 'solved' : game.completed ? 'complete' : 'searching';
      if (game.won) {
        kicker.textContent = 'Solved';
        title.textContent = game.target.name;
        copy.textContent = `${guesses.length}/${game.maxGuesses || 6} guesses`;
      } else if (game.completed) {
        kicker.textContent = 'Puzzle complete';
        title.textContent = game.target.name;
        copy.textContent = 'Next puzzle tomorrow.';
      } else {
        const warmer = previousBest !== null && latest.distanceKm < previousBest;
        const colder = previousBest !== null && latest.distanceKm > previous.at(-1).distanceKm;
        kicker.textContent = warmer ? 'Getting warmer' : colder ? 'A different direction' : 'Your next bearing';
        title.textContent = warmer ? 'Closer' : colder ? 'Farther' : 'Direction';
        const direction = String(latest.directionLabel || latest.direction || '').toLowerCase();
        copy.textContent = `${latest.displayDistance} ${direction} of ${latest.card.name}.`;
      }
      if (needle) needle.style.transform = `rotate(${Number(latest.bearingDegrees) || 0}deg)`;
      const bestLabel = document.getElementById('worldle-closest-label');
      if (bestLabel) bestLabel.textContent = best.displayDistance;
      const bestFill = document.getElementById('worldle-closest-fill');
      if (bestFill) bestFill.style.width = `${Math.max(0, Math.min(100, best.proximityPercent || 0))}%`;
    }

    function renderTargetSilhouette(target) {
      if (!shapeArt || !target) return;
      if (shapeApi && typeof shapeApi.render === 'function') {
        shapeArt.textContent = 'Loading outline...';
        shapeApi.render(shapeArt, target, { padding: 0.1, compactBounds: true, label: 'Mystery country outline' }).catch(() => {
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

      if (kicker) kicker.textContent = !game.completed ? 'STATISTICS' : game.won ? 'VICTORY' : 'NICE TRY';
      if (title) title.textContent = !game.completed ? 'Statistics' : game.won ? 'Solved' : 'Not solved';
      modal.querySelector('.worldle-revealed-country')?.classList.toggle('hidden', !game.completed);

      if (target && game.completed) {
        renderFlag(flagEl, target);
        if (nameEl) nameEl.textContent = target.name;
        if (regionEl) regionEl.textContent = [target.continent, target.subregion].filter((value, index, values) => value && values.indexOf(value) === index).join(' · ');
      } else {
        renderFlag(flagEl, null);
        if (nameEl) nameEl.textContent = 'Mystery country';
        if (regionEl) regionEl.textContent = 'Finish the puzzle to reveal the answer.';
      }
      if (shareBtn) shareBtn.classList.toggle('hidden', !game.completed);
      const exploreAnswer = document.getElementById('btn-worldle-explore-answer');
      if (exploreAnswer) exploreAnswer.classList.toggle('hidden', !game.completed);
      const revealedFact = document.getElementById('worldle-revealed-fact');
      if (revealedFact) revealedFact.textContent = game.completed ? (target?.fun_facts?.[0] || '') : '';

      if (playedEl) playedEl.textContent = stats.played || 0;
      const winPct = stats.played ? Math.round(((stats.won || 0) / stats.played) * 100) : 0;
      if (winPctEl) winPctEl.textContent = `${winPct}%`;
      if (streakEl) streakEl.textContent = stats.currentStreak || 0;
      if (maxStreakEl) maxStreakEl.textContent = stats.maxStreak || 0;

      modal.classList.remove('hidden');
    }

    async function refresh() {
      if (!worldleApi) return;
      const sequence = openSequence;
      const game = worldleApi.getDailyGame(cards);
      renderTargetSilhouette(game.target);
      updateGuessesView(game);
      try {
        await loadGuidance();
        updateGuessesView(withCorrectedGuesses(worldleApi.getDailyGame(cards)));
      } catch (error) {
        console.error('Daily Puzzle guidance failed to load:', error);
        showMessage('Could not load geographic guidance. Try submitting your guess again.');
      }
      if (active && sequence === openSequence && game.completed) {
        scheduleOutcome(game, 600);
      }
    }

    function dismissSuggestions() {
      if (suggestionsList) {
        suggestionsList.innerHTML = '';
        suggestionsList.classList.add('hidden');
      }
      activeSuggestionIdx = -1;
      input.setAttribute('aria-expanded', 'false');
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
          <span class="worldle-autocomplete-flag"></span>
          <span class="worldle-autocomplete-name"></span>
        `;
        item.querySelector('.worldle-autocomplete-name').textContent = c.name;
        renderFlag(item.querySelector('.worldle-autocomplete-flag'), c);
        item.addEventListener('click', () => {
          input.value = c.name;
          dismissSuggestions();
          submitCurrentGuess();
        });
        suggestionsList.appendChild(item);
      });

      suggestionsList.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      positionSuggestions(true);
      root.requestAnimationFrame(() => positionSuggestions(true));
    }

    async function submitCurrentGuess() {
      const name = input.value.trim().toLowerCase();
      if (!name || !worldleApi || submitting) return;

      const guessedCard = cards.find(c => c.name.toLowerCase() === name);
      if (!guessedCard) {
        showMessage('Unknown country name');
        return;
      }

      submitting = true;
      const sequence = openSequence;
      submitBtn.disabled = true;
      try {
        await loadGuidance();
      } catch (error) {
        console.error('Daily Puzzle guidance failed to load:', error);
        showMessage('Hints unavailable. Retry.');
        submitting = false;
        submitBtn.disabled = false;
        return;
      }
      const res = worldleApi.submitGuess(guessedCard, cards, guidance);
      submitting = false;
      submitBtn.disabled = false;
      if (res.error) {
        showMessage(res.error);
        return;
      }
      if (res.duplicate) {
        showMessage('Already guessed!');
        return;
      }

      input.value = '';
      showMessage('');
      dismissSuggestions();

      if (res.evalResult) {
        if (res.evalResult.correct) {
          if (audioEngine) audioEngine.playCorrect(100, 1);
        } else {
          if (audioEngine) audioEngine.playWrong();
        }
      }

      updateGuessesView(withCorrectedGuesses(res.game));
      if (root.matchMedia?.('(max-width: 767px), (max-width: 960px) and (max-height: 500px) and (pointer: coarse)').matches) input.blur();

      if (res.justCompleted && active && sequence === openSequence) {
        scheduleOutcome(res.game, 800);
      }
    }

    // Event listeners
    function scrollSuggestionIntoView(item) {
      const listBounds = suggestionsList.getBoundingClientRect();
      const itemBounds = item.getBoundingClientRect();
      const top = listBounds.top + suggestionsList.clientTop + 1;
      const bottom = listBounds.top + suggestionsList.clientTop + suggestionsList.clientHeight - 1;
      if (itemBounds.top < top) {
        suggestionsList.scrollTop -= Math.ceil(top - itemBounds.top);
      } else if (itemBounds.bottom > bottom) {
        suggestionsList.scrollTop += Math.ceil(itemBounds.bottom - bottom);
      }
    }

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
          scrollSuggestionIntoView(items[activeSuggestionIdx]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = suggestionsList.querySelectorAll('.worldle-autocomplete-item');
        if (items.length) {
          activeSuggestionIdx = (activeSuggestionIdx - 1 + items.length) % items.length;
          items.forEach((it, i) => it.setAttribute('aria-selected', String(i === activeSuggestionIdx)));
          scrollSuggestionIntoView(items[activeSuggestionIdx]);
        }
      } else if (e.key === 'Escape') {
        dismissSuggestions();
      }
    });

    submitBtn.addEventListener('click', submitCurrentGuess);
    root.addEventListener('scroll', scheduleSuggestionPosition, { passive: true });
    root.addEventListener('resize', () => positionSuggestions(true));
    root.visualViewport?.addEventListener('resize', () => positionSuggestions(true));
    root.visualViewport?.addEventListener('scroll', scheduleSuggestionPosition, { passive: true });

    if (statsBtn) {
      statsBtn.addEventListener('click', () => {
        if (worldleApi) {
          const game = withCorrectedGuesses(worldleApi.getDailyGame(cards));
          showOutcomeModal(game);
        }
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        if (modal) modal.classList.add('hidden');
      });
    }
    document.getElementById('btn-worldle-explore-answer')?.addEventListener('click', () => {
      const game = worldleApi?.getDailyGame(cards);
      if (!game?.completed || !game.target) return;
      root.GeoWars?.atlas?.showGlobe?.();
      root.GeoWars?.explorer?.selectCountry?.(game.target.id, { animate: true, source: 'daily-answer' });
    });

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!worldleApi) return;
        const game = worldleApi.getDailyGame(cards);
        const text = worldleApi.generateShareEmojiGrid(game);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            if (toast) {
              toast.textContent = 'Copied';
              setTimeout(() => { toast.textContent = ''; }, 3000);
            }
          });
        }
      });
    }

    root.GeoWars = root.GeoWars || {};
    root.GeoWars.worldle = Object.freeze({
      open: function (options) {
        if (!options?.embedded) {
          if (root.GeoWars?.atlas?.openDailyPuzzle) {
            return root.GeoWars.atlas.openDailyPuzzle();
          }
          console.error('Daily Puzzle cannot open: Atlas navigation is unavailable.');
          return false;
        }
        active = true;
        openSequence += 1;
        refresh();
        return true;
      },
      close: function () {
        active = false;
        openSequence += 1;
        clearTimeout(outcomeTimer);
        outcomeTimer = null;
        modal?.classList.add('hidden');
        dismissSuggestions();
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
