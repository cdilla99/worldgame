/**
 * GeoWars — Country silhouette guessing game
 *
 * Flow: Silhouette shows → Player says answer out loud → Taps to validate
 * Flag is a secondary hint (unlockable). Outline is the game.
 */

// ============================================================
// STATE
// ============================================================

const state = {
  mode: 'sprint', // 'sprint' or 'showoff'
  difficulty: 'all',
  continent: 'all',
  deck: [],
  currentCard: null,
  choices: [],
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  total: 0,
  timer: null,
  timeLeft: 60,
  flagRevealed: false,
  regionRevealed: false,
  answered: false,
  gameOver: false,
  lastMultiplier: 1,
  feedbackTimeout: null,
  roundHistory: [],
  roundCounted: false,
  assetFailure: null,
};

// ============================================================
// HELPERS
// ============================================================

function getCountryCode(flagEmoji) {
  if (!flagEmoji || flagEmoji.length < 2) return null;
  const codePoints = [...flagEmoji].map(c => c.codePointAt(0));
  if (codePoints.length >= 2 && codePoints[0] >= 0x1F1E6 && codePoints[0] <= 0x1F1FF) {
    const a = String.fromCharCode(codePoints[0] - 0x1F1E6 + 65);
    const b = String.fromCharCode(codePoints[1] - 0x1F1E6 + 65);
    return a + b;
  }
  return null;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function filterDeck(difficulty) {
  let cards = [...countryCards];
  if (difficulty !== 'all') cards = cards.filter(c => c.difficulty === difficulty);
  if (state.continent && state.continent !== 'all') {
    if (state.continent === 'North America') {
      cards = cards.filter(c => c.continent === 'North America' || c.continent === 'South America');
    } else {
      cards = cards.filter(c => c.continent === state.continent);
    }
  }
  return cards;
}

/**
 * Pick 3 wrong answers from the same continent (similar countries = harder).
 * Falls back to random if not enough from same continent.
 */
function pickDistractors(correctCard, pool) {
  // Prefer same continent
  let candidates = pool.filter(c => c.continent === correctCard.continent && c.id !== correctCard.id);
  if (candidates.length < 5) {
    // Not enough from same continent, pull from everywhere
    const extras = pool.filter(c => c.id !== correctCard.id && c.continent !== correctCard.continent);
    candidates = candidates.concat(shuffle(extras));
  }
  shuffle(candidates);
  return candidates.slice(0, 5);
}

// ============================================================
// DOM REFS
// ============================================================

const $landing = document.getElementById('landing');
const $game = document.getElementById('game');
const $results = document.getElementById('results');

const $silhouetteImg = document.getElementById('silhouette-img');
const $flagHint = document.getElementById('flag-hint');
const $flagImg = document.getElementById('flag-img');
const $continentHint = document.getElementById('continent-hint');
const $difficultyHint = document.getElementById('difficulty-hint');
const $choices = document.getElementById('choices');
const $choiceBtns = document.querySelectorAll('.choice-btn');
const $feedback = document.getElementById('feedback');
const $feedbackIcon = document.getElementById('feedback-icon');
const $feedbackText = document.getElementById('feedback-details');
const $feedbackFlag = document.getElementById('feedback-flag');
const $feedbackScore = document.getElementById('feedback-score');
const $feedbackCountryName = document.getElementById('feedback-country-name');
const $feedbackRegion = document.getElementById('feedback-region');
const $feedbackActions = document.getElementById('feedback-actions');
const $feedbackNext = document.getElementById('btn-feedback-next');
const $feedbackResults = document.getElementById('btn-feedback-results');
const $feedbackHome = document.getElementById('btn-feedback-home');
const $timerText = document.getElementById('timer-text');
const $timerProgress = document.getElementById('timer-progress');
const $timerContainer = document.getElementById('timer-container');
const $streakDisplay = document.getElementById('streak-display');
const $scoreDisplay = document.getElementById('score-display');
const $btnShowFlag = document.getElementById('btn-show-flag');
const $btnShowRegion = document.getElementById('btn-show-region');
const $btnReveal = document.getElementById('btn-reveal');
const $btnQuit = document.getElementById('btn-quit');
const $clueArea = document.getElementById('clue-area');
const $clueText = document.getElementById('clue-text');
const $feedbackHeading = document.getElementById('feedback-heading');
const $feedbackStatus = document.getElementById('feedback-status');
const $silhouetteBox = document.getElementById('silhouette-box');
const $assetRecovery = document.getElementById('asset-recovery');
const $assetRecoveryMessage = document.getElementById('asset-recovery-message');
const $btnRetrySilhouette = document.getElementById('btn-retry-silhouette');
const $btnRecoverNext = document.getElementById('btn-recover-next');
const $btnRecoverHome = document.getElementById('btn-recover-home');
const $answerInteractionPanel = document.getElementById('answer-interaction-panel');
const assetFallbacks = window.AssetFallbacks;

function setAssetRecoveryVisible(visible) {
  if (!$assetRecovery) return;
  $assetRecovery.classList.toggle('hidden', !visible);
  $assetRecovery.setAttribute('aria-hidden', String(!visible));
  $assetRecovery.toggleAttribute('inert', !visible);
  if ('inert' in $assetRecovery) $assetRecovery.inert = !visible;
}

function setAnswerPanelAvailable(available) {
  if (!$answerInteractionPanel) return;
  $answerInteractionPanel.classList.toggle('hidden', !available);
  $answerInteractionPanel.setAttribute('aria-hidden', String(!available));
  $answerInteractionPanel.toggleAttribute('inert', !available);
  if ('inert' in $answerInteractionPanel) $answerInteractionPanel.inert = !available;
}

function clearAssetRecovery() {
  state.assetFailure = null;
  setAssetRecoveryVisible(false);
  setAnswerPanelAvailable(true);
}

function handleSilhouetteAssetFailure(card) {
  if (!card || state.currentCard !== card || state.gameOver || state.answered || (state.assetFailure && state.assetFailure.cardId !== card.id)) return;
  if (!state.assetFailure) state.assetFailure = { cardId: card.id, type: 'silhouette' };
  if (state.roundCounted) {
    state.total = Math.max(0, state.total - 1);
    state.roundCounted = false;
  }
  clearInterval(state.timer);
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  if ($assetRecoveryMessage) {
    $assetRecoveryMessage.textContent = 'The country silhouette could not be loaded. Retry, move on, or return home. This round will not be saved.';
  }
  setControlDisabled($btnRetrySilhouette, false);
  setAssetRecoveryVisible(true);
  setAnswerPanelAvailable(false);
}

function restoreRecoveredRound(card) {
  if (!state.assetFailure || state.assetFailure.cardId !== card.id || state.currentCard !== card) return;
  if (!state.roundCounted) {
    state.total++;
    state.roundCounted = true;
  }
  clearAssetRecovery();
  if (state.mode === 'sprint' && state.timeLeft > 0 && !state.gameOver) resumeTimer();
  focusElement(document.getElementById('btn-i-know'));
}

function renderSilhouetteAsset(card) {
  const previousAsset = $silhouetteBox && $silhouetteBox.querySelector('#silhouette-img, [data-asset-fallback="silhouette"]');
  if (previousAsset) previousAsset.remove();
  if (!$silhouetteBox || !assetFallbacks) {
    handleSilhouetteAssetFailure(card);
    return;
  }

  const image = document.createElement('img');
  image.id = 'silhouette-img';
  image.alt = 'Guess this country';
  image.addEventListener('error', () => handleSilhouetteAssetFailure(card), { once: true });
  image.addEventListener('load', () => restoreRecoveredRound(card), { once: true });
  $silhouetteBox.insertBefore(image, $flagHint);

  const source = assetFallbacks.prepareImage(image, 'silhouette', card, { alt: image.alt });
  if (!source || !source.url) handleSilhouetteAssetFailure(card);
}

function renderFlagHintAsset(card) {
  if (!$flagHint || !assetFallbacks) return;
  $flagHint.replaceChildren();
  const image = document.createElement('img');
  image.id = 'flag-img';
  image.alt = '';
  $flagHint.appendChild(image);
  assetFallbacks.prepareImage(image, 'flag', card, { countryName: card.name, alt: '' });
}

function renderFeedbackFlagAsset(card) {
  if (!assetFallbacks) return;
  const flag = document.createElement('img');
  flag.className = 'reveal-flag';
  $feedbackFlag.appendChild(flag);
  assetFallbacks.prepareImage(flag, 'flag', card, {
    countryName: card.name,
    alt: card.name + ' flag',
    className: 'feedback-flag-fallback'
  });
}

function retrySilhouetteRecovery() {
  if (!state.assetFailure || state.assetFailure.type !== 'silhouette' || state.gameOver) return;
  setControlDisabled($btnRetrySilhouette, true);
  if ($assetRecoveryMessage) $assetRecoveryMessage.textContent = 'Retrying the country silhouette. This round remains excluded until the image loads.';
  renderSilhouetteAsset(state.currentCard);
}

function advanceFromAssetRecovery() {
  if (!state.assetFailure || state.gameOver) return;
  nextRound();
}

function returnHomeFromAssetRecovery() {
  if (!state.assetFailure) return;
  clearInterval(state.timer);
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  state.gameOver = true;
  invokeBackgroundMusic('stop');
  clearAssetRecovery();
  showScreen($landing);
  loadStats();
}

function setControlLabel(control, label) {
  if (!control) return;
  const labelElement = control.querySelector('span:last-child');
  if (labelElement) {
    labelElement.textContent = label;
  } else {
    control.textContent = label;
  }
}

function setControlDisabled(control, disabled) {
  if (!control) return;
  control.disabled = disabled;
  control.setAttribute('aria-disabled', String(disabled));
}

function setControlIcon(control, iconId) {
  const use = control && control.querySelector('svg use');
  if (use) use.setAttribute('href', 'assets/geowars-icons.svg#' + iconId);
}

function appendFeedbackDetail(container, className, text) {
  const detail = document.createElement('p');
  detail.className = className;
  detail.textContent = text;
  container.appendChild(detail);
}

function renderFeedbackStatusIcon(correct, isReveal) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.setAttribute('class', 'feedback-status-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', 'true');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2.2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', isReveal
    ? 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v5m0 3h.01'
    : correct
      ? 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 9 2.5 2.5L16.5 9'
      : 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3 6 6 6m0-6-6 6');
  svg.appendChild(path);
  $feedbackIcon.replaceChildren(svg);
}

