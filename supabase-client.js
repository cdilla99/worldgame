/**
 * Supabase Client — GeoWars Player Identity
 *
 * Handles frictionless anonymous auth, optional magic-link profiles, stats
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

  /**
   * Initialize once and retain the existing session, otherwise create the
   * anonymous session that keeps the game frictionless for guests.
   */
  function init() {
    if (!initPromise) initPromise = initialize();
    return initPromise;
  }

  async function initialize() {
    if (!window.supabase) {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      } catch (e) {
        console.warn('[GeoWarsDB] Could not load Supabase SDK, running offline.');
        return;
      }
    }

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      ready = true;
      supabase.auth.onAuthStateChange(function (_event, session) {
        setCurrentUser(session && session.user ? session.user : null);
      });

      var sessionResult = await supabase.auth.getSession();
      var session = sessionResult.data && sessionResult.data.session;
      if (session) {
        setCurrentUser(session.user);
      } else {
        var anonymousResult = await supabase.auth.signInAnonymously();
        if (anonymousResult.error) {
          console.warn('[GeoWarsDB] Anonymous sign-in failed:', anonymousResult.error.message);
          return;
        }
        setCurrentUser(anonymousResult.data.user);
      }

      if (currentUser) console.log('[GeoWarsDB] Player ID:', currentUser.id);
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
   * Get the current player's aggregate stats from Supabase.
   * Falls back to localStorage if offline.
   */
  async function getStats() {
    if (!online || !supabase || !currentUser) return getLocalStats();

    try {
      var result = await supabase
        .from('players')
        .select('games_played, best_streak, total_correct, total_score, display_name')
        .eq('id', currentUser.id)
        .single();

      if (result.error || !result.data) return getLocalStats();
      cacheProfileName(result.data.display_name);
      return {
        played: result.data.games_played,
        bestStreak: result.data.best_streak,
        totalCorrect: result.data.total_correct,
        totalScore: result.data.total_score,
        displayName: result.data.display_name
      };
    } catch (e) {
      return getLocalStats();
    }
  }

  /**
   * Returns the display-ready identity used by the landing UI.
   */
  async function getIdentity() {
    var claimed = isClaimed();
    var profileName = await getProfileName();
    var metadataName = getMetadataDisplayName();
    var email = claimed ? getEmail() : null;
    var displayName = claimed
      ? (profileName || metadataName || getEmailLocalPart(email) || 'Player')
      : 'Guest';

    return {
      online: online,
      claimed: claimed,
      isGuest: !claimed,
      displayName: displayName,
      email: email,
      profileName: profileName || null
    };
  }

  async function getProfileName() {
    if (!online || !supabase || !currentUser) return null;
    if (cachedProfileUserId === currentUser.id) return cachedProfileName;

    try {
      var result = await supabase
        .from('players')
        .select('display_name')
        .eq('id', currentUser.id)
        .single();
      if (result.error || !result.data) return null;
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
    saveLocalStats(sessionData);
    if (!online || !supabase || !currentUser) return;

    try {
      var result = await supabase
        .from('game_sessions')
        .insert({
          player_id: currentUser.id,
          mode: sessionData.mode,
          score: sessionData.score,
          correct_count: sessionData.correct,
          total_count: sessionData.total,
          best_streak: sessionData.bestStreak,
          difficulty: sessionData.difficulty || 'all',
          duration_seconds: sessionData.duration || null
        });

      if (result.error) console.warn('[GeoWarsDB] Failed to save session:', result.error.message);
    } catch (e) {
      console.warn('[GeoWarsDB] Save session error:', e.message);
    }
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
    return !!(currentUser && currentUser.email && !currentUser.is_anonymous);
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
        message: 'Magic link sent. Open it to switch to that player’s saved record.'
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
    return normalizeDisplayName(currentUser && currentUser.user_metadata && currentUser.user_metadata.display_name);
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
      var s = JSON.parse(localStorage.getItem('geowars-stats') || '{}');
      return {
        played: s.played || 0,
        bestStreak: s.bestStreak || 0,
        totalCorrect: s.totalCorrect || 0,
        totalScore: s.totalScore || 0,
        displayName: 'Guest'
      };
    } catch (e) {
      return { played: 0, bestStreak: 0, totalCorrect: 0, totalScore: 0, displayName: 'Guest' };
    }
  }

  function saveLocalStats(sessionData) {
    try {
      var existing = JSON.parse(localStorage.getItem('geowars-stats') || '{}');
      existing.played = (existing.played || 0) + 1;
      existing.bestStreak = Math.max(existing.bestStreak || 0, sessionData.bestStreak);
      existing.totalCorrect = (existing.totalCorrect || 0) + sessionData.correct;
      existing.totalScore = (existing.totalScore || 0) + sessionData.score;
      localStorage.setItem('geowars-stats', JSON.stringify(existing));
    } catch (e) {}
  }

  window.GeoWarsDB = {
    init: init,
    getPlayer: getPlayer,
    getStats: getStats,
    getIdentity: getIdentity,
    saveGameSession: saveGameSession,
    isOnline: isOnline,
    isReady: isReady,
    isClaimed: isClaimed,
    getEmail: getEmail,
    sendPlayerMagicLink: sendPlayerMagicLink,
    claimWithEmail: claimWithEmail
  };
})();
