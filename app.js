// Geo Game Table front-end
// How to run locally: open index.html in any modern browser. No build step required.
// To edit country data: see data/countries.js and adjust the countryCards array.
// To change default timer/points/difficulty presets: tweak defaults in bootstrapOptions below.

const bootstrapOptions = {
  defaultTimerMinutes: 15,
  defaultTargetPoints: 15,
};

const avatarOptions = ['😀','😎','🦊','🐱','🐶','🐼','🐯','🐸','🐧','🐨','🐰','🐵','🐠','🐙'];

const state = {
  players: [],
  scores: {},
  deck: [],
  usedIds: new Set(),
  currentCard: null,
  questionCount: 0,
  timer: null,
  timerRemaining: bootstrapOptions.defaultTimerMinutes * 60,
  mode: 'timer',
  targetPoints: bootstrapOptions.defaultTargetPoints,
  difficultyPool: 'all',
  currentClueGiverIndex: 0,
  clueRevealed: false,
  nearbyRevealed: false,
  flagRevealed: false,
  flagPenalty: false,
  timerWarningPlayed: false,
  musicOn: false,
};

function emojiToCountryCode(emoji) {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0));
  if (codePoints.length !== 2) return null;
  const base = 0x1f1e6; // regional indicator A
  const upperA = 65;
  const letters = codePoints.map((cp) => {
    if (cp < base || cp > base + 25) return null;
    return String.fromCharCode(upperA + (cp - base));
  });
  return letters.includes(null) ? null : letters.join('');
}

const setupForm = document.getElementById('setup-form');
const playerCountInput = document.getElementById('player-count');
const playerNamesContainer = document.getElementById('player-names');
const timerWrapper = document.getElementById('timer-wrapper');
timerWrapper.querySelector('input').value = bootstrapOptions.defaultTimerMinutes;
const pointsWrapper = document.getElementById('points-wrapper');
const modeSelect = document.getElementById('mode');
const difficultyPool = document.getElementById('difficulty-pool');
const timerLengthInput = document.getElementById('timer-length');
const targetPointsInput = document.getElementById('target-points');
const heroTimerTrigger = document.getElementById('hero-timer-trigger');
const heroPointsTrigger = document.getElementById('hero-points-trigger');
const heroTimerMenu = document.getElementById('hero-timer-menu');
const heroTimerValue = document.getElementById('hero-timer-value');
const heroMusicToggle = document.getElementById('music-toggle');
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const restartSetupBtn = document.getElementById('restart-setup');
const nextRoundBtn = document.getElementById('next-round');
const gameMusicToggle = document.getElementById('music-toggle-game');

const gameSection = document.getElementById('game');
const setupSection = document.getElementById('setup');
const scoreboardSection = document.getElementById('scoreboard');

const cardName = document.getElementById('card-name');
const cardStars = document.getElementById('card-stars');
const sharedStars = document.getElementById('shared-stars');
const cardMeta = document.getElementById('card-meta');
const cardFlagFallback = document.getElementById('card-flag-fallback');
const cardFlagImg = document.getElementById('card-flag-img');
const flagVeil = document.getElementById('flag-veil');
const flagPeekBtn = document.getElementById('flag-peek-btn');
const flagPeekNote = document.getElementById('flag-peek-note');
const mapOutline = document.getElementById('map-outline');
const identityBlock = document.getElementById('identity-block');
const cardTags = document.getElementById('card-tags');
const cardCapital = document.getElementById('card-capital');
const cardMetaTop = document.getElementById('card-meta-top');
const cardPop = document.getElementById('card-pop');
const cardArea = document.getElementById('card-area');
const cardSize = document.getElementById('card-size');
const cardHemi = document.getElementById('card-hemi');
const cardCoast = document.getElementById('card-coast');
const cardLang = document.getElementById('card-lang');
const cardCurrency = document.getElementById('card-currency');
const cardNeighbors = document.getElementById('card-neighbors');
const cardLandmarks = document.getElementById('card-landmarks');
const cardFacts = document.getElementById('card-facts');
const difficultyLabel = document.getElementById('difficulty-label');
const currentTurn = document.getElementById('current-turn');
const timerDisplay = document.getElementById('timer-display');
const scoreDisplay = document.getElementById('score-display');
const modeDisplay = document.getElementById('mode-display');
const questionCountEl = document.getElementById('question-count');
const qaLog = document.getElementById('qa-log');
const qaPlayerChips = document.getElementById('qa-player-chips');
const holderChips = document.getElementById('holder-chips');
const logQuestionBtn = document.getElementById('log-question');
const logGuessBtn = document.getElementById('log-guess');
const markCorrectBtn = document.getElementById('mark-correct');
const revealFlagBtn = document.getElementById('reveal-flag');
const revealClueBtn = document.getElementById('reveal-clue');
const revealNearbyBtn = document.getElementById('reveal-nearby');
const builtInClue = document.getElementById('built-in-clue');
const nearbyClue = document.getElementById('nearby-clue');
const regionHint = document.getElementById('region-hint');
const regionRevealBtn = document.getElementById('region-reveal');
const capitalRow = document.getElementById('capital-row');
const capitalRevealBtn = document.getElementById('capital-reveal');
const scoreRows = document.getElementById('score-rows');
const exportJson = document.getElementById('export-json');
const downloadCsvBtn = document.getElementById('download-csv');