if ($btnRetrySilhouette) $btnRetrySilhouette.addEventListener('click', retrySilhouetteRecovery);
if ($btnRecoverNext) $btnRecoverNext.addEventListener('click', advanceFromAssetRecovery);
if ($btnRecoverHome) $btnRecoverHome.addEventListener('click', returnHomeFromAssetRecovery);

// Mute button
const $btnMute = document.getElementById('btn-mute');
let audioMuted = false;

function invokeBackgroundMusic(method, value) {
  const music = window.BackgroundMusic;
  if (!music || typeof music[method] !== 'function') return;
  try { music[method](value); } catch (error) {}
}

if ($btnMute) {
  $btnMute.addEventListener('click', () => {
    audioMuted = !audioMuted;
    AudioEngine.setEnabled(!audioMuted);
    invokeBackgroundMusic('setMuted', audioMuted);
    setControlIcon($btnMute, audioMuted ? 'icon-sound-muted' : 'icon-sound');
    setControlLabel($btnMute, audioMuted ? 'Sound off' : 'Sound on');
    $btnMute.setAttribute('aria-label', audioMuted ? 'Enable sound' : 'Mute sound');
    $btnMute.setAttribute('aria-pressed', String(audioMuted));
  });
}

// Results
const $resultsTitle = document.getElementById('results-title');
const $resultsStatus = document.getElementById('results-status');
const $resScore = document.getElementById('res-score');
const $resStreak = document.getElementById('res-streak');
const $resCorrect = document.getElementById('res-correct');

// Stats
const $statPlayed = document.getElementById('stat-played');
const $statBest = document.getElementById('stat-best');
const $statTotal = document.getElementById('stat-total');
const $playerContextName = document.getElementById('player-context-name');
const $playerContextDetail = document.getElementById('player-context-detail');
const $choosePlayerButton = document.getElementById('btn-choose-player');
const $playerProfileModal = document.getElementById('player-profile-modal');
const $playerProfileForm = document.getElementById('player-profile-form');
const $playerProfileName = document.getElementById('player-profile-name');
const $playerProfileEmail = document.getElementById('player-profile-email');
const $playerProfileStatus = document.getElementById('player-profile-status');
const $playerProfileDescription = document.getElementById('player-profile-description');
const $sendPlayerLinkButton = document.getElementById('btn-send-player-link');

// ============================================================
// SCREENS
// ============================================================

function showScreen(screen) {
  [$landing, $game, $results].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

// ============================================================
// LANDING
// ============================================================

// Keep internal filter state synchronized with the visibly active controls.
// This also protects against stale state when switching between game modes.
function syncFiltersFromUI() {
  const activeDifficulty = document.querySelector('.diff-btn[data-diff].active');
  const activeContinent = document.querySelector('#continent-row .diff-btn.active');
  state.difficulty = activeDifficulty ? activeDifficulty.dataset.diff : 'all';
  state.continent = activeContinent ? activeContinent.dataset.continent : 'all';
  updateFilterSummary();
}

// Update the setup summary whenever a selection changes.
function updateFilterSummary() {
  const $summary = document.getElementById('filter-summary');
  if (!$summary) return;
  const diffLabel = state.difficulty === 'all'
    ? 'Any difficulty'
    : state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
  const continentLabel = state.continent === 'all'
    ? 'Worldwide'
    : (state.continent === 'North America' ? 'Americas' : state.continent);
  $summary.textContent = diffLabel + ' · ' + continentLabel;
}

function selectFilterOption(buttons, selectedButton) {
  buttons.forEach(button => {
    const isSelected = button === selectedButton;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  syncFiltersFromUI();
}

// Difficulty buttons
const $difficultyButtons = document.querySelectorAll('.diff-btn[data-diff]');
$difficultyButtons.forEach(button => {
  button.addEventListener('click', () => selectFilterOption($difficultyButtons, button));
});

// Region filter buttons
const $continentButtons = document.querySelectorAll('#continent-row .diff-btn');
$continentButtons.forEach(button => {
  button.addEventListener('click', () => selectFilterOption($continentButtons, button));
});

const $btnSprint = document.getElementById('btn-sprint');
const $btnShowoff = document.getElementById('btn-showoff');
const $modeButtons = [$btnSprint, $btnShowoff];
const $modeSummary = document.getElementById('mode-summary');
const $startGameButton = document.getElementById('btn-start-game');
const $startGameLabel = document.getElementById('start-game-label');

function updateModeSummary() {
  const isSprint = state.mode === 'sprint';
  if ($modeSummary) {
    $modeSummary.textContent = isSprint
      ? 'Sprint selected — 60 seconds to answer by typing or options.'
      : 'Practice selected — No timer. Reveal each answer and advance at your own pace.';
  }
  if ($startGameLabel) $startGameLabel.textContent = isSprint ? 'Start Sprint' : 'Start Practice';
}

function selectModeOption(selectedButton) {
  const isSprint = selectedButton === $btnSprint;
  state.mode = isSprint ? 'sprint' : 'showoff';
  $modeButtons.forEach(button => {
    const isSelected = button === selectedButton;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  updateModeSummary();
}

// Derive state from the visible selection, retaining Sprint as a valid fallback.
function syncModeFromUI() {
  const selectedButton = $modeButtons.find(button => button.classList.contains('active'))
    || $modeButtons.find(button => button.getAttribute('aria-pressed') === 'true')
    || $btnSprint;
  selectModeOption(selectedButton);
}

function syncLandingStateFromUI() {
  syncModeFromUI();
  syncFiltersFromUI();
}

$btnSprint.addEventListener('click', () => selectModeOption($btnSprint));
$btnShowoff.addEventListener('click', () => selectModeOption($btnShowoff));

// The sole primary action captures what the player can currently see before play starts.
$startGameButton.addEventListener('click', () => {
  syncLandingStateFromUI();
  startGame();
});

syncLandingStateFromUI();

// Load stats on page load (from Supabase if online, localStorage fallback)
async function loadStats() {
  let stats;
  if (window.GeoWarsDB) {
    await GeoWarsDB.init();
    stats = await GeoWarsDB.getStats();
  } else {
    try {
      const s = JSON.parse(localStorage.getItem('geowars-stats') || '{}');
      stats = {
        played: s.played || 0,
        bestStreak: s.bestStreak || 0,
        totalCorrect: s.totalCorrect || 0
      };
    } catch (e) {
      stats = { played: 0, bestStreak: 0, totalCorrect: 0 };
    }
  }

  $statPlayed.textContent = stats.played || 0;
  $statBest.textContent = stats.bestStreak || 0;
  $statTotal.textContent = stats.totalCorrect || 0;
  await renderPlayerContext();
}

function saveStats() {
  if (window.GeoWarsDB) {
    return GeoWarsDB.saveGameSession({
      mode: state.mode,
      score: state.score,
      correct: state.correct,
      total: state.total,
      bestStreak: state.bestStreak,
      difficulty: state.difficulty,
      duration: state.mode === 'sprint' ? (60 - state.timeLeft) : null
    });
  }

  try {
    const existing = JSON.parse(localStorage.getItem('geowars-stats') || '{}');
    existing.played = (existing.played || 0) + 1;
    existing.bestStreak = Math.max(existing.bestStreak || 0, state.bestStreak);
    existing.totalCorrect = (existing.totalCorrect || 0) + state.correct;
    localStorage.setItem('geowars-stats', JSON.stringify(existing));
  } catch (e) {}
}

loadStats();

// ============================================================
// GAME
// ============================================================

function startGame() {
  AudioEngine.init();
  invokeBackgroundMusic('setMuted', audioMuted);
  invokeBackgroundMusic('start');
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  // Re-read the visible controls at the final start boundary so mode changes
  // can never carry a stale difficulty or continent into the deck.
  syncFiltersFromUI();
  state.deck = shuffle(filterDeck(state.difficulty));
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correct = 0;
  state.total = 0;
  state.timeLeft = 60;
  state.gameOver = false;
  state.roundHistory = [];
  state.roundCounted = false;
  clearAssetRecovery();

  showScreen($game);
  updateHUD();

  if (state.mode === 'sprint') {
    $timerContainer.classList.remove('hidden');
    $btnReveal.classList.add('hidden');
    startTimer();
  } else {
    $timerContainer.classList.add('hidden');
    $btnReveal.classList.remove('hidden');
    setControlIcon($btnReveal, 'icon-flag');
    setControlLabel($btnReveal, 'Reveal answer');
    setControlDisabled($btnReveal, false);
  }

  nextRound();
  AudioEngine.playRoundStart(0);
}

function startTimer() {
  clearInterval(state.timer);
  state.timeLeft = 60;
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    if (state.timeLeft <= 10) {
      AudioEngine.playTimerWarning(state.timeLeft <= 5 ? 'high' : 'medium');
    }
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      endGame();
    }
  }, 1000);
}

function resumeTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    if (state.timeLeft <= 10) {
      AudioEngine.playTimerWarning(state.timeLeft <= 5 ? 'high' : 'medium');
    }
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      endGame();
    }
  }, 1000);
}

