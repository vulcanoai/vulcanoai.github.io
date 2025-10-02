/*
  capsule-main.js — Archive-first experience for Vulcano capsules
*/
(() => {
  const config = window.AILatamConfig || {};
  const api = config.api || {};
  const docUrl = api.capsulesDocUrl || '/data/capsules/doc-latest.txt';

  const state = {
    capsules: [],
    filteredCapsules: [],
    tags: [],
    tagLabels: new Map(),
    tagCounts: new Map(),
    activeTag: 'todos',
    loading: true,
    error: null,
    generatedAt: null,
    source: null,
    voiceButtons: new Map(),
    capsuleIndex: new Map(),
    pendingCapsuleId: null
  };

  const voiceState = {
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    activeId: null,
    utterance: null,
    playbackRate: 1.0
  };

  const playbackRates = [0.75, 1.0, 1.25, 1.5];

  const elements = {
    updatedLabel: document.getElementById('capsule-updated'),
    archive: document.getElementById('capsule-archive'),
    tagFilter: document.getElementById('tag-filter'),
    playLatest: document.getElementById('play-latest-button'),
    heroNote: document.querySelector('.hero-note')
  };

  init();

  function init() {
    renderCapsules();
    renderTagFilter();
    updatePlayLatestState();
    state.pendingCapsuleId = getCapsuleIdFromHash();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('vulcano:holographic-open', handleViewerOpen);
    window.addEventListener('vulcano:holographic-close', handleViewerClose);
    loadCapsules();
    setupPlayLatest();
    window.addEventListener('beforeunload', cancelVoicePlayback, { once: true });
  }

  async function loadCapsules() {
    setLoading(true);
    try {
      const { text, updatedAt, source } = await fetchLatestDocument();
      const capsules = parseDocumentToCapsules(text) || [];
      enhanceCapsules(capsules);
      state.capsules = capsules;
      state.capsuleIndex = buildCapsuleIndex(capsules);
      state.filteredCapsules = applyFilterToCapsules(state.activeTag, capsules);
      const payloadGeneratedAt = normalizeDateInput(capsules.generatedAt);
      const fallbackUpdatedAt = normalizeDateInput(updatedAt);
      state.generatedAt = payloadGeneratedAt || fallbackUpdatedAt || new Date().toISOString();
      state.source = source || capsules.source || null;
      state.error = null;
      buildTagIndex(capsules);
      renderTagFilter();
      renderCapsules();
      openPendingCapsuleIfNeeded();
      updatePlayLatestState();
      updateTimestampLabel();
    } catch (err) {
      console.error('capsule-main: error al cargar documento', err);
      state.error = 'No pude cargar las cápsulas en este momento.';
      renderCapsules();
      updatePlayLatestState();
      if (elements.updatedLabel) {
        elements.updatedLabel.textContent = 'sin conexión';
      }
    } finally {
      setLoading(false);
    }
  }

  function setLoading(value) {
    state.loading = value;
    renderCapsules();
  }

  function updateTimestampLabel() {
    if (!elements.updatedLabel || !state.generatedAt) return;
    elements.updatedLabel.textContent = formatTimestamp(state.generatedAt);
  }

  function setupPlayLatest() {
    if (!elements.playLatest) return;
    if (!voiceState.supported) {
      elements.playLatest.disabled = true;
      if (elements.heroNote) {
        elements.heroNote.textContent = 'El audio estará disponible en navegadores compatibles con síntesis de voz.';
      }
      return;
    }

    elements.playLatest.addEventListener('click', () => {
      const latest = state.capsules[0];
      if (!latest) return;
      toggleCapsuleVoice(latest);
    });
  }

  function updatePlayLatestState() {
    if (!elements.playLatest) return;
    const hasCapsules = Boolean(state.capsules.length);
    if (!voiceState.supported || !hasCapsules) {
      elements.playLatest.disabled = true;
    } else {
      elements.playLatest.disabled = false;
    }
  }

  function renderTagFilter() {
    const container = elements.tagFilter;
    if (!container) return;

    container.innerHTML = '';

    const allButton = createFilterChip({
      slug: 'todos',
      label: 'Todos',
      count: state.capsules.length,
      active: state.activeTag === 'todos'
    });
    container.appendChild(allButton);

    state.tags.forEach(slug => {
      const label = state.tagLabels.get(slug) || slug;
      const count = state.tagCounts.get(slug) || 0;
      container.appendChild(createFilterChip({
        slug,
        label,
        count,
        active: state.activeTag === slug
      }));
    });
  }

  function createFilterChip({ slug, label, count, active }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag-filter-chip' + (active ? ' is-active' : '');
    button.textContent = count ? `${beautifyTagLabel(label)} (${count})` : beautifyTagLabel(label);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', active ? 'true' : 'false');
    button.dataset.tag = slug;
    button.addEventListener('click', () => {
      if (state.activeTag === slug) return;
      state.activeTag = slug;
      state.filteredCapsules = applyFilterToCapsules(slug, state.capsules);
      renderTagFilter();
      renderCapsules();
      updatePlayLatestState();
    });
    return button;
  }

  function renderCapsules() {
    const container = elements.archive;
    if (!container) return;

    container.innerHTML = '';
    state.voiceButtons.clear();

    if (voiceState.activeId && !state.filteredCapsules.some(cap => cap.id === voiceState.activeId)) {
      cancelVoicePlayback();
    }

    if (state.loading) {
      container.appendChild(buildInfoCard('Cargando cápsulas…'));
      return;
    }

    if (state.error) {
      container.appendChild(buildInfoCard(state.error, true));
      return;
    }

    if (!state.filteredCapsules.length) {
      const message = state.activeTag === 'todos'
        ? 'Aún no tenemos cápsulas disponibles. Vuelve pronto.'
        : 'No hay cápsulas con esta etiqueta por ahora.';
      container.appendChild(buildInfoCard(message));
      return;
    }

    state.filteredCapsules.forEach(capsule => {
      container.appendChild(buildCapsuleCard(capsule));
    });

    updateVoiceButtons();
  }

  function buildCapsuleCard(capsule) {
    const article = document.createElement('article');
    article.className = 'capsule-card';
    article.dataset.capsuleId = capsule.id;

    const header = document.createElement('header');
    header.className = 'card-header';

    const date = document.createElement('span');
    date.className = 'card-date';
    date.textContent = formatDate(capsule.createdAt || capsule.createdISO || state.generatedAt);
    header.appendChild(date);

    if (capsule.primarySource) {
      const source = document.createElement('a');
      source.className = 'card-source';
      source.href = capsule.primarySource.url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = capsule.primarySource.title || 'Fuente';
      header.appendChild(source);
    }

    article.appendChild(header);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = capsule.title || 'Sin título';
    article.appendChild(title);

    if (capsule.summary) {
      const summary = document.createElement('p');
      summary.className = 'card-summary';
      summary.textContent = capsule.summary;
      article.appendChild(summary);
    }

    if (capsule.mainIdea && capsule.mainIdea !== capsule.summary) {
      const insight = document.createElement('p');
      insight.className = 'card-main-idea';
      insight.textContent = `Idea central: ${capsule.mainIdea}`;
      article.appendChild(insight);
    }

    const bullets = document.createElement('ul');
    bullets.className = 'card-bullets';
    const bodyItems = Array.isArray(capsule.body) ? capsule.body : [capsule.body];
    bodyItems
      .map(item => (item || '').trim())
      .filter(Boolean)
      .forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        bullets.appendChild(li);
      });
    if (!bullets.children.length) {
      const li = document.createElement('li');
      li.textContent = 'Sin detalles adicionales.';
      bullets.appendChild(li);
    }
    article.appendChild(bullets);

    const footer = document.createElement('footer');
    footer.className = 'card-footer';

    const tagsWrapper = document.createElement('div');
    tagsWrapper.className = 'card-tags';
    if (capsule.tags && capsule.tags.length) {
      capsule.tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'card-tag';
        chip.textContent = beautifyTagLabel(tag);
        chip.addEventListener('click', event => {
          event.stopPropagation();
          const slug = normalizeTag(tag);
          if (!slug) return;
          state.activeTag = slug;
          state.filteredCapsules = applyFilterToCapsules(slug, state.capsules);
          renderTagFilter();
          renderCapsules();
        });
        tagsWrapper.appendChild(chip);
      });
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'card-tag is-muted';
      placeholder.textContent = 'sin etiquetas';
      tagsWrapper.appendChild(placeholder);
    }
    footer.appendChild(tagsWrapper);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const voiceButton = document.createElement('button');
    voiceButton.type = 'button';
    voiceButton.className = 'card-action card-action-voice';
    voiceButton.innerHTML = `
      <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm7 9a7 7 0 0 1-7 7" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <span class="action-label">Escuchar cápsula</span>
    `;
    if (!voiceState.supported) {
      voiceButton.disabled = true;
      voiceButton.title = 'Tu navegador no soporta síntesis de voz.';
    } else {
      voiceButton.addEventListener('click', event => {
        event.stopPropagation();
        toggleCapsuleVoice(capsule);
      });
    }
    actions.appendChild(voiceButton);
    state.voiceButtons.set(capsule.id, voiceButton);

    const shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'card-action card-action-share';
    shareButton.innerHTML = `
      <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M16 6l-4-4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" />
        <path d="M12 2v13" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      Compartir
    `;
    shareButton.addEventListener('click', event => {
      event.stopPropagation();
      shareCapsule(capsule);
    });
    actions.appendChild(shareButton);

    if (capsule.sources && capsule.sources.length) {
      const primary = capsule.primarySource || capsule.sources[0];
      const sourceLink = document.createElement('a');
      sourceLink.className = 'card-action card-action-link';
      sourceLink.href = primary.url || '#';
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.innerHTML = `
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7 17L17 7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 7h7v7" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Fuente
      `;
      sourceLink.addEventListener('click', event => {
        event.stopPropagation();
      });
      actions.appendChild(sourceLink);
    }

    if (window.VulcanoHolographicViewer) {
      const detailButton = document.createElement('button');
      detailButton.type = 'button';
      detailButton.className = 'card-action card-action-detail';
      detailButton.innerHTML = `
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 5v14" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 12h14" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        Ver ficha completa
      `;
      detailButton.addEventListener('click', event => {
        event.stopPropagation();
        openCapsuleDetail(capsule.id);
      });
      actions.appendChild(detailButton);
    }

    footer.appendChild(actions);
    article.appendChild(footer);

    article.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      if (event.target.closest('a, button')) return;
      openCapsuleDetail(capsule.id);
    });

    return article;
  }

  function buildInfoCard(message, isError = false) {
    const div = document.createElement('div');
    div.className = 'archive-empty' + (isError ? ' is-error' : '');
    div.textContent = message;
    return div;
  }

  function toggleCapsuleVoice(capsule) {
    if (!voiceState.supported) return;
    if (!capsule) return;

    if (voiceState.activeId === capsule.id) {
      cancelVoicePlayback();
      return;
    }

    const text = buildVoiceText(capsule);
    if (!text) return;

    cancelVoicePlayback();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO';
    utterance.rate = voiceState.playbackRate;
    utterance.pitch = 1;
    utterance.onend = () => {
      voiceState.activeId = null;
      voiceState.utterance = null;
      updateVoiceButtons();
    };
    utterance.onerror = () => {
      voiceState.activeId = null;
      voiceState.utterance = null;
      updateVoiceButtons();
    };

    voiceState.activeId = capsule.id;
    voiceState.utterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    updateVoiceButtons();
  }

  function cancelVoicePlayback() {
    if (!voiceState.supported) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    voiceState.activeId = null;
    voiceState.utterance = null;
    updateVoiceButtons();
  }

  function buildVoiceText(capsule) {
    if (!capsule) return '';
    const pieces = [];
    if (capsule.title) pieces.push(capsule.title);
    if (capsule.summary) pieces.push(capsule.summary);
    if (capsule.mainIdea && capsule.mainIdea !== capsule.summary) {
      pieces.push(`Idea central: ${capsule.mainIdea}`);
    }
    const bodyItems = Array.isArray(capsule.body) ? capsule.body : [capsule.body];
    bodyItems
      .map(item => (item || '').trim())
      .filter(Boolean)
      .forEach((item, index) => {
        pieces.push(`Punto ${index + 1}: ${item}`);
      });
    return pieces.join('. ');
  }

  function updateVoiceButtons() {
    state.voiceButtons.forEach((button, id) => {
      const active = voiceState.activeId === id;
      if (!button) return;
      button.classList.toggle('is-playing', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      const label = button.querySelector('.action-label');
      if (label) {
        label.textContent = active ? 'Detener audio' : 'Escuchar cápsula';
      }
    });

    if (elements.playLatest) {
      const active = voiceState.activeId && state.capsules.length && state.capsules[0].id === voiceState.activeId;
      elements.playLatest.classList.toggle('is-playing', Boolean(active));
      elements.playLatest.setAttribute('aria-pressed', active ? 'true' : 'false');
      const label = elements.playLatest.querySelector('.hero-button-label');
      if (label) {
        label.textContent = active ? 'Detener audio' : 'Escuchar la última cápsula';
      }
    }
  }

  function shareCapsule(capsule) {
    if (!capsule) return;
    const payload = buildSharePayload(capsule);

    const canUseNavigator = typeof navigator !== 'undefined';

    if (payload.url && canUseNavigator && typeof navigator.share === 'function') {
      navigator.share(payload).catch(err => {
        if (err && err.name === 'AbortError') return;
        openCapsuleDetail(capsule.id, { highlightShare: true });
      });
      return;
    }

    if (payload.url && canUseNavigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(`${payload.title} — ${payload.url}`)
        .then(() => openCapsuleDetail(capsule.id, { highlightShare: true }))
        .catch(() => openCapsuleDetail(capsule.id, { highlightShare: true }));
      return;
    }

    openCapsuleDetail(capsule.id, { highlightShare: true });
  }

  function openCapsuleDetail(capsuleId, { highlightShare = false, updateHash = true } = {}) {
    if (!capsuleId || !window.VulcanoHolographicViewer) return;
    const index = state.capsuleIndex.get(capsuleId);
    if (typeof index !== 'number' || index < 0 || index >= state.capsules.length) return;

    if (!state.filteredCapsules.some(cap => cap.id === capsuleId)) {
      state.activeTag = 'todos';
      state.filteredCapsules = applyFilterToCapsules('todos', state.capsules);
      renderTagFilter();
      renderCapsules();
    }

    window.VulcanoHolographicViewer.show(state.capsules, index);
    state.pendingCapsuleId = null;

    if (updateHash) {
      updateHashForCapsule(capsuleId);
    }

    if (highlightShare) {
      requestAnimationFrame(() => highlightShareControls());
    }
  }

  function highlightShareControls() {
    const overlay = document.querySelector('.holographic-overlay');
    if (!overlay) return;
    const shareGroup = overlay.querySelector('.holographic-share');
    if (!shareGroup) return;

    shareGroup.classList.add('is-highlighted');
    setTimeout(() => {
      shareGroup.classList.remove('is-highlighted');
    }, 2200);
  }

  function buildSharePayload(capsule) {
    return {
      title: capsule.title || 'Cápsula Vulcano',
      text: capsule.summary || capsule.mainIdea || '',
      url: buildCapsuleUrl(capsule)
    };
  }

  function buildCapsuleUrl(capsule) {
    if (!capsule || typeof window === 'undefined') return '';
    const { location } = window;
    if (!location) return '';
    const base = `${location.origin}${location.pathname}${location.search}`;
    if (!capsule.id) return base;
    return `${base}#capsule=${encodeURIComponent(capsule.id)}`;
  }

  function updateHashForCapsule(capsuleId) {
    if (typeof window === 'undefined') return;
    const target = capsuleId
      ? `#capsule=${encodeURIComponent(capsuleId)}`
      : `${window.location.pathname}${window.location.search}`;
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', target);
    } else if (capsuleId) {
      window.location.hash = `capsule=${encodeURIComponent(capsuleId)}`;
    } else {
      window.location.hash = '';
    }
  }

  function handleViewerOpen(event) {
    const capsuleId = event && event.detail ? event.detail.capsuleId : null;
    if (!capsuleId) return;
    updateHashForCapsule(capsuleId);
  }

  function handleViewerClose() {
    updateHashForCapsule(null);
  }

  function openPendingCapsuleIfNeeded() {
    if (!state.pendingCapsuleId) return;
    if (!state.capsuleIndex.has(state.pendingCapsuleId)) return;
    openCapsuleDetail(state.pendingCapsuleId, { highlightShare: false, updateHash: false });
    state.pendingCapsuleId = null;
  }

  function handleHashChange() {
    const capsuleId = getCapsuleIdFromHash();
    if (!capsuleId) {
      state.pendingCapsuleId = null;
      if (window.VulcanoHolographicViewer && typeof window.VulcanoHolographicViewer.isOpen === 'function' && window.VulcanoHolographicViewer.isOpen()) {
        window.VulcanoHolographicViewer.close();
      }
      return;
    }

    if (!state.capsuleIndex.has(capsuleId)) {
      state.pendingCapsuleId = capsuleId;
      return;
    }

    openCapsuleDetail(capsuleId, { highlightShare: false, updateHash: false });
  }

  function getCapsuleIdFromHash() {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash || '';
    const match = hash.match(/capsule=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async function fetchLatestDocument() {
    try {
      const res = await fetch(docUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const lastModified = res.headers.get('last-modified');
      const updatedAt = lastModified ? new Date(lastModified).toISOString() : null;
      return { text, updatedAt, source: 'primary-doc' };
    } catch (initialError) {
      const localJson = await tryFetchLocalJsonSnapshot(initialError);
      if (localJson) {
        return localJson;
      }
      const fallback = await fetchFromGitHubDirectory(initialError);
      return { ...fallback, source: 'github-directory' };
    }
  }

  async function tryFetchLocalJsonSnapshot(initialError) {
    const altUrl = '/data/capsules.json';
    if (docUrl === altUrl) {
      return null;
    }
    try {
      const res = await fetch(altUrl, { cache: 'no-store' });
      if (!res.ok) {
        return null;
      }
      const text = await res.text();
      const lastModified = res.headers.get('last-modified');
      const updatedAt = lastModified ? new Date(lastModified).toISOString() : null;
      return { text, updatedAt, source: 'capsules-json', url: altUrl };
    } catch (err) {
      console.warn('capsule-main: fallback a capsules.json falló', err, initialError);
      return null;
    }
  }

  async function fetchFromGitHubDirectory(originalError) {
    const gh = (api && api.capsulesGitHub) || {};
    const owner = (gh.owner || 'vulcanoai').trim();
    const repo = (gh.repo || 'vulcanoai.github.io').trim();
    const directory = (gh.directory || 'data/capsules').replace(/^\/+|\/+$/g, '');
    const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${directory}`;
    const res = await fetch(listUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) {
      throw originalError || new Error(`GitHub listing failed: HTTP ${res.status}`);
    }
    const files = await res.json();
    const docFiles = Array.isArray(files)
      ? files
          .filter(file => file && file.download_url && isCapsuleSnapshot(file.name))
          .map(file => ({ ...file, generatedAt: extractTimestampFromName(file.name) }))
      : [];
    if (!docFiles.length) {
      throw originalError || new Error('No se encontraron snapshots de cápsulas en el repositorio.');
    }
    docFiles.sort((a, b) => {
      if (a.generatedAt && b.generatedAt) {
        return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
      if (a.generatedAt) return -1;
      if (b.generatedAt) return 1;
      return b.name.localeCompare(a.name);
    });
    const latest = docFiles[0];
    const textRes = await fetch(latest.download_url, { cache: 'no-store' });
    if (!textRes.ok) {
      throw new Error(`Descarga de snapshot falló: HTTP ${textRes.status}`);
    }
    const text = await textRes.text();
    const updatedAt = latest.generatedAt || extractTimestampFromName(latest.name) || new Date().toISOString();
    return { text, updatedAt };
  }

  function enhanceCapsules(capsules) {
    capsules.forEach(cap => {
      const tagSlugs = Array.isArray(cap.tags)
        ? cap.tags.map(tag => normalizeTag(tag)).filter(Boolean)
        : [];
      cap.tagSlugs = tagSlugs;
      cap.primarySource = Array.isArray(cap.sources) && cap.sources.length ? cap.sources[0] : null;
    });
  }

  function applyFilterToCapsules(slug, capsules) {
    if (!slug || slug === 'todos') {
      return capsules.slice();
    }
    return capsules.filter(cap => Array.isArray(cap.tagSlugs) && cap.tagSlugs.includes(slug));
  }

  function buildTagIndex(capsules) {
    const counts = new Map();
    const labels = new Map();

    capsules.forEach(cap => {
      (cap.tags || []).forEach(tag => {
        const slug = normalizeTag(tag);
        if (!slug) return;
        counts.set(slug, (counts.get(slug) || 0) + 1);
        if (!labels.has(slug)) {
          labels.set(slug, tag);
        }
      });
    });

    const ordered = Array.from(counts.entries()).sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      const labelA = (labels.get(a[0]) || a[0]).toString();
      const labelB = (labels.get(b[0]) || b[0]).toString();
      return labelA.localeCompare(labelB, 'es');
    });

    state.tags = ordered.map(entry => entry[0]);
    state.tagLabels = labels;
    state.tagCounts = counts;
  }

  function buildCapsuleIndex(capsules) {
    const index = new Map();
    capsules.forEach((cap, idx) => {
      if (cap && cap.id) {
        index.set(cap.id, idx);
      }
    });
    return index;
  }

  function beautifyTagLabel(tag) {
    return String(tag || '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/(^|\s)\p{L}/gu, match => match.toUpperCase());
  }

  function normalizeTag(tag) {
    return String(tag || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }

  function formatDate(dateLike) {
    if (!dateLike) return 'Fecha no disponible';
    const date = new Date(dateLike);
    if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatTimestamp(dateLike) {
    if (!dateLike) return 'fecha desconocida';
    const date = new Date(dateLike);
    if (!Number.isFinite(date.getTime())) return 'fecha desconocida';
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function parseDocumentToCapsules(text) {
    const jsonCapsules = parseJsonCapsules(text);
    if (jsonCapsules) {
      return jsonCapsules;
    }

    const normalized = String(text || '').replace(/\r\n/g, '\n');
    const segments = normalized.split(/\n-{3,}\n/g).map(seg => seg.trim()).filter(Boolean);
    const blocks = segments.length ? segments : (normalized.trim() ? [normalized.trim()] : []);
    const orderedBlocks = blocks.slice().reverse();

    return orderedBlocks
      .map((segment, index) => buildCapsuleFromSegment(segment, index))
      .filter(Boolean);
  }

  function parseJsonCapsules(payload) {
    if (payload === null || payload === undefined) {
      return null;
    }

    let data = payload;
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
        return null;
      }
      try {
        data = JSON.parse(trimmed);
      } catch (err) {
        console.warn('capsule-main: no pude interpretar cápsulas JSON', err);
        return null;
      }
    }

    const rawCapsules = Array.isArray(data) ? data : data && typeof data === 'object' ? data.capsules : null;
    if (!Array.isArray(rawCapsules)) {
      return null;
    }

    const normalized = rawCapsules
      .map((entry, index) => normalizeJsonCapsuleEntry(entry, index))
      .filter(Boolean);

    const generatedAt = extractGeneratedAtFromJson(data);
    if (generatedAt) {
      normalized.generatedAt = generatedAt;
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const source = data.source || data.origin || null;
      if (source) {
        normalized.source = source;
      }
      if (typeof data.version === 'string') {
        normalized.version = data.version;
      }
    }

    return normalized;
  }

  function normalizeJsonCapsuleEntry(entry, index) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const title = safeString(entry.title || entry.name);
    const mainIdea = safeString(entry.mainIdea || entry.ideaPrincipal || entry.idea_central);
    const summary = safeString(entry.summary || entry.resumen || mainIdea);
    const body = normalizeJsonBody(entry.body || entry.content || entry.highlights, summary || mainIdea);

    let id = safeString(entry.id || entry.capsule_id || entry.capsuleId || entry.slug);
    if (!id && title) {
      const slug = normalizeTag(title);
      if (slug) {
        id = `capsule-${slug}`;
      }
    }
    if (!id) {
      id = `capsule-${index + 1}`;
    }

    const createdRaw = entry.createdAt || entry.created_at || entry.createdISO || entry.created_iso || entry.created;
    const createdAt = normalizeDateInput(createdRaw);
    const tags = Array.from(new Set(normalizeJsonTags(entry.tags || entry.labels || entry.topics)));
    const sources = normalizeJsonSources(entry.sources || entry.references || entry.links);
    const authors = normalizeJsonAuthors(entry.authors || entry.author);

    const capsule = {
      id,
      title: title || summary || body[0] || `Cápsula ${index + 1}`,
      summary: summary || body[0] || title || '',
      mainIdea: mainIdea || summary || body[0] || '',
      body,
      tags,
      sources,
      authors,
      createdAt: createdAt || null,
      createdISO: createdAt || safeString(entry.createdISO) || null
    };

    if (!capsule.summary && capsule.body.length) {
      capsule.summary = capsule.body[0];
    }
    if (!capsule.mainIdea && capsule.summary) {
      capsule.mainIdea = capsule.summary;
    }

    return capsule;
  }

  function normalizeJsonBody(value, fallback) {
    if (!value && fallback) {
      return [fallback];
    }
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map(safeString).filter(Boolean);
    }
    if (typeof value === 'string') {
      const parts = value
        .split(/\n+/)
        .map(part => safeString(part))
        .filter(Boolean);
      if (parts.length) {
        return parts;
      }
    }
    return fallback ? [fallback] : [];
  }

  function normalizeJsonTags(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(safeString).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/[,;]+/)
        .map(part => safeString(part))
        .filter(Boolean);
    }
    return [];
  }

  function normalizeJsonSources(value) {
    if (!value) return [];
    const list = Array.isArray(value) ? value : [value];
    return list
      .map(entry => {
        if (!entry) return null;
        if (typeof entry === 'string') {
          const text = safeString(entry);
          if (!text) return null;
          if (/^https?:\/\//i.test(text)) {
            return { title: '', url: text };
          }
          return { title: text, url: '' };
        }
        if (typeof entry === 'object') {
          const url = safeString(entry.url || entry.href || entry.link || entry.permalink);
          let title = safeString(entry.title || entry.name || entry.label || entry.text || entry.source);
          if (!title && url) {
            title = url;
          }
          if (!title && !url) {
            return null;
          }
          return { title, url };
        }
        return null;
      })
      .filter(Boolean);
  }

  function normalizeJsonAuthors(value) {
    if (!value) return [];
    const list = Array.isArray(value) ? value : [value];
    return list
      .map(author => safeString(author))
      .filter(Boolean);
  }

  function extractGeneratedAtFromJson(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    return normalizeDateInput(
      data.generated_at ||
        data.generatedAt ||
        data.updated_at ||
        data.updatedAt ||
        data.generated_at_iso ||
        data.generatedISO ||
        null
    );
  }

  function normalizeDateInput(value) {
    if (!value) return null;
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) return null;
      return value.toISOString();
    }
    if (typeof value === 'number') {
      const dateFromNumber = new Date(value);
      if (!Number.isFinite(dateFromNumber.getTime())) return null;
      return dateFromNumber.toISOString();
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const dateFromString = new Date(trimmed);
      if (!Number.isFinite(dateFromString.getTime())) return null;
      return dateFromString.toISOString();
    }
    return null;
  }

  function safeString(value) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return '';
  }

  function buildCapsuleFromSegment(segment, index) {
    const lines = segment.split(/\n+/).map(line => line.trim()).filter(line => line.length);
    if (!lines.length) return null;

    let inCodeBlock = false;
    let title = '';
    let summary = '';
    let mainIdea = '';
    let createdAt = null;
    let capsuleId = '';
    const content = [];
    const looseText = [];
    const tags = new Set();
    const sources = [];
    const authors = new Set();
    let currentSection = null;

    const pushContent = value => {
      const clean = stripListMarker(value);
      if (clean) content.push(clean);
    };

    const pushAuthor = value => {
      const clean = stripListMarker(value);
      if (clean) {
        clean.split(/[,;]+/).map(name => name.trim()).filter(Boolean).forEach(name => authors.add(name));
      }
    };

    const pushSource = value => {
      const entry = parseSourceEntry(stripListMarker(value));
      if (entry) {
        sources.push(entry);
      }
    };

    lines.forEach(rawLine => {
      if (!rawLine) return;

      if (/^```/.test(rawLine)) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) return;

      const line = rawLine;

      if (/^capsule-id[:\-]?/i.test(line)) {
        capsuleId = extractValueAfterColon(line);
        currentSection = null;
        return;
      }

      if (/^created-at[:\-]?/i.test(line)) {
        createdAt = extractValueAfterColon(line);
        currentSection = null;
        return;
      }

      if (!title && /^#\s*capsule[:\-]?/i.test(line)) {
        title = line.replace(/^#\s*capsule[:\-]?/i, '').trim();
        currentSection = null;
        return;
      }

      if (!title && /^title[:\-]?/i.test(line)) {
        title = extractValueAfterColon(line);
        currentSection = null;
        return;
      }

      if (!summary && /^summary[:\-]?/i.test(line)) {
        summary = extractValueAfterColon(line);
        currentSection = null;
        return;
      }

      if (!mainIdea && /^(main[\s_-]?idea|idea\s+central)[:\-]?/i.test(line)) {
        mainIdea = extractValueAfterColon(line);
        currentSection = null;
        return;
      }

      if (/^authors?[:\-]?/i.test(line)) {
        const value = extractValueAfterColon(line);
        if (value) {
          pushAuthor(value);
          currentSection = null;
        } else {
          currentSection = 'authors';
        }
        return;
      }

      if (/^tags?[:\-]?/i.test(line) || /^etiquetas?[:\-]?/i.test(line)) {
        const list = extractValueAfterColon(line) || '';
        list.split(/[,;]+/).map(tag => tag.trim()).filter(Boolean).forEach(tag => tags.add(tag));
        currentSection = null;
        return;
      }

      if (/^sources?[:\-]?/i.test(line) || /^source[:\-]?/i.test(line)) {
        const value = extractValueAfterColon(line);
        if (value) {
          parseSourceList(value).forEach(entry => sources.push(entry));
          currentSection = null;
        } else {
          currentSection = 'sources';
        }
        return;
      }

      if (/^(body|contenido|content|highlights?)[:\-]?/i.test(line)) {
        const inline = extractValueAfterColon(line);
        if (inline) pushContent(inline);
        currentSection = 'content';
        return;
      }

      if (currentSection === 'authors') {
        pushAuthor(line);
        return;
      }

      if (currentSection === 'sources') {
        pushSource(line);
        return;
      }

      if (currentSection === 'content') {
        pushContent(line);
        return;
      }

      if (/^[*\-]\s+https?:\/\//i.test(line)) {
        pushSource(line);
        return;
      }

      if (/^[*\-]\s+/i.test(line)) {
        pushContent(line);
        return;
      }

      looseText.push(line);
    });

    if (!title && looseText.length) {
      title = looseText.shift();
    }
    if (!title) {
      title = `Cápsula ${index + 1}`;
    }

    if (!summary && mainIdea) {
      summary = mainIdea;
    }
    if (!summary && content.length) {
      summary = content[0];
    }
    if (!summary && looseText.length) {
      summary = looseText[0];
    }
    if (!summary) {
      summary = title;
    }

    if (!mainIdea && summary) {
      mainIdea = summary;
    }

    if (!content.length && looseText.length) {
      looseText.forEach(pushContent);
    }

    if (!sources.length) {
      looseText.filter(text => /https?:\/\//i.test(text)).forEach(pushSource);
    }

    const body = content.length ? content : [summary];
    const authorsList = Array.from(authors);
    const tagsList = Array.from(tags);
    const normalizedTitle = normalizeText(title);
    const id = capsuleId || `capsule-${index + 1}-${normalizedTitle || Math.random().toString(36).slice(2, 8)}`;
    const searchTokens = Array.from(new Set([
      normalizedTitle,
      normalizeText(summary),
      normalizeText(mainIdea),
      ...body.map(normalizeText),
      ...tagsList.map(normalizeText),
      ...authorsList.map(normalizeText),
      ...sources.map(source => normalizeText(source.title || source.url))
    ])).filter(Boolean);

    return {
      id,
      title,
      summary,
      mainIdea,
      body,
      tags: tagsList,
      sources,
      authors: authorsList,
      createdISO: createdAt,
      createdAt: createdAt,
      normalizedTitle,
      searchTokens
    };
  }

  function extractValueAfterColon(line) {
    if (!line) return '';
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      return line.slice(colonIndex + 1).trim();
    }
    const dashMatch = line.match(/^[^\-]+-\s*(.+)$/);
    return dashMatch ? dashMatch[1].trim() : '';
  }

  function stripListMarker(value) {
    return String(value || '')
      .replace(/^[-*+]\s+/, '')
      .trim();
  }

  function parseSourceEntry(text) {
    if (!text) return null;
    const linkMatch = /\[([^\]]+)\]\((https?:[^)]+)\)/.exec(text);
    if (linkMatch) {
      return { title: linkMatch[1].trim(), url: linkMatch[2].trim() };
    }
    const parts = text.split('|').map(part => part.trim()).filter(Boolean);
    if (parts.length === 2) {
      return { title: parts[0], url: parts[1] };
    }
    if (parts.length > 2) {
      const title = parts.slice(0, -1).join(' | ');
      const urlCandidate = parts[parts.length - 1];
      if (/^https?:\/\//i.test(urlCandidate)) {
        return { title, url: urlCandidate };
      }
    }
    if (/^https?:\/\//i.test(text)) {
      return { title: text, url: text };
    }
    if (text) {
      return { title: text, url: '' };
    }
    return null;
  }

  function parseSourceList(value) {
    return value
      .split(/[,;]+/)
      .map(entry => parseSourceEntry(entry.trim()))
      .filter(Boolean);
  }

  function isCapsuleSnapshot(name) {
    if (!name) return false;
    return /^doc-.*\.(txt|md)$/i.test(name) ||
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{3}Z-.*\.md$/i.test(name);
  }

  function extractTimestampFromName(name) {
    if (!name) return null;
    const docMatch = /^doc-(.+)\.(txt|md)$/i.exec(name);
    if (docMatch) {
      const raw = docMatch[1];
      const isoMatch = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{3})Z$/i.exec(raw);
      if (isoMatch) {
        const [, date, hh, mm, ss, ms] = isoMatch;
        const iso = `${date}T${hh}:${mm}:${ss}.${ms}Z`;
        const parsed = new Date(iso);
        if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
      }
    }

    const mdMatch = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{3})Z/i.exec(name);
    if (mdMatch) {
      const [, date, hh, mm, ss, ms] = mdMatch;
      const iso = `${date}T${hh}:${mm}:${ss}.${ms}Z`;
      const parsed = new Date(iso);
      if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
    }

    return null;
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
})();