// Show the full dataset on the landing page only.
exportJson.value = JSON.stringify(countryCards, null, 2);

let selectedPlayer = null;
const heroModeButtons = document.querySelectorAll('.mode-btn');
const musicState = { ctx: null, gain: null, intervalId: null };

function renderPlayerInputs(count) {
  playerNamesContainer.innerHTML = '';
  const quickAvatars = avatarOptions.slice(0, 3);
  const extraAvatars = avatarOptions.slice(3);
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'player-card compact';
    card.dataset.avatar = avatarOptions[0];

    const header = document.createElement('div');
    header.className = 'player-card-head';
    header.innerHTML = `<span class="pill muted">P${i + 1}</span><span class="muted">Tap an avatar or keep default</span>`;

    const avatarRow = document.createElement('div');
    avatarRow.className = 'avatar-row';

    quickAvatars.forEach((emoji, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `avatar-btn ${idx === 0 ? 'active' : ''}`;
      btn.textContent = emoji;
      btn.title = `Use ${emoji} as player icon`;
      btn.addEventListener('click', () => {
        card.dataset.avatar = emoji;
        avatarRow.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('active'));
        btn.classList.add('active');
        nameInput.value = nameInput.value.trim() ? nameInput.value : emoji;
      });
      avatarRow.appendChild(btn);
    });

    if (extraAvatars.length) {
      const moreRow = document.createElement('div');
      moreRow.className = 'avatar-row hidden';
      extraAvatars.forEach((emoji) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-btn';
        btn.textContent = emoji;
        btn.title = `Use ${emoji} as player icon`;
        btn.addEventListener('click', () => {
          card.dataset.avatar = emoji;
          avatarRow.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('active'));
          moreRow.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('active'));
          btn.classList.add('active');
          nameInput.value = nameInput.value.trim() ? nameInput.value : emoji;
        });
        moreRow.appendChild(btn);
      });

      const moreToggle = document.createElement('button');
      moreToggle.type = 'button';
      moreToggle.className = 'ghost more-toggle';
      moreToggle.textContent = 'More avatars';
      moreToggle.addEventListener('click', () => {
        const isHidden = moreRow.classList.toggle('hidden');
        moreToggle.textContent = isHidden ? 'More avatars' : 'Fewer avatars';
      });

      card.appendChild(moreToggle);
      card.appendChild(moreRow);
    }

    const nameWrap = document.createElement('label');
    nameWrap.textContent = 'Custom name (optional)';
    nameWrap.className = 'name-optional';
    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Tap to type — otherwise we use the emoji';
    nameInput.dataset.index = i;
    nameWrap.appendChild(nameInput);

    card.appendChild(header);
    card.appendChild(avatarRow);
    card.appendChild(nameWrap);
    playerNamesContainer.appendChild(card);
  }
}