function updateTimerDisplay() {
  $timerText.textContent = state.timeLeft;
  const circumference = 2 * Math.PI * 28; // 175.93
  const offset = circumference * (1 - state.timeLeft / 60);
  $timerProgress.setAttribute('stroke-dashoffset', offset);

  // Color
  if (state.timeLeft > 30) {
    $timerProgress.setAttribute('stroke', 'var(--green)');
  } else if (state.timeLeft > 15) {
    $timerProgress.setAttribute('stroke', 'var(--yellow)');
  } else {
    $timerProgress.setAttribute('stroke', 'var(--urgent)');
  }
}

function animateScore(target) {
  const current = parseInt($scoreDisplay.textContent) || 0;
  if (current === target) return;
  const diff = target - current;
  const steps = Math.min(Math.abs(diff), 10);
  const increment = diff / steps;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step >= steps) {
      $scoreDisplay.textContent = target;
      clearInterval(interval);
    } else {
      $scoreDisplay.textContent = Math.round(current + increment * step);
    }
  }, 40);
}

function updateHUD() {
  animateScore(state.score);
  $scoreDisplay.setAttribute('aria-label', 'Current score: ' + state.score);
  if (state.streak > 0) {
    $streakDisplay.classList.remove('hidden');
    $streakDisplay.textContent = 'Streak ' + state.streak;
    $streakDisplay.setAttribute('aria-label', 'Current streak: ' + state.streak);
  } else {
    $streakDisplay.classList.add('hidden');
    $streakDisplay.textContent = 'Streak 0';
    $streakDisplay.setAttribute('aria-label', 'Current streak: 0');
  }
}

function nextRound() {
  if (state.deck.length === 0) {
    state.deck = shuffle(filterDeck(state.difficulty));
  }

  // Resume timer in Sprint mode (was paused during feedback)
  if (state.mode === 'sprint' && state.timeLeft > 0 && !state.gameOver) {
    resumeTimer();
  }

  state.currentCard = state.deck.pop();
  state.flagRevealed = false;
  state.regionRevealed = false;
  state.answered = false;
  state.total++;
  state.roundCounted = true;
  clearAssetRecovery();

  const card = state.currentCard;

  // Silhouette is the main clue. The fallback module reserves its layout and
  // replaces a failed remote image with a local, readable recovery state.
  renderSilhouetteAsset(card);

  // Flag is a secondary hint. A failed flag is replaced in place and never
  // removes the country name or outcome from feedback.
  $flagHint.classList.add('flag-blurred');
  $flagHint.classList.remove('flag-revealed');
  renderFlagHintAsset(card);

  // Hints
  $continentHint.textContent = '';
  $continentHint.classList.add('hidden');
  $difficultyHint.textContent = card.stars + '★';

  // Reset hint controls for the new stage and keep their disabled state exposed to assistive technology.
  setControlDisabled($btnShowFlag, false);
  setControlLabel($btnShowFlag, 'Show flag');
  $btnShowFlag.removeAttribute('aria-pressed');
  setControlDisabled($btnShowRegion, false);
  setControlLabel($btnShowRegion, 'Show region');
  $btnShowRegion.removeAttribute('aria-pressed');

  // Show answer section (type answer / show options), hide choices and typed input.
  const $answerSection = document.getElementById('answer-section');
  const $typeAnswer = document.getElementById('type-answer');
  const $answerInput = document.getElementById('answer-input');

  $answerSection.classList.remove('hidden');
  $choices.classList.add('hidden');
  $typeAnswer.classList.add('hidden');
  if (state.mode === 'sprint') {
    $btnReveal.classList.add('hidden');
  } else {
    $btnReveal.classList.remove('hidden');
    setControlIcon($btnReveal, 'icon-flag');
    setControlLabel($btnReveal, 'Reveal answer');
    setControlDisabled($btnReveal, false);
  }
  if ($answerInput) $answerInput.value = '';

  // Prepare choices data (but don't show yet)
  const distractors = pickDistractors(card, countryCards);
  const options = shuffle([card, ...distractors]);
  state.choices = options;

  // Hide feedback until an answer or reveal has been evaluated.
  $feedback.classList.add('hidden');
  $feedbackActions.classList.add('hidden');

  // Show/hide skip button
  const $btnSkip = document.getElementById('btn-skip');
  if (state.mode === 'sprint') { $btnSkip.classList.remove('hidden'); } else { $btnSkip.classList.add('hidden'); }
}

// ============================================================
// ANSWERING
// ============================================================

// "I KNOW IT" — show text input
function showTypedAnswer() {
  if (state.answered || state.gameOver) return;
  document.getElementById('answer-section').classList.add('hidden');
  $typeAnswer.classList.remove('hidden');
  syncFeedbackAccessibility(false);
  dismissAutocomplete();
  focusElement($answerInput);
  AudioEngine.playSubmitClick();
}

document.getElementById('btn-i-know').addEventListener('click', showTypedAnswer);

// Bail: clicked "I KNOW IT" but actually don't — fall back to options at 2×
document.getElementById('btn-bail').addEventListener('click', () => {
  if (state.answered || state.gameOver) return;
  $typeAnswer.classList.add('hidden');
  showChoiceButtons(2, true);
});

/**
 * Show multiple choice buttons with a given point multiplier.
 * Used by "Show Options" (1x) and bail from typed answer (2x).
 */
function showChoiceButtons(multiplier, moveFocus) {
  dismissAutocomplete();
  $choices.classList.remove('hidden');
  syncFeedbackAccessibility(false);
  AudioEngine.playReveal();

  // Store the multiplier so handleAnswer uses it
  state.lastMultiplier = multiplier;

  // Populate buttons with prepared choices
  $choiceBtns.forEach((btn, i) => {
    if (state.choices[i]) {
      btn.textContent = state.choices[i].name;
      btn.className = 'choice-btn';
      setControlDisabled(btn, false);
    }
  });

  if (moveFocus) {
    requestAnimationFrame(() => focusElement($choiceBtns.find(button => !button.disabled)));
  }
}

