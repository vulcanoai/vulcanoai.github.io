/*
  capsules-archive.js — Archive page for browsing capsules collection
*/
(() => {
  const config = window.AILatamConfig || {};
  const api = config.api || {};
  const docUrl = api.capsulesDocUrl || '/data/capsules/doc-latest.txt';

  const state = {
    loading: true,
    error: null,
    capsules: [],
    generatedAt: null,
    source: null
  };

  const elements = {
    grid: document.getElementById('capsules-grid'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    updatedLabel: document.getElementById('archive-updated')
  };

  loadCapsules();

  async function loadCapsules() {
    if (elements.updatedLabel) elements.updatedLabel.textContent = 'cargando…';

    try {
      const { text, updatedAt, source } = await fetchLatestDocument();
      const capsules = parseDocumentToCapsules(text) || [];

      state.capsules = capsules;
      const payloadGeneratedAt = normalizeDateInput(capsules.generatedAt);
      const fallbackUpdatedAt = normalizeDateInput(updatedAt);
      state.generatedAt = payloadGeneratedAt || fallbackUpdatedAt || new Date().toISOString();
      state.source = source || capsules.source || null;
      state.loading = false;

      if (elements.updatedLabel) {
        elements.updatedLabel.textContent = formatTimestamp(state.generatedAt);
      }

      renderCapsules(capsules);
    } catch (err) {
      state.loading = false;
      state.error = 'No se pudieron cargar las cápsulas';

      if (elements.updatedLabel) elements.updatedLabel.textContent = 'sin conexión';

      console.error('capsules-archive: error loading capsules', err);
      showEmptyState();
    }
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
      try {
        const fallback = await fetchFromGitHubDirectory(initialError);
        return { ...fallback, source: 'github-directory' };
      } catch (githubError) {
        const localJson = await tryFetchLocalJsonSnapshot(initialError, githubError);
        if (localJson) {
          return localJson;
        }
        throw githubError;
      }
    }
  }

  async function tryFetchLocalJsonSnapshot(initialError, secondaryError) {
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
      console.warn('capsules-archive: fallback a capsules.json falló', err, initialError, secondaryError);
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
      throw originalError || new Error('No capsule snapshots found');
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
      throw new Error(`Download failed: HTTP ${textRes.status}`);
    }

    const text = await textRes.text();
    const updatedAt = latest.generatedAt || extractTimestampFromName(latest.name) || new Date().toISOString();
    return { text, updatedAt };
  }

  function renderCapsules(capsules) {
    if (elements.loadingState) elements.loadingState.style.display = 'none';

    if (!capsules || !capsules.length) {
      showEmptyState();
      return;
    }

    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.grid) elements.grid.innerHTML = '';

    capsules.forEach((capsule, index) => {
      const card = createCapsuleCard(capsule, index);
      if (elements.grid) elements.grid.appendChild(card);
    });
  }

  function createCapsuleCard(capsule, index) {
    const card = document.createElement('article');
    card.className = 'capsule-card';
    card.setAttribute('role', 'listitem');

    const header = document.createElement('div');
    header.className = 'capsule-card-header';

    const title = document.createElement('h2');
    title.className = 'capsule-card-title';
    title.textContent = capsule.title || `Cápsula ${index + 1}`;

    const summary = document.createElement('p');
    summary.className = 'capsule-card-summary';
    summary.textContent = capsule.summary || capsule.mainIdea || '';

    header.appendChild(title);
    header.appendChild(summary);

    const meta = document.createElement('div');
    meta.className = 'capsule-card-meta';

    if (capsule.createdAt || capsule.createdISO) {
      const timestamp = document.createElement('span');
      timestamp.className = 'capsule-card-timestamp';
      const date = new Date(capsule.createdAt || capsule.createdISO);
      timestamp.textContent = formatTimestamp(date);
      meta.appendChild(timestamp);
    }

    if (capsule.tags && capsule.tags.length) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'capsule-card-tags';
      capsule.tags.slice(0, 3).forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'capsule-card-tag';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
      });
      meta.appendChild(tagsContainer);
    }

    const actions = document.createElement('div');
    actions.className = 'capsule-card-actions';

    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'capsule-card-action-btn voiceover-btn';
    voiceBtn.type = 'button';
    voiceBtn.title = 'Escuchar cápsula';
    voiceBtn.setAttribute('aria-label', 'Escuchar cápsula');
    voiceBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    voiceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playVoiceover(capsule, voiceBtn);
    });

    const viewBtn = document.createElement('button');
    viewBtn.className = 'capsule-card-action-btn view-btn';
    viewBtn.type = 'button';
    viewBtn.textContent = 'Ver cápsula';
    viewBtn.addEventListener('click', () => {
      if (window.VulcanoHolographicViewer) {
        window.VulcanoHolographicViewer.show(state.capsules, index);
      }
    });

    actions.appendChild(voiceBtn);
    actions.appendChild(viewBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actions);

    return card;
  }

  function playVoiceover(capsule, button) {
    // Cancel any existing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      button.classList.remove('is-playing');
      return;
    }

    const textToRead = buildVoiceoverText(capsule);
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      button.classList.add('is-playing');
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    };

    utterance.onend = () => {
      button.classList.remove('is-playing');
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    };

    utterance.onerror = () => {
      button.classList.remove('is-playing');
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    };

    window.speechSynthesis.speak(utterance);
  }

  function buildVoiceoverText(capsule) {
    const parts = [];

    if (capsule.title) {
      parts.push(capsule.title);
    }

    if (capsule.summary && capsule.summary !== capsule.title) {
      parts.push(capsule.summary);
    }

    if (capsule.body && Array.isArray(capsule.body)) {
      capsule.body.forEach(item => {
        if (item && item !== capsule.summary) {
          parts.push(item);
        }
      });
    }

    return parts.join('. ');
  }

  function showEmptyState() {
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.emptyState) elements.emptyState.style.display = 'block';
    if (elements.grid) elements.grid.innerHTML = '';
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
        console.warn('capsules-archive: no pude interpretar cápsulas JSON', err);
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
      if (entry) sources.push(entry);
    };

    lines.forEach(rawLine => {
      if (!rawLine) return;

      if (/^```/.test(rawLine)) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) return;

      if (/^capsule-id[:\-]?/i.test(rawLine)) {
        capsuleId = extractValueAfterColon(rawLine);
        currentSection = null;
        return;
      }

      if (/^created-at[:\-]?/i.test(rawLine)) {
        createdAt = extractValueAfterColon(rawLine);
        currentSection = null;
        return;
      }

      if (!title && /^#\s*capsule[:\-]?/i.test(rawLine)) {
        title = rawLine.replace(/^#\s*capsule[:\-]?/i, '').trim();
        currentSection = null;
        return;
      }

      if (!title && /^title[:\-]?/i.test(rawLine)) {
        title = extractValueAfterColon(rawLine);
        currentSection = null;
        return;
      }

      if (!summary && /^summary[:\-]?/i.test(rawLine)) {
        summary = extractValueAfterColon(rawLine);
        currentSection = null;
        return;
      }

      if (!mainIdea && /^(main[\s_-]?idea|idea\s+central)[:\-]?/i.test(rawLine)) {
        mainIdea = extractValueAfterColon(rawLine);
        currentSection = null;
        return;
      }

      if (/^authors?[:\-]?/i.test(rawLine)) {
        const value = extractValueAfterColon(rawLine);
        if (value) {
          pushAuthor(value);
          currentSection = null;
        } else {
          currentSection = 'authors';
        }
        return;
      }

      if (/^tags?[:\-]?/i.test(rawLine) || /^etiquetas?[:\-]?/i.test(rawLine)) {
        const list = extractValueAfterColon(rawLine) || '';
        list.split(/[,;]+/).map(tag => tag.trim()).filter(Boolean).forEach(tag => tags.add(tag));
        currentSection = null;
        return;
      }

      if (/^sources?[:\-]?/i.test(rawLine)) {
        const value = extractValueAfterColon(rawLine);
        if (value) {
          parseSourceList(value).forEach(entry => sources.push(entry));
          currentSection = null;
        } else {
          currentSection = 'sources';
        }
        return;
      }

      if (/^(body|contenido|content|highlights?)[:\-]?/i.test(rawLine)) {
        const inline = extractValueAfterColon(rawLine);
        if (inline) pushContent(inline);
        currentSection = 'content';
        return;
      }

      if (currentSection === 'authors') {
        pushAuthor(rawLine);
        return;
      }

      if (currentSection === 'sources') {
        pushSource(rawLine);
        return;
      }

      if (currentSection === 'content') {
        pushContent(rawLine);
        return;
      }

      if (/^[*\-]\s+https?:\/\//i.test(rawLine)) {
        pushSource(rawLine);
        return;
      }

      if (/^[*\-]\s+/i.test(rawLine)) {
        pushContent(rawLine);
        return;
      }

      looseText.push(rawLine);
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
    const id = capsuleId || `capsule-${index + 1}`;

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
      createdAt: createdAt
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

  function formatTimestamp(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Fecha desconocida';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
})();