function renderPlayerChips() {
  qaPlayerChips.innerHTML = '';
  state.players.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip ${idx === 0 ? 'active' : ''}`;
    btn.dataset.name = p.name;
    btn.textContent = p.name;
    btn.addEventListener('click', () => {
      setActiveChip(p.name);
    });
    qaPlayerChips.appendChild(btn);
  });
  setActiveChip(state.players[0]?.name || null);
}

function setActiveChip(name) {
  selectedPlayer = name;
  Array.from(qaPlayerChips.children).forEach((el) => {
    el.classList.toggle('active', el.dataset.name === name);
  });
}

function updateMusicButtons(isOn) {
  [heroMusicToggle, gameMusicToggle].forEach((btn) => {
    if (!btn) return;
    btn.textContent = isOn ? '🔊 Music on' : '🎵 Play chill loop';
    btn.classList.toggle('on', isOn);
    btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  });
}

function ensureMusicContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!musicState.ctx) {
    musicState.ctx = new AudioContext();
    musicState.gain = musicState.ctx.createGain();
    musicState.gain.gain.value = 0.05;
    musicState.gain.connect(musicState.ctx.destination);
  }
  if (musicState.ctx.state === 'suspended') {
    musicState.ctx.resume();
  }
  return musicState.ctx;
}

function playAmbientTone() {
  const ctx = ensureMusicContext();
  if (!ctx || !musicState.gain) return;
  const notes = [261.63, 293.66, 329.63, 392.0, 523.25];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const freq = notes[Math.floor(Math.random() * notes.length)] * (Math.random() > 0.65 ? 2 : 1);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
  osc.connect(gain);
  gain.connect(musicState.gain);
  osc.start();
  osc.stop(now + 1);
}

function startMusic() {
  if (!ensureMusicContext()) return;
  if (musicState.intervalId) clearInterval(musicState.intervalId);
  playAmbientTone();
  musicState.intervalId = setInterval(playAmbientTone, 1400);
  state.musicOn = true;
  updateMusicButtons(true);
}

function stopMusic() {
  if (musicState.intervalId) {
    clearInterval(musicState.intervalId);
    musicState.intervalId = null;
  }
  if (musicState.ctx) {
    musicState.ctx.close().catch(() => {});
    musicState.ctx = null;
    musicState.gain = null;
  }
  state.musicOn = false;
  updateMusicButtons(false);
}

function updateTurnCopy() {
  const holder = state.players[state.currentClueGiverIndex];
  if (!holder) return;
  currentTurn.textContent = `${holder.name} is holding the card. Reveal the flag when everyone is ready to guess.`;
}

function renderHolderChips() {
  holderChips.innerHTML = '';
  state.players.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip ${idx === state.currentClueGiverIndex ? 'active' : ''}`;
    btn.dataset.name = p.name;
    btn.textContent = p.name;
    btn.addEventListener('click', () => {
      state.currentClueGiverIndex = idx;
      renderHolderChips();
      setActiveChip(state.players[(idx + 1) % state.players.length]?.name || p.name);
      updateTurnCopy();
    });
    holderChips.appendChild(btn);
  });
}

playerCountInput.addEventListener('input', (e) => {
  const count = Math.min(8, Math.max(2, parseInt(e.target.value, 10) || 2));
  renderPlayerInputs(count);
});

modeSelect.addEventListener('change', () => {
  const isTimer = modeSelect.value === 'timer';
  timerWrapper.classList.toggle('hidden', !isTimer);
  pointsWrapper.classList.toggle('hidden', isTimer);
  state.mode = modeSelect.value;
  updateModeDisplay();
});

timerLengthInput.addEventListener('input', () => {
  const mins = parseInt(timerLengthInput.value, 10) || bootstrapOptions.defaultTimerMinutes;
  state.timerRemaining = mins * 60;
  syncHeroTimerButtons(mins);
  if (state.mode === 'timer') {
    updateModeDisplay();
  }
});

targetPointsInput.addEventListener('input', () => {
  state.targetPoints = parseInt(targetPointsInput.value, 10) || bootstrapOptions.defaultTargetPoints;
  if (state.mode === 'points') {
    updateModeDisplay();
  }
});

renderPlayerInputs(parseInt(playerCountInput.value, 10));
updateModeDisplay();