// Autocomplete: the input retains focus while aria-activedescendant identifies
// the currently traversed listbox option. This keeps the typed-answer task in
// the natural tab order while allowing keyboard and pointer selection.
const $autocompleteList = document.getElementById('autocomplete-list');
const $answerInput = document.getElementById('answer-input');
const autocompleteCountryIndex = window.GeoWars?.data?.getIndex?.() || countryCards;
const allCountryNames = autocompleteCountryIndex.map(country => country.name).sort();
let autocompleteMatches = [];
let activeSuggestionIndex = -1;
let autocompleteBlurTimeout = null;

$answerInput.setAttribute('role', 'combobox');
$answerInput.setAttribute('aria-autocomplete', 'list');
$answerInput.setAttribute('aria-haspopup', 'listbox');
$answerInput.setAttribute('aria-controls', $autocompleteList.id);
$autocompleteList.setAttribute('role', 'listbox');
$autocompleteList.setAttribute('aria-label', 'Country suggestions');

function autocompleteIsVisible() {
  return !$autocompleteList.classList.contains('hidden');
}

function dismissAutocomplete() {
  clearTimeout(autocompleteBlurTimeout);
  autocompleteMatches = [];
  activeSuggestionIndex = -1;
  $autocompleteList.replaceChildren();
  $autocompleteList.classList.add('hidden');
  $autocompleteList.setAttribute('aria-hidden', 'true');
  $answerInput.setAttribute('aria-expanded', 'false');
  $answerInput.removeAttribute('aria-activedescendant');
}

function setActiveSuggestion(index) {
  if (!autocompleteMatches.length) return;
  activeSuggestionIndex = (index + autocompleteMatches.length) % autocompleteMatches.length;
  const options = Array.from($autocompleteList.querySelectorAll('[role="option"]'));
  options.forEach((option, optionIndex) => {
    const selected = optionIndex === activeSuggestionIndex;
    option.setAttribute('aria-selected', String(selected));
    if (selected && typeof option.scrollIntoView === 'function') {
      option.scrollIntoView({ block: 'nearest' });
    }
  });
  $answerInput.setAttribute('aria-activedescendant', 'autocomplete-option-' + activeSuggestionIndex);
}

function selectAutocompleteSuggestion(index) {
  const name = autocompleteMatches[index];
  if (!name) return;
  $answerInput.value = name;
  dismissAutocomplete();
  focusElement($answerInput);
}

function renderAutocomplete() {
  const query = $answerInput.value.trim().toLowerCase();
  dismissAutocomplete();
  if (query.length < 2) return;

  autocompleteMatches = allCountryNames
    .filter(name => name.toLowerCase().includes(query))
    .slice(0, 5);
  if (!autocompleteMatches.length) return;

  const options = document.createDocumentFragment();
  autocompleteMatches.forEach((name, index) => {
    const option = document.createElement('div');
    const matchStart = name.toLowerCase().indexOf(query);
    const matchEnd = matchStart + query.length;
    option.id = 'autocomplete-option-' + index;
    option.className = 'autocomplete-item';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.append(document.createTextNode(name.slice(0, matchStart)));
    const match = document.createElement('strong');
    match.textContent = name.slice(matchStart, matchEnd);
    option.append(match, document.createTextNode(name.slice(matchEnd)));

    // Keeping input focus lets aria-activedescendant expose selection while
    // pointer users can still choose an option without a blur race.
    option.addEventListener('pointerdown', event => event.preventDefault());
    option.addEventListener('click', () => selectAutocompleteSuggestion(index));
    options.appendChild(option);
  });

  $autocompleteList.appendChild(options);
  $autocompleteList.classList.remove('hidden');
  $autocompleteList.setAttribute('aria-hidden', 'false');
  $answerInput.setAttribute('aria-expanded', 'true');
}

$answerInput.addEventListener('input', renderAutocomplete);
$answerInput.addEventListener('blur', () => {
  autocompleteBlurTimeout = setTimeout(() => {
    if (document.activeElement !== $answerInput) dismissAutocomplete();
  }, 0);
});

$answerInput.addEventListener('keydown', event => {
  if (event.isComposing) return;
  const canTraverseSuggestions = autocompleteIsVisible() && autocompleteMatches.length > 0;

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!canTraverseSuggestions) {
      renderAutocomplete();
      if (!autocompleteIsVisible()) return;
    }
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const startIndex = activeSuggestionIndex === -1
      ? (direction === 1 ? 0 : autocompleteMatches.length - 1)
      : activeSuggestionIndex + direction;
    setActiveSuggestion(startIndex);
    return;
  }

  if (event.key === 'Escape' && autocompleteIsVisible()) {
    event.preventDefault();
    dismissAutocomplete();
    focusElement($answerInput);
    return;
  }

  if (event.key === 'Enter') {
    if (canTraverseSuggestions && activeSuggestionIndex !== -1) {
      event.preventDefault();
      selectAutocompleteSuggestion(activeSuggestionIndex);
      return;
    }
    submitTypedAnswer();
  }
});

// Submit typed answer
document.getElementById('btn-submit-answer').addEventListener('click', submitTypedAnswer);

function submitTypedAnswer() {
  const guess = $answerInput.value.trim();
  dismissAutocomplete();
  if (!guess || state.answered || state.gameOver) return;
  AudioEngine.playSubmitClick();

  if (guess.toLowerCase() === state.currentCard.name.toLowerCase()) {
    handleAnswer(true, null, 3); // 3x points
  } else if (window.NearMiss && NearMiss.isNearMiss(guess, state.currentCard.name)) {
    // Close enough spelling — still give them credit at 2x
    handleAnswer(true, null, 2);
  } else {
    handleAnswer(false, null, 0);
  }
}

// "Show Options" — reveal choice buttons at 1x multiplier
document.getElementById('btn-show-options').addEventListener('click', () => {
  if (state.answered || state.gameOver) return;
  document.getElementById('answer-section').classList.add('hidden');
  showChoiceButtons(1, true);
});

// Sprint mode: tap a choice
$choiceBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.answered || state.gameOver) return;
    const idx = parseInt(btn.dataset.idx);
    const chosen = state.choices[idx];
    const correct = chosen.id === state.currentCard.id;

    // Highlight buttons
    $choiceBtns.forEach((b, i) => {
      b.disabled = true;
      if (state.choices[i].id === state.currentCard.id) b.classList.add('choice-correct');
    });
    if (!correct) btn.classList.add('choice-wrong');

    handleAnswer(correct, btn, state.lastMultiplier); // multiplier set by showChoiceButtons
  });
});

// Show Off mode: reveal answer
$btnReveal.addEventListener('click', () => {
  if (state.answered) {
    // Already revealed — move to next
    nextRound();
    return;
  }
  // Reveal the answer
  state.answered = true;
  showFeedback(true, true); // show as reveal, not scored
  setControlIcon($btnReveal, 'icon-next');
  setControlLabel($btnReveal, 'Next country');
});

function handleAnswer(correct, btnEl, multiplier) {
  state.answered = true;
  multiplier = multiplier || 1;
  state.lastMultiplier = multiplier;

  // Pause timer during feedback/celebration
  if (state.mode === 'sprint') clearInterval(state.timer);

  // Track round history
  state.roundHistory.push({ card: state.currentCard, correct: correct, multiplier: multiplier });

  if (correct) {
    state.correct++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const points = state.currentCard.stars * multiplier;
    state.score += points;
    updateHUD();
    showFeedback(true, false);

    // Sound
    var playedAnthem = false;
    if (window.Anthems && window.Anthems.has(state.currentCard.name)) {
      AudioEngine.playAnthem(state.currentCard.name);
      playedAnthem = true;
    } else {
      AudioEngine.playCorrect(points, state.streak);
    }
    if (state.streak >= 3 && !playedAnthem) AudioEngine.playSpeedBonus();
  } else {
    state.streak = 0;
    updateHUD();
    showFeedback(false, false);
    AudioEngine.playWrong();
  }

  // Auto-advance after delay in Sprint (Practice uses the Next button).
  // Tap, keyboard, and timeout all route through one idempotent function.
  if (state.mode === 'sprint') {
    clearTimeout(state.feedbackTimeout);
    state.feedbackTimeout = setTimeout(advanceFromFeedback, 3000);
  }
}

function advanceFromFeedback() {
  if (state.gameOver || !state.answered || $feedback.classList.contains('hidden')) return;
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  nextRound();
}

// Register once. Per-round listeners used to survive timeout/keyboard advancement
// and later advance through several unseen countries in a single tap.
$feedback.addEventListener('click', () => {
  if (state.mode === 'sprint') advanceFromFeedback();
});

$feedbackNext.addEventListener('click', (event) => {
  event.stopPropagation();
  if (state.mode === 'showoff' && state.answered && !state.gameOver) nextRound();
});

