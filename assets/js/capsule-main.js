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
      ? files.filter(file => file && /^doc-.*\.txt$/.test(file.name) && file.download_url)
      : [];
    if (!docFiles.length) {
      throw originalError || new Error('No se encontraron snapshots de cápsulas en el repositorio.');
    }
    docFiles.sort((a, b) => b.name.localeCompare(a.name));
    const latest = docFiles[0];
    const textRes = await fetch(latest.download_url, { cache: 'no-store' });
    if (!textRes.ok) {
      throw new Error(`Descarga de snapshot falló: HTTP ${textRes.status}`);
    }
    const text = await textRes.text();
    const updatedAt = extractTimestampFromName(latest.name) || new Date().toISOString();
    return { text, updatedAt };
  }

  function handleUserInput(rawQuery, helpers) {
    const query = (rawQuery || '').trim();
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
    const lines = segment.split(/\n+/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) return null;

    let title = '';
    let summary = '';
    const bodyLines = [];
    const tags = [];
    const sources = [];
    const rest = [];

    lines.forEach(line => {
      if (!title && /^#\s*capsule[:\-]?/i.test(line)) {
        title = line.replace(/^#\s*capsule[:\-]?/i, '').trim();
        return;
      }
      if (!title && /^title[:\-]?/i.test(line)) {
        title = line.replace(/^title[:\-]?/i, '').trim();
        return;
      }
      if (!summary && /^summary[:\-]?/i.test(line)) {
        summary = line.replace(/^summary[:\-]?/i, '').trim();
        return;
      }
      if (/^tags?[:\-]?/i.test(line)) {
        const values = line.replace(/^tags?[:\-]?/i, '').split(/[,;]+/).map(tag => tag.trim()).filter(Boolean);
        tags.push(...values);
        return;
      }
      if (/^sources?[:\-]?/i.test(line)) {
        const entries = line.replace(/^sources?[:\-]?/i, '').split(/[,;]+/).map(entry => entry.trim()).filter(Boolean);
        entries.forEach(entry => {
          sources.push({ title: entry, url: entry.startsWith('http') ? entry : '' });
        });
        return;
      }
      rest.push(line);
    });

    if (!title && rest.length) {
      title = rest.shift();
    }
    if (!title) {
      title = `Cápsula ${index + 1}`;
    }

    if (!summary && rest.length) {
      summary = rest[0];
    }
    if (!summary) {
      summary = title;
    }

    const body = rest.length ? rest : [summary];

    const normalizedTitle = normalizeText(title);
    const id = `capsule-${index + 1}-${normalizedTitle || Math.random().toString(36).slice(2, 8)}`;
    const searchTokens = Array.from(new Set([
      normalizedTitle,
      normalizeText(summary),
      ...body.map(normalizeText),
      ...tags.map(normalizeText)
    ])).filter(Boolean);

    return {
      id,
      title,
      summary,
      body,
      tags,
      sources,
      createdISO: null,
      createdAt: null,
      normalizedTitle,
      searchTokens
    };
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

  function extractTimestampFromName(name) {
    const match = /^doc-(.+)\.txt$/.exec(name || '');
    if (!match) return null;
    const raw = match[1];
    const isoMatch = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2})-([0-9]{2})-([0-9]{2})-([0-9]{3})Z$/.exec(raw);
    if (!isoMatch) return null;
    const [, date, hh, mm, ss, ms] = isoMatch;
    const iso = `${date}T${hh}:${mm}:${ss}.${ms}Z`;
    const parsed = new Date(iso);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
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
})();