function syncHeroTimerButtons(mins) {
  heroTimerMenu.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', parseInt(b.dataset.minutes, 10) === mins);
  });
}

function setTimerMenu(open) {
  heroTimerMenu.classList.toggle('hidden', !open);
  heroTimerTrigger.setAttribute('aria-expanded', String(open));
}

function toggleTimerMenu() {
  const isOpen = !heroTimerMenu.classList.contains('hidden');
  setTimerMenu(!isOpen);
}

function setHeroMode(mode, openTimerMenu = false) {
  modeSelect.value = mode;
  modeSelect.dispatchEvent(new Event('change'));
  heroModeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  if (mode === 'points') {
    setTimerMenu(false);
  } else if (openTimerMenu) {
    setTimerMenu(true);
  }
}

heroTimerTrigger.addEventListener('click', (e) => {
  e.preventDefault();
  setHeroMode('timer', true);
});

heroPointsTrigger.addEventListener('click', (e) => {
  e.preventDefault();
  setHeroMode('points');
});

heroTimerMenu.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mins = parseInt(btn.dataset.minutes, 10);
    timerLengthInput.value = mins;
    state.timerRemaining = mins * 60;
    syncHeroTimerButtons(mins);
    if (modeSelect.value !== 'timer') {
      modeSelect.value = 'timer';
      modeSelect.dispatchEvent(new Event('change'));
    } else {
      updateModeDisplay();
    }
    setTimerMenu(false);
  });
});

document.addEventListener('click', (event) => {
  const clickedInsideMenu = heroTimerMenu.contains(event.target);
  const clickedTrigger = heroTimerTrigger.contains(event.target);
  if (!clickedInsideMenu && !clickedTrigger) {
    setTimerMenu(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setTimerMenu(false);
  }
});

setTimerMenu(false);
setHeroMode(state.mode);
updateMusicButtons(state.musicOn);

function toggleMusic() {
  if (state.musicOn) {
    stopMusic();
  } else {
    startMusic();
  }
}

heroMusicToggle.addEventListener('click', toggleMusic);
gameMusicToggle.addEventListener('click', toggleMusic);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.musicOn) {
    stopMusic();
  }
});

function selectDeck(pool) {
  const filtered = countryCards.filter((c) => {
    if (pool === 'all') return true;
    if (pool === 'easy-medium') return c.difficulty !== 'hard';
    if (pool === 'medium-hard') return c.difficulty !== 'easy';
    if (pool === 'easy') return c.difficulty === 'easy';
    if (pool === 'medium') return c.difficulty === 'medium';
    if (pool === 'hard') return c.difficulty === 'hard';
    return true;
  });
  return [...filtered];
}

function startTimer(seconds) {
  clearInterval(state.timer);
  state.timerRemaining = seconds;
  state.timerWarningPlayed = false;
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timerRemaining -= 1;
    if (state.timerRemaining <= 0) {
      clearInterval(state.timer);
      timerDisplay.textContent = 'Timer: Session ending after this card';
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timerRemaining / 60);
  const secs = String(state.timerRemaining % 60).padStart(2, '0');
  timerDisplay.textContent = `Timer: ${mins}:${secs}`;
  timerDisplay.classList.toggle('low-time', state.timerRemaining <= 30);
  if (state.timerRemaining <= 15 && !state.timerWarningPlayed) {
    playBeep();
    state.timerWarningPlayed = true;
  }
  updateModeDisplay();
}

function updateModeDisplay() {
  const timerMins = Math.max(1, Math.floor((state.timerRemaining || bootstrapOptions.defaultTimerMinutes * 60) / 60));
  const modeText = state.mode === 'timer'
    ? `Timed challenge (${timerMins} min)`
    : `Turn-based team play (to ${state.targetPoints} pts)`;
  modeDisplay.textContent = `Mode: ${modeText}`;
  heroTimerValue.textContent = `${timerMins} min`;
  syncHeroTimerButtons(timerMins);
}

function updateScoreDisplay() {
  const pts = state.players.map((p) => `${p.name}: ${state.scores[p.name].points} pts`).join(' • ');
  scoreDisplay.textContent = pts || 'Scoreboard ready';
}