function finishPracticeSession(destination) {
  if (state.mode !== 'showoff' || !state.answered || state.gameOver) return;
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  quitGame();

  if (destination === 'home') {
    showScreen($landing);
    loadStats();
    return;
  }

  $resultsTitle.textContent = 'Practice complete.';
  if ($resultsStatus) $resultsStatus.textContent = 'Practice session complete. Review your results or replay.';
}

if ($feedbackResults) {
  $feedbackResults.addEventListener('click', event => {
    event.stopPropagation();
    finishPracticeSession('results');
  });
}

if ($feedbackHome) {
  $feedbackHome.addEventListener('click', event => {
    event.stopPropagation();
    finishPracticeSession('home');
  });
}

function showFeedback(correct, isReveal) {
  const card = state.currentCard;
  const points = card.stars * (state.lastMultiplier || 1);
  const statusClass = isReveal ? 'feedback-revealed' : (correct ? 'feedback-correct' : 'feedback-wrong');
  const outcome = isReveal ? 'Answer revealed' : (correct ? 'Correct' : 'Incorrect');
  const scoreBefore = correct && !isReveal ? state.score - points : state.score;
  const statusMessage = isReveal
    ? 'Answer revealed. No points were awarded.'
    : correct
      ? 'Correct. Awarded ' + points + ' points. Score changed from ' + scoreBefore + ' to ' + state.score + '.'
      : 'Incorrect. No points were awarded. Score remains ' + state.score + '.';
  const fact = card.fun_facts && card.fun_facts.length > 0
    ? card.fun_facts[Math.floor(Math.random() * card.fun_facts.length)]
    : '';
  const landmark = card.landmarks && card.landmarks.length > 0
    ? card.landmarks[0]
    : '';
  const showPracticeRoutes = state.mode === 'showoff';

  $feedback.className = 'feedback ' + statusClass;
  $feedbackHeading.textContent = outcome;
  $feedbackStatus.textContent = statusMessage;
  renderFeedbackStatusIcon(correct, isReveal);
  $feedbackScore.replaceChildren();
  $feedbackCountryName.textContent = card.name;
  $feedbackRegion.textContent = 'Region: ' + card.continent + (card.subregion ? ' · ' + card.subregion : '');
  $feedbackText.replaceChildren();
  $feedbackFlag.replaceChildren();

  if (correct && !isReveal) {
    appendFeedbackDetail($feedbackScore, 'reveal-points', 'Awarded: +' + points + ' points');
    appendFeedbackDetail($feedbackScore, 'reveal-score-change', 'Score: ' + scoreBefore + ' → ' + state.score);
  }
  if (assetFallbacks) renderFeedbackFlagAsset(card);
  if (landmark) appendFeedbackDetail($feedbackText, 'reveal-fact', 'Landmark: ' + landmark);
  if (fact) appendFeedbackDetail($feedbackText, 'reveal-fact', 'Fact: ' + fact);

  setControlIcon($feedbackNext, 'icon-next');
  setControlLabel($feedbackNext, 'Next country');
  setControlDisabled($feedbackNext, false);
  $feedbackActions.classList.toggle('hidden', !showPracticeRoutes);

  // Reveal the flag on the stage as supporting information.
  $flagHint.classList.remove('flag-blurred');
  $flagHint.classList.add('flag-revealed');
}

// ============================================================
// HINTS
// ============================================================

$btnShowFlag.addEventListener('click', () => {
  if (state.flagRevealed) return;
  state.flagRevealed = true;
  $flagHint.classList.remove('flag-blurred');
  $flagHint.classList.add('flag-revealed');
  setControlDisabled($btnShowFlag, true);
  setControlLabel($btnShowFlag, 'Flag revealed');
  $btnShowFlag.setAttribute('aria-pressed', 'true');
  AudioEngine.playReveal();
});

$btnShowRegion.addEventListener('click', () => {
  if (state.regionRevealed) return;
  state.regionRevealed = true;
  $continentHint.textContent = state.currentCard.continent + ' · ' + state.currentCard.subregion;
  $continentHint.classList.remove('hidden');
  setControlDisabled($btnShowRegion, true);
  setControlLabel($btnShowRegion, 'Region revealed');
  $btnShowRegion.setAttribute('aria-pressed', 'true');
  AudioEngine.playReveal();
});

// ============================================================
// GAME END
// ============================================================

function buildReview() {
  const $review = document.getElementById('game-review');
  if (!state.roundHistory.length) { $review.classList.add('hidden'); return; }
  $review.classList.remove('hidden');
  $review.innerHTML = '<h3 class="review-title">Round Review</h3>' +
    state.roundHistory.map(r => {
      const icon = r.correct ? '✓' : '✗';
      const cls = r.correct ? 'review-correct' : 'review-wrong';
      return `<div class="review-row ${cls}"><span class="review-icon">${icon}</span><span class="review-name">${r.card.name}</span><span class="review-meta">${r.card.continent}</span></div>`;
    }).join('');
}

function endGame() {
  state.gameOver = true;
  clearInterval(state.timer);
  const savePromise = saveStats();
  invokeBackgroundMusic('stop');
  AudioEngine.playGameEnd();

  // Show results
  $resultsTitle.textContent = 'Run complete.';
  if ($resultsStatus) $resultsStatus.textContent = 'Sprint complete. Review your results or replay.';
  $resScore.textContent = state.score;
  $resStreak.textContent = state.bestStreak;
  $resCorrect.textContent = state.correct + '/' + state.total;

  updateSaveProgressUI();
  buildReview();
  Promise.resolve(savePromise).then(() => loadStats());
  setTimeout(() => showScreen($results), 800);
}

$btnQuit.addEventListener('click', () => {
  if (state.mode === 'sprint' && state.total > 0 && !state.gameOver) {
    clearInterval(state.timer);
    document.getElementById('quit-confirm').classList.remove('hidden');
  } else {
    quitGame();
  }
});

document.getElementById('btn-quit-yes').addEventListener('click', () => {
  document.getElementById('quit-confirm').classList.add('hidden');
  quitGame();
});

document.getElementById('btn-quit-no').addEventListener('click', () => {
  document.getElementById('quit-confirm').classList.add('hidden');
  if (state.mode === 'sprint' && !state.gameOver && state.timeLeft > 0) resumeTimer();
});

function quitGame() {
  clearInterval(state.timer);
  state.gameOver = true;
  invokeBackgroundMusic('stop');
  if (state.total > 0) {
    const savePromise = saveStats();
    $resultsTitle.textContent = 'Run complete.';
    if ($resultsStatus) $resultsStatus.textContent = 'Run ended. Review your results or replay.';
    $resScore.textContent = state.score;
    $resStreak.textContent = state.bestStreak;
    $resCorrect.textContent = state.correct + '/' + state.total;
    updateSaveProgressUI();
    buildReview();
    Promise.resolve(savePromise).then(() => loadStats());
    showScreen($results);
  } else {
    showScreen($landing);
    loadStats();
  }
}

document.getElementById('btn-again').addEventListener('click', () => {
  startGame();
});

document.getElementById('btn-home').addEventListener('click', () => {
  invokeBackgroundMusic('stop');
  showScreen($landing);
  loadStats();
});

// ============================================================
// CLAIM ACCOUNT AND PLAYER CONTEXT
// ============================================================

const $saveProgress = document.getElementById('save-progress');
const $claimForm = document.getElementById('claim-form');
const $claimEmail = document.getElementById('claim-email');
const $claimStatus = document.getElementById('claim-status');
const $loggedInBadge = document.getElementById('logged-in-badge');
let lastPlayerModalTrigger = null;

function updateSaveProgressUI() {
  if (saveDismissed) { $saveProgress.classList.add('hidden'); $loggedInBadge.classList.add('hidden'); return; }
  if (!window.GeoWarsDB || !GeoWarsDB.isOnline()) {
    $saveProgress.classList.add('hidden');
    $loggedInBadge.classList.add('hidden');
    return;
  }
  if (GeoWarsDB.isClaimed()) {
    $saveProgress.classList.add('hidden');
    $loggedInBadge.classList.remove('hidden');
  } else {
    $saveProgress.classList.remove('hidden');
    $loggedInBadge.classList.add('hidden');
  }
}

