(() => {
  const sourceCards = typeof countryCards === 'undefined' ? [] : countryCards;
  const cards = sourceCards
    .filter(card => card.kind !== 'territory')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const byName = name => cards.findIndex(card => card.name === name);
  let currentIndex = Math.max(0, byName('Japan'));
  let renderSequence = 0;
  let previewTimer = null;

  const queryAll = selector => [...document.querySelectorAll(selector)];
  const refs = {
    outline: document.getElementById('shape-outline'),
    select: document.getElementById('country-select'),
    status: document.getElementById('concept-status'),
    preview: document.querySelector('[data-action="preview"]'),
    live: document.getElementById('concept-live')
  };

  const setText = (selector, value) => queryAll(selector).forEach(element => {
    element.textContent = value || '—';
  });

  const countryCode = country => {
    if (!country?.flag) return '—';
    return Array.from(country.flag)
      .filter(character => character.codePointAt(0) >= 127462 && character.codePointAt(0) <= 127487)
      .map(character => String.fromCharCode(character.codePointAt(0) - 127397))
      .join('') || '—';
  };

  function setPreviewState(active) {
    if (active && !previewTimer) {
      previewTimer = window.setInterval(() => selectIndex(currentIndex + 1, false), 5000);
    } else if (!active && previewTimer) {
      window.clearInterval(previewTimer);
      previewTimer = null;
    }
    if (refs.preview) {
      refs.preview.textContent = active ? 'Pause preview' : 'Play preview';
      refs.preview.setAttribute('aria-pressed', String(active));
    }
    if (refs.status) refs.status.textContent = active
      ? 'Preview is playing. Select a country to take over.'
      : 'Preview paused. Browse the library at your pace.';
  }

  function renderFlag(card) {
    const code = countryCode(card);
    const source = window.AssetFallbacks?.getFlagSource(card);
    queryAll('[data-country-flag]').forEach(slot => {
      const label = `${card.name} flag`;
      slot.replaceChildren();
      slot.setAttribute('aria-label', label);
      if (!source?.urls?.length) {
        slot.textContent = code || '—';
        return;
      }
      const image = document.createElement('img');
      let sourceIndex = 0;
      image.alt = label;
      image.decoding = 'async';
      image.addEventListener('error', () => {
        sourceIndex += 1;
        if (sourceIndex < source.urls.length) {
          image.src = source.urls[sourceIndex];
          return;
        }
        slot.replaceChildren();
        slot.textContent = code || '—';
      });
      slot.appendChild(image);
      image.src = source.urls[sourceIndex];
    });
  }

  function renderOutline(card) {
    if (!refs.outline) return;
    const sequence = ++renderSequence;
    refs.outline.setAttribute('aria-busy', 'true');
    refs.outline.replaceChildren();
    if (!window.GeoWarsShapeGeometry?.render) {
      refs.outline.textContent = 'Outline unavailable.';
      refs.outline.removeAttribute('aria-busy');
      return;
    }
    window.GeoWarsShapeGeometry.render(refs.outline, card, { padding: 0.1 })
      .then(() => {
        if (sequence === renderSequence) refs.outline.removeAttribute('aria-busy');
      })
      .catch(() => {
        if (sequence !== renderSequence) return;
        refs.outline.textContent = 'Outline unavailable.';
        refs.outline.removeAttribute('aria-busy');
      });
  }

  function renderCountry(card, announce = true) {
    if (!card) return;
    document.body.classList.toggle('has-long-country-name', card.name.length > 20);
    const region = `${card.continent || 'World'} · ${card.subregion || '—'}`;
    setText('[data-country-name]', card.name);
    setText('[data-country-region]', region);
    setText('[data-country-capital]', card.capital || 'No official capital');
    setText('[data-country-population]', card.population_hint);
    setText('[data-country-languages]', card.main_languages?.join(', '));
    setText('[data-country-currency]', card.currency);
    setText('[data-country-area]', card.area_hint);
    setText('[data-country-neighbors]', card.neighbors?.length ? card.neighbors.join(', ') : 'No land borders');
    setText('[data-country-fact]', card.fun_facts?.[0] || card.built_in_clue);
    renderFlag(card);
    queryAll('[data-country-code]').forEach(element => { element.textContent = countryCode(card); });
    if (refs.select) refs.select.value = String(card.id);
    if (refs.live && announce) refs.live.textContent = `${card.name} selected. Capital: ${card.capital || 'No official capital'}.`;
    renderOutline(card);
  }

  function selectIndex(nextIndex, announce = true) {
    if (!cards.length) return;
    currentIndex = (nextIndex + cards.length) % cards.length;
    renderCountry(cards[currentIndex], announce);
  }

  cards.forEach(card => {
    const option = document.createElement('option');
    option.value = String(card.id);
    option.textContent = card.name;
    refs.select?.appendChild(option);
  });

  document.querySelectorAll('[data-action="previous"]').forEach(button => {
    button.addEventListener('click', () => {
      setPreviewState(false);
      selectIndex(currentIndex - 1);
    });
  });
  document.querySelectorAll('[data-action="next"]').forEach(button => {
    button.addEventListener('click', () => {
      setPreviewState(false);
      selectIndex(currentIndex + 1);
    });
  });
  refs.select?.addEventListener('change', event => {
    setPreviewState(false);
    const nextIndex = cards.findIndex(card => card.id === Number(event.target.value));
    if (nextIndex >= 0) selectIndex(nextIndex);
  });
  refs.preview?.addEventListener('click', () => setPreviewState(!previewTimer));
  document.querySelectorAll('[data-action="quiz"]').forEach(button => {
    button.addEventListener('click', () => {
      if (refs.status) refs.status.textContent = 'Shape Quiz selected. Choose a country to begin.';
      if (refs.live) refs.live.textContent = 'Shape Quiz selected.';
    });
  });
  document.querySelectorAll('.prototype-control').forEach(control => {
    control.addEventListener('click', event => {
      if (control.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });
  });

  renderCountry(cards[currentIndex], false);
  setPreviewState(false);
})();
