/* Device profiles contain no credentials. Cloud access always requires Supabase authentication. */
(function (root) {
  'use strict';
  const KEY = 'earthling-player-profiles-v1';
  const RESOURCES = ['geowars-stats', 'geowars-learning', 'geowars-daily-worldle', 'geowars-session-queue'];
  const AVATARS = ['🌍', '🚀', '🦊', '🐼', '🐬', '🦉'];
  function read() {
    const value = JSON.parse(localStorage.getItem(KEY) || '{"active":"guest","profiles":[]}');
    if (!Array.isArray(value.profiles)) throw new Error('Player profiles could not be read.');
    return value;
  }
  function write(value) { localStorage.setItem(KEY, JSON.stringify(value)); }
  function id() { return root.crypto.randomUUID(); }
  function active() {
    try { const state = read(); return state.profiles.find(p => p.id === state.active) || null; }
    catch (_) { return null; }
  }
  function storageKey(key, profile) {
    const player = profile === undefined ? active() : profile;
    return player ? key + ':player:' + player.id : key;
  }
  function list() { try { return read().profiles; } catch (_) { return []; } }
  function create(name, avatar, keepGuest) {
    const normalized = String(name || '').trim().slice(0, 40);
    if (!normalized) throw new Error('Enter a nickname.');
    const state = read();
    const profile = { id: id(), name: normalized, avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0] };
    // Copy first, commit the profile second, clear guest records last. Failed storage
    // writes leave the original guest data intact.
    const takingGuest = keepGuest && !active();
    if (takingGuest) RESOURCES.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) localStorage.setItem(storageKey(key, profile), value);
    });
    state.profiles.push(profile);
    state.active = profile.id;
    write(state);
    if (takingGuest) RESOURCES.forEach(key => localStorage.removeItem(key));
    return profile;
  }
  function select(profileId) {
    const state = read();
    if (profileId !== 'guest' && !state.profiles.some(p => p.id === profileId)) throw new Error('Player not found.');
    state.active = profileId;
    write(state);
  }
  function update(profileId, changes) {
    const state = read();
    const profile = state.profiles.find(p => p.id === profileId);
    if (!profile) throw new Error('Player not found.');
    Object.assign(profile, changes);
    write(state);
    return profile;
  }
  root.GeoWarsProfiles = Object.freeze({ active, list, create, select, update, storageKey, avatars: AVATARS, id });
})(window);