async function renderPlayerContext() {
  if (!$playerContextName || !$playerContextDetail || !$choosePlayerButton) return;

  let identity = { online: false, claimed: false, displayName: 'Guest', email: null };
  try {
    if (window.GeoWarsDB && GeoWarsDB.getIdentity) {
      const resolvedIdentity = await GeoWarsDB.getIdentity();
      if (resolvedIdentity) identity = resolvedIdentity;
    }
  } catch (error) {}

  $playerContextName.textContent = identity.displayName || 'Guest';
  if (!identity.online) {
    $playerContextDetail.textContent = 'Offline — guest stats are shared on this browser/device and will not sync until you reconnect.';
  } else if (identity.claimed) {
    $playerContextDetail.textContent = 'Signed in as ' + (identity.email || 'this player') + '. Stats are synced to this profile.';
  } else {
    $playerContextDetail.textContent = 'Guest stats are shared on this browser/device. Choose a player for a personal saved record.';
  }

  $choosePlayerButton.textContent = identity.claimed ? 'Switch player' : 'Choose player';
  $choosePlayerButton.disabled = false;
  $choosePlayerButton.setAttribute('aria-label', identity.claimed ? 'Switch to another player' : 'Choose a player');
}

function playerProfilesAreOnline() {
  return !!(window.GeoWarsDB && typeof GeoWarsDB.isOnline === 'function' && GeoWarsDB.isOnline());
}

function setPlayerProfileStatus(message, isError) {
  if (!$playerProfileStatus) return;
  $playerProfileStatus.textContent = message || '';
  $playerProfileStatus.className = 'profile-status' + (isError ? ' error' : '');
  $playerProfileStatus.classList.toggle('hidden', !message);
}

let playerProfileOnline = false;

function setPlayerProfileAvailability(isOnline) {
  playerProfileOnline = !!isOnline;
  if ($playerProfileDescription) {
    $playerProfileDescription.textContent = playerProfileOnline
      ? 'Enter an email to create a personal profile or switch to an existing one. Opening the magic link will switch this browser to that player’s saved record.'
      : 'An internet connection is required to create or switch Supabase profiles. Reconnect to send a magic link.';
  }
  if ($sendPlayerLinkButton) $sendPlayerLinkButton.disabled = !playerProfileOnline;
  if (!playerProfileOnline) {
    setPlayerProfileStatus('Internet connection required to create or switch a player profile.', false);
  }
}

function setPlayerProfileBusy(isBusy) {
  if ($playerProfileName) $playerProfileName.disabled = isBusy;
  if ($playerProfileEmail) $playerProfileEmail.disabled = isBusy;
  if ($sendPlayerLinkButton) {
    $sendPlayerLinkButton.disabled = isBusy || !playerProfileOnline;
    $sendPlayerLinkButton.textContent = isBusy ? 'Sending…' : 'Send magic link';
  }
}

// The modal starts inert/aria-hidden during init. These helpers must clear that
// state themselves: the click listeners below are registered before the later
// accessibility wrappers are installed, so those wrappers never run for them.
function setPlayerModalInteractive(interactive) {
  if (!$playerProfileModal) return;
  $playerProfileModal.setAttribute('aria-hidden', String(!interactive));
  $playerProfileModal.toggleAttribute('inert', !interactive);
  if ('inert' in $playerProfileModal) $playerProfileModal.inert = !interactive;

  const screen = typeof currentScreen !== 'undefined' ? currentScreen : null;
  if (!screen) return;
  screen.setAttribute('aria-hidden', String(interactive));
  screen.toggleAttribute('inert', interactive);
  if ('inert' in screen) screen.inert = interactive;
}

function closePlayerModal() {
  if (!$playerProfileModal || $playerProfileModal.classList.contains('hidden')) return;
  $playerProfileModal.classList.add('hidden');
  setPlayerModalInteractive(false);
  setPlayerProfileBusy(false);
  if (lastPlayerModalTrigger && typeof lastPlayerModalTrigger.focus === 'function') lastPlayerModalTrigger.focus();
}

async function openPlayerModal() {
  if (!$playerProfileModal) return;

  lastPlayerModalTrigger = document.activeElement;
  setPlayerProfileStatus('', false);
  $playerProfileModal.classList.remove('hidden');
  // Must run before any await so the dialog is clickable immediately.
  setPlayerModalInteractive(true);

  let identity = { online: playerProfilesAreOnline(), claimed: false, displayName: '', email: '' };
  try {
    if (window.GeoWarsDB && GeoWarsDB.getIdentity) {
      const resolvedIdentity = await GeoWarsDB.getIdentity();
      if (resolvedIdentity) identity = resolvedIdentity;
    }
  } catch (error) {}

  setPlayerProfileAvailability(!!identity.online);
  if (identity.claimed) {
    if ($playerProfileName) $playerProfileName.value = identity.displayName || '';
    if ($playerProfileEmail) $playerProfileEmail.value = identity.email || '';
  }
  if ($playerProfileName) $playerProfileName.focus();
}

function getProfileModalFocusable() {
  if (!$playerProfileModal) return [];
  // Get all focusable elements inside the modal, excluding the backdrop
  const card = $playerProfileModal.querySelector('.profile-modal-card');
  if (!card) return Array.from($playerProfileModal.querySelectorAll('button:not([disabled]), input:not([disabled])'));
  return Array.from(card.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]'))
    .filter(el => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

var saveDismissed = false;
const $dismissSaveButton = document.getElementById('btn-dismiss-save');
if ($dismissSaveButton) {
  $dismissSaveButton.addEventListener('click', () => {
    saveDismissed = true;
    if ($saveProgress) $saveProgress.classList.add('hidden');
  });
}

if ($choosePlayerButton) $choosePlayerButton.addEventListener('click', openPlayerModal);
const $closePlayerModalButton = document.getElementById('btn-close-player-modal');
const $cancelPlayerModalButton = document.getElementById('btn-cancel-player-modal');
if ($closePlayerModalButton) $closePlayerModalButton.addEventListener('click', closePlayerModal);
if ($cancelPlayerModalButton) $cancelPlayerModalButton.addEventListener('click', closePlayerModal);
if ($playerProfileModal) {
  $playerProfileModal.addEventListener('click', (event) => {
    if (event.target === $playerProfileModal) closePlayerModal();
  });
}

document.addEventListener('keydown', (event) => {
  if (!$playerProfileModal || $playerProfileModal.classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closePlayerModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusable = getProfileModalFocusable();
  if (!focusable.length) return;
  
  // Ensure the close button is always accessible - move it to the front if present
  const closeBtn = $playerProfileModal?.querySelector('.profile-modal-close');
  if (closeBtn && !focusable.includes(closeBtn)) {
    focusable.unshift(closeBtn);
  }
  
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

if ($playerProfileForm) {
  $playerProfileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const isOnline = playerProfilesAreOnline();
    setPlayerProfileAvailability(isOnline);
    if (!isOnline) return;

    const email = $playerProfileEmail ? $playerProfileEmail.value.trim() : '';
    const name = $playerProfileName ? $playerProfileName.value.trim() : '';
    if (!email) return;

    setPlayerProfileBusy(true);
    setPlayerProfileStatus('', false);
    const result = window.GeoWarsDB && GeoWarsDB.sendPlayerMagicLink
      ? await GeoWarsDB.sendPlayerMagicLink(email, name)
      : { error: 'Player profiles are unavailable while offline.' };
    setPlayerProfileBusy(false);

    if (result.error) {
      setPlayerProfileStatus(result.error, true);
    } else {
      setPlayerProfileStatus(result.message, false);
    }
  });
}

// Kept as a compatibility alias for existing return-home flows.
function updatePlayerBadge() {
  return renderPlayerContext();
}

if ($claimForm) {
  $claimForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $claimEmail.value.trim();
    const name = document.getElementById('claim-name').value.trim();
    if (!email) return;

    const btn = $claimForm.querySelector('.claim-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    $claimStatus.classList.add('hidden');

    const result = await GeoWarsDB.claimWithEmail(email, name || 'Player');

    if (result.error) {
      $claimStatus.textContent = result.error;
      $claimStatus.className = 'claim-status error';
      $claimStatus.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Send link';
    } else {
      $claimStatus.textContent = result.message;
      $claimStatus.className = 'claim-status';
      $claimStatus.classList.remove('hidden');
      $claimForm.classList.add('hidden');
    }
  });
}

// ============================================================
// SKIP BUTTON (Sprint only)
// ============================================================

document.getElementById('btn-skip').addEventListener('click', () => {
  if (state.answered || state.gameOver) return;
  state.answered = true;
  // Skip: no points, no streak break, just move on
  nextRound();
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
  if (state.gameOver || $game.classList.contains('hidden')) return;

  // Enter/Space to advance feedback
  if ((e.key === 'Enter' || e.key === ' ') && !$feedback.classList.contains('hidden') && state.mode === 'sprint') {
    e.preventDefault();
    advanceFromFeedback();
    return;
  }

  // Number keys 1-6 for choices
  if (!$choices.classList.contains('hidden') && !state.answered) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) {
      e.preventDefault();
      const btn = $choiceBtns[num - 1];
      if (btn && !btn.disabled) btn.click();
    }
  }
});