function updateScoreTable() {
  scoreRows.innerHTML = '';
  state.players.forEach((p) => {
    const row = document.createElement('tr');
    const s = state.scores[p.name];
    row.innerHTML = `<td>${p.name}</td><td>${s.points}</td><td>${s.easy}</td><td>${s.medium}</td><td>${s.hard}</td>`;
    scoreRows.appendChild(row);
  });
}

function drawCard() {
  if (state.deck.length === 0) {
    state.deck = selectDeck(state.difficultyPool);
    state.usedIds.clear();
  }
  const idx = Math.floor(Math.random() * state.deck.length);
  const card = state.deck.splice(idx, 1)[0];
  state.usedIds.add(card.id);
  return card;
}

function renderCard(card) {
  cardName.textContent = card.name;
  cardStars.textContent = '★'.repeat(card.stars);
  sharedStars.textContent = '★'.repeat(card.stars);
  cardMeta.textContent = `${card.continent} • ${card.subregion}`;
  const flagGlyph = card.flag || '🏳️';
  const countryCode = emojiToCountryCode(flagGlyph);
  cardFlagFallback.innerHTML = '';
  cardFlagFallback.classList.add('hidden');
  cardFlagImg.classList.add('hidden');
  flagVeil?.classList.add('masked');
  state.flagPenalty = false;
  if (flagPeekBtn) {
    flagPeekBtn.disabled = false;
    flagPeekNote.textContent = 'Flag stays blurred until you tap peek.';
  }
  mapOutline.classList.add('hidden');
  const showFallbackFlag = () => {
    if (window.twemoji) {
      cardFlagFallback.innerHTML = twemoji.parse(flagGlyph, { folder: 'svg', ext: '.svg' });
    } else {
      cardFlagFallback.textContent = flagGlyph;
    }
    cardFlagFallback.classList.remove('hidden');
  };
  if (countryCode) {
    const codeLower = countryCode.toLowerCase();
    cardFlagImg.src = `https://flagcdn.com/w320/${codeLower}.png`;
    cardFlagImg.alt = `${card.name} flag`;
    cardFlagImg.loading = 'lazy';
    cardFlagImg.referrerPolicy = 'no-referrer';
    cardFlagImg.onload = () => {
      cardFlagFallback.classList.add('hidden');
    };
    cardFlagImg.onerror = showFallbackFlag;
    cardFlagImg.classList.remove('hidden');
    mapOutline.src = `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${codeLower}/vector.svg`;
    mapOutline.alt = `${card.name} outline map`;
    mapOutline.loading = 'lazy';
    mapOutline.onerror = () => {
      mapOutline.classList.add('hidden');
    };
    mapOutline.classList.remove('hidden');
  } else {
    showFallbackFlag();
  }
  cardTags.innerHTML = '';
  ['hemisphere', 'coastline_type', 'size_category'].forEach((key) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = card[key].replace(/_/g, ' ');
    cardTags.appendChild(span);
  });
  cardCapital.textContent = card.capital;
  cardMetaTop.textContent = `${card.continent} • ${card.subregion}`;
  cardPop.textContent = card.population_hint;
  cardArea.textContent = card.area_hint;
  cardSize.textContent = card.size_category;
  cardHemi.textContent = card.hemisphere;
  cardCoast.textContent = card.coastline_type;
  cardLang.textContent = card.main_languages.join(', ');
  cardCurrency.textContent = card.currency;
  cardNeighbors.textContent = card.neighbors.length ? card.neighbors.join(', ') : 'None (island/isolated)';
  cardLandmarks.innerHTML = card.landmarks.map((l) => `<li>${l}</li>`).join('');
  cardFacts.innerHTML = card.fun_facts.map((f) => `<li>${f}</li>`).join('');
  difficultyLabel.textContent = `${card.difficulty.toUpperCase()} • ${card.stars}★ • ${card.coastline_type}`;
  builtInClue.textContent = card.built_in_clue;
  nearbyClue.textContent = card.nearby_country_clue || 'N/A';
  builtInClue.classList.add('hidden');
  nearbyClue.classList.add('hidden');
  revealClueBtn.disabled = false;
  revealNearbyBtn.disabled = !card.nearby_country_clue;
  state.clueRevealed = false;
  state.nearbyRevealed = false;
  regionHint.classList.add('masked-soft');
  capitalRow.classList.add('masked-soft');
  regionRevealBtn.disabled = false;
  capitalRevealBtn.disabled = false;
  questionCountEl.textContent = state.questionCount;
}

