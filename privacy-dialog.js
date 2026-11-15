/* Keep the standalone privacy page as the single source for the in-app notice. */
(function () {
  'use strict';
  const dialog = document.createElement('dialog');
  dialog.id = 'privacy-dialog';
  dialog.className = 'privacy-dialog';
  dialog.setAttribute('aria-labelledby', 'privacy-dialog-title');
  dialog.innerHTML = '<header class="privacy-dialog-heading"><h2 id="privacy-dialog-title">Privacy</h2><button type="button" aria-label="Close privacy" autofocus>×</button></header><div class="privacy-dialog-content" aria-busy="false"></div>';
  document.body.append(dialog);
  const close = dialog.querySelector('button');
  const content = dialog.querySelector('.privacy-dialog-content');
  let trigger = null;
  let loading = null;

  function loadNotice() {
    if (loading) return loading;
    content.textContent = 'Loading…';
    content.setAttribute('aria-busy', 'true');
    loading = fetch('/privacy.html').then(response => {
      if (!response.ok) throw new Error('Privacy unavailable');
      return response.text();
    }).then(html => {
      const page = new DOMParser().parseFromString(html, 'text/html');
      const paragraphs = page.querySelectorAll('main > p');
      if (!paragraphs.length) throw new Error('Privacy unavailable');
      content.replaceChildren(...Array.from(paragraphs, paragraph => document.importNode(paragraph, true)));
    }).catch(() => {
      loading = null;
      content.replaceChildren();
      const fallback = document.createElement('a');
      fallback.href = '/privacy.html';
      fallback.textContent = 'Open privacy page';
      content.append(fallback);
    }).finally(() => content.setAttribute('aria-busy', 'false'));
    return loading;
  }

  document.querySelectorAll('a[href="/privacy.html"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
      void loadNotice();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
  // Let the native dialog handle Escape and focus without closing a dialog underneath.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
})();
