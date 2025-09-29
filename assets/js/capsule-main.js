/*
  capsule-main.js — Main page implementation using unified chat component
*/
(() => {
  const config = window.AILatamConfig || {};
  const feedUrl = (config.api && config.api.feedUrl) || '/data/feed-latest.json';

  // Initialize the unified chat component with main page configuration
  const chatInterface = window.VulcanoChatComponent.create('chat-interface', {
    hasVoiceOrb: true,
    hasHorizontalChips: true,
    placeholder: "O escribe tu pregunta aquí...",
    voiceHint: "Toca para hablar",
    initialMessage: `
      <article class="capsule-message from-agent">
        <span class="capsule-sender">Vulcano</span>
        <p>Hola. Estoy listo para contarte qué ocurre con la IA en la región. ¿En qué quieres enfocarnos?</p>
      </article>
    `,
    onSubmit: handleUserInput
  });

  if (!chatInterface) {
    console.error('Failed to initialize chat interface');
    return;
  }

  const updatedLabel = document.getElementById('capsule-updated');

  // Load feed data on startup
  loadFeed();

  // Main response handler
  function handleUserInput(query, { appendAgent, updateChips, state }) {
    const placeholder = appendAgent(['Dame un instante…'], {});
    setTimeout(() => {
      const response = buildResponse(query);
      updateAgent(placeholder, response.paragraphs, { sources: response.sources });
      updateChips(response.suggestions);
    }, 260);
  }

  async function loadFeed() {
    if (updatedLabel) updatedLabel.textContent = 'cargando…';
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawItems = Array.isArray(data) ? data : (data.articles || data.items || []);
      chatInterface.state.generatedAt = data.generated_at || null;
      chatInterface.state.articles = normalizeArticles(rawItems);
      chatInterface.state.loading = false;
      const latest = chatInterface.state.articles[0];
      if (updatedLabel) {
        if (chatInterface.state.generatedAt) {
          updatedLabel.textContent = formatTimestamp(chatInterface.state.generatedAt);
        } else if (latest) {
          updatedLabel.textContent = formatTimestamp(latest.publishedAt);
        } else {
          updatedLabel.textContent = 'sin datos recientes';
        }
      }
      if (chatInterface.state.generatedAt) {
        const ageHours = (Date.now() - new Date(chatInterface.state.generatedAt).getTime()) / 36e5;
        if (ageHours >= 24) {
          chatInterface.state.stale = true;
          chatInterface.state.statusNote = `Nota: el último corte confirmado es del ${formatTimestamp(chatInterface.state.generatedAt)}.`;
        }
      }
      if (chatInterface.state.articles.length === 0) {
        chatInterface.state.statusNote = 'Aún no hay historias publicadas en el corte más reciente.';
      }
    } catch (err) {
      chatInterface.state.loading = false;
      chatInterface.state.error = 'No pude cargar el feed en este momento.';
      if (updatedLabel) updatedLabel.textContent = 'sin conexión';
      console.error('capsule: no se pudo cargar el feed', err);
    }
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

  function buildResponse(query) {
    const clean = query.trim();
    const intro = `Gracias por preguntar sobre "${shorten(clean)}". Aquí lo esencial:`;

    if (chatInterface.state.loading) {
      return {
        paragraphs: [intro, 'Sigo cargando el feed de hoy. Dame unos segundos y vuelve a intentarlo.'],
        sources: [],
        suggestions: chatInterface.state.defaultChips
      };
    }
    if (chatInterface.state.error) {
      return {
        paragraphs: [intro, chatInterface.state.error, 'Puedes recargar la página o intentar más tarde.'],
        sources: [],
        suggestions: chatInterface.state.defaultChips
      };
    }
    if (chatInterface.state.articles.length === 0) {
      return {
        paragraphs: [intro, 'No tengo historias nuevas confirmadas en este corte.', 'Te avisaré apenas lleguen señales confiables.'],
        sources: [],
        suggestions: chatInterface.state.defaultChips
      };
    }

    const matches = rankArticles(clean, chatInterface.state.articles);
    const sources = matches.map(item => ({
      title: item.title,
      url: item.url,
      source: item.source
    }));

    const lines = matches.map(article => formatLine(article));
    while (lines.length < 2 && chatInterface.state.articles.length) {
      const fallback = chatInterface.state.articles[lines.length];
      if (!fallback) break;
      if (!matches.includes(fallback)) {
        lines.push(formatLine(fallback));
        sources.push({ title: fallback.title, url: fallback.url, source: fallback.source });
      }
    }

    const paragraphs = [intro, ...lines.slice(0, 3)];
    if (chatInterface.state.stale || chatInterface.state.statusNote) {
      paragraphs.push(chatInterface.state.statusNote);
    } else {
      paragraphs.push('Si quieres bajar a más detalle, dime qué país o tema seguimos.');
    }

    return {
      paragraphs: paragraphs.slice(0, 6),
      sources,
      suggestions: buildSuggestions(matches)
    };
  }

  function rankArticles(query, articles) {
    const normalizedQuery = normalizeText(query);
    const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);
    const focusCountry = detectCountry(normalizedQuery);
    const focusTopic = detectTopic(normalizedQuery);

    const scored = articles.map(article => {
      let score = 0;
      tokens.forEach(token => {
        if (article.normalized.title.includes(token)) score += 4;
        if (article.normalized.summary.includes(token)) score += 2;
        if (article.normalized.source.includes(token)) score += 1;
        if (article.normalized.topics.some(t => t.includes(token))) score += 3;
      });
      if (focusCountry && article.normalized.country === focusCountry.key) score += 6;
      if (focusTopic && article.normalized.topics.includes(focusTopic)) score += 4;
      if (article.normalized.country === 'regional' && !focusCountry) score += 1;
      const ageBoost = (Date.now() - new Date(article.publishedAt).getTime()) / 36e5;
      score += Math.max(0, 12 - ageBoost); // favorecer lo reciente
      return { article, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
    });
    const top = scored.filter(item => item.score > 0).slice(0, 3).map(item => item.article);
    if (top.length) return top;
    return articles.slice(0, 3);
  }

  function buildSuggestions(matches) {
    if (!matches || !matches.length) return chatInterface.state.defaultChips;
    const suggestions = [];
    const first = matches[0];
    if (first.country && first.country !== 'Regional') {
      suggestions.push({
        prompt: `Dame más contexto de IA en ${first.country}`,
        label: `Más en ${first.country}`
      });
    }
    if (first.topics && first.topics.length) {
      const topic = first.topics[0];
      suggestions.push({
        prompt: `Actualízame sobre ${topic} en América Latina`,
        label: topic
      });
    }
    return suggestions.slice(0, 2);
  }

  function formatLine(article) {
    const country = article.country || 'Regional';
    const summary = article.summary ? shorten(article.summary, 140) : article.title;
    const hook = explainWhy(article);
    return `${country}: ${summary}${hook ? ` ${hook}` : ''}`;
  }

  function explainWhy(article) {
    const topicHints = {
      regulacion: 'Impacta la agenda regulatoria.',
      gobierno: 'Marca postura gubernamental.',
      inversion: 'Mueve capital en el ecosistema.',
      startups: 'Abre oportunidades para startups.',
      educacion: 'Afecta talento y formación.',
      salud: 'Tiene implicaciones en salud pública.',
      justicia: 'Toca el sistema de justicia.',
      industria: 'Reconfigura la productividad industrial.'
    };
    for (const topic of article.normalized.topics) {
      const hint = topicHints[topic];
      if (hint) return hint;
    }
    return '';
  }

  function normalizeArticles(items) {
    return items
      .map(item => {
        const title = safeText(item.title || item.titulo || 'Sin título');
        const summary = safeText(item.summary || item.descripcion || item.resumen || '');
        const url = safeUrl(item.url || item.link || '');
        const source = safeText(item.source || item.fuente || 'Fuente no identificada');
        const country = safeText(item.country || item.pais || 'Regional');
        const topics = Array.isArray(item.topics || item.temas) ? (item.topics || item.temas).map(safeText).filter(Boolean) : [];
        const publishedAt = item.published_at || item.fecha || new Date().toISOString();
        return {
          id: item.id || url || title,
          title,
          summary,
          url,
          source,
          country,
          topics,
          publishedAt,
          normalized: {
            title: normalizeText(title),
            summary: normalizeText(summary),
            source: normalizeText(source),
            country: normalizeText(country),
            topics: topics.map(t => normalizeText(t))
          }
        };
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  function detectCountry(text) {
    const dictionary = [
      { key: 'mexico', tokens: ['mexico', 'méxico', 'mx'] },
      { key: 'colombia', tokens: ['colombia', 'col', 'co'] },
      { key: 'argentina', tokens: ['argentina', 'ar'] },
      { key: 'brasil', tokens: ['brasil', 'brazil', 'br'] },
      { key: 'chile', tokens: ['chile', 'cl'] },
      { key: 'peru', tokens: ['peru', 'perú', 'pe'] },
      { key: 'uruguay', tokens: ['uruguay', 'uy'] },
      { key: 'ecuador', tokens: ['ecuador', 'ec'] },
      { key: 'bolivia', tokens: ['bolivia', 'bo'] },
      { key: 'paraguay', tokens: ['paraguay', 'py'] },
      { key: 'panama', tokens: ['panama', 'panamá', 'pa'] },
      { key: 'dominicana', tokens: ['república dominicana', 'dominicana', 'rd'] },
      { key: 'regional', tokens: ['latam', 'latinoamerica', 'latinoamérica', 'regional'] }
    ];
    for (const entry of dictionary) {
      if (entry.tokens.some(token => text.includes(token))) return entry;
    }
    return null;
  }

  function detectTopic(text) {
    const dictionary = {
      regulacion: ['regulacion', 'regulación', 'ley', 'norma', 'politica', 'política', 'marco'],
      inversion: ['inversion', 'inversión', 'capital', 'financiacion', 'financiación'],
      startups: ['startup', 'emprend'],
      gobierno: ['gobierno', 'ministerio', 'publico', 'público', 'senado'],
      educacion: ['educacion', 'educación', 'universidad', 'colegio'],
      salud: ['salud', 'hospital', 'clínica', 'clinica'],
      justicia: ['justicia', 'corte', 'tribunal'],
      industria: ['industria', 'manufactura', 'produccion', 'producción'],
      trabajo: ['trabajo', 'empleo', 'laboral']
    };
    for (const key in dictionary) {
      if (dictionary[key].some(token => text.includes(token))) return key;
    }
    return null;
  }

  function shorten(str, max = 100) {
    const clean = safeText(str);
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1)}…`;
  }

  function safeText(value) {
    return (value || '').toString().trim();
  }

  function safeUrl(value) {
    const text = safeText(value);
    if (!text) return '';
    if (text.startsWith('http') || text.startsWith('/')) return text;
    return `https://${text}`;
  }

  function normalizeText(value) {
    return safeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatTimestamp(iso) {
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return 'fecha no disponible';
      return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch (_) {
      return 'fecha no disponible';
    }
  }
})();