function logQA(entry) {
  const div = document.createElement('div');
  div.className = 'log-item';
  div.innerHTML = `<strong>${entry.player}</strong> (${entry.type}): ${entry.text}<br/><span class="muted">${entry.result}</span>`;
  qaLog.appendChild(div);
  qaLog.scrollTop = qaLog.scrollHeight;
}

function resetQA() {
  qaLog.innerHTML = '';
  questionCountEl.textContent = '0';
}

function maskCard(shouldHide) {
  if (!identityBlock) return;
  identityBlock.classList.toggle('masked', shouldHide);
}

function startRound() {
  state.questionCount = 0;
  resetQA();
  state.currentCard = drawCard();
  renderCard(state.currentCard);
  state.flagRevealed = false;
  maskCard(true);
  revealFlagBtn.disabled = false;
  logGuessBtn.disabled = false;
  markCorrectBtn.disabled = false;
  const defaultGuesser = state.players[(state.currentClueGiverIndex + 1) % state.players.length];
  setActiveChip(defaultGuesser?.name || state.players[state.currentClueGiverIndex]?.name);
  renderHolderChips();
  updateTurnCopy();
  updateModeDisplay();
  updateScoreDisplay();
  updateScoreTable();
}

function showGamePage() {
  landingPage.classList.add('hidden');
  gamePage.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const count = Math.min(8, Math.max(2, parseInt(playerCountInput.value, 10) || 2));
  const slots = Array.from(playerNamesContainer.querySelectorAll('.player-card')).slice(0, count);
  const names = slots.map((slot, idx) => {
    const typed = slot.querySelector('input')?.value.trim();
    const avatar = slot.dataset.avatar || avatarOptions[0];
    return typed || `${avatar} Player ${idx + 1}`;
  });
  state.players = names.map((n, idx) => ({ name: n, index: idx }));
  state.players.forEach((p) => {
    state.scores[p.name] = { points: 0, easy: 0, medium: 0, hard: 0 };
  });
  state.mode = modeSelect.value;
  state.difficultyPool = difficultyPool.value;
  state.targetPoints = parseInt(targetPointsInput.value, 10) || bootstrapOptions.defaultTargetPoints;
  const timerSeconds = (parseInt(timerLengthInput.value, 10) || bootstrapOptions.defaultTimerMinutes) * 60;
  updateModeDisplay();
  if (state.mode === 'timer') {
    startTimer(timerSeconds);
  } else {
    clearInterval(state.timer);
    timerDisplay.textContent = 'Timer: Turn-based';
  }
  state.deck = selectDeck(state.difficultyPool);
  renderPlayerChips();
  renderHolderChips();
  setupSection.classList.add('hidden');
  showGamePage();
  startRound();
});

restartSetupBtn.addEventListener('click', () => {
  window.location.reload();
});

nextRoundBtn.addEventListener('click', () => {
  if (!state.players.length) return;
  advanceClueGiver();
  startRound();
});

revealClueBtn.addEventListener('click', () => {
  builtInClue.classList.remove('hidden');
  state.clueRevealed = true;
  revealClueBtn.disabled = true;
  logQA({ player: 'Host', type: 'clue', text: 'Special clue revealed', result: 'One-time clue used for this card.' });
});

revealNearbyBtn.addEventListener('click', () => {
  if (!state.currentCard.nearby_country_clue) return;
  nearbyClue.classList.remove('hidden');
  state.nearbyRevealed = true;
  revealNearbyBtn.disabled = true;
  logQA({ player: 'Host', type: 'clue', text: 'Nearby country hint revealed', result: 'Hint consumed for this card.' });
});

flagPeekBtn.addEventListener('click', () => {
  flagVeil.classList.remove('masked');
  state.flagPenalty = true;
  flagPeekBtn.disabled = true;
  flagPeekNote.textContent = 'Flag peeked: correct guess is worth one less point (minimum 1).';
  logQA({ player: 'Host', type: 'peek', text: 'Flag peeked', result: 'Next correct guess earns -1 point.' });
});

