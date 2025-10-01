/*
  capsule-main.js — Main page implementation using unified chat component
*/
(() => {
  const config = window.AILatamConfig || {};
  const api = config.api || {};
  const docUrl = api.capsulesDocUrl || '/data/capsules/doc-latest.txt';

  const chatInterface = window.VulcanoChatComponent.create('chat-interface', {
    hasHorizontalChips: true,
    placeholder: "Escribe el título de una cápsula o elige una de la lista…",
    initialMessage: `
      <article class="capsule-message from-agent">
        <span class="capsule-sender">Vulcano</span>
        <p>Hola. Tengo cápsulas listas para que pases menos tiempo frente a la pantalla.</p>
        <p>Toca un título en la parte inferior o escribe el nombre para repasar el contenido.</p>
      </article>
    `,
    defaultChips: [],
    onSubmit: handleUserInput
  });

  if (!chatInterface) {
    console.error('capsule-main: no se pudo inicializar la interfaz de chat');
    return;
  }

  const updatedLabel = document.getElementById('capsule-updated');
  const state = chatInterface.state;
  state.loading = true;
  state.error = null;
  state.capsules = [];
  state.capsuleIndex = new Map();
  state.generatedAt = null;
  state.rawDocument = '';

  loadCapsules();
  setupArchiveToggle();

  async function loadCapsules() {
    if (updatedLabel) updatedLabel.textContent = 'cargando…';
    try {
      const { text, updatedAt, source } = await fetchLatestDocument();
      state.rawDocument = text;
      state.source = source;

      const capsules = parseDocumentToCapsules(text);
      state.capsules = capsules;
      state.capsuleIndex = buildIndex(capsules);
      state.loading = false;
      state.generatedAt = updatedAt || new Date().toISOString();

      if (updatedLabel) {
        updatedLabel.textContent = formatTimestamp(state.generatedAt);
      }

      const chipList = capsules.map(cap => ({ prompt: cap.title, label: cap.title }));
      state.defaultChips = chipList;
      chatInterface.updateChips(chipList);

      if (!capsules.length) {
        appendSystemNote([
          'Todavía no hay cápsulas registradas.',
          'Asegúrate de que el documento tiene contenido separado por "---".'
        ]);
      }
    } catch (err) {
      state.loading = false;
      state.error = 'No pude cargar las cápsulas en este momento.';
      if (updatedLabel) updatedLabel.textContent = 'sin conexión';
      console.error('capsule-main: error al cargar documento', err);
      appendSystemNote([
        'No pude obtener el documento con las cápsulas.',
        'Verifica que el workflow esté publicando los archivos y que tengas conexión.'
      ]);
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

  function handleUserInput(rawQuery, helpers) {
    const query = (rawQuery || '').trim();

    // Check if this is a capsule title (from chip click)
    const matchingCapsule = findCapsule(query);

    if (matchingCapsule && window.VulcanoHolographicViewer) {
      // Show holographic viewer for capsule
      const capsuleIndex = state.capsules.findIndex(cap => cap.id === matchingCapsule.id);
      window.VulcanoHolographicViewer.show(state.capsules, capsuleIndex);
      return;
    }

    // Fallback to chat response for manual queries
    const placeholder = helpers.appendAgent(['Buscando cápsula…'], {});
    const response = buildCapsuleResponse(query);
    updateAgent(placeholder, response.paragraphs, { sources: response.sources });
  }

  function buildCapsuleResponse(query) {
    const clean = query.trim();
    const mention = clean ? `"${shorten(clean)}"` : 'esa cápsula';

    if (state.loading) {
      return {
        paragraphs: ['Sigo cargando el documento. Intenta de nuevo en unos segundos.'],
        sources: []
      };
    }

    if (state.error) {
      return {
        paragraphs: [state.error, 'Puedes revisar el documento y recargar la página.'],
        sources: []
      };
    }

    if (!state.capsules.length) {
      return {
        paragraphs: ['Aún no hay cápsulas guardadas en el documento.'],
        sources: []
      };
    }

    const match = findCapsule(clean);
    if (!match) {
      const suggestions = state.capsules.slice(0, 4).map(cap => `• ${cap.title}`);
      const followUp = suggestions.length
        ? ['Puedes elegir una de estas cápsulas:', ...suggestions]
        : ['Puedes escribir una cápsula nueva y actualizar el documento.'];
      return {
        paragraphs: [`No encontré ${mention}.`, ...followUp],
        sources: []
      };
    }

    const paragraphs = [];
    if (match.summary && match.summary !== match.body[0]) {
      paragraphs.push(match.summary);
    }
    match.body.forEach(line => {
      if (line) paragraphs.push(line);
    });
    if (match.tags.length) {
      paragraphs.push(`Etiquetas: ${match.tags.join(', ')}.`);
    }
    if (state.generatedAt) {
      paragraphs.push(`Última sincronización: ${formatTimestamp(state.generatedAt)}.`);
    }

    return {
      paragraphs,
      sources: match.sources
    };
  }

  function findCapsule(query) {
    if (!query) return null;
    const normalized = normalizeText(query);
    if (!normalized) return null;

    const exact = state.capsuleIndex.get(normalized);
    if (exact) return exact;

    const partial = state.capsules.find(cap => cap.searchTokens.some(token => token.includes(normalized) || normalized.includes(token)));
    return partial || null;
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

      if (/^sources?[:\-]?/i.test(line)) {
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
        // bullet line with URL but without explicit section — treat as source
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

  function buildIndex(capsules) {
    const index = new Map();
    capsules.forEach(cap => {
      if (cap.normalizedTitle) index.set(cap.normalizedTitle, cap);
      cap.searchTokens.forEach(token => {
        if (token && !index.has(token)) {
          index.set(token, cap);
        }
      });
    });
    return index;
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

  function appendSystemNote(lines) {
    const stream = chatInterface?.elements?.stream;
    if (!stream) return;
    const article = document.createElement('article');
    article.className = 'capsule-message from-agent';
    const sender = document.createElement('span');
    sender.className = 'capsule-sender';
    sender.textContent = 'Vulcano';
    article.appendChild(sender);
    lines.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      article.appendChild(p);
    });
    stream.appendChild(article);
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function shorten(value, max = 48) {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
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

  function setupArchiveToggle() {
    const archiveToggle = document.getElementById('archive-toggle');
    if (!archiveToggle) return;

    archiveToggle.addEventListener('click', () => {
      if (!state.capsules.length) {
        appendSystemNote([
          'No hay cápsulas disponibles en el archivo.',
          'Espera a que se carguen las cápsulas para acceder al archivo.'
        ]);
        return;
      }

      // Show holographic viewer with all capsules starting from the first one
      if (window.VulcanoHolographicViewer) {
        window.VulcanoHolographicViewer.show(state.capsules, 0);
      }
    });
  }
})();