// ============================================================
// ACCESSIBLE SCREEN, FEEDBACK, AND DIALOG STATE
// ============================================================

const $landingTitle = document.getElementById('landing-title');
const $gameTitle = document.getElementById('game-title');
const $quitConfirm = document.getElementById('quit-confirm');
const $quitConfirmTitle = document.getElementById('quit-confirm-title');
const $quitConfirmNo = document.getElementById('btn-quit-no');
const $typeAnswer = document.getElementById('type-answer');
const $answerSection = document.getElementById('answer-section');
const $hintRow = document.querySelector('.hint-row');
const $btnSkip = document.getElementById('btn-skip');
const $btnIKnow = document.getElementById('btn-i-know');
const $gameUtility = document.querySelector('.game-utility');
const $gameStage = document.querySelector('.game-stage');
let currentScreen = $landing;
let lastQuitDialogTrigger = null;

function setAccessibilityAvailability(element, available) {
  if (!element) return;
  element.setAttribute('aria-hidden', String(!available));
  element.toggleAttribute('inert', !available);
  if ('inert' in element) element.inert = !available;
}

function focusElement(element) {
  if (element && typeof element.focus === 'function') element.focus({ preventScroll: true });
}

function getScreenFocusTarget(screen) {
  if (screen === $landing) return $landingTitle;
  if (screen === $game) return $gameTitle;
  if (screen === $results) return $resultsTitle;
  return null;
}

function isVisible(element) {
  return !!element && !element.classList.contains('hidden');
}

function isActiveGameScreen() {
  return currentScreen === $game && isVisible($game);
}

function setGameFeedbackBackgroundAvailability(available) {
  const elements = [$gameUtility, $gameStage, $answerSection, $typeAnswer, $choices, $hintRow, $btnReveal, $btnSkip];
  elements.forEach(element => {
    if (!element) return;
    setAccessibilityAvailability(element, available && isActiveGameScreen() && isVisible(element));
  });
}

function syncFeedbackAccessibility(moveFocus) {
  const feedbackVisible = isActiveGameScreen() && isVisible($feedback);
  const feedbackHadFocus = $feedback.contains(document.activeElement);
  setAccessibilityAvailability($feedback, feedbackVisible);
  setGameFeedbackBackgroundAvailability(!feedbackVisible);

  if (feedbackVisible && moveFocus) {
    focusElement($feedbackHeading);
  } else if (!feedbackVisible && feedbackHadFocus && isActiveGameScreen()) {
    focusElement($btnIKnow);
  }
}

function setQuitDialogBackgroundAvailability(available) {
  Array.from($game.children)
    .filter(element => element !== $quitConfirm)
    .forEach(element => setAccessibilityAvailability(element, available && isActiveGameScreen()));
}

function closeQuitDialog(restoreFocus) {
  if (!$quitConfirm) return;
  $quitConfirm.classList.add('hidden');
  setAccessibilityAvailability($quitConfirm, false);
  setQuitDialogBackgroundAvailability(true);
  syncFeedbackAccessibility(false);
  if (restoreFocus && isActiveGameScreen()) {
    focusElement(lastQuitDialogTrigger || $btnQuit);
  }
  lastQuitDialogTrigger = null;
}

function openQuitDialog() {
  if (!$quitConfirm || $quitConfirm.classList.contains('hidden')) return;
  lastQuitDialogTrigger = document.activeElement;
  setQuitDialogBackgroundAvailability(false);
  setAccessibilityAvailability($quitConfirm, true);
  focusElement($quitConfirmTitle);
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'))
    .filter(element => !element.closest('[aria-hidden="true"], [inert]'));
}

