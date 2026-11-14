/**
 * Supabase Client — GeoWars Player Identity
 *
 * Handles nickname profiles, optional Google sign-in, stats
 * persistence, and game session recording. It falls back to localStorage when
 * Supabase is unavailable.
 */
(function () {
  'use strict';

  // This is the public browser anon key; no service-role secret is exposed.
  var SUPABASE_URL = 'https://njlklquuzrezqheikcxp.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbGtscXV1enJlenFoZWlrY3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTc4NzAsImV4cCI6MjA5OTk3Mzg3MH0.FJVi94reT9Q5cMPIYxOsrDcXo5_-72WhhkPAswNyA-k';

  var supabase = null;
  var currentUser = null;
  var online = false;
  // Client reachability is tracked separately from the anonymous session:
  // sending a magic link needs a working client, not a signed-in guest.
  var ready = false;
  var initPromise = null;
  var cachedProfileName = null;
  var cachedProfileUserId = null;
  var syncing = null;
  var syncAgain = false;
  var syncError = '';
  var signInError = '';
  var nextSyncAt = 0;
  var syncTimer = null;
  var SYNC_INTERVAL_MS = 5000;
  var OAUTH_PENDING_KEY = 'earthling-google-signin';
  var AUTH_STORAGE_KEY = 'sb-njlklquuzrezqheikcxp-auth-token';
  function profiles() { return window.GeoWarsProfiles; }
  function localKey(key) { return profiles() ? profiles().storageKey(key) : key; }
  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(localKey(key)) || 'null') || fallback; }
    catch (_) { return fallback; }
  }
  function writeLocal(key, value) { localStorage.setItem(localKey(key), JSON.stringify(value)); }

  /**
   * Retain an existing session. Guests stay local and never create cloud users.
   */
  function init() {
    if (!initPromise) initPromise = initialize();
    return initPromise;
  }

  async function initialize() {
    var returnQuery = String(window.location?.search || '');
    var googleReturn = returnQuery.includes('player_auth=google');
    if (!window.supabase) {
      try {
        await loadScript('/vendor/supabase-2.119.0.js');
      } catch (e) {
        console.warn('[GeoWarsDB] Could not load Supabase SDK, running offline.');
        return;
      }
    }

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: {
        flowType: 'pkce', detectSessionInUrl: !googleReturn, storageKey: AUTH_STORAGE_KEY
      } });
      ready = true;
      supabase.auth.onAuthStateChange(function (_event, session) {
        setCurrentUser(session && session.user ? session.user : null);
      });

      var pendingGoogle = null;
      try { pendingGoogle = JSON.parse(localStorage.getItem(OAUTH_PENDING_KEY) || 'null'); } catch (_) {}
      var googleVerified = false;
      if (googleReturn) {
        var params = new URLSearchParams(returnQuery);
        if (!params.has('error') && params.get('code') && pendingGoogle) {
          var exchange = await supabase.auth.exchangeCodeForSession(params.get('code'));
          googleVerified = !exchange.error && !!exchange.data?.session?.user;
        }
        if (!googleVerified) {
          signInError = 'Google sign-in did not complete. Your device progress is safe. Please try again.';
          pendingGoogle = null;
          localStorage.removeItem(OAUTH_PENDING_KEY);
        }
        if (window.history) {
          var cleanUrl = new URL(window.location.href);
          ['player_auth', 'code', 'error', 'error_code', 'error_description'].forEach(function (key) { cleanUrl.searchParams.delete(key); });
          window.history.replaceState(null, '', cleanUrl.href);
        }
      }
      var sessionResult = await supabase.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (session) {
        setCurrentUser(session.user);
        if (googleVerified && pendingGoogle && !session.user.is_anonymous) {
          if (!pendingGoogle.profileId || profiles().list().some(function (p) { return p.id === pendingGoogle.profileId; })) profiles().select(pendingGoogle.profileId || 'guest');
          await bindVerifiedProfile();
          localStorage.removeItem(OAUTH_PENDING_KEY);
        }
        if (session.user.email && !session.user.is_anonymous && profiles()) {
          var selected = profiles().active();
          if (!selected) {
            selected = profiles().list().find(function (p) { return p.cloudUserId === session.user.id; });
            if (selected) profiles().select(selected.id);
            else selected = profiles().create(getMetadataDisplayName() || getEmailLocalPart(session.user.email), '🌍', false);
            profiles().update(selected.id, { cloudUserId: session.user.id, email: session.user.email });
          }
        }
      } else {
        if (googleReturn) {
          signInError = 'Google sign-in did not complete. Your device progress is safe. Please try again.';
          try { localStorage.removeItem(OAUTH_PENDING_KEY); } catch (_) {}
        }
        setCurrentUser(null);
      }

      if (isClaimed()) await syncProgress();
    } catch (e) {
      online = false;
      console.warn('[GeoWarsDB] Init failed, running offline:', e.message);
    }
  }

  function setCurrentUser(user) {
    if (!user || !currentUser || currentUser.id !== user.id) {
      cachedProfileName = null;
      cachedProfileUserId = null;
    }
    currentUser = user;
    online = !!user;
  }

  /**
   * Get the current player's aggregate stats. Guest records remain local to
   * this browser/device; claimed profiles use their synced Supabase totals.
   */
  async function getStats() {
    if (!online || !supabase || !currentUser || !isClaimed()) return getLocalStats();
    var statsUserId = currentUser.id;
    var statsProfileId = profiles()?.active()?.id;
    await syncProgress();

    try {
      var result = await supabase
        .from('players')
        .select('games_played, best_streak, total_correct, total_score, display_name')
        .eq('id', currentUser.id)
        .single();

      if (result.error || !result.data) return getLocalStats();
      if (currentUser?.id !== statsUserId || profiles()?.active()?.id !== statsProfileId || !isClaimed()) return getLocalStats();
      cacheProfileName(result.data.display_name);
      var stats = {
        played: result.data.games_played,
        bestStreak: result.data.best_streak,
        totalCorrect: result.data.total_correct,
        totalScore: result.data.total_score,
        displayName: result.data.display_name
      };
      // Once a queued upload is acknowledged its aggregate is read back here.
      // Keep a device backup so offline play never falls back to another player.
      if (!readLocal('geowars-session-queue', []).length) writeLocal('geowars-stats', stats);
      return readLocal('geowars-session-queue', []).length ? getLocalStats() : stats;
    } catch (e) {
      return getLocalStats();
    }
  }

  /**
   * Returns the display-ready identity used by the landing UI.
   */
  async function getIdentity() {
    var claimed = isClaimed();
    var localProfile = profiles() && profiles().active();
    var profileName = claimed ? await getProfileName() : null;
    var metadataName = getMetadataDisplayName();
    var email = claimed ? getEmail() : null;
    var displayName = claimed
      ? (localProfile?.name || profileName || metadataName || getEmailLocalPart(email) || 'Player')
      : (localProfile ? localProfile.name : 'Guest');

    return {
      online: online,
      claimed: claimed,
      isGuest: !claimed && !localProfile,
      local: !!localProfile,
      avatar: localProfile ? localProfile.avatar : '🌍',
      syncError: syncError,
      signInError: signInError,
      displayName: displayName,
      email: email,
      profileName: profileName || null
    };
  }

  async function getProfileName() {
    if (!online || !supabase || !currentUser) return null;
    if (cachedProfileUserId === currentUser.id) return cachedProfileName;
    var nameUserId = currentUser.id;

    try {
      var result = await supabase
        .from('players')
        .select('display_name')
        .eq('id', currentUser.id)
        .single();
      if (result.error || !result.data) return null;
      if (currentUser?.id !== nameUserId) return null;
      cacheProfileName(result.data.display_name);
      return cachedProfileName;
    } catch (e) {
      return null;
    }
  }

  function cacheProfileName(name) {
    cachedProfileUserId = currentUser ? currentUser.id : null;
    cachedProfileName = normalizeDisplayName(name);
  }

  /**
   * Save a completed game session to Supabase and localStorage backup.
   */
  async function saveGameSession(sessionData) {
    // A stable ID makes retrying a failed response safe: the server cannot count
    // the same completed game twice.
    try {
      ensureLegacyImport();
      var queue = readLocal('geowars-session-queue', []);
      queue.push({ id: window.crypto.randomUUID(), mode: sessionData.mode, score: sessionData.score,
        correct_count: sessionData.correct, total_count: sessionData.total, best_streak: sessionData.bestStreak,
        difficulty: sessionData.difficulty || 'all', duration_seconds: sessionData.duration || null });
      writeLocal('geowars-session-queue', queue);
    } catch (_) { return { error: 'Could not save this game. Check browser storage.' }; }
    saveLocalStats(sessionData);
    return syncProgress();
  }

  function ensureLegacyImport() {
    if (localStorage.getItem(localKey('geowars-session-queue')) !== null) return;
    var stats = getLocalStats();
    var queue = readLocal('geowars-session-queue', []);
    if (stats.played > 0 || stats.totalScore > 0 || stats.totalCorrect > 0) {
      queue.push({ id: window.crypto.randomUUID(), mode: 'practice', score: stats.totalScore,
        correct_count: stats.totalCorrect, total_count: stats.totalCorrect,
        best_streak: stats.bestStreak, difficulty: 'local-import', imported_games: stats.played });
    }
    writeLocal('geowars-session-queue', queue);
  }

  async function syncProgress() {
    if (!isClaimed() || !supabase) return;
    if (syncing) { syncAgain = true; return syncing; }
    if (Date.now() < nextSyncAt) { scheduleSync(); return; }
    nextSyncAt = Date.now() + SYNC_INTERVAL_MS;
    var userId = currentUser.id;
    var profileId = profiles() && profiles().active()?.id;
    syncing = (async function () {
      try {
        ensureLegacyImport();
        var queue = readLocal('geowars-session-queue', []);
        // Limit each flush. Remaining records stay on the device for the next batch.
        for (var item of queue.slice(0, 30)) {
          // The RPC handles legacy aggregate imports and idempotency in one transaction.
          var result = await supabase.rpc('save_player_game', { game: item });
          if (result.error) throw new Error(result.error.message);
          if (currentUser?.id !== userId || profiles()?.active()?.id !== profileId) return;
          writeLocal('geowars-session-queue', readLocal('geowars-session-queue', []).filter(function (entry) { return entry.id !== item.id; }));
        }
        var progress = await supabase.rpc('sync_player_progress', {
          incoming_learning: readLocal('geowars-learning', {}),
          incoming_daily: readLocal('geowars-daily-worldle', {}).days || {}
        });
        if (progress.error) throw new Error(progress.error.message);
        if (currentUser?.id !== userId || profiles()?.active()?.id !== profileId) return;
        if (progress.data) {
          // Merge again with local state: a player may answer during the request.
          var learning = readLocal('geowars-learning', {});
          Object.entries(progress.data.learning || {}).forEach(function ([key, value]) {
            if (!learning[key] || (value.last || 0) > (learning[key].last || 0)) learning[key] = value;
          });
          writeLocal('geowars-learning', learning);
          var daily = readLocal('geowars-daily-worldle', {});
          daily.days = daily.days || {};
          Object.entries(progress.data.daily || {}).forEach(function ([key, value]) {
            var local = daily.days[key];
            if (!local || (!local.completed && (value.completed || value.guesses.length > local.guesses.length))) daily.days[key] = value;
          });
          rebuildDailyStats(daily);
          writeLocal('geowars-daily-worldle', daily);
        }
        syncError = '';
        if (readLocal('geowars-session-queue', []).length) syncAgain = true;
      } catch (error) {
        // Back off on network/provider errors as well as server upload limits.
        nextSyncAt = Date.now() + 60000;
        syncAgain = true;
        syncError = 'Saved on this device. Cloud sync will retry when available.';
      }
    })();
    try { await syncing; }
    finally { syncing = null; if (syncAgain) { syncAgain = false; scheduleSync(); } }
  }

  function scheduleSync() {
    if (syncTimer || typeof window.setTimeout !== 'function') return;
    syncTimer = window.setTimeout(function () {
      syncTimer = null;
      void syncProgress();
    }, Math.max(0, nextSyncAt - Date.now()));
  }

  function rebuildDailyStats(state) {
    var stats = { played: 0, won: 0, currentStreak: 0, maxStreak: 0, guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };
    var previousWin = null;
    Object.keys(state.days).sort().forEach(function (key) {
      var day = state.days[key];
      if (!day.completed) return;
      stats.played++;
      if (day.won) {
        stats.won++;
        var date = new Date(key + 'T12:00:00');
        date.setDate(date.getDate() - 1);
        var yesterday = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
        stats.currentStreak = previousWin === yesterday ? stats.currentStreak + 1 : 1;
        previousWin = key;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[day.guesses.length]++;
      } else { stats.currentStreak = 0; previousWin = null; }
    });
    state.stats = stats;
    state.lastWinDay = previousWin;
  }

  async function switchLocalPlayer(profileId) {
    try {
      if (supabase && currentUser && !currentUser.is_anonymous) {
        // Local switching remains available offline. Remove this browser's stored
        // session even when the service cannot revoke its refresh token yet.
        try { await supabase.auth.signOut({ scope: 'local' }); } catch (_) {}
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY + '-code-verifier');
        setCurrentUser(null);
      }
      profiles().select(profileId);
      nextSyncAt = 0;
      if (syncTimer && typeof window.clearTimeout === 'function') window.clearTimeout(syncTimer);
      syncTimer = null;
      return { success: true };
    }
    catch (error) { return { error: error.message }; }
  }

  async function bindVerifiedProfile() {
      var profile = profiles().active();
      var created = false;
      // Reuse this account's local cache rather than attaching two independent
      // local histories to it unintentionally.
      var existing = profiles().list().find(function (p) { return p.cloudUserId === currentUser.id; });
      if (existing && (!profile || profile.cloudUserId !== currentUser.id)) {
        profiles().select(existing.id);
        profile = existing;
      }
      if (!profile) {
        profile = profiles().create(getMetadataDisplayName() || getEmailLocalPart(currentUser.email), '🌍', true);
        created = true;
      }
      if (profile.cloudUserId && profile.cloudUserId !== currentUser.id) {
        profile = profiles().create(getMetadataDisplayName() || getEmailLocalPart(currentUser.email), '🌍', false);
        created = true;
      }
      profiles().update(profile.id, { cloudUserId: currentUser.id, email: currentUser.email });
      var remoteName = await getProfileName();
      if (created && remoteName && remoteName !== 'Player') profiles().update(profile.id, { name: remoteName });
      else if (!remoteName || remoteName === 'Player') {
        try {
          var result = await supabase.from('players').update({ display_name: profile.name }).eq('id', currentUser.id);
          if (!result.error) cacheProfileName(profile.name);
        } catch (_) { /* The local nickname remains available if this update is offline. */ }
      }
  }

  var googleSignInBusy = false;
  async function signInWithGoogle(credentials) {
    if (googleSignInBusy) return { error: 'Google sign-in is already being checked. Please wait.' };
    if (!credentials || typeof credentials.token !== 'string' || !credentials.token ||
        typeof credentials.nonce !== 'string' || !credentials.nonce ||
        !Object.prototype.hasOwnProperty.call(credentials, 'profileId')) {
      return { error: 'Use the Google sign-in button to choose an account.' };
    }
    googleSignInBusy = true;
    try {
      await init();
      if (!supabase) return { error: 'Connect to the internet to sign in with Google. Device profiles still work offline.' };
      if ((profiles()?.active()?.id || null) !== credentials.profileId) {
        return { error: 'The selected player changed. Choose your player and try Google sign-in again.' };
      }
      // Supabase validates Google's signature, audience and nonce. Never attach a
      // profile based on a decoded browser token or an existing session alone.
      var result = await supabase.auth.signInWithIdToken({
        provider: 'google', token: credentials.token, nonce: credentials.nonce
      });
      var user = result.data?.session?.user;
      if (result.error || !user || user.is_anonymous || !user.email) {
        return { error: 'Google sign-in did not complete. Your device profile is safe. Please try again.' };
      }
      if ((profiles()?.active()?.id || null) !== credentials.profileId) {
        return { error: 'The selected player changed. Your device progress is safe. Please sign in again.' };
      }
      setCurrentUser(user);
      await bindVerifiedProfile();
      signInError = '';
      localStorage.removeItem(OAUTH_PENDING_KEY);
      nextSyncAt = 0;
      await syncProgress();
      return { success: true };
    } catch (_) {
      return { error: 'Could not finish Google sign-in. Your device profile is safe. Please try again.' };
    } finally { googleSignInBusy = false; }
  }

  function getPlayer() {
    return currentUser;
  }

  function isOnline() {
    return online;
  }

  /**
   * True when the Supabase client exists, even if no guest session was created.
   * Magic-link sign-in works in this state; anonymous sign-in may not.
   */
  function isReady() {
    return ready && !!supabase;
  }

  function isClaimed() {
    var profile = profiles() && profiles().active();
    return !!(currentUser && currentUser.email && !currentUser.is_anonymous && (!profiles() || profile?.cloudUserId === currentUser.id));
  }

  function getEmail() {
    return currentUser && currentUser.email ? currentUser.email : null;
  }

  /**
   * Send a magic link to either sign into an existing player or create a new
   * personal profile. The active guest remains unchanged until the link opens.
   */
  async function sendPlayerMagicLink(email, displayName) {
    // Only the client is required here. Requiring `online` would block this
    // whenever anonymous sign-in is unavailable, which is unrelated.
    try {
      await init();
    } catch (e) {}
    if (!supabase) return { error: 'Cannot reach the player service. Check your connection and retry.' };

    var normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) return { error: 'Enter an email address.' };

    var options = {
      shouldCreateUser: true,
      data: { display_name: normalizeDisplayName(displayName) || 'Player' }
    };
    var redirect = getSafeEmailRedirect();
    if (redirect) options.emailRedirectTo = redirect;

    try {
      var result = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: options
      });
      if (result.error) return { error: result.error.message };
      return {
        success: true,
        message: 'Sign-in link sent. Open it to switch to that player’s saved record.'
      };
    } catch (e) {
      return { error: e.message || 'Unable to send the magic link.' };
    }
  }

  /**
   * Retain the existing guest record by upgrading that auth user with email.
   */
  async function claimWithEmail(email, displayName) {
    if (!online || !supabase) return { error: 'Not connected to server' };

    var name = normalizeDisplayName(displayName) || 'Player';
    var options = {};
    var redirect = getSafeEmailRedirect();
    if (redirect) options.emailRedirectTo = redirect;

    try {
      var result = await supabase.auth.updateUser({
        email: email,
        data: { display_name: name }
      }, options);
      if (result.error) return { error: result.error.message };

      if (displayName && currentUser) {
        await supabase
          .from('players')
          .update({ display_name: name })
          .eq('id', currentUser.id);
        cacheProfileName(name);
      }

      return { success: true, message: 'Check your email for a confirmation link!' };
    } catch (e) {
      return { error: e.message };
    }
  }

  // ─── Helpers ───

  function getSafeEmailRedirect() {
    if (typeof window === 'undefined' || !window.location) return null;
    var protocol = window.location.protocol;
    return protocol === 'http:' || protocol === 'https:' ? window.location.href : null;
  }

  function getMetadataDisplayName() {
    var metadata = currentUser && currentUser.user_metadata || {};
    return normalizeDisplayName(metadata.display_name || metadata.full_name || metadata.name);
  }

  function getEmailLocalPart(email) {
    return email ? email.split('@')[0] : null;
  }

  function normalizeDisplayName(name) {
    var normalized = String(name || '').trim();
    return normalized ? normalized.slice(0, 80) : null;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function getLocalStats() {
    try {
      var s = readLocal('geowars-stats', {});
      return {
        played: s.played || 0,
        bestStreak: s.bestStreak || 0,
        totalCorrect: s.totalCorrect || 0,
        totalScore: s.totalScore || 0,
        displayName: profiles()?.active()?.name || 'Guest'
      };
    } catch (e) {
      return { played: 0, bestStreak: 0, totalCorrect: 0, totalScore: 0, displayName: 'Guest' };
    }
  }

  function saveLocalStats(sessionData) {
    try {
      var existing = readLocal('geowars-stats', {});
      existing.played = (existing.played || 0) + 1;
      existing.bestStreak = Math.max(existing.bestStreak || 0, sessionData.bestStreak);
      existing.totalCorrect = (existing.totalCorrect || 0) + sessionData.correct;
      existing.totalScore = (existing.totalScore || 0) + sessionData.score;
      writeLocal('geowars-stats', existing);
    } catch (e) {}
  }

  function resetLocalStats() {
    try {
      localStorage.removeItem(localKey('geowars-stats'));
      localStorage.removeItem(localKey('geowars-session-queue'));
      return true;
    } catch (e) {
      return false;
    }
  }

  window.GeoWarsDB = {
    init: init,
    getPlayer: getPlayer,
    getStats: getStats,
    getIdentity: getIdentity,
    saveGameSession: saveGameSession,
    resetLocalStats: resetLocalStats,
    isOnline: isOnline,
    isReady: isReady,
    isClaimed: isClaimed,
    getEmail: getEmail,
    sendPlayerMagicLink: sendPlayerMagicLink,
    claimWithEmail: claimWithEmail,
    switchLocalPlayer: switchLocalPlayer,
    syncProgress: syncProgress,
    signInWithGoogle: signInWithGoogle
  };
  window.addEventListener?.('online', function () { void syncProgress(); });
})();
