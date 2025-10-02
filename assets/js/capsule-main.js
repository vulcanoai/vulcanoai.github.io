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
    voiceButtons: new Map()
  };

  const voiceState = {
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    activeId: null,
    utterance: null
  };

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
    loadCapsules();
    setupPlayLatest();
    window.addEventListener('beforeunload', cancelVoicePlayback, { once: true });
  }

  async function loadCapsules() {
    setLoading(true);
    try {
      const { text, updatedAt, source } = await fetchLatestDocument();
      const capsules = parseDocumentToCapsules(text);
      enhanceCapsules(capsules);
      state.capsules = capsules;
      state.filteredCapsules = applyFilterToCapsules(state.activeTag, capsules);
      state.generatedAt = updatedAt || new Date().toISOString();
      state.source = source;
      state.error = null;
      buildTagIndex(capsules);
      renderTagFilter();
      renderCapsules();
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
    if (value) {
      renderCapsules();
    }
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
        chip.addEventListener('click', () => {
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
      voiceButton.addEventListener('click', () => toggleCapsuleVoice(capsule));
    }
    actions.appendChild(voiceButton);
    state.voiceButtons.set(capsule.id, voiceButton);

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
      detailButton.addEventListener('click', () => {
        window.VulcanoHolographicViewer.show(state.capsules, state.capsules.findIndex(cap => cap.id === capsule.id));
      });
      actions.appendChild(detailButton);
    }

    footer.appendChild(actions);
    article.appendChild(footer);

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
    utterance.rate = 1;
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

  async function fetchLatestDocument() {
    try {
      const res = await fetch(docUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const lastModified = res.headers.get('last-modified');
      const updatedAt = lastModified ? new Date(lastModified).toISOString() : new Date().toISOString();
      return { text, updatedAt, source: 'doc-latest' };
    } catch (initialError) {
      const fallback = await fetchFromGitHubDirectory(initialError);
      return { ...fallback, source: 'github-directory' };
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
    const normalized = String(text || '').replace(/\r\n/g, '\n');
    const segments = normalized.split(/\n-{3,}\n/g).map(seg => seg.trim()).filter(Boolean);
    const blocks = segments.length ? segments : (normalized.trim() ? [normalized.trim()] : []);
    const orderedBlocks = blocks.slice().reverse();

    return orderedBlocks
      .map((segment, index) => buildCapsuleFromSegment(segment, index))
      .filter(Boolean);
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