regionRevealBtn.addEventListener('click', () => {
  regionHint.classList.remove('masked-soft');
  regionRevealBtn.disabled = true;
  logQA({ player: 'Host', type: 'hint', text: 'Region hint revealed', result: 'Hemisphere and continent shown.' });
});

capitalRevealBtn.addEventListener('click', () => {
  capitalRow.classList.remove('masked-soft');
  capitalRevealBtn.disabled = true;
  logQA({ player: 'Host', type: 'hint', text: 'Capital revealed', result: 'Mid-game hint used.' });
});

logQuestionBtn.addEventListener('click', () => {
  const player = selectedPlayer || state.players[0]?.name;
  if (!player) return;
  if (state.questionCount >= 10) {
    alert('Question limit reached for this card. Jump to guesses!');
    return;
  }
  state.questionCount += 1;
  questionCountEl.textContent = state.questionCount;
  const limitNote = state.questionCount >= 10 ? 'Question limit reached—switch to guesses.' : 'Question logged—card-holder answers.';
  logQA({ player, type: 'question', text: 'Asked a question', result: limitNote });
});

logGuessBtn.addEventListener('click', () => {
  const player = selectedPlayer || state.players[0]?.name;
  if (!player) return;
  logQA({ player, type: 'guess', text: 'Took a guess', result: 'Not correct. Keep the round rolling.' });
});

markCorrectBtn.addEventListener('click', () => {
  const player = selectedPlayer || state.players[0]?.name;
  if (!player) return;
  const score = state.scores[player];
  const basePoints = state.currentCard.stars;
  const penalty = state.flagPenalty ? 1 : 0;
  const awarded = Math.max(1, basePoints - penalty);
  score.points += awarded;
  score[state.currentCard.difficulty] += 1;
  const flagNote = penalty ? ' (flag peeked: -1 point)' : '';
  logQA({ player, type: 'guess', text: 'Correct guess!', result: `${player} earns ${awarded} point(s)${flagNote}. Next card ready.` });
  advanceClueGiver();
  checkEndConditions();
  startRound();
});

revealFlagBtn.addEventListener('click', () => {
  state.flagRevealed = true;
  maskCard(false);
  revealFlagBtn.disabled = true;
  logGuessBtn.disabled = false;
  markCorrectBtn.disabled = false;
  regionHint.classList.remove('masked-soft');
  capitalRow.classList.remove('masked-soft');
  regionRevealBtn.disabled = true;
  capitalRevealBtn.disabled = true;
});

function advanceClueGiver() {
  state.currentClueGiverIndex = (state.currentClueGiverIndex + 1) % state.players.length;
  renderHolderChips();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // audio not available; silently skip
  }
}

function checkEndConditions() {
  if (state.mode === 'points') {
    const winner = state.players.find((p) => state.scores[p.name].points >= state.targetPoints);
    if (winner) {
      alert(`${winner.name} reached ${state.targetPoints} points! Finish current card and stop.`);
    }
  }
  if (state.timerRemaining <= 0) {
    alert('Time is up. Finish this card and wrap up!');
  }
}

function makeCsvRow(card) {
  const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
  return [
    card.id,
    card.name,
    card.difficulty,
    card.stars,
    card.continent,
    card.subregion,
    card.capital,
    card.population_hint,
    card.size_category,
    card.area_hint,
    card.hemisphere,
    card.coastline_type,
    card.neighbors.join('; '),
    card.main_languages.join('; '),
    card.currency,
    card.landmarks.join('; '),
    card.fun_facts.join('; '),
    card.built_in_clue,
    card.nearby_country_clue || ''
  ].map(escape).join(',');
}

downloadCsvBtn.addEventListener('click', () => {
  const header = ['id','name','difficulty','stars','continent','subregion','capital','population_hint','size_category','area_hint','hemisphere','coastline_type','neighbors','main_languages','currency','landmarks','fun_facts','built_in_clue','nearby_country_clue'];
  const csv = [header.join(',')].concat(countryCards.map(makeCsvRow)).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'geo-country-cards.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Initial mask off
maskCard(false);