function trapDialogFocus(event, dialog) {
  const focusable = getFocusableElements(dialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

let $outcomeLive = document.getElementById('game-outcome-live');
if (!$outcomeLive) {
  $outcomeLive = document.createElement('div');
  $outcomeLive.id = 'game-outcome-live';
  $outcomeLive.setAttribute('role', 'status');
  $outcomeLive.setAttribute('aria-live', 'polite');
  $outcomeLive.setAttribute('aria-atomic', 'true');
  $outcomeLive.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border:0;';
  document.body.appendChild($outcomeLive);
}

function announceOutcome(message, priority) {
  $outcomeLive.setAttribute('aria-live', priority || 'polite');
  $outcomeLive.textContent = message;
}

const renderScreen = showScreen;
showScreen = function(screen) {
  if ($playerProfileModal && isVisible($playerProfileModal)) {
    $playerProfileModal.classList.add('hidden');
    setAccessibilityAvailability($playerProfileModal, false);
  }
  if ($quitConfirm && isVisible($quitConfirm)) closeQuitDialog(false);

  renderScreen(screen);
  currentScreen = screen;
  [$landing, $game, $results].forEach(candidate => setAccessibilityAvailability(candidate, candidate === screen));
  syncFeedbackAccessibility(false);
  focusElement(getScreenFocusTarget(screen));
};

const renderNextRound = nextRound;
nextRound = function() {
  renderNextRound();
  syncFeedbackAccessibility(false);
};

const renderFeedback = showFeedback;
showFeedback = function(correct, isReveal) {
  renderFeedback(correct, isReveal);
  // The feedback card is a focusable state, while this separate region announces
  // the outcome and score without stealing focus from the player's current task.
  $feedback.setAttribute('role', 'region');
  $feedback.removeAttribute('aria-live');
  syncFeedbackAccessibility(true);
  announceOutcome($feedbackStatus.textContent, isReveal ? 'polite' : 'assertive');
};

const renderEndGame = endGame;
endGame = function() {
  renderEndGame();
  announceOutcome('Session complete. Score ' + state.score + ', best streak ' + state.bestStreak + ', ' + state.correct + ' correct out of ' + state.total + '.', 'polite');
};

const renderQuitGame = quitGame;
quitGame = function() {
  const hadRounds = state.total > 0;
  renderQuitGame();
  if (hadRounds) {
    announceOutcome('Run ended. Score ' + state.score + ', best streak ' + state.bestStreak + ', ' + state.correct + ' correct out of ' + state.total + '.', 'polite');
  }
};

const renderOpenPlayerModal = openPlayerModal;
openPlayerModal = async function() {
  setAccessibilityAvailability(currentScreen, false);
  setAccessibilityAvailability($playerProfileModal, true);
  return renderOpenPlayerModal();
};

const renderClosePlayerModal = closePlayerModal;
closePlayerModal = function() {
  setAccessibilityAvailability(currentScreen, true);
  renderClosePlayerModal();
  setAccessibilityAvailability($playerProfileModal, false);
};

// These controls were registered before the wrapper above. Restore the page
// before their existing close handler returns focus to its opener.
function restorePlayerDialogFocus() {
  setAccessibilityAvailability(currentScreen, true);
  setAccessibilityAvailability($playerProfileModal, false);
  if (lastPlayerModalTrigger && typeof lastPlayerModalTrigger.focus === 'function') {
    focusElement(lastPlayerModalTrigger);
  }
}

if ($closePlayerModalButton) $closePlayerModalButton.addEventListener('click', restorePlayerDialogFocus);
if ($cancelPlayerModalButton) $cancelPlayerModalButton.addEventListener('click', restorePlayerDialogFocus);

$btnQuit.addEventListener('click', openQuitDialog);
if ($quitConfirmNo) {
  $quitConfirmNo.addEventListener('click', () => closeQuitDialog(true));
}

document.addEventListener('keydown', event => {
  if ($quitConfirm && isVisible($quitConfirm)) {
    if (event.key === 'Escape') {
      event.preventDefault();
      $quitConfirmNo.click();
    } else if (event.key === 'Tab') {
      trapDialogFocus(event, $quitConfirm);
    }
  }
});

// Initialize semantic visibility after all controls and wrappers are available.
[$landing, $game, $results].forEach(screen => setAccessibilityAvailability(screen, screen === currentScreen));
$feedback.setAttribute('role', 'region');
$feedback.removeAttribute('aria-live');
syncFeedbackAccessibility(false);
setAccessibilityAvailability($quitConfirm, false);
setAccessibilityAvailability($playerProfileModal, false);

// ============================================================
// CORE COMPATIBILITY FACADE
// ============================================================

/* CORE_FACADE_START */
(function installCoreCompatibilityFacade(root) {
  const facade = root.GeoWars || {};

  function install(core) {
    const { stateModule, eventsModule, domModule } = core;
    const eventBus = eventsModule.eventBus;
    const domRefs = domModule.default;

    Object.assign(facade, {
      state: stateModule.state,
      eventBus,
      domRefs,
      getState: (...args) => stateModule.getState(...args),
      setState: (...args) => stateModule.setState(...args),
      onStateChange: (...args) => stateModule.onStateChange(...args),
      emit: (...args) => eventBus.emit(...args),
      on: (...args) => eventBus.on(...args),
      off: (...args) => eventBus.off(...args),
      once: (...args) => eventBus.once(...args),
      createEventBus: (...args) => new eventsModule.EventBus(...args),
      getDomRef: (...args) => domRefs.get(...args),
      clearDomRefs: (...args) => domRefs.clear(...args),
      preloadDomRefs: (...args) => domRefs.preload(...args)
    });

    return facade;
  }

  root.GeoWars = facade;
  facade.ready = root.GeoWarsCore
    ? Promise.resolve(install(root.GeoWarsCore))
    : Promise.all([
        import('./src/core/state.js'),
        import('./src/core/events.js'),
        import('./src/core/dom-refs.js')
      ])
        .then(([stateModule, eventsModule, domModule]) => install({ stateModule, eventsModule, domModule }))
        .catch(() => facade);
}(window));
/* CORE_FACADE_END */

// ============================================================
// TIMER COMPATIBILITY FACADE
// ============================================================

/* TIMER_FACADE_START */
(function installTimerCompatibilityFacade(root) {
  const facade = root.GeoWars || {};
  let timerApi = null;
  let timerEvents = null;
  let loadSettled = false;

  function install({ timerModule, eventsModule }) {
    const candidate = timerModule && (timerModule.timer || timerModule.default);
    const events = eventsModule && eventsModule.eventBus;
    if (!candidate || typeof candidate.start !== 'function' || typeof candidate.getState !== 'function') {
      throw new TypeError('Timer module is unavailable');
    }
    if (!events || typeof events.emit !== 'function') {
      throw new TypeError('Timer event bus is unavailable');
    }
    timerApi = candidate;
    timerEvents = events;
    facade.timer = timerApi;
    return facade;
  }

  function callTimer(action, legacyName) {
    if (timerApi) return action();
    const useLegacy = () => typeof root[legacyName] === 'function' ? root[legacyName]() : undefined;
    if (loadSettled) return useLegacy();
    return timerReady.then(() => timerApi ? action() : useLegacy());
  }

  function startTimerFacade() {
    // The legacy app's no-argument timer is a 60-second countdown.
    return callTimer(() => timerApi.start('blitz'), 'startTimer');
  }

  function resumeTimerFacade() {
    return callTimer(() => {
      timerEvents.emit('game:resume');
      return timerApi.getState();
    }, 'resumeTimer');
  }

  function updateTimerDisplayFacade() {
    return callTimer(() => {
      const snapshot = timerApi.getState();
      timerEvents.emit('timer:tick', { remaining: snapshot.remaining });
      return snapshot;
    }, 'updateTimerDisplay');
  }

  Object.assign(facade, {
    startTimer: startTimerFacade,
    resumeTimer: resumeTimerFacade,
    updateTimerDisplay: updateTimerDisplayFacade
  });
  root.GeoWars = facade;

  const priorReady = facade.ready || Promise.resolve(facade);
  const modules = root.GeoWarsTimer
    ? Promise.resolve(root.GeoWarsTimer)
    : Promise.all([
        import('./src/features/timer/index.js'),
        import('./src/core/events.js')
      ]).then(([timerModule, eventsModule]) => ({ timerModule, eventsModule }));

  const timerReady = modules
    .then(install)
    .catch(() => facade)
    .then(value => {
      loadSettled = true;
      return value;
    });

  facade.timerReady = timerReady;
  facade.ready = Promise.all([priorReady, timerReady]).then(() => facade);
}(window));
/* TIMER_FACADE_END */


// ============================================================
// AUTOCOMPLETE COMPATIBILITY FACADE
// ============================================================

/* AUTOCOMPLETE_FACADE_START */
(function installAutocompleteCompatibilityFacade(root) {
  const facade = root.GeoWars || {};
  let autocompleteApi = null;
  let autocompleteModule = null;
  let loadSettled = false;

  function install(source) {
    const candidate = source && (source.autocompleteModule || source.autocomplete || source.default || source);
    if (!candidate || typeof candidate.render !== 'function' ||
        typeof candidate.dismiss !== 'function' || typeof candidate.select !== 'function') {
      throw new TypeError('Autocomplete module is unavailable');
    }
    autocompleteApi = candidate;
    autocompleteModule = source;
    facade.autocomplete = autocompleteApi;
    return facade;
  }

  function callAutocomplete(action, legacyName, args = []) {
    if (autocompleteApi) return action();
    const useLegacy = () => typeof root[legacyName] === 'function' ? root[legacyName](...args) : undefined;
    if (loadSettled) return useLegacy();
    return autocompleteReady.then(() => autocompleteApi ? action() : useLegacy());
  }

  function autocompleteIsVisibleFacade() {
    return callAutocomplete(() => typeof autocompleteApi.isVisible === 'function'
      ? autocompleteApi.isVisible()
      : typeof root.autocompleteIsVisible === 'function'
        ? root.autocompleteIsVisible()
        : false, 'autocompleteIsVisible');
  }

  function dismissAutocompleteFacade() {
    return callAutocomplete(() => autocompleteApi.dismiss(), 'dismissAutocomplete');
  }

  function setActiveSuggestionFacade(index) {
    if (autocompleteApi && typeof autocompleteApi.setActiveSuggestion === 'function') {
      return autocompleteApi.setActiveSuggestion(index);
    }
    return callAutocomplete(() => typeof autocompleteApi.setActiveSuggestion === 'function'
      ? autocompleteApi.setActiveSuggestion(index)
      : typeof root.setActiveSuggestion === 'function' ? root.setActiveSuggestion(index) : undefined,
    'setActiveSuggestion', [index]);
  }

  function selectAutocompleteSuggestionFacade(index) {
    return callAutocomplete(() => {
      if (typeof autocompleteApi.select !== 'function') return undefined;
      if (!Number.isInteger(index)) return autocompleteApi.select(index);
      const suggestions = typeof autocompleteApi.getSuggestions === 'function'
        ? autocompleteApi.getSuggestions()
        : [];
      return autocompleteApi.select(suggestions[index]);
    }, 'selectAutocompleteSuggestion', [index]);
  }

  function renderAutocompleteFacade() {
    return callAutocomplete(() => autocompleteApi.render(), 'renderAutocomplete');
  }

  function getCountrySuggestionsFacade(query, countryIndex) {
    if (autocompleteModule && typeof autocompleteModule.getCountrySuggestions === 'function') {
      return autocompleteModule.getCountrySuggestions(query, countryIndex);
    }
    return typeof root.getCountrySuggestions === 'function'
      ? root.getCountrySuggestions(query, countryIndex)
      : [];
  }

  function createAutocompleteFacade(options) {
    if (autocompleteModule && typeof autocompleteModule.createAutocomplete === 'function') {
      return autocompleteModule.createAutocomplete(options);
    }
    return typeof root.createAutocomplete === 'function' ? root.createAutocomplete(options) : undefined;
  }

  Object.assign(facade, {
    autocompleteIsVisible: autocompleteIsVisibleFacade,
    dismissAutocomplete: dismissAutocompleteFacade,
    setActiveSuggestion: setActiveSuggestionFacade,
    selectAutocompleteSuggestion: selectAutocompleteSuggestionFacade,
    renderAutocomplete: renderAutocompleteFacade,
    getCountrySuggestions: getCountrySuggestionsFacade,
    createAutocomplete: createAutocompleteFacade
  });
  root.GeoWars = facade;

  const priorReady = facade.ready || Promise.resolve(facade);
  const modules = root.GeoWarsAutocomplete
    ? Promise.resolve(root.GeoWarsAutocomplete)
    : Promise.resolve(null);
  const autocompleteReady = modules
    .then(module => module ? install(module) : facade)
    .catch(() => facade)
    .then(value => {
      loadSettled = true;
      return value;
    });

  facade.autocompleteReady = autocompleteReady;
  facade.ready = Promise.all([priorReady, autocompleteReady]).then(() => facade);
}(window));
/* AUTOCOMPLETE_FACADE_END */