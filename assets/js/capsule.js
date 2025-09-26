/*
  capsule.js — UI conversacional minimalista para Vulcano AI
  Cumple con la experiencia "Agente como conversación" descrita en el brief.
*/
(() => {
  const config = window.AILatamConfig || {};
  const feedUrl = (config.api && config.api.feedUrl) || '/data/feed-latest.json';

  const stream = document.getElementById('capsule-stream');
  const form = document.getElementById('capsule-form');
  const input = document.getElementById('capsule-input');
  const chipsWrap = document.getElementById('capsule-chips');
  const chipNodes = chipsWrap ? Array.from(chipsWrap.querySelectorAll('.capsule-chip')) : [];
  const voiceBtn = document.getElementById('capsule-voice');
  const audioBtn = document.getElementById('capsule-audio');
  const updatedLabel = document.getElementById('capsule-updated');

  if (!stream || !form || !input) return;

  const defaults = chipNodes.map(node => ({ prompt: node.dataset.prompt || '', label: node.textContent.trim() }));

  const state = {
    loading: true,
    error: null,
    articles: [],
    generatedAt: null,
    stale: false,
    statusNote: '',
    defaultChips: defaults
  };

  const voiceState = {
    recognition: null,
    recognitionSupported: false,
    recognitionActive: false,
    speakingSupported: 'speechSynthesis' in window,
    speakingEnabled: false,
    lastResponse: collectAgentParagraphs(),
    voices: []
  };

  setupVoiceInterfaces();

  loadFeed();

  form.addEventListener('submit', evt => {
    evt.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    appendUser(raw);
    input.value = '';
    input.blur();
    respondTo(raw);
  });

  chipNodes.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = (chip.dataset.prompt || '').trim();
      if (!prompt) return;
      appendUser(prompt);
      respondTo(prompt);
    });
  });

  async function loadFeed(){
    if (updatedLabel) updatedLabel.textContent = 'cargando…';
    try {
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawItems = Array.isArray(data) ? data : (data.articles || data.items || []);
      state.generatedAt = data.generated_at || null;
      state.articles = normalizeArticles(rawItems);
      state.loading = false;
      const latest = state.articles[0];
      if (updatedLabel){
        if (state.generatedAt) {
          updatedLabel.textContent = formatTimestamp(state.generatedAt);
        } else if (latest) {
          updatedLabel.textContent = formatTimestamp(latest.publishedAt);
        } else {
          updatedLabel.textContent = 'sin datos recientes';
        }
      }
      if (state.generatedAt){
        const ageHours = (Date.now() - new Date(state.generatedAt).getTime()) / 36e5;
        if (ageHours >= 24){
          state.stale = true;
          state.statusNote = `Nota: el último corte confirmado es del ${formatTimestamp(state.generatedAt)}.`;
        }
      }
      if (state.articles.length === 0){
        state.statusNote = 'Aún no hay historias publicadas en el corte más reciente.';
      }
    } catch (err){
      state.loading = false;
      state.error = 'No pude cargar el feed en este momento.';
      if (updatedLabel) updatedLabel.textContent = 'sin conexión';
      console.error('capsule: no se pudo cargar el feed', err);
    }
  }

  function appendUser(text){
    if (voiceState.speakingSupported){
      try { window.speechSynthesis.cancel(); } catch (_){ /* noop */ }
    }
    const article = document.createElement('article');
    article.className = 'capsule-message from-user';
    const sender = document.createElement('span');
    sender.className = 'capsule-sender';
    sender.textContent = 'Tú';
    article.appendChild(sender);
    const body = document.createElement('p');
    body.textContent = text;
    article.appendChild(body);
    stream.appendChild(article);
    scrollStream();
  }

  function appendAgent(paragraphs, meta){
    const article = document.createElement('article');
    article.className = 'capsule-message from-agent';
    const sender = document.createElement('span');
    sender.className = 'capsule-sender';
    sender.textContent = 'Vulcano';
    article.appendChild(sender);
    paragraphs.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      article.appendChild(p);
    });

    if (meta && Array.isArray(meta.sources) && meta.sources.length){
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'capsule-source-toggle';
      toggle.textContent = 'Ver fuentes';
      let expanded = false;
      let panel = null;
      toggle.addEventListener('click', () => {
        expanded = !expanded;
        toggle.textContent = expanded ? 'Ocultar fuentes' : 'Ver fuentes';
        if (!panel){
          panel = document.createElement('div');
          panel.className = 'capsule-sources';
          meta.sources.forEach(src => {
            const item = document.createElement('div');
            if (src.url){
              const link = document.createElement('a');
              link.href = src.url;
              link.target = src.url.startsWith('/') ? '_self' : '_blank';
              link.rel = 'noopener';
              link.textContent = src.title || src.source || src.url;
              item.appendChild(link);
            } else {
              item.textContent = src.title || src.source || '';
            }
            if (src.source){
              const metaSpan = document.createElement('span');
              metaSpan.textContent = ` · ${src.source}`;
              item.appendChild(metaSpan);
            }
            panel.appendChild(item);
          });
          article.appendChild(panel);
        }
        if (panel){
          panel.style.display = expanded ? 'block' : 'none';
        }
      });
      article.appendChild(toggle);
    }

    stream.appendChild(article);
    scrollStream();
    return article;
  }

  function updateAgent(node, paragraphs, meta){
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
    if (meta && Array.isArray(meta.sources) && meta.sources.length){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'capsule-source-toggle';
      btn.textContent = 'Ver fuentes';
      let expanded = false;
      let panel = null;
      btn.addEventListener('click', () => {
        expanded = !expanded;
        btn.textContent = expanded ? 'Ocultar fuentes' : 'Ver fuentes';
        if (!panel){
          panel = document.createElement('div');
          panel.className = 'capsule-sources';
          meta.sources.forEach(src => {
            const item = document.createElement('div');
            if (src.url){
              const link = document.createElement('a');
              link.href = src.url;
              link.target = src.url.startsWith('/') ? '_self' : '_blank';
              link.rel = 'noopener';
              link.textContent = src.title || src.source || src.url;
              item.appendChild(link);
            } else {
              item.textContent = src.title || src.source || '';
            }
            if (src.source){
              const metaSpan = document.createElement('span');
              metaSpan.textContent = ` · ${src.source}`;
              item.appendChild(metaSpan);
            }
            panel.appendChild(item);
          });
          node.appendChild(panel);
        }
        if (panel){ panel.style.display = expanded ? 'block' : 'none'; }
      });
      node.appendChild(btn);
    }
  }

  function respondTo(query){
    const placeholder = appendAgent(['Dame un instante…'], {});
    setTimeout(() => {
      const response = buildResponse(query);
      updateAgent(placeholder, response.paragraphs, { sources: response.sources });
      updateChips(response.suggestions);
      announceResponse(response.paragraphs);
    }, 260);
  }

  function buildResponse(query){
    const clean = query.trim();
    const intro = `Gracias por preguntar sobre “${shorten(clean)}”. Aquí lo esencial:`;

    if (state.loading){
      return {
        paragraphs: [intro, 'Sigo cargando el feed de hoy. Dame unos segundos y vuelve a intentarlo.'],
        sources: [],
        suggestions: state.defaultChips
      };
    }
    if (state.error){
      return {
        paragraphs: [intro, state.error, 'Puedes recargar la página o intentar más tarde.'],
        sources: [],
        suggestions: state.defaultChips
      };
    }
    if (state.articles.length === 0){
      return {
        paragraphs: [intro, 'No tengo historias nuevas confirmadas en este corte.', 'Te avisaré apenas lleguen señales confiables.'],
        sources: [],
        suggestions: state.defaultChips
      };
    }

    const matches = rankArticles(clean, state.articles);
    const sources = matches.map(item => ({
      title: item.title,
      url: item.url,
      source: item.source
    }));

    const lines = matches.map(article => formatLine(article));
    while (lines.length < 2 && state.articles.length){
      const fallback = state.articles[lines.length];
      if (!fallback) break;
      if (!matches.includes(fallback)){
        lines.push(formatLine(fallback));
        sources.push({ title: fallback.title, url: fallback.url, source: fallback.source });
      }
    }

    const paragraphs = [intro, ...lines.slice(0,3)];
    if (state.stale || state.statusNote){
      paragraphs.push(state.statusNote);
    } else {
      paragraphs.push('Si quieres bajar a más detalle, dime qué país o tema seguimos.');
    }

    return {
      paragraphs: paragraphs.slice(0,6),
      sources,
      suggestions: buildSuggestions(matches)
    };
  }

  function announceResponse(paragraphs){
    if (!Array.isArray(paragraphs) || !paragraphs.length) return;
    voiceState.lastResponse = paragraphs;
    speakParagraphs(paragraphs);
  }

  function rankArticles(query, articles){
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
    const top = scored.filter(item => item.score > 0).slice(0,3).map(item => item.article);
    if (top.length) return top;
    return articles.slice(0,3);
  }

  function buildSuggestions(matches){
    if (!matches || !matches.length) return state.defaultChips;
    const suggestions = [];
    const first = matches[0];
    if (first.country && first.country !== 'Regional'){
      suggestions.push({
        prompt: `Dame más contexto de IA en ${first.country}`,
        label: `Más en ${first.country}`
      });
    }
    if (first.topics && first.topics.length){
      const topic = first.topics[0];
      suggestions.push({
        prompt: `Actualízame sobre ${topic} en América Latina`,
        label: topic
      });
    }
    return suggestions.slice(0,2);
  }

  function updateChips(suggestions){
    chipNodes.forEach((chip, index) => {
      const fallback = state.defaultChips[index];
      const hint = suggestions && suggestions[index] ? suggestions[index] : fallback;
      if (!hint){
        chip.hidden = true;
        return;
      }
      chip.hidden = false;
      chip.dataset.prompt = hint.prompt;
      chip.textContent = hint.label;
    });
  }

  function formatLine(article){
    const country = article.country || 'Regional';
    const summary = article.summary ? shorten(article.summary, 140) : article.title;
    const hook = explainWhy(article);
    return `${country}: ${summary}${hook ? ` ${hook}` : ''}`;
  }

  function explainWhy(article){
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
    for (const topic of article.normalized.topics){
      const hint = topicHints[topic];
      if (hint) return hint;
    }
    return '';
  }

  function normalizeArticles(items){
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

  function detectCountry(text){
    const dictionary = [
      { key:'mexico', tokens:['mexico','méxico','mx'] },
      { key:'colombia', tokens:['colombia','col','co'] },
      { key:'argentina', tokens:['argentina','ar'] },
      { key:'brasil', tokens:['brasil','brazil','br'] },
      { key:'chile', tokens:['chile','cl'] },
      { key:'peru', tokens:['peru','perú','pe'] },
      { key:'uruguay', tokens:['uruguay','uy'] },
      { key:'ecuador', tokens:['ecuador','ec'] },
      { key:'bolivia', tokens:['bolivia','bo'] },
      { key:'paraguay', tokens:['paraguay','py'] },
      { key:'panama', tokens:['panama','panamá','pa'] },
      { key:'dominicana', tokens:['república dominicana','dominicana','rd'] },
      { key:'regional', tokens:['latam','latinoamerica','latinoamérica','regional'] }
    ];
    for (const entry of dictionary){
      if (entry.tokens.some(token => text.includes(token))) return entry;
    }
    return null;
  }

  function detectTopic(text){
    const dictionary = {
      regulacion: ['regulacion','regulación','ley','norma','politica','política','marco'],
      inversion: ['inversion','inversión','capital','financiacion','financiación'],
      startups: ['startup','emprend'],
      gobierno: ['gobierno','ministerio','publico','público','senado'],
      educacion: ['educacion','educación','universidad','colegio'],
      salud: ['salud','hospital','clínica','clinica'],
      justicia: ['justicia','corte','tribunal'],
      industria: ['industria','manufactura','produccion','producción'],
      trabajo: ['trabajo','empleo','laboral']
    };
    for (const key in dictionary){
      if (dictionary[key].some(token => text.includes(token))) return key;
    }
    return null;
  }

  function shorten(str, max = 100){
    const clean = safeText(str);
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1)}…`;
  }

  function safeText(value){
    return (value || '').toString().trim();
  }

  function safeUrl(value){
    const text = safeText(value);
    if (!text) return '';
    if (text.startsWith('http') || text.startsWith('/')) return text;
    return `https://${text}`;
  }

  function normalizeText(value){
    return safeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatTimestamp(iso){
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return 'fecha no disponible';
      return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch (_){
      return 'fecha no disponible';
    }
  }

  function scrollStream(){
    stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
  }

  function setupVoiceInterfaces(){
    setupRecognition();
    setupSpeech();

    if (voiceBtn){
      if (!voiceState.recognitionSupported){
        voiceBtn.setAttribute('aria-disabled', 'true');
        voiceBtn.disabled = true;
        voiceBtn.title = 'Tu navegador no permite dictado por voz.';
      } else {
        voiceBtn.addEventListener('click', () => {
          if (voiceState.recognitionActive){
            stopRecognition();
          } else {
            startRecognition();
          }
        });
      }
    }

    if (audioBtn){
      if (!voiceState.speakingSupported){
        audioBtn.setAttribute('aria-disabled', 'true');
        audioBtn.disabled = true;
        audioBtn.title = 'Tu navegador no soporta síntesis de voz.';
      } else {
        audioBtn.title = 'Escuchar respuestas';
        audioBtn.addEventListener('click', () => {
          voiceState.speakingEnabled = !voiceState.speakingEnabled;
          audioBtn.setAttribute('aria-pressed', String(voiceState.speakingEnabled));
          audioBtn.title = voiceState.speakingEnabled ? 'Desactivar lectura en voz' : 'Escuchar respuestas';
          if (!voiceState.speakingEnabled){
            window.speechSynthesis.cancel();
          } else {
            speakParagraphs(voiceState.lastResponse);
          }
        });
      }
    }
  }

  function setupRecognition(){
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = 'es-ES';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.addEventListener('result', (evt) => {
      const transcript = Array.from(evt.results)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (!transcript) return;
      voiceState.recognitionActive = false;
      updateVoiceUI();
      input.value = '';
      input.blur();
      appendUser(transcript);
      respondTo(transcript);
    });
    rec.addEventListener('error', (evt) => {
      voiceState.recognitionActive = false;
      updateVoiceUI();
      console.warn('capsule: error en reconocimiento de voz', evt.error);
      if (evt.error === 'not-allowed'){
        const msg = ['No puedo activar el micrófono. Revisa los permisos del navegador.'];
        appendAgent(msg, {});
        announceResponse(msg);
      }
    });
    rec.addEventListener('end', () => {
      voiceState.recognitionActive = false;
      updateVoiceUI();
    });
    voiceState.recognition = rec;
    voiceState.recognitionSupported = true;
  }

  function startRecognition(){
    if (!voiceState.recognition || voiceState.recognitionActive) return;
    try {
      voiceState.recognition.start();
      voiceState.recognitionActive = true;
      updateVoiceUI();
    } catch (err){
      console.error('capsule: no se pudo iniciar reconocimiento', err);
      voiceState.recognitionActive = false;
      updateVoiceUI();
    }
  }

  function stopRecognition(){
    if (!voiceState.recognition || !voiceState.recognitionActive) return;
    voiceState.recognition.stop();
    voiceState.recognitionActive = false;
    updateVoiceUI();
  }

  function setupSpeech(){
    if (!voiceState.speakingSupported) return;
    try {
      voiceState.voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => {
        voiceState.voices = window.speechSynthesis.getVoices();
      });
      window.speechSynthesis.onvoiceschanged = () => {
        voiceState.voices = window.speechSynthesis.getVoices();
      };
    } catch (_){ /* noop */ }
  }

  function speakParagraphs(paragraphs){
    if (!voiceState.speakingSupported || !voiceState.speakingEnabled) return;
    if (!Array.isArray(paragraphs) || !paragraphs.length) return;
    const text = paragraphs.join(' ').trim();
    if (!text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const preferred = voiceState.voices.find(v => /es(-|_)(CO|MX|419|ES)/i.test(v.lang));
      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred ? preferred.lang : 'es-ES';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err){
      console.warn('capsule: síntesis de voz no disponible', err);
    }
  }

  function updateVoiceUI(){
    if (voiceBtn){
      voiceBtn.classList.toggle('listening', voiceState.recognitionActive);
      voiceBtn.setAttribute('aria-pressed', String(voiceState.recognitionActive));
      voiceBtn.setAttribute('aria-label', voiceState.recognitionActive ? 'Detener dictado' : 'Hablar con Vulcano');
      voiceBtn.title = voiceState.recognitionActive ? 'Detener dictado' : 'Hablar con Vulcano';
    }
    if (form){
      form.classList.toggle('listening', voiceState.recognitionActive);
    }
  }

  function collectAgentParagraphs(){
    if (!stream) return [];
    const last = stream.querySelector('.capsule-message.from-agent');
    if (!last) return [];
    return Array.from(last.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
  }
})();
