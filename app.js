// Geo Game Table front-end
// How to run locally: open index.html in any modern browser. No build step required.
// To edit country data: see data/countries.js and adjust the countryCards array.
// To change default timer/points/difficulty presets: tweak defaults in bootstrapOptions below.

const bootstrapOptions = {
  defaultTimerMinutes: 15,
  defaultTargetPoints: 15,
};

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
};

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

const gameSection = document.getElementById('game');
const setupSection = document.getElementById('setup');
const scoreboardSection = document.getElementById('scoreboard');
const exportSection = document.getElementById('export');

const cardName = document.getElementById('card-name');
const cardStars = document.getElementById('card-stars');
const sharedStars = document.getElementById('shared-stars');
const cardMeta = document.getElementById('card-meta');
const cardFlag = document.getElementById('card-flag');
const cardTags = document.getElementById('card-tags');
const cardCapital = document.getElementById('card-capital');
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
const questionCountEl = document.getElementById('question-count');
const qaForm = document.getElementById('qa-form');
const qaPlayerSelect = document.getElementById('qa-player');
const qaText = document.getElementById('qa-text');
const qaType = document.getElementById('qa-type');
const qaLog = document.getElementById('qa-log');
const revealClueBtn = document.getElementById('reveal-clue');
const revealNearbyBtn = document.getElementById('reveal-nearby');
const builtInClue = document.getElementById('built-in-clue');
const nearbyClue = document.getElementById('nearby-clue');
const scoreRows = document.getElementById('score-rows');
const exportJson = document.getElementById('export-json');
const downloadCsvBtn = document.getElementById('download-csv');

let privacyHidden = false;

function renderPlayerInputs(count) {
  playerNamesContainer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement('label');
    wrap.textContent = `Player ${i + 1} name`;
    const input = document.createElement('input');
    input.value = `Player ${i + 1}`;
    input.dataset.index = i;
    wrap.appendChild(input);
    playerNamesContainer.appendChild(wrap);
  }
}

playerCountInput.addEventListener('input', (e) => {
  const count = Math.min(8, Math.max(2, parseInt(e.target.value, 10) || 2));
  renderPlayerInputs(count);
});

modeSelect.addEventListener('change', () => {
  const isTimer = modeSelect.value === 'timer';
  timerWrapper.classList.toggle('hidden', !isTimer);
  pointsWrapper.classList.toggle('hidden', isTimer);
});

renderPlayerInputs(parseInt(playerCountInput.value, 10));

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
  cardFlag.textContent = card.flag || '🏳️';
  cardTags.innerHTML = '';
  ['hemisphere', 'coastline_type', 'size_category'].forEach((key) => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = card[key].replace(/_/g, ' ');
    cardTags.appendChild(span);
  });
  cardCapital.textContent = card.capital;
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
  qaText.value = '';
  questionCountEl.textContent = '0';
}

function maskCard(shouldHide) {
  const detail = document.querySelector('.card-detail');
  detail.style.filter = shouldHide ? 'blur(6px)' : 'none';
  detail.style.pointerEvents = shouldHide ? 'none' : 'auto';
}

function startRound() {
  state.questionCount = 0;
  resetQA();
  state.currentCard = drawCard();
  renderCard(state.currentCard);
  const clueGiver = state.players[state.currentClueGiverIndex];
  currentTurn.textContent = `${clueGiver.name} is Clue-giver. Pass device or hide card for guessers.`;
  updateScoreDisplay();
  updateScoreTable();
}

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const count = Math.min(8, Math.max(2, parseInt(playerCountInput.value, 10) || 2));
  const names = Array.from(playerNamesContainer.querySelectorAll('input')).slice(0, count).map((i) => i.value.trim() || 'Player');
  state.players = names.map((n, idx) => ({ name: n, index: idx }));
  state.players.forEach((p) => {
    state.scores[p.name] = { points: 0, easy: 0, medium: 0, hard: 0 };
  });
  state.mode = modeSelect.value;
  state.difficultyPool = difficultyPool.value;
  state.targetPoints = parseInt(targetPointsInput.value, 10) || bootstrapOptions.defaultTargetPoints;
  const timerSeconds = (parseInt(timerLengthInput.value, 10) || bootstrapOptions.defaultTimerMinutes) * 60;
  startTimer(timerSeconds);
  state.deck = selectDeck(state.difficultyPool);
  qaPlayerSelect.innerHTML = state.players.map((p) => `<option value="${p.name}">${p.name}</option>`).join('');
  setupSection.classList.add('hidden');
  gameSection.classList.remove('hidden');
  scoreboardSection.classList.remove('hidden');
  exportSection.classList.remove('hidden');
  startRound();
  exportJson.value = JSON.stringify(countryCards, null, 2);
});

revealClueBtn.addEventListener('click', () => {
  builtInClue.classList.remove('hidden');
  state.clueRevealed = true;
  revealClueBtn.disabled = true;
});

revealNearbyBtn.addEventListener('click', () => {
  if (!state.currentCard.nearby_country_clue) return;
  nearbyClue.classList.remove('hidden');
  state.nearbyRevealed = true;
  revealNearbyBtn.disabled = true;
});

qaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = qaText.value.trim();
  if (!text) return;
  const type = qaType.value;
  const player = qaPlayerSelect.value;
  if (type === 'question' && state.questionCount >= 10) {
    alert('Question limit reached for this card. You can still make guesses.');
    return;
  }
  let result = 'Awaiting Clue-giver answer';
  if (type === 'guess') {
    const correct = text.toLowerCase() === state.currentCard.name.toLowerCase();
    if (correct) {
      const score = state.scores[player];
      score.points += state.currentCard.stars;
      score[state.currentCard.difficulty] += 1;
      result = `Correct! ${player} gains ${state.currentCard.stars} point(s). Card ends.`;
      logQA({ player, type, text, result });
      advanceClueGiver();
      checkEndConditions();
      startRound();
      return;
    } else {
      result = 'Wrong guess. Pass to next guesser.';
    }
  } else {
    state.questionCount += 1;
    questionCountEl.textContent = state.questionCount;
    if (state.questionCount >= 10) {
      result = 'Question logged. Limit reached—reveal after guesses.';
    }
  }
  logQA({ player, type, text, result });
  qaText.value = '';
});

function advanceClueGiver() {
  state.currentClueGiverIndex = (state.currentClueGiverIndex + 1) % state.players.length;
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

const privacyToggle = document.createElement('button');
privacyToggle.textContent = 'Toggle Clue-giver Privacy';
privacyToggle.className = 'ghost';
privacyToggle.addEventListener('click', () => {
  privacyHidden = !privacyHidden;
  maskCard(privacyHidden);
  privacyToggle.textContent = privacyHidden ? 'Reveal Card (Clue-giver)' : 'Hide Card from Guessers';
});

document.querySelector('.top-row').appendChild(privacyToggle);

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
