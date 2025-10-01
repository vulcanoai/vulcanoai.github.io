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
    generatedAt: null
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
      const { text, updatedAt } = await fetchLatestDocument();
      const capsules = parseDocumentToCapsules(text);

      state.capsules = capsules;
      state.generatedAt = updatedAt || new Date().toISOString();
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
      const updatedAt = lastModified ? new Date(lastModified).toISOString() : new Date().toISOString();
      return { text, updatedAt };
    } catch (initialError) {
      return await fetchFromGitHubDirectory(initialError);
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
