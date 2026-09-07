/**
 * EARTHLING — Country silhouette guessing game
 *
 * Flow: Silhouette shows → Player says answer out loud → Taps to validate
 * Flag is a secondary hint (unlockable). Outline is the game.
 */

// ============================================================
// STATE
// ============================================================

const state = {
  mode: 'sprint', // 'sprint' or 'showoff'
  level: 'earthling',
  difficulty: 'earthling',
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

const difficultyLadder = window.GeoWarsDifficulty || null;
const ladderProgress = window.GeoWarsLadderProgress || null;
const learningProgress = window.GeoWarsLearning || null;

// Feed a single answered round into the spaced-repetition store. Central helper
// so every answer path (typed, choices, skip) records consistently. Skips are
// treated as a miss so unknown countries resurface. Guarded/defensive: a
// storage failure must never interrupt gameplay.
function recordLearningOutcome(card, correct) {
  if (!learningProgress || !card || !Number.isFinite(Number(card.id))) return;
  try {
    learningProgress.record(card.id, Boolean(correct));
  } catch (e) { /* storage unavailable: ignore */ }
}

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

function getLevelConfig(levelId) {
  if (difficultyLadder && typeof difficultyLadder.getLevel === 'function') {
    return difficultyLadder.getLevel(levelId);
  }
  return {
    id: levelId || 'earthling',
    name: 'Hard',
    recommendation: 'Name the country from the shape.',
    defaultMode: 'sprint',
    allowedModes: ['showoff', 'sprint'],
    choiceCount: 6,
    showTypedAnswer: true,
    showSprintTimer: true,
    showFlagHint: true,
    showRegionHint: true,
    showAnswerMap: false,
    endRunOnWrongSprint: false
  };
}

function filterDeck(levelId) {
  if (difficultyLadder && typeof difficultyLadder.buildLevelDeck === 'function') {
    return difficultyLadder.buildLevelDeck(levelId, countryCards, state.continent);
  }
  let cards = [...countryCards];
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
function buildChoices(correctCard, pool) {
  const level = getLevelConfig(state.level);
  if (difficultyLadder && typeof difficultyLadder.createChoices === 'function') {
    return difficultyLadder.createChoices(correctCard, pool, level.choiceCount);
  }

  let candidates = pool.filter(c => c.continent === correctCard.continent && c.id !== correctCard.id);
  if (candidates.length < Math.max(0, level.choiceCount - 1)) {
    const extras = pool.filter(c => c.id !== correctCard.id && c.continent !== correctCard.continent);
    candidates = candidates.concat(shuffle(extras));
  }
  shuffle(candidates);
  return shuffle([correctCard, ...candidates.slice(0, Math.max(0, level.choiceCount - 1))]).slice(0, level.choiceCount);
}

// ============================================================
// DOM REFS
// ============================================================

const $landing = document.getElementById('landing');
const $explorer = document.getElementById('explorer');
const $game = document.getElementById('game');
const $results = document.getElementById('results');

const $silhouetteImg = document.getElementById('silhouette-img');
const $flagHint = document.getElementById('flag-hint');
const $flagImg = document.getElementById('flag-img');
const $continentHint = document.getElementById('continent-hint');
const $difficultyHint = document.getElementById('difficulty-hint');
const $regionRevealCard = document.getElementById('region-reveal-card');
const $regionRevealTitle = document.getElementById('region-reveal-title');
const $regionRevealContext = document.getElementById('region-reveal-context');
const $choices = document.getElementById('choices');
const $choiceBtns = Array.from(document.querySelectorAll('.choice-btn'));
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
const $roundDisplay = document.getElementById('round-display');
const $gameModeLabel = document.getElementById('game-mode-label');
const $landingHomeLogo = document.getElementById('btn-landing-home');
const $gameHomeLogo = document.getElementById('btn-game-home');
const $feedbackContinueHint = document.getElementById('feedback-continue-hint');
const $globeSelectionLabel = document.getElementById('globe-selection-label');
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
let localSilhouetteGeometryPromise = null;

function loadLocalSilhouetteGeometry() {
  if (Array.isArray(window.GeoWarsGlobeCountries)) return Promise.resolve(window.GeoWarsGlobeCountries);
  if (localSilhouetteGeometryPromise) return localSilhouetteGeometryPromise;

  localSilhouetteGeometryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'assets/globe-countries.js?v=20260831-cy-ps197';
    script.async = true;
    script.onload = () => Array.isArray(window.GeoWarsGlobeCountries)
      ? resolve(window.GeoWarsGlobeCountries)
      : reject(new Error('Country geometry was incomplete.'));
    script.onerror = () => reject(new Error('Country geometry failed to load.'));
    document.head.appendChild(script);
  });

  return localSilhouetteGeometryPromise.catch(error => {
    localSilhouetteGeometryPromise = null;
    throw error;
  });
}

function polygonArea(polygon) {
  const ring = polygon?.[0] || [];
  return Math.abs(ring.reduce((area, point, index) => {
    const next = ring[(index + 1) % ring.length] || point;
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0));
}

function createLocalSilhouette(card, geometry, elementId = 'silhouette-img', options = {}) {
  const country = geometry.find(entry => entry.i === card.id);
  if (!country?.p?.length) return null;
  if (document.body?.classList?.contains('design-review') && window.GeoWarsShapeGeometry?.buildOutline && !options.largestLandmass) {
    const outline = window.GeoWarsShapeGeometry.buildOutline(country, { padding: 0.08, compactBounds: true, label: 'Guess this country' });
    if (outline && elementId) outline.id = elementId;
    return outline;
  }

  const polygons = options.largestLandmass
    ? [country.p.reduce((largest, polygon) => polygonArea(polygon) > polygonArea(largest) ? polygon : largest)]
    : country.p;
  const points = polygons.flat(2);
  const longitudes = points.map(point => point[0]);
  const latitudes = points.map(point => point[1]);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const width = Math.max(1, maxLongitude - minLongitude);
  const height = Math.max(1, maxLatitude - minLatitude);
  const padding = Math.max(width, height) * 0.08;
  const viewBoxWidth = width + padding * 2;
  const viewBoxHeight = height + padding * 2;
  const pathData = polygons.flatMap(polygon => polygon.map(ring => ring.map((point, index) => {
    const x = point[0] - minLongitude + padding;
    const y = maxLatitude - point[1] + padding;
    return (index === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3);
  }).join(' ') + ' Z')).join(' ');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (elementId) svg.id = elementId;
  svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Guess this country');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(path);
  return svg;
}

function renderLocalSilhouette(card) {
  return loadLocalSilhouetteGeometry().then(geometry => {
    if (state.currentCard !== card || state.gameOver || state.answered || !$silhouetteBox) return false;
    const fallback = createLocalSilhouette(card, geometry);
    if (!fallback) throw new Error('Country shape was unavailable locally.');
    const previousAsset = $silhouetteBox.querySelector('#silhouette-img, [data-asset-fallback="silhouette"]');
    if (previousAsset) previousAsset.replaceWith(fallback);
    else $silhouetteBox.insertBefore(fallback, $flagHint);
    restoreRecoveredRound(card);
    return true;
  });
}

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
    $assetRecoveryMessage.textContent = 'The country shape could not be loaded. Retry, move on, or return home. This round will not be saved.';
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
  if (document.body?.classList?.contains('design-review')) {
    $silhouetteBox?.querySelector('#silhouette-img, [data-asset-fallback="silhouette"]')?.remove();
    renderLocalSilhouette(card).catch(() => handleSilhouetteAssetFailure(card));
    return;
  }
  const previousAsset = $silhouetteBox && $silhouetteBox.querySelector('#silhouette-img, [data-asset-fallback="silhouette"]');
  if (previousAsset) previousAsset.remove();
  if (!$silhouetteBox || !assetFallbacks) {
    handleSilhouetteAssetFailure(card);
    return;
  }

  const image = document.createElement('img');
  image.id = 'silhouette-img';
  image.alt = 'Guess this country';
  image.addEventListener('error', () => {
    renderLocalSilhouette(card).catch(() => handleSilhouetteAssetFailure(card));
  }, { once: true });
  image.addEventListener('load', () => restoreRecoveredRound(card), { once: true });
  $silhouetteBox.insertBefore(image, $flagHint);

  const source = assetFallbacks.getSilhouetteSource(card);
  if (source?.url) image.src = source.url;
  if (!source || !source.url) handleSilhouetteAssetFailure(card);
}

