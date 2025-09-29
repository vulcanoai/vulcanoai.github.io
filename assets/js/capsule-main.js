/*
  capsule-main.js — Main page implementation using unified chat component
*/
(() => {
  const config = window.AILatamConfig || {};
  const api = config.api || {};
  const capsulesUrl = api.capsulesUrl || '/data/capsules.json';

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

  loadCapsules();

  async function loadCapsules() {
    if (updatedLabel) updatedLabel.textContent = 'cargando…';
    try {
      const res = await fetch(capsulesUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.capsules || []);
      const normalized = normalizeCapsules(raw);
      normalized.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      state.capsules = normalized;
      state.capsuleIndex = buildIndex(normalized);
      state.loading = false;
      state.generatedAt = data.generated_at || (normalized[0]?.createdISO ?? null);

      if (updatedLabel) {
        if (state.generatedAt) {
          updatedLabel.textContent = formatTimestamp(state.generatedAt);
        } else if (normalized[0]) {
          updatedLabel.textContent = formatTimestamp(normalized[0].createdISO);
        } else {
          updatedLabel.textContent = 'sin cápsulas registradas';
        }
      }

      const chipList = normalized.map(cap => ({ prompt: cap.title, label: cap.title }));
      state.defaultChips = chipList;
      chatInterface.updateChips(chipList);

      if (!normalized.length) {
        appendSystemNote([
          'Todavía no hay cápsulas almacenadas.',
          'Añade nuevas cápsulas en tu base local y actualiza la página para verlas aquí.'
        ]);
      }
    } catch (err) {
      state.loading = false;
      state.error = 'No pude cargar las cápsulas locales.';
      if (updatedLabel) updatedLabel.textContent = 'sin conexión';
      console.error('capsule-main: error al cargar cápsulas', err);
      appendSystemNote([
        'No pude conectar con tu base de cápsulas.',
        'Verifica el archivo /data/capsules.json o vuelve a intentar más tarde.'
      ]);
    }
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
        paragraphs: [`Sigo cargando la biblioteca local. Intenta de nuevo en unos segundos.`],
        sources: []
      };
    }

    if (state.error) {
      return {
        paragraphs: [state.error, 'Puedes revisar el archivo de cápsulas y recargar la página.'],
        sources: []
      };
    }

    if (!state.capsules.length) {
      return {
        paragraphs: ['Aún no hay cápsulas guardadas. Agrega una y vuelve a intentarlo.'],
        sources: []
      };
    }

    const match = findCapsule(clean);
    if (!match) {
      const suggestions = state.capsules.slice(0, 4).map(cap => `• ${cap.title}`);
      const followUp = suggestions.length ? ['Puedes elegir una de estas cápsulas:', ...suggestions] : ['Puedes crear una cápsula nueva y actualizar la página.'];
      return {
        paragraphs: [`No encontré ${mention}.`, ...followUp],
        sources: []
      };
    }

    const paragraphs = [];
    if (match.summary) {
      paragraphs.push(match.summary);
    }
    match.body.forEach(line => {
      if (line) paragraphs.push(line);
    });
    if (match.tags.length) {
      paragraphs.push(`Etiquetas: ${match.tags.join(', ')}.`);
    }
    if (state.generatedAt) {
      paragraphs.push(`Última actualización de la biblioteca: ${formatTimestamp(state.generatedAt)}.`);
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

  function normalizeCapsules(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
      const title = String(item.title || '').trim();
      const summary = String(item.summary || '').trim();
      const bodyRaw = Array.isArray(item.body) ? item.body : String(item.body || '').split(/\r?\n\r?\n|\r?\n/);
      const body = bodyRaw.map(line => String(line || '').trim()).filter(Boolean);
      const tags = Array.isArray(item.tags) ? item.tags.map(tag => String(tag || '').trim()).filter(Boolean) : [];
      const sources = Array.isArray(item.sources) ? item.sources.filter(Boolean).map(src => ({
        title: String(src.title || src.name || src.url || '').trim(),
        url: src.url ? String(src.url).trim() : '',
        source: String(src.source || '').trim()
      })) : [];
      const createdISO = item.created_at || item.createdAt || null;
      const createdAt = createdISO ? Date.parse(createdISO) : null;
      const normalizedTitle = normalizeText(title);
      const extraTokens = [normalizeText(item.id || ''), ...tags.map(normalizeText)];
      const searchTokens = [normalizedTitle, ...extraTokens].filter(Boolean);

      return {
        id: item.id || normalizedTitle || `capsule-${Math.random().toString(36).slice(2, 8)}`,
        title: title || 'Cápsula sin título',
        summary,
        body,
        tags,
        sources,
        createdISO,
        createdAt,
        normalizedTitle,
        searchTokens
      };
    }).filter(cap => cap.title && cap.body.length);
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

  function updateAgent(node, paragraphs, meta) {
    if (!node) return;
    Array.from(node.querySelectorAll('p')).forEach(p => p.remove());
    paragraphs.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      node.appendChild(p);
    });
    const toggle = node.querySelector('.capsule-source-toggle');
    const sourcesPanel = node.querySelector('.capsule-sources');
    if (toggle) toggle.remove();
    if (sourcesPanel) sourcesPanel.remove();
    if (meta && Array.isArray(meta.sources) && meta.sources.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'capsule-source-toggle';
      btn.textContent = 'Ver fuentes';
      let expanded = false;
      let panel = null;
      btn.addEventListener('click', () => {
        expanded = !expanded;
        btn.textContent = expanded ? 'Ocultar fuentes' : 'Ver fuentes';
        if (!panel) {
          panel = document.createElement('div');
          panel.className = 'capsule-sources';
          meta.sources.forEach(src => {
            const item = document.createElement('div');
            if (src.url) {
              const link = document.createElement('a');
              link.href = src.url;
              link.target = src.url.startsWith('/') ? '_self' : '_blank';
              link.rel = 'noopener';
              link.textContent = src.title || src.source || src.url;
              item.appendChild(link);
            } else {
              item.textContent = src.title || src.source || '';
            }
            if (src.source) {
              const metaSpan = document.createElement('span');
              metaSpan.textContent = ` · ${src.source}`;
              item.appendChild(metaSpan);
            }
            panel.appendChild(item);
          });
          node.appendChild(panel);
        }
        if (panel) { panel.style.display = expanded ? 'block' : 'none'; }
      });
      node.appendChild(btn);
    }
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
