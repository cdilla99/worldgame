/* Google's official button signs in on this site's origin. No Supabase OAuth redirect. */
(function (root) {
  'use strict';

  // Public Web client ID from the existing Supabase Google provider, not a secret.
  const CLIENT_ID = '923544522831-kvvqtalqdhflur58g0e8kdrat6smsmm8.apps.googleusercontent.com';
  let initialization = null;
  let pending = null;
  let busy = false;
  let renderVersion = 0;

  function loadGoogle() {
    if (root.google?.accounts?.id) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => finish(new Error('Google sign-in timed out.')), 10000);
      function finish(error) {
        clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); }
        else resolve();
      }
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => finish(root.google?.accounts?.id ? null : new Error('Google sign-in could not load.'));
      script.onerror = () => finish(new Error('Google sign-in could not load.'));
      document.head.appendChild(script);
    });
  }

  async function initialize() {
    await loadGoogle();
    const bytes = root.crypto.getRandomValues(new Uint8Array(32));
    const nonce = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    const digest = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
    const hashedNonce = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
    root.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      nonce: hashedNonce,
      ux_mode: 'popup',
      auto_select: false,
      button_auto_select: false,
      use_fedcm_for_button: true,
      callback: async response => {
        if (!pending || busy || response.state !== pending.state) return;
        const attempt = pending;
        pending = null;
        busy = true;
        let result;
        try {
          attempt.onStart?.();
          result = await root.GeoWarsDB.signInWithGoogle({
            token: response.credential, nonce, profileId: attempt.profileId
          });
        } catch (_) {
          result = { error: 'Google sign-in failed. Retry. Your device profile is safe.' };
        } finally { busy = false; }
        if (attempt.version === renderVersion) attempt.onResult?.(result);
      }
    });
  }

  async function render(container, handlers) {
    const version = ++renderVersion;
    pending = null;
    try {
      await root.GeoWarsDB.init();
      if (!root.GeoWarsDB.isReady()) throw new Error('Player service unavailable.');
      if (!initialization) initialization = initialize().catch(error => { initialization = null; throw error; });
      await initialization;
      if (version !== renderVersion) return { cancelled: true };
      container.replaceChildren();
      const state = root.crypto.randomUUID();
      root.google.accounts.id.renderButton(container, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
        state,
        width: String(Math.min(400, Math.max(200, Math.floor(container.getBoundingClientRect().width)))),
        click_listener: () => {
          if (!busy && version === renderVersion) {
            pending = { ...handlers, version, state, profileId: root.GeoWarsProfiles?.active()?.id || null };
          }
        }
      });
      return { success: true };
    } catch (_) {
      return { error: 'Google sign-in could not load. Check your connection or browser settings, then retry. Your device profile is safe.' };
    }
  }

  function cancel() { ++renderVersion; pending = null; }
  root.EarthlingGoogleSignIn = Object.freeze({ render, cancel });
})(window);