function renderFlagHintAsset(card) {
  if (!$flagHint || !assetFallbacks) return;
  $flagHint.replaceChildren();
  const image = document.createElement('img');
  image.id = 'flag-img';
  image.alt = '';
  const code = assetFallbacks.getCountryCode(card);
  if (code === 'NP') image.classList.add('is-nonrect-flag');
  $flagHint.appendChild(image);
  assetFallbacks.prepareImage(image, 'flag', card, { countryName: card.name, alt: '' });
}

function renderFeedbackFlagAsset(card) {
  if (!assetFallbacks) return;
  const flag = document.createElement('img');
  flag.className = 'reveal-flag';
  const code = assetFallbacks.getCountryCode(card);
  if (code === 'NP') flag.classList.add('is-nonrect-flag');
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
  if ($assetRecoveryMessage) $assetRecoveryMessage.textContent = 'Retrying the country shape. This round remains excluded until the image loads.';
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
  showExplorerFirstLanding();
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
const $resLevel = document.getElementById('res-level');
const $resScore = document.getElementById('res-score');
const $resStreak = document.getElementById('res-streak');
const $resCorrect = document.getElementById('res-correct');

// Stats
const $statPlayed = document.getElementById('stat-played');
const $statBest = document.getElementById('stat-best');
const $statTotal = document.getElementById('stat-total');
const $statsBar = document.getElementById('stats-bar');
const $recordsEmpty = document.getElementById('records-empty');
const $resetStatsButton = document.getElementById('btn-reset-stats');
const $statsResetDialog = document.getElementById('stats-reset-dialog');
const $cancelStatsResetButton = document.getElementById('btn-cancel-stats-reset');
const $confirmStatsResetButton = document.getElementById('btn-confirm-stats-reset');
const $statsResetStatus = document.getElementById('stats-reset-status');
const $statisticsTitle = document.getElementById('statistics-title');
const $playerContextName = document.getElementById('player-context-name');
const $playerContextDetail = document.getElementById('player-context-detail');
const $choosePlayerButton = document.getElementById('btn-choose-player');
const $playerContext = document.getElementById('player-context');
const $playerProfileModal = document.getElementById('player-profile-modal');
const $playerProfileForm = document.getElementById('player-profile-form');
const $playerProfileName = document.getElementById('player-profile-name');
const $playerProfileEmail = document.getElementById('player-profile-email');
const $playerProfileStatus = document.getElementById('player-profile-status');
const $playerProfileDescription = document.getElementById('player-profile-description');
const $sendPlayerLinkButton = document.getElementById('btn-send-player-link');
const $landingShapeGameButton = document.getElementById('btn-landing-shape-game');
const $atlasShapeChallengeButton = document.getElementById('btn-atlas-shape-challenge');
const $shapeChallengePanel = document.getElementById('shape-challenge-panel');
const $landingShapePreview = document.getElementById('landing-shape-preview');
const $landingShapePreviewArt = document.getElementById('landing-shape-preview-art');
const $landingShapePreviewFlag = document.getElementById('landing-shape-preview-flag');
const $landingShapePreviewCountry = document.getElementById('landing-shape-preview-country');
const $landingPreviewFlag = document.getElementById('landing-preview-flag');
const $landingPreviewCountry = document.getElementById('landing-preview-country');
const $landingPreviewRegion = document.getElementById('landing-preview-region');
const $landingPreviewCapital = document.getElementById('landing-preview-capital');
const $landingPreviewLanguages = document.getElementById('landing-preview-languages');
const $landingPreviewLandmark = document.getElementById('landing-preview-landmark');
const $landingPreviewFact = document.getElementById('landing-preview-fact');
const $landingChallenges = document.querySelector('.landing-challenges');
const $landingStatistics = document.querySelector('.landing-statistics');
const $explorerUtilityActions = document.querySelector('.explorer-utility-actions');
const $explorerSecondaryContent = document.getElementById('explorer-secondary-content');
const $atlasPlayerSlot = document.getElementById('atlas-player-slot');
const $atlasStatsSlot = document.getElementById('atlas-stats-slot');
const $atlasShapeSetupSlot = document.getElementById('atlas-shape-setup-slot');
const $atlasMenuSetupSlot = document.getElementById('atlas-menu-setup-slot');
const $levelButtons = Array.from(document.querySelectorAll('.diff-btn[data-level]'));
const $btnIKnow = document.getElementById('btn-i-know');
const $btnShowOptions = document.getElementById('btn-show-options');
const $btnBail = document.getElementById('btn-bail');

// ============================================================
// SCREENS
// ============================================================

function showScreen(screen) {
  [$landing, $explorer, $game, $results].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
  document.body.classList.toggle('is-explorer-active', screen === $explorer);
  const themeColor = screen === $explorer && $explorer?.dataset.atlasView === 'shapes' ? '#e8e3d7' : '#07111f';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
}

// ============================================================
// LANDING
// ============================================================

const LANDING_PREVIEW_COUNTRY_IDS = Object.freeze([1, 4, 7, 12, 14, 16, 18, 23]);
let landingShapePreviewIndex = 0;
let landingShapePreviewTimer = null;
const landingShapePreviewDesktopQuery = window.matchMedia?.('(min-width: 768px)');

function syncLandingShapePreviewDisclosure() {
  if (!$landingShapePreview) return;
  // The rotating sample-round card is a standalone, always-on preview now (it
  // lives outside the Border Outline setup panel), so it stays open on every
  // screen size to match the production landing experience.
  $landingShapePreview.open = true;
}

// Render a country flag into a preview slot as an IMAGE (via the shared asset
// pipeline), not raw emoji text. Regional-indicator emoji have no glyphs on
// Windows and most Linux builds, so they show as bare letters ("NP") or a
// clipped shape — Nepal's pennant looked cut off. Images render everywhere and
// degrade to an ISO code chip if the network flag hosts are unreachable.
function renderPreviewFlag(element, card) {
  if (!element || !card) return;
  element.setAttribute('aria-label', card.name + ' flag');
  if (!assetFallbacks || !assetFallbacks.prepareImage) {
    // No pipeline available: keep the emoji as a last resort.
    element.textContent = card.flag || '🌍';
    return;
  }
  element.replaceChildren();
  const image = document.createElement('img');
  image.alt = '';
  // Nepal is the only non-rectangular national flag; contain it so the pennant
  // is never cropped by the slot's object-fit: cover.
  const code = assetFallbacks.getCountryCode(card);
  if (code === 'NP') image.classList.add('is-nonrect-flag');
  element.appendChild(image);
  assetFallbacks.prepareImage(image, 'flag', card, { countryName: card.name, alt: '' });
}

function renderLandingShapePreview(cards, geometry) {
  const card = cards[landingShapePreviewIndex];
  if (!card || !$landingShapePreviewArt) return;
  const silhouette = createLocalSilhouette(card, geometry, '', { largestLandmass: card.id === 1 });
  if (!silhouette) return;

  $landingShapePreviewArt.classList.remove('is-changing');
  $landingShapePreviewArt.replaceChildren(silhouette);
  if ($landingShapePreviewFlag) {
    renderPreviewFlag($landingShapePreviewFlag, card);
  }
  if ($landingShapePreviewCountry) $landingShapePreviewCountry.textContent = card.name;
  if ($landingShapePreview) {
    $landingShapePreview.setAttribute('aria-label', 'Border Outline preview. ' + card.flag + ' ' + card.name + ' revealed.');
  }
  void $landingShapePreviewArt.offsetWidth;
  $landingShapePreviewArt.classList.add('is-changing');
}

function initializeLandingShapePreview() {
  if (!$landingShapePreviewArt || !$landingShapePreviewFlag || !$landingShapePreviewCountry) return;
  const cards = shuffle(LANDING_PREVIEW_COUNTRY_IDS
    .map(id => countryCards.find(card => card.id === id))
    .filter(Boolean));
  if (cards.length < 2) return;

  loadLocalSilhouetteGeometry().then(geometry => {
    renderLandingShapePreview(cards, geometry);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    landingShapePreviewTimer = window.setInterval(() => {
      landingShapePreviewIndex = (landingShapePreviewIndex + 1) % cards.length;
      renderLandingShapePreview(cards, geometry);
    }, 3600);
  }).catch(() => {});
}

function renderLandingCountryPreview(card) {
  const chosen = card || countryCards.find(country => country.id === 2);
  if (!chosen) return;
  if ($landingPreviewFlag) renderPreviewFlag($landingPreviewFlag, chosen);
  if ($landingPreviewCountry) $landingPreviewCountry.textContent = chosen.name;
  if ($landingPreviewRegion) $landingPreviewRegion.textContent = chosen.continent;
  if ($landingPreviewCapital) $landingPreviewCapital.textContent = chosen.capital;
  if ($landingPreviewLanguages) {
    $landingPreviewLanguages.textContent = Array.isArray(chosen.main_languages)
      ? chosen.main_languages.join(', ')
      : '—';
  }
  if ($landingPreviewLandmark) {
    $landingPreviewLandmark.textContent = chosen.landmarks?.[0] || '—';
  }
  if ($landingPreviewFact) {
    $landingPreviewFact.textContent = chosen.fun_facts?.[0] || '';
  }
}

// While the landing globe idly rotates and the visitor has not interacted yet,
// spotlight a random country in the otherwise-empty preview panel. The showcase
// stops permanently on the first real interaction (globe drag/click/keys or a
// search focus) so it never fights with an intentional selection.
let landingShowcaseTimer = null;
let landingShowcaseStopped = false;
const landingShowcaseExampleCard = document.querySelector('.landing-country-example');

// Lazily-populated map of country id -> { longitude, latitude } sourced from the
// heavy explorer geometry (assets/globe-countries.js). Loaded only after the
// landing page is idle so it never weighs down first paint; if it never arrives
// the panel showcase still runs, just without the globe pin.
let landingCountryCoords = null;
let landingGeometryRequested = false;

function loadLandingCountryCoords() {
  if (landingGeometryRequested) return;
  landingGeometryRequested = true;
  const apply = () => {
    if (landingShowcaseStopped) return;
    const geometry = window.GeoWarsGlobeCountries;
    if (!Array.isArray(geometry)) return;
    landingCountryCoords = new Map();
    geometry.forEach(entry => {
      if (entry && Number.isFinite(entry.x) && Number.isFinite(entry.y)) {
        landingCountryCoords.set(entry.i, { longitude: entry.x, latitude: entry.y });
      }
    });
    // Immediately place a pin for whatever country is currently showcased.
    spotlightShowcasedCountry();
  };
  if (Array.isArray(window.GeoWarsGlobeCountries)) {
    apply();
    return;
  }
  const script = document.createElement('script');
  script.src = 'assets/globe-countries.js?v=20260831-cy-ps197';
  script.async = true;
  script.onload = apply;
  script.onerror = () => {}; // Silent: the panel showcase degrades gracefully.
  document.head.appendChild(script);
}

function spotlightShowcasedCountry() {
  if (!landingCountryCoords) return;
  const globeApi = window.GeoWars?.globe;
  if (!globeApi?.spotlight || globeApi.isShowcaseActive?.() === false) return;
  const current = countryCards.find(
    country => country.name === $landingPreviewCountry?.textContent
  );
  const coords = current && landingCountryCoords.get(current.id);
  if (coords) globeApi.spotlight(coords.longitude, coords.latitude);
}

function pickRandomLandingCard(previousId) {
  if (!Array.isArray(countryCards) || !countryCards.length) return null;
  if (countryCards.length === 1) return countryCards[0];
  let candidate = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    candidate = countryCards[Math.floor(Math.random() * countryCards.length)];
    if (candidate && candidate.id !== previousId) break;
  }
  return candidate;
}

function showcaseNextLandingCountry() {
  if (landingShowcaseStopped) return;
  const previousId = countryCards.find(
    country => country.name === $landingPreviewCountry?.textContent
  )?.id;
  const next = pickRandomLandingCard(previousId);
  if (!next) return;
  if (landingShowcaseExampleCard) {
    // Brief fade so swapped content reads as an intentional transition, not a flicker.
    landingShowcaseExampleCard.classList.add('is-showcasing');
    window.requestAnimationFrame(() => {
      renderLandingCountryPreview(next);
      landingShowcaseExampleCard.classList.remove('is-showcasing');
      spotlightShowcasedCountry();
    });
  } else {
    renderLandingCountryPreview(next);
    spotlightShowcasedCountry();
  }
}

function stopLandingShowcase() {
  if (landingShowcaseStopped) return;
  landingShowcaseStopped = true;
  if (landingShowcaseTimer) {
    window.clearInterval(landingShowcaseTimer);
    landingShowcaseTimer = null;
  }
  window.GeoWars?.globe?.clearSpotlight?.();
}

function startLandingShowcase() {
  if (landingShowcaseStopped || landingShowcaseTimer) return;
  if (!Array.isArray(countryCards) || !countryCards.length) return;
  // Kick off immediately so the panel is populated on first paint, then cycle.
  showcaseNextLandingCountry();
  // Defer the heavy country geometry until the page is idle so the globe pin can
  // join in without slowing first paint.
  const scheduleGeometry = () => {
    if (landingShowcaseStopped) return;
    loadLandingCountryCoords();
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(scheduleGeometry, { timeout: 4000 });
  } else {
    window.setTimeout(scheduleGeometry, 2500);
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  landingShowcaseTimer = window.setInterval(showcaseNextLandingCountry, 4200);
}

function wireLandingShowcaseInteractionStop() {
  const stopEvents = ['pointerdown', 'keydown'];
  const landingCanvas = document.getElementById('landing-globe-canvas');
  const landingShell = document.getElementById('landing-globe-shell');
  [landingCanvas, landingShell].filter(Boolean).forEach(target => {
    stopEvents.forEach(type =>
      target.addEventListener(type, stopLandingShowcase, { once: true, passive: true })
    );
  });
  const explorerSearch = document.getElementById('explorer-country-search');
  explorerSearch?.addEventListener('focus', stopLandingShowcase, { once: true });
}

function setShapeChallengeExpanded(expanded) {
  if (!$shapeChallengePanel) return;
  // When the panel lives in the atlas Menu, the Menu dropdown is the disclosure
  // and the form stays visible inside it; the landing Play toggle no longer
  // hides it. Only apply hidden/aria toggling on the landing homepage mount.
  const inMenu = $atlasMenuSetupSlot && $atlasMenuSetupSlot.contains($shapeChallengePanel);
  if (!inMenu) {
    $shapeChallengePanel.hidden = !expanded;
    $shapeChallengePanel.classList.toggle('hidden', !expanded);
  }
  [$landingShapeGameButton, $atlasShapeChallengeButton].filter(Boolean).forEach(button => {
    button.setAttribute('aria-expanded', String(expanded));
  });
  const action = $landingShapeGameButton?.querySelector('.landing-challenge-action');
  if (action) action.textContent = expanded ? 'Hide' : 'Play';
  syncLandingShapePreviewDisclosure();
  if (expanded) $shapeChallengePanel.querySelector('button')?.focus({ preventScroll: true });
}

function showExplorerFirstLanding() {
  setShapeChallengeExpanded(false);
  window.GeoWars?.atlas?.showGlobe?.({ focus: false, announce: false });
  showScreen($explorer);
  if (window.GeoWars?.explorer?.open) {
    window.GeoWars.explorer.open();
  }
}

function composeExplorerHomepage() {
  const playerDestination = $atlasPlayerSlot || $explorerUtilityActions;
  if (playerDestination && $playerContext) playerDestination.append($playerContext);

  // The quiz setup (mode / difficulty / region + Start) belongs with the quiz
  // launcher, not the settings menu. It lives in the Shapes view's setup slot
  // and is revealed only when the player chooses "Shape Quiz". Fall back to the
  // menu slot only if the shape slot is somehow absent.
  const shapeSetupHome = $atlasShapeSetupSlot || $atlasMenuSetupSlot;
  if (shapeSetupHome && $shapeChallengePanel) {
    shapeSetupHome.append($shapeChallengePanel);
    // Start collapsed; the "Shape Quiz" toggle opens it (see the button wiring).
    $shapeChallengePanel.hidden = true;
    $shapeChallengePanel.classList.add('hidden');
  }
  if ($atlasStatsSlot) {
    [$landingStatistics, $statsResetDialog, $statsResetStatus]
      .filter(Boolean)
      .forEach(element => $atlasStatsSlot.append(element));
  }
  if ($explorerSecondaryContent && $landingChallenges) {
    $explorerSecondaryContent.append($landingChallenges);
  }
}

composeExplorerHomepage();

// Landing "Border Outline / Play" keeps its disclosure behaviour: it reveals the
// setup panel inline on the homepage so a first-time visitor sees the options.
if ($landingShapeGameButton) {
  $landingShapeGameButton.addEventListener('click', () => {
    setShapeChallengeExpanded($landingShapeGameButton.getAttribute('aria-expanded') !== 'true');
  });
}

// Reveal or hide the Shape Quiz setup (mode/difficulty/region + Start) inline in
// the Shapes view. This is the launch step for the quiz — it is NOT in the
// settings menu. "Explore" collapses it; "Shape Quiz" opens it.
function setShapeQuizSetupOpen(open) {
  const exploreButton = document.getElementById('btn-atlas-shape-explore');
  const setupSlot = document.getElementById('atlas-shape-setup-slot');
  const shapeToolbar = document.getElementById('atlas-shape-toolbar');
  const shapesWorkspace = document.getElementById('atlas-shapes-workspace');
  const shapeStudy = shapesWorkspace?.querySelector('.atlas-shape-study');
  if (shapesWorkspace) shapesWorkspace.dataset.quizSetup = String(open);
  if (shapeStudy) {
    shapeStudy.hidden = open;
    shapeStudy.inert = open;
  }
  if (setupSlot) setupSlot.hidden = !open;
  // The Shape Library browser (country dropdown + prev/next) belongs to Explore.
  // Hide it while the Shape Quiz setup is showing so the quiz launcher stands alone.
  if (shapeToolbar) {
    shapeToolbar.hidden = open;
    shapeToolbar.classList.toggle('hidden', open);
  }
  if ($shapeChallengePanel) {
    $shapeChallengePanel.hidden = !open;
    $shapeChallengePanel.classList.toggle('hidden', !open);
  }
  if ($atlasShapeChallengeButton) {
    $atlasShapeChallengeButton.classList.toggle('is-active', open);
    $atlasShapeChallengeButton.setAttribute('aria-pressed', String(open));
    $atlasShapeChallengeButton.setAttribute('aria-expanded', String(open));
  }
  if (exploreButton) {
    exploreButton.classList.toggle('is-active', !open);
    exploreButton.setAttribute('aria-pressed', String(!open));
  }
  if (open && $shapeChallengePanel) {
    $shapeChallengePanel.querySelector('button, select, [tabindex]')?.focus?.({ preventScroll: true });
  }
}

if ($atlasShapeChallengeButton) {
  // "Shape Quiz" reveals the setup right here in the Shapes view; the setup's
  // own Start button launches the game (seeded with the country on the plate).
  $atlasShapeChallengeButton.addEventListener('click', () => setShapeQuizSetupOpen(true));
}

const $atlasShapeExploreButton = document.getElementById('btn-atlas-shape-explore');
if ($atlasShapeExploreButton) {
  $atlasShapeExploreButton.addEventListener('click', () => setShapeQuizSetupOpen(false));
}

// "Settings" on the Ready row opens the atlas Menu and reveals the difficulty &
// region control, so the player can change what the summary describes without
// hunting for the Menu themselves.
const $changeSettingsButton = document.getElementById('btn-change-settings');
if ($changeSettingsButton) {
  $changeSettingsButton.addEventListener('click', () => {
    const menu = document.getElementById('atlas-utility-menu');
    const settings = document.getElementById('challenge-settings');
    if (menu) menu.open = true;
    if (settings) {
      settings.open = true;
      settings.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      // Focus the first difficulty option so keyboard users land on the control.
      const firstControl = settings.querySelector('.diff-btn, button, select');
      firstControl?.focus?.({ preventScroll: true });
    }
  });
}

// Expose the Shapes sub-mode reset so the atlas view switcher can default the
// Shapes view back to Explore (collapsed quiz setup) whenever it is opened.
window.GeoWars = window.GeoWars || {};
window.GeoWars.shapes = Object.freeze({
  setQuizSetupOpen: setShapeQuizSetupOpen
});
syncLandingShapePreviewDisclosure();
landingShapePreviewDesktopQuery?.addEventListener?.('change', syncLandingShapePreviewDisclosure);
setShapeChallengeExpanded(false);
renderLandingCountryPreview();
wireLandingShowcaseInteractionStop();
startLandingShowcase();
initializeLandingShapePreview();

// Keep internal filter state synchronized with the visibly active controls.
// This also protects against stale state when switching between game modes.
function syncFiltersFromUI() {
  const activeContinent = document.querySelector('#continent-row .diff-btn.active');
  state.continent = activeContinent ? activeContinent.dataset.continent : 'all';
  updateFilterSummary();
}

// Update the setup summary whenever a selection changes.
function updateFilterSummary() {
  const $summary = document.getElementById('filter-summary');
  if (!$summary) return;
  const level = getLevelConfig(state.level);
  const diffLabel = level.name || 'Hard';
  const continentLabel = state.continent === 'all'
    ? 'Worldwide'
    : (state.continent === 'North America' ? 'Americas' : state.continent);
  $summary.textContent = diffLabel + ' · ' + continentLabel;
  if ($globeSelectionLabel) $globeSelectionLabel.textContent = continentLabel;
  updateModeSummary();
}

function updateLevelAvailability() {
  const level = getLevelConfig(state.level);
  const allowedModes = new Set(level.allowedModes || ['showoff', 'sprint']);
  $modeButtons.forEach(button => {
    const modeId = button === $btnSprint ? 'sprint' : 'showoff';
    const allowed = allowedModes.has(modeId);
    button.disabled = !allowed;
    button.classList.toggle('is-disabled', !allowed);
    if (!allowed && button.classList.contains('active')) {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  });
  if (!allowedModes.has(state.mode)) {
    selectModeOption(level.defaultMode === 'sprint' ? $btnSprint : $btnShowoff);
  }
}

function selectLevelOption(selectedButton) {
  const selectedLevel = selectedButton?.dataset?.level || 'earthling';
  state.level = selectedLevel;
  state.difficulty = selectedLevel;
  $levelButtons.forEach(button => {
    const isSelected = button === selectedButton;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  if (ladderProgress && typeof ladderProgress.setLastLevel === 'function') {
    ladderProgress.setLastLevel(selectedLevel);
  }
  updateLevelAvailability();
  updateFilterSummary();
}

function selectFilterOption(buttons, selectedButton) {
  buttons.forEach(button => {
    const isSelected = button === selectedButton;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  syncFiltersFromUI();
}

// Difficulty ladder buttons
$levelButtons.forEach(button => {
  button.addEventListener('click', () => selectLevelOption(button));
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
  const level = getLevelConfig(state.level);
  const isSprint = state.mode === 'sprint';
  const diffLabel = level.name || 'Hard';
  const continentLabel = state.continent === 'all'
    ? 'Worldwide'
    : (state.continent === 'North America' ? 'Americas' : state.continent);
  if ($modeSummary) {
    $modeSummary.textContent = isSprint
      ? `Sprint · 60 seconds · ${diffLabel} · ${continentLabel}`
      : `Practice · No timer · ${diffLabel} · ${continentLabel}`;
  }
  if ($startGameLabel) $startGameLabel.textContent = isSprint ? 'Start sprint' : 'Start practice';
}

function selectModeOption(selectedButton) {
  const isSprint = selectedButton === $btnSprint;
  const level = getLevelConfig(state.level);
  if (isSprint && !(level.allowedModes || []).includes('sprint')) {
    selectedButton = $btnShowoff;
  }
  if (!isSprint && !(level.allowedModes || []).includes('showoff')) {
    selectedButton = $btnSprint;
  }
  const nextIsSprint = selectedButton === $btnSprint;
  state.mode = nextIsSprint ? 'sprint' : 'showoff';
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
  const activeLevel = $levelButtons.find(button => button.classList.contains('active'))
    || $levelButtons.find(button => button.getAttribute('aria-pressed') === 'true')
    || $levelButtons.find(button => button.dataset.level === (ladderProgress && ladderProgress.getLastLevel && ladderProgress.getLastLevel()))
    || $levelButtons.find(button => button.dataset.level === 'earthling')
    || $levelButtons[0];
  selectLevelOption(activeLevel);
  syncModeFromUI();
  syncFiltersFromUI();
}

$btnSprint.addEventListener('click', () => selectModeOption($btnSprint));
$btnShowoff.addEventListener('click', () => selectModeOption($btnShowoff));

// The sole primary action captures what the player can currently see before play starts.
$startGameButton.addEventListener('click', () => {
  syncLandingStateFromUI();
  // When the setup is launched from inside the Shapes view, seed the quiz with
  // the country currently on the plate (same behaviour the old direct launcher had).
  const atlasState = window.GeoWars?.atlas?.getState?.();
  if (atlasState && atlasState.view === 'shapes' && Number.isFinite(atlasState.countryId)) {
    startGame({ seedCountryId: atlasState.countryId });
  } else {
    startGame();
  }
});

// How many countries a single daily review / challenge session serves.
const DAILY_REVIEW_SIZE = 12;
const DAILY_CHALLENGE_SIZE = 10;

function allCountryIds() {
  return (window.countryCards || []).map(c => Number(c.id)).filter(Number.isFinite);
}

// Adaptive daily review: pull the countries the scheduler says are due (or, for
// a new player, introduce fresh ones / resurface the weakest). Plays as an
// untimed Practice session over that finite set, then ends. Falls back to a
// normal game if the store is unavailable.
function startDailyReview() {
  syncLandingStateFromUI();
  const ids = allCountryIds();
  let batch = [];
  if (learningProgress && typeof learningProgress.selectStudyBatch === 'function' && ids.length) {
    try {
      batch = learningProgress.selectStudyBatch(ids, DAILY_REVIEW_SIZE);
    } catch (e) { batch = []; }
  }
  if (!batch.length) {
    // No store / nothing scheduled yet: fall back to a standard game.
    startGame();
    return;
  }
  state.mode = 'showoff'; // review is calm and untimed
  startGame({ deckCardIds: batch, sessionKind: 'review' });
}

// Daily challenge: a deterministic set seeded by today's date so every player
// (and every reload) gets the same puzzle today, a new one tomorrow. Uses the
// shared seeded selector in the learning module.
function startDailyChallenge() {
  syncLandingStateFromUI();
  const ids = allCountryIds();
  let batch = [];
  if (window.GeoWarsDaily && typeof window.GeoWarsDaily.selectDailySet === 'function' && ids.length) {
    try {
      batch = window.GeoWarsDaily.selectDailySet(ids, DAILY_CHALLENGE_SIZE);
    } catch (e) { batch = []; }
  }
  if (!batch.length) {
    startGame();
    return;
  }
  state.mode = 'sprint'; // the challenge keeps the timed, competitive feel
  startGame({ deckCardIds: batch, sessionKind: 'daily' });
}

const $dailyReviewButton = document.getElementById('btn-daily-review');
if ($dailyReviewButton) $dailyReviewButton.addEventListener('click', () => startDailyReview());

const $dailyChallengeButton = document.getElementById('btn-daily-challenge');
if ($dailyChallengeButton) $dailyChallengeButton.addEventListener('click', () => startDailyChallenge());

syncLandingStateFromUI();

// Load player statistics. Guest records remain device-owned; claimed profiles
// keep using their synced Supabase totals and intentionally cannot be reset here.
async function loadStats() {
  let stats;
  let identity = { online: false, claimed: false, displayName: 'Guest', email: null };
  if (window.GeoWarsDB) {
    await GeoWarsDB.init();
    if (GeoWarsDB.getIdentity) {
      try {
        const resolvedIdentity = await GeoWarsDB.getIdentity();
        if (resolvedIdentity) identity = resolvedIdentity;
      } catch (error) {}
    }
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
  const hasRecords = (stats.played || 0) > 0 || (stats.bestStreak || 0) > 0 || (stats.totalCorrect || 0) > 0;
  if ($statsBar) $statsBar.classList.toggle('hidden', !hasRecords);
  if ($recordsEmpty) $recordsEmpty.classList.toggle('hidden', hasRecords);
  if ($resetStatsButton) {
    const canResetDeviceStats = hasRecords && !identity.claimed;
    $resetStatsButton.classList.toggle('hidden', !canResetDeviceStats);
    $resetStatsButton.disabled = !canResetDeviceStats;
  }
  await renderPlayerContext(identity);
  renderLearningProgress();
}

// Continent display order + friendly labels for the mastery-by-region bars.
const LEARNING_CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
const LEARNING_CONTINENT_LABELS = {
  'Africa': 'Africa',
  'Asia': 'Asia',
  'Europe': 'Europe',
  'North America': 'Americas',
  'South America': 'S. America',
  'Oceania': 'Oceania'
};

// Populate the learning-progress dashboard from the spaced-repetition store.
// Reads the global countryCards for the universe of ids and continent grouping.
// Entirely defensive: if the store or DOM is missing it no-ops.
function renderLearningProgress() {
  if (!learningProgress || typeof learningProgress.getSummary !== 'function') return;
  const cards = Array.isArray(countryCards) ? countryCards : [];
  if (!cards.length) return;

  const continentById = new Map(cards.map((c) => [Number(c.id), c.continent]));
  const ids = cards.map((c) => Number(c.id));

  let summary;
  try {
    summary = learningProgress.getSummary(ids, {
      groupOf: (id) => continentById.get(Number(id)) || 'Other'
    });
  } catch (e) { return; }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  };
  setText('learning-learned-count', summary.mastered);
  setText('learning-total-count', summary.total);
  setText('learning-due-count', summary.dueCount);
  setText('learning-active-count', summary.learning);

  const pct = summary.total > 0 ? Math.round((summary.mastered / summary.total) * 100) : 0;
  const fill = document.getElementById('learning-progress-fill');
  if (fill) fill.style.width = pct + '%';

  const bar = document.querySelector('.learning-progress-bar');
  if (bar) bar.setAttribute('aria-label', `${summary.mastered} of ${summary.total} countries learned (${pct}%)`);

  const caption = document.getElementById('learning-progress-barlabel');
  if (caption) {
    if (summary.seen === 0) {
      caption.textContent = 'Play a round to start tracking what you have learned.';
    } else if (summary.dueCount > 0) {
      caption.textContent = `${summary.mastered} learned · ${summary.dueCount} ${summary.dueCount === 1 ? 'country is' : 'countries are'} due for review.`;
    } else {
      caption.textContent = `${summary.mastered} learned · ${summary.learning} in progress · nothing due right now. Nice work.`;
    }
  }

  const reviewLabel = document.getElementById('daily-review-label');
  if (reviewLabel) {
    reviewLabel.textContent = summary.dueCount > 0
      ? `Review ${summary.dueCount} due`
      : "Start today's review";
  }

  // Daily challenge label reflects today's completion + streak.
  const challengeLabel = document.getElementById('daily-challenge-label');
  const challengeButton = document.getElementById('btn-daily-challenge');
  if (challengeLabel && window.GeoWarsDaily) {
    try {
      const done = window.GeoWarsDaily.isCompletedToday();
      const { streak } = window.GeoWarsDaily.getStreak();
      if (done) {
        challengeLabel.textContent = streak > 1 ? `Daily done · ${streak}-day streak` : 'Daily done today';
        if (challengeButton) challengeButton.classList.add('is-daily-done');
      } else {
        challengeLabel.textContent = streak > 0 ? `Daily challenge · ${streak}🔥` : 'Daily challenge';
        if (challengeButton) challengeButton.classList.remove('is-daily-done');
      }
    } catch (e) { /* ignore */ }
  }

  const list = document.getElementById('learning-continents');
  if (list) {
    const groups = summary.groups || {};
    const rows = LEARNING_CONTINENTS.filter((name) => groups[name]).map((name) => {
      const g = groups[name];
      const gpct = g.total > 0 ? Math.round((g.mastered / g.total) * 100) : 0;
      const label = LEARNING_CONTINENT_LABELS[name] || name;
      return `<div class="learning-continent"><dt>${label}</dt><dd>` +
        `<span class="learning-continent-track"><span class="learning-continent-fill" style="width:${gpct}%"></span></span>` +
        `<span class="learning-continent-value">${g.mastered}/${g.total}</span></dd></div>`;
    }).join('');
    list.innerHTML = rows;
  }
}

function openStatsResetDialog() {
  if (!$statsResetDialog || !$resetStatsButton || $resetStatsButton.disabled) return;
  if (typeof $statsResetDialog.showModal === 'function') {
    if (!$statsResetDialog.open) $statsResetDialog.showModal();
  } else {
    $statsResetDialog.setAttribute('open', '');
  }
  $cancelStatsResetButton?.focus();
}

function closeStatsResetDialog(restoreFocus) {
  if (!$statsResetDialog) return;
  if (typeof $statsResetDialog.close === 'function' && $statsResetDialog.open) {
    $statsResetDialog.close();
  } else {
    $statsResetDialog.removeAttribute('open');
  }
  if (restoreFocus) $resetStatsButton?.focus();
}

async function resetDeviceStats() {
  let resetSucceeded = false;
  try {
    if (window.GeoWarsDB && typeof GeoWarsDB.resetLocalStats === 'function') {
      resetSucceeded = GeoWarsDB.resetLocalStats();
    } else {
      localStorage.removeItem('geowars-stats');
      resetSucceeded = true;
    }
  } catch (error) {
    resetSucceeded = false;
  }

  if (!resetSucceeded) {
    if ($statsResetStatus) $statsResetStatus.textContent = 'Your device stats could not be reset. Try again.';
    return;
  }

  closeStatsResetDialog(false);
  await loadStats();
  if ($statsResetStatus) $statsResetStatus.textContent = 'Your device stats have been reset.';
  $statisticsTitle?.focus();
}

if ($resetStatsButton) $resetStatsButton.addEventListener('click', openStatsResetDialog);
if ($cancelStatsResetButton) {
  $cancelStatsResetButton.addEventListener('click', () => closeStatsResetDialog(true));
}
if ($confirmStatsResetButton) $confirmStatsResetButton.addEventListener('click', resetDeviceStats);
if ($statsResetDialog) {
  $statsResetDialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeStatsResetDialog(true);
  });
  $statsResetDialog.addEventListener('click', event => {
    if (event.target === $statsResetDialog) closeStatsResetDialog(true);
  });
}

function saveStats() {
  if (window.GeoWarsDB) {
    return GeoWarsDB.saveGameSession({
      mode: state.mode,
      score: state.score,
      correct: state.correct,
      total: state.total,
      bestStreak: state.bestStreak,
      difficulty: state.level,
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

function startGame(options) {
  options = options || {};
  AudioEngine.init();
  invokeBackgroundMusic('setMuted', audioMuted);
  invokeBackgroundMusic('start');
  clearTimeout(state.feedbackTimeout);
  state.feedbackTimeout = null;
  // Re-read the visible controls at the final start boundary so mode changes
  // can never carry a stale difficulty or continent into the deck.
  syncFiltersFromUI();

  // A curated session (daily review / daily challenge) supplies an explicit,
  // ordered list of country ids. It plays exactly that finite set and then ends
  // — it does NOT refill with random countries. A normal game leaves
  // options.deckCardIds undefined and uses the filtered, endless deck.
  const curatedIds = Array.isArray(options.deckCardIds)
    ? options.deckCardIds.map(Number).filter(Number.isFinite)
    : null;

  if (curatedIds && curatedIds.length) {
    const byId = new Map((window.countryCards || []).map(c => [Number(c.id), c]));
    const ordered = curatedIds.map(id => byId.get(id)).filter(Boolean);
    // nextRound() pops from the end, so reverse to serve in the intended order.
    state.deck = ordered.slice().reverse();
    state.finiteDeck = true;
    state.sessionKind = options.sessionKind || 'review';
  } else {
    state.deck = shuffle(filterDeck(state.level));
    state.finiteDeck = false;
    state.sessionKind = 'standard';
    // Optional seed: when the Atlas launches the quiz from the study plate, start
    // with the country the player was just looking at. Move it to the end of the
    // deck so the first nextRound() pop serves it. If it isn't in the filtered
    // deck (e.g. a region filter excludes it) the shuffle order stands.
    if (Number.isFinite(options.seedCountryId)) {
      const seedIndex = state.deck.findIndex(card => card.id === options.seedCountryId);
      if (seedIndex >= 0) {
        const [seedCard] = state.deck.splice(seedIndex, 1);
        state.deck.push(seedCard);
      }
    }
  }
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
  if ($gameModeLabel) $gameModeLabel.textContent = getLevelConfig(state.level).name + ' · ' + (state.mode === 'sprint' ? 'Sprint run' : 'Practice session');
  updateHUD();

  const level = getLevelConfig(state.level);
  $btnShowFlag.classList.toggle('hidden', !level.showFlagHint);
  $btnShowRegion.classList.toggle('hidden', !level.showRegionHint);
  setControlDisabled($btnShowFlag, !level.showFlagHint);
  setControlDisabled($btnShowRegion, !level.showRegionHint);
  if ($btnIKnow) $btnIKnow.classList.toggle('hidden', !level.showTypedAnswer);
  if ($btnShowOptions) $btnShowOptions.classList.toggle('hidden', !level.choiceCount);
  if ($btnBail) $btnBail.classList.toggle('hidden', !level.showTypedAnswer);

  if (state.mode === 'sprint' && level.showSprintTimer) {
    $timerContainer.classList.remove('hidden');
    $btnReveal.classList.add('hidden');
    startTimer();
  } else {
    $timerContainer.classList.add('hidden');
    $btnReveal.classList.toggle('hidden', !level.showAnswerMap);
    setControlIcon($btnReveal, 'icon-flag');
    setControlLabel($btnReveal, 'Reveal answer');
    setControlDisabled($btnReveal, !level.showAnswerMap);
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
  if ($roundDisplay) {
    const roundNumber = Math.max(1, state.total);
    $roundDisplay.textContent = 'Round ' + roundNumber;
    $roundDisplay.setAttribute('aria-label', 'Current round: ' + roundNumber);
  }
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

function resetRegionReveal() {
  if ($regionRevealCard) {
    $regionRevealCard.hidden = true;
    $regionRevealCard.classList.add('hidden');
    $regionRevealCard.setAttribute('aria-hidden', 'true');
  }
  if ($regionRevealTitle) $regionRevealTitle.textContent = '';
  if ($regionRevealContext) $regionRevealContext.textContent = '';
}

function renderRegionReveal(card) {
  if (!card || !$regionRevealCard || !$regionRevealTitle || !$regionRevealContext) return;
  const continent = card.continent || 'Worldwide';
  const subregion = card.subregion && card.subregion !== continent ? card.subregion : '';
  $regionRevealTitle.textContent = subregion || continent;
  $regionRevealContext.textContent = subregion ? 'Part of ' + continent : 'Continent';
  $regionRevealCard.hidden = false;
  $regionRevealCard.classList.remove('hidden');
  $regionRevealCard.setAttribute('aria-hidden', 'false');
}

function nextRound() {
  if (state.deck.length === 0) {
    // A curated session (daily review / challenge) is a fixed set: when it's
    // done, finish and show results rather than refilling with random cards.
    if (state.finiteDeck) {
      endGame();
      return;
    }
    state.deck = shuffle(filterDeck(state.level));
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
  updateHUD();
  clearAssetRecovery();

  const card = state.currentCard;
  const level = getLevelConfig(state.level);

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
  resetRegionReveal();
  $difficultyHint.textContent = card.stars + '★';

  // Reset hint controls for the new stage and keep their disabled state exposed to assistive technology.
  $btnShowFlag.classList.toggle('hidden', !level.showFlagHint);
  $btnShowRegion.classList.toggle('hidden', !level.showRegionHint);
  setControlDisabled($btnShowFlag, !level.showFlagHint);
  setControlLabel($btnShowFlag, 'Show flag');
  $btnShowFlag.removeAttribute('aria-pressed');
  setControlDisabled($btnShowRegion, !level.showRegionHint);
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
    $btnReveal.classList.toggle('hidden', !level.showAnswerMap);
    setControlIcon($btnReveal, 'icon-flag');
    setControlLabel($btnReveal, 'Reveal answer');
    setControlDisabled($btnReveal, !level.showAnswerMap);
  }
  if ($answerInput) $answerInput.value = '';

  // Prepare choices data (but don't show yet)
  state.choices = level.choiceCount ? buildChoices(card, countryCards) : [];

  // Hide feedback until an answer or reveal has been evaluated.
  $answerInteractionPanel.classList.remove('has-feedback');
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
  const level = getLevelConfig(state.level);
  if (!level.showTypedAnswer) return;
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
    } else {
      btn.textContent = '';
      btn.className = 'choice-btn hidden';
      setControlDisabled(btn, true);
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
  $answerInteractionPanel.classList.remove('has-autocomplete');
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
    const option = document.createElement('button');
    option.type = 'button';
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
    option.addEventListener('pointerdown', event => {
      event.preventDefault();
      selectAutocompleteSuggestion(index);
    });
    option.addEventListener('click', () => selectAutocompleteSuggestion(index));
    options.appendChild(option);
  });

  $autocompleteList.appendChild(options);
  $autocompleteList.classList.remove('hidden');
  $answerInteractionPanel.classList.add('has-autocomplete');
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
  const level = getLevelConfig(state.level);
  if (!level.choiceCount) return;
  document.getElementById('answer-section').classList.add('hidden');
  showChoiceButtons(1, true);
});

// Sprint mode: tap a choice
$choiceBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.answered || state.gameOver) return;
    const idx = parseInt(btn.dataset.idx);
    const chosen = state.choices[idx];
    if (!chosen) return;
    const correct = chosen.id === state.currentCard.id;

    // Highlight buttons
    $choiceBtns.forEach((b, i) => {
      b.disabled = true;
      if (state.choices[i]?.id === state.currentCard.id) b.classList.add('choice-correct');
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

  // Feed the spaced-repetition scheduler so real play drives what resurfaces.
  recordLearningOutcome(state.currentCard, correct);

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
    showExplorerFirstLanding();
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
    ? 'Explore the answer, then continue when you are ready.'
    : correct
      ? 'You read the shape correctly — ' + points + ' points added.'
      : 'Not this time — learn the shape and keep going.';
  const fact = card.fun_facts && card.fun_facts.length > 0
    ? card.fun_facts[Math.floor(Math.random() * card.fun_facts.length)]
    : '';
  const landmark = card.landmarks && card.landmarks.length > 0
    ? card.landmarks[0]
    : '';
  const showPracticeRoutes = state.mode === 'showoff';

  $answerInteractionPanel.classList.add('has-feedback');
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
    appendFeedbackDetail($feedbackScore, 'reveal-points', '+' + points + ' points earned');
    appendFeedbackDetail($feedbackScore, 'reveal-score-change', 'Total score ' + scoreBefore + ' → ' + state.score);
  }
  if (assetFallbacks) renderFeedbackFlagAsset(card);
  if (landmark) appendFeedbackDetail($feedbackText, 'reveal-fact', 'Landmark: ' + landmark);
  if (fact) appendFeedbackDetail($feedbackText, 'reveal-fact', 'Fact: ' + fact);

  setControlIcon($feedbackNext, 'icon-next');
  setControlLabel($feedbackNext, 'Next country');
  setControlDisabled($feedbackNext, false);
  $feedbackActions.classList.toggle('hidden', !showPracticeRoutes);
  if ($feedbackContinueHint) $feedbackContinueHint.classList.toggle('hidden', showPracticeRoutes);

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
  renderRegionReveal(state.currentCard);
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

  if (ladderProgress && typeof ladderProgress.recordRun === 'function') {
    ladderProgress.recordRun(state.level, {
      score: state.score,
      bestStreak: state.bestStreak,
      correct: state.correct,
      total: state.total,
      mode: state.mode
    });
  }

  // A finished daily challenge advances the daily-completion streak.
  if (state.sessionKind === 'daily' && window.GeoWarsDaily?.recordCompletion) {
    try {
      window.GeoWarsDaily.recordCompletion({
        score: state.score,
        correct: state.correct,
        total: state.total
      });
    } catch (e) { /* storage unavailable: ignore */ }
  }

  // Show results. Curated sessions get their own framing.
  if (state.sessionKind === 'review') {
    $resultsTitle.textContent = 'Review complete.';
    if ($resultsStatus) $resultsStatus.textContent = 'Daily review complete. Your progress has been updated.';
  } else if (state.sessionKind === 'daily') {
    $resultsTitle.textContent = "Daily challenge complete.";
    if ($resultsStatus) $resultsStatus.textContent = 'Daily challenge complete. Come back tomorrow for a new one.';
  } else {
    $resultsTitle.textContent = getLevelConfig(state.level).name + ' run complete.';
    if ($resultsStatus) $resultsStatus.textContent = 'Sprint complete. Review your results or replay.';
  }
  if ($resLevel) $resLevel.textContent = getLevelConfig(state.level).name;
  $resScore.textContent = state.score;
  $resStreak.textContent = state.bestStreak;
  $resCorrect.textContent = state.correct + '/' + state.total;

  updateSaveProgressUI();
  buildReview();
  Promise.resolve(savePromise).then(() => loadStats());
  setTimeout(() => showScreen($results), 800);
}

if ($gameHomeLogo) {
  $gameHomeLogo.addEventListener('click', () => {
    // Leaving a game in progress ends the run, so confirm first (same guard the
    // Quit button uses). Applies to any mode with rounds played; a finished or
    // not-yet-started game leaves immediately.
    if (state.total > 0 && !state.gameOver) {
      clearInterval(state.timer);
      document.getElementById('quit-confirm').classList.remove('hidden');
      openQuitDialog();
      return;
    }
    clearTimeout(state.feedbackTimeout);
    state.feedbackTimeout = null;
    clearInterval(state.timer);
    state.gameOver = true;
    invokeBackgroundMusic('stop');
    if (state.total > 0) Promise.resolve(saveStats()).then(() => loadStats());
    showExplorerFirstLanding();
  });
}

if ($landingHomeLogo) {
  $landingHomeLogo.addEventListener('click', showExplorerFirstLanding);
}

$btnQuit.addEventListener('click', () => {
  // Confirm before abandoning any game mode that has rounds in progress (Sprint
  // or Practice). A not-yet-started or finished game quits immediately.
  if (state.total > 0 && !state.gameOver) {
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
  // Ending a run early is a bail-out, not a finish: never show the results
  // scoreboard. We still persist any progress from rounds actually played (so
  // stats and the learning store stay accurate), then return straight home.
  // A natural finish (timer end / completed review set) goes through endGame(),
  // which is what shows results.
  if (state.total > 0) {
    if (ladderProgress && typeof ladderProgress.recordRun === 'function') {
      ladderProgress.recordRun(state.level, {
        score: state.score,
        bestStreak: state.bestStreak,
        correct: state.correct,
        total: state.total,
        mode: state.mode
      });
    }
    Promise.resolve(saveStats()).then(() => loadStats());
  }
  showExplorerFirstLanding();
  loadStats();
}

document.getElementById('btn-again').addEventListener('click', () => {
  startGame();
});

document.getElementById('btn-home').addEventListener('click', () => {
  invokeBackgroundMusic('stop');
  showExplorerFirstLanding();
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

async function renderPlayerContext(identityOverride) {
  if (!$playerContextName || !$playerContextDetail || !$choosePlayerButton) return;

  let identity = identityOverride || { online: false, claimed: false, displayName: 'Guest', email: null };
  if (!identityOverride) {
    try {
      if (window.GeoWarsDB && GeoWarsDB.getIdentity) {
        const resolvedIdentity = await GeoWarsDB.getIdentity();
        if (resolvedIdentity) identity = resolvedIdentity;
      }
    } catch (error) {}
  }

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
  if (!window.GeoWarsDB) return false;
  // Magic links only need a reachable client. Falling back to isOnline() keeps
  // older builds working, but readiness is the accurate gate.
  if (typeof GeoWarsDB.isReady === 'function') return GeoWarsDB.isReady();
  return typeof GeoWarsDB.isOnline === 'function' && GeoWarsDB.isOnline();
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

  // Wait for the client so opening the dialog during startup does not leave the
  // submit button permanently disabled.
  try {
    if (window.GeoWarsDB && GeoWarsDB.init) await GeoWarsDB.init();
  } catch (error) {}

  let identity = { online: playerProfilesAreOnline(), claimed: false, displayName: '', email: '' };
  try {
    if (window.GeoWarsDB && GeoWarsDB.getIdentity) {
      const resolvedIdentity = await GeoWarsDB.getIdentity();
      if (resolvedIdentity) identity = resolvedIdentity;
    }
  } catch (error) {}

  // identity.online reflects the guest session; readiness is what magic links need.
  setPlayerProfileAvailability(playerProfilesAreOnline() || !!identity.online);
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
  // Skipping means the shape wasn't recognized: record a miss so it resurfaces,
  // but (as before) don't break the visible streak or dock points.
  recordLearningOutcome(state.currentCard, false);
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
const $explorerTitle = document.getElementById('explorer-stage-title');
const $gameTitle = document.getElementById('game-title');
const $quitConfirm = document.getElementById('quit-confirm');
const $quitConfirmTitle = document.getElementById('quit-confirm-title');
const $quitConfirmNo = document.getElementById('btn-quit-no');
const $typeAnswer = document.getElementById('type-answer');
const $answerSection = document.getElementById('answer-section');
const $hintRow = document.querySelector('.hint-row');
const $btnSkip = document.getElementById('btn-skip');
const $gameUtility = document.querySelector('.game-utility');
const $gameStage = document.querySelector('.game-stage');
let currentScreen = [$landing, $explorer, $game, $results]
  .find(screen => !screen.classList.contains('hidden')) || $landing;
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
  if (screen === $explorer) return $explorerTitle;
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
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  currentScreen = screen;
  [$landing, $explorer, $game, $results].forEach(candidate => setAccessibilityAvailability(candidate, candidate === screen));
  syncFeedbackAccessibility(false);
  focusElement(getScreenFocusTarget(screen));
};

window.GeoWars = window.GeoWars || {};
window.GeoWars.navigate = Object.freeze({
  showHome: showExplorerFirstLanding,
  showExplorer: () => showScreen($explorer)
});

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
  renderQuitGame();
  announceOutcome('Run ended. Returning to the home screen.', 'polite');
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
[$landing, $explorer, $game, $results].forEach(screen => setAccessibilityAvailability(screen, screen === currentScreen));
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


// ============================================================
// SCORING COMPATIBILITY FACADE
// ============================================================

/* SCORING_FACADE_START */
(function installScoringCompatibilityFacade(root) {
  const facade = root.GeoWars || {};
  let scoringApi = null;
  let scoringModule = null;
  let loadSettled = false;

  function install(source) {
    const candidate = source && (source.scoring || source.default);
    if (!candidate || typeof candidate.getState !== 'function' ||
        typeof source.calculatePoints !== 'function' || typeof source.createScoring !== 'function') {
      throw new TypeError('Scoring module is unavailable');
    }
    scoringApi = candidate;
    scoringModule = source;
    facade.scoring = scoringApi;
    return facade;
  }

  function callScoring(action, legacyName, args = []) {
    if (scoringModule) return action();
    const useLegacy = () => typeof root[legacyName] === 'function'
      ? root[legacyName](...args)
      : undefined;
    if (loadSettled) return useLegacy();
    return scoringReady.then(() => scoringModule ? action() : useLegacy());
  }

  function calculatePointsFacade(difficulty, answerType) {
    return callScoring(
      () => scoringModule.calculatePoints(difficulty, answerType),
      'calculatePoints',
      [difficulty, answerType]
    );
  }

  function createScoringFacade(options) {
    return callScoring(
      () => scoringModule.createScoring(options),
      'createScoring',
      [options]
    );
  }

  function getScoringStateFacade() {
    return callScoring(() => scoringApi.getState(), 'getScoringState');
  }

  Object.assign(facade, {
    calculatePoints: calculatePointsFacade,
    createScoring: createScoringFacade,
    getScoringState: getScoringStateFacade
  });
  root.GeoWars = facade;

  const priorReady = facade.ready || Promise.resolve(facade);
  const module = root.GeoWarsScoring
    ? Promise.resolve(root.GeoWarsScoring)
    : import('./src/features/scoring/index.js');
  const scoringReady = module
    .then(install)
    .catch(() => facade)
    .then(value => {
      loadSettled = true;
      return value;
    });

  facade.scoringReady = scoringReady;
  facade.ready = Promise.all([priorReady, scoringReady]).then(() => facade);
}(window));
/* SCORING_FACADE_END */


// ============================================================
// HINTS COMPATIBILITY FACADE
// ============================================================

/* HINTS_FACADE_START */
(function installHintsCompatibilityFacade(root) {
  const facade = root.GeoWars || {};
  let hintsApi = null;
  let hintsModule = null;
  let loadSettled = false;

  function install(source) {
    const candidate = source && (source.hintsModule || source.hints || source.default || source);
    if (!candidate || typeof candidate.reveal !== 'function' ||
        typeof candidate.getState !== 'function') {
      throw new TypeError('Hints module is unavailable');
    }
    hintsApi = candidate;
    hintsModule = source;
    facade.hints = hintsApi;
    return facade;
  }

  function callHints(action, legacyName, args = []) {
    if (hintsApi) return action();
    const useLegacy = () => typeof root[legacyName] === 'function'
      ? root[legacyName](...args)
      : undefined;
    if (loadSettled) return useLegacy();
    return hintsReady.then(() => hintsApi ? action() : useLegacy());
  }

  function revealHintFacade(type) {
    return callHints(() => hintsApi.reveal(type), 'revealHint', [type]);
  }

  function createHintsFacade(options) {
    return callHints(() => {
      const createHints = hintsModule && (hintsModule.createHints || hintsModule.hintsModule?.createHints);
      return typeof createHints === 'function' ? createHints(options) : undefined;
    }, 'createHints', [options]);
  }

  function getHintsStateFacade() {
    return callHints(() => hintsApi.getState(), 'getHintsState');
  }

  Object.assign(facade, {
    revealHint: revealHintFacade,
    createHints: createHintsFacade,
    getHintsState: getHintsStateFacade
  });
  root.GeoWars = facade;

  const priorReady = facade.ready || Promise.resolve(facade);
  const module = root.GeoWarsHints
    ? Promise.resolve(root.GeoWarsHints)
    : import('./src/features/hints/index.js');
  const hintsReady = module
    .then(install)
    .catch(() => facade)
    .then(value => {
      loadSettled = true;
      return value;
    });

  facade.hintsReady = hintsReady;
  facade.ready = Promise.all([priorReady, hintsReady]).then(() => facade);
}(window));
/* HINTS_FACADE_END */


// ============================================================
// SILHOUETTE COMPATIBILITY FACADE
// ============================================================

/* SILHOUETTE_FACADE_START */
(function installSilhouetteCompatibilityFacade(root) {
  const facade = root.GeoWars || {};
  let silhouetteApi = null;
  let silhouetteModule = null;
  let loadSettled = false;

  function install(source) {
    const moduleSource = source && (source.silhouetteModule || source);
    const candidate = moduleSource && (moduleSource.silhouette || moduleSource.default || moduleSource);
    if (!candidate || typeof candidate.load !== 'function' ||
        typeof candidate.getElement !== 'function' ||
        typeof moduleSource.createSilhouette !== 'function') {
      throw new TypeError('Silhouette module is unavailable');
    }
    silhouetteApi = candidate;
    silhouetteModule = moduleSource;
    facade.silhouette = silhouetteApi;
    return facade;
  }

  function callSilhouette(action, legacyName, args = []) {
    if (silhouetteApi) return action();
    const useLegacy = () => typeof root[legacyName] === 'function'
      ? root[legacyName](...args)
      : undefined;
    if (loadSettled) return useLegacy();
    return silhouetteReady.then(() => silhouetteApi ? action() : useLegacy());
  }

  function renderSilhouetteAssetFacade(card) {
    return callSilhouette(() => silhouetteApi.load(card), 'renderSilhouetteAsset', [card]);
  }

  function createSilhouetteFacade(options) {
    return callSilhouette(
      () => silhouetteModule.createSilhouette(options),
      'createSilhouette',
      [options]
    );
  }

  function getSilhouetteElementFacade() {
    return callSilhouette(() => silhouetteApi.getElement(), 'getSilhouetteElement');
  }

  Object.assign(facade, {
    renderSilhouetteAsset: renderSilhouetteAssetFacade,
    createSilhouette: createSilhouetteFacade,
    getSilhouetteElement: getSilhouetteElementFacade
  });
  root.GeoWars = facade;

  const priorReady = facade.ready || Promise.resolve(facade);
  const module = root.GeoWarsSilhouette
    ? Promise.resolve(root.GeoWarsSilhouette)
    : import('./src/features/silhouette/index.js');
  const silhouetteReady = module
    .then(install)
    .catch(() => facade)
    .then(value => {
      loadSettled = true;
      return value;
    });

  facade.silhouetteReady = silhouetteReady;
  facade.ready = Promise.all([priorReady, silhouetteReady]).then(() => facade);
}(window));
/* SILHOUETTE_FACADE_END */
