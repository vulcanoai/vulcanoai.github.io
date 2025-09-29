/*
  chat-component.js — Unified conversational interface for Vulcano AI
  Creates consistent chat UI across all pages with configurable options.
*/

window.VulcanoChatComponent = (() => {

  // Default configuration
  const defaultConfig = {
    hasVoiceOrb: true,          // Show the large voice orb or simple button
    hasHorizontalChips: true,    // Use horizontal scrolling chips vs simple chips
    placeholder: "O escribe tu pregunta aquí...",
    voiceHint: "Toca para hablar",
    defaultChips: [
      { prompt: "Léeme un resumen de las noticias de IA en América Latina hoy", label: "Escuchar briefing" },
      { prompt: "Actualízame sobre regulación de IA en México", label: "Regulación MX" },
      { prompt: "Cuéntame si hubo financiamiento destacado en IA esta semana", label: "Financiamiento IA" },
      { prompt: "Explícame el impacto de IA en empleo en Hispanoamérica", label: "Impacto laboral" },
      { prompt: "Dame ejemplos de implementaciones de IA en gobiernos LATAM", label: "Gobiernos LATAM" },
      { prompt: "Recomiéndame startups de IA con foco en sostenibilidad", label: "Startups verdes" }
    ]
  };

  function createChatInterface(containerId, options = {}) {
    const config = { ...defaultConfig, ...options };
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`VulcanoChatComponent: Container ${containerId} not found`);
      return null;
    }

    // Create the unified HTML structure
    const html = `
      <section class="capsule-stream" id="capsule-stream" aria-live="polite" aria-label="Conversación">
        ${config.initialMessage || ''}
      </section>

      ${config.hasVoiceOrb ? createVoiceOrbHTML(config) : ''}

      ${createFormHTML(config)}

      ${createChipsHTML(config)}
    `;

    container.innerHTML = html;
    return initializeChatBehavior(container, config);
  }

  function createVoiceOrbHTML(config) {
    return `
      <div class="capsule-interaction">
        <div class="voice-primary">
          <button type="button" class="voice-orb" id="capsule-voice" aria-pressed="false" aria-label="Hablar con Vulcano">
            <div class="orb-glow"></div>
            <div class="orb-core">
              <svg width="32" height="32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink">
                <use href="/assets/icons.svg#mic" xlink:href="/assets/icons.svg#mic"></use>
              </svg>
            </div>
            <div class="orb-pulse"></div>
          </button>
          <p class="voice-hint">${config.voiceHint}</p>
        </div>
    `;
  }

  function createFormHTML(config) {
    const voiceButtonHTML = config.hasVoiceOrb ? '' : `
      <button type="button" class="capsule-voice" id="capsule-voice" aria-pressed="false" aria-label="Hablar con Vulcano">
        <svg width="18" height="18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink">
          <use href="/assets/icons.svg#mic" xlink:href="/assets/icons.svg#mic"></use>
        </svg>
      </button>
    `;

    return `
      <form class="capsule-form" id="capsule-form" autocomplete="off">
        ${voiceButtonHTML}
        <label class="sr-only" for="capsule-input">Escribe tu pregunta</label>
        <input id="capsule-input" name="q" type="text" placeholder="${config.placeholder}" maxlength="180" ${config.required ? 'required' : ''} />
        <button type="button" class="capsule-audio" id="capsule-audio" aria-pressed="false" aria-label="Escuchar respuestas">
          <svg width="20" height="20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink">
            <use href="/assets/icons.svg#volume" xlink:href="/assets/icons.svg#volume"></use>
          </svg>
        </button>
        <button type="submit" class="capsule-send" aria-label="Enviar">
          <svg width="20" height="20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink">
            <use href="/assets/icons.svg#arrow-right" xlink:href="/assets/icons.svg#arrow-right"></use>
          </svg>
        </button>
      </form>
      ${config.hasVoiceOrb ? '</div>' : ''}
    `;
  }

  function createChipsHTML(config) {
    if (config.hasHorizontalChips) {
      return `
        <div class="capsule-suggestions" id="capsule-chips" aria-label="Sugerencias de prompts">
          <span id="chip-instructions" class="sr-only">Desliza horizontalmente para descubrir más sugerencias de prompts.</span>
          <div class="chip-track" role="list" aria-describedby="chip-instructions">
            ${config.defaultChips.map(chip =>
              `<button type="button" class="capsule-chip" role="listitem" data-prompt="${chip.prompt}">${chip.label}</button>`
            ).join('')}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="capsule-chips" id="capsule-chips" aria-label="Sugerencias">
          ${config.defaultChips.slice(0, 2).map(chip =>
            `<button type="button" class="capsule-chip" data-prompt="${chip.prompt}">${chip.label}</button>`
          ).join('')}
        </div>
      `;
    }
  }

  function initializeChatBehavior(container, config) {
    // Get all the elements
    const stream = container.querySelector('#capsule-stream');
    const form = container.querySelector('#capsule-form');
    const input = container.querySelector('#capsule-input');
    const chipsWrap = container.querySelector('#capsule-chips');
    const chipNodes = chipsWrap ? Array.from(chipsWrap.querySelectorAll('.capsule-chip')) : [];
    const voiceBtn = container.querySelector('#capsule-voice');
    const audioBtn = container.querySelector('#capsule-audio');

    if (!stream || !form || !input) {
      console.error('VulcanoChatComponent: Required elements not found');
      return null;
    }

    // Initialize state
    const state = {
      loading: true,
      error: null,
      articles: [],
      generatedAt: null,
      stale: false,
      statusNote: '',
      defaultChips: config.defaultChips
    };

    const voiceState = {
      recognition: null,
      recognitionSupported: false,
      recognitionActive: false,
      speakingSupported: 'speechSynthesis' in window,
      speakingEnabled: false,
      lastResponse: [],
      voices: []
    };

    // Set up event listeners
    form.addEventListener('submit', evt => {
      evt.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      appendUser(raw);
      input.value = '';
      input.blur();
      if (config.onSubmit) {
        config.onSubmit(raw, { appendAgent, updateChips, state });
      }
    });

    chipNodes.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = (chip.dataset.prompt || '').trim();
        if (!prompt) return;
        appendUser(prompt);
        if (config.onSubmit) {
          config.onSubmit(prompt, { appendAgent, updateChips, state });
        }
      });
    });

    // Voice setup
    setupVoiceInterfaces();

    // Helper functions
    function appendUser(text) {
      if (voiceState.speakingSupported) {
        try { window.speechSynthesis.cancel(); } catch (_) { /* noop */ }
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

    function appendAgent(paragraphs, meta) {
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

      if (meta && Array.isArray(meta.sources) && meta.sources.length) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'capsule-source-toggle';
        toggle.textContent = 'Ver fuentes';
        let expanded = false;
        let panel = null;
        toggle.addEventListener('click', () => {
          expanded = !expanded;
          toggle.textContent = expanded ? 'Ocultar fuentes' : 'Ver fuentes';
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
            article.appendChild(panel);
          }
          if (panel) {
            panel.style.display = expanded ? 'block' : 'none';
          }
        });
        article.appendChild(toggle);
      }

      stream.appendChild(article);
      scrollStream();

      // Announce for voice
      if (Array.isArray(paragraphs) && paragraphs.length) {
        voiceState.lastResponse = paragraphs;
        speakParagraphs(paragraphs);
      }

      return article;
    }

    function updateChips(suggestions) {
      chipNodes.forEach((chip, index) => {
        const fallback = state.defaultChips[index];
        const hint = suggestions && suggestions[index] ? suggestions[index] : fallback;
        if (!hint) {
          chip.hidden = true;
          return;
        }
        chip.hidden = false;
        chip.dataset.prompt = hint.prompt;
        chip.textContent = hint.label;
      });
    }

    function scrollStream() {
      stream.scrollTo({ top: stream.scrollHeight, behavior: 'smooth' });
    }

    function setupVoiceInterfaces() {
      setupRecognition();
      setupSpeech();

      if (voiceBtn) {
        if (!voiceState.recognitionSupported) {
          voiceBtn.setAttribute('aria-disabled', 'true');
          voiceBtn.disabled = true;
          voiceBtn.title = 'Tu navegador no permite dictado por voz.';
        } else {
          voiceBtn.addEventListener('click', () => {
            if (voiceState.recognitionActive) {
              stopRecognition();
            } else {
              startRecognition();
            }
          });
        }
      }

      if (audioBtn) {
        if (!voiceState.speakingSupported) {
          audioBtn.setAttribute('aria-disabled', 'true');
          audioBtn.disabled = true;
          audioBtn.title = 'Tu navegador no soporta síntesis de voz.';
        } else {
          audioBtn.title = 'Escuchar respuestas';
          audioBtn.addEventListener('click', () => {
            voiceState.speakingEnabled = !voiceState.speakingEnabled;
            audioBtn.setAttribute('aria-pressed', String(voiceState.speakingEnabled));
            audioBtn.title = voiceState.speakingEnabled ? 'Desactivar lectura en voz' : 'Escuchar respuestas';
            if (!voiceState.speakingEnabled) {
              window.speechSynthesis.cancel();
            } else {
              speakParagraphs(voiceState.lastResponse);
            }
          });
        }
      }
    }

    function setupRecognition() {
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
        if (config.onSubmit) {
          config.onSubmit(transcript, { appendAgent, updateChips, state });
        }
      });
      rec.addEventListener('error', (evt) => {
        voiceState.recognitionActive = false;
        updateVoiceUI();
        console.warn('VulcanoChatComponent: error en reconocimiento de voz', evt.error);
        if (evt.error === 'not-allowed') {
          const msg = ['No puedo activar el micrófono. Revisa los permisos del navegador.'];
          appendAgent(msg, {});
        }
      });
      rec.addEventListener('end', () => {
        voiceState.recognitionActive = false;
        updateVoiceUI();
      });
      voiceState.recognition = rec;
      voiceState.recognitionSupported = true;
    }

    function startRecognition() {
      if (!voiceState.recognition || voiceState.recognitionActive) return;
      try {
        voiceState.recognition.start();
        voiceState.recognitionActive = true;
        updateVoiceUI();
      } catch (err) {
        console.error('VulcanoChatComponent: no se pudo iniciar reconocimiento', err);
        voiceState.recognitionActive = false;
        updateVoiceUI();
      }
    }

    function stopRecognition() {
      if (!voiceState.recognition || !voiceState.recognitionActive) return;
      voiceState.recognition.stop();
      voiceState.recognitionActive = false;
      updateVoiceUI();
    }

    function setupSpeech() {
      if (!voiceState.speakingSupported) return;
      try {
        voiceState.voices = window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
          voiceState.voices = window.speechSynthesis.getVoices();
        });
        window.speechSynthesis.onvoiceschanged = () => {
          voiceState.voices = window.speechSynthesis.getVoices();
        };
      } catch (_) { /* noop */ }
    }

    function speakParagraphs(paragraphs) {
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
      } catch (err) {
        console.warn('VulcanoChatComponent: síntesis de voz no disponible', err);
      }
    }

    function updateVoiceUI() {
      if (voiceBtn) {
        voiceBtn.classList.toggle('listening', voiceState.recognitionActive);
        voiceBtn.setAttribute('aria-pressed', String(voiceState.recognitionActive));
        voiceBtn.setAttribute('aria-label', voiceState.recognitionActive ? 'Detener dictado' : 'Hablar con Vulcano');
        voiceBtn.title = voiceState.recognitionActive ? 'Detener dictado' : 'Hablar con Vulcano';

        // Update voice hint text
        const hintElement = container.querySelector('.voice-hint');
        if (hintElement) {
          hintElement.textContent = voiceState.recognitionActive ? 'Escuchando...' : config.voiceHint;
        }
      }
      if (form) {
        form.classList.toggle('listening', voiceState.recognitionActive);
      }
    }

    // Return public API
    return {
      appendUser,
      appendAgent,
      updateChips,
      state,
      voiceState,
      container,
      elements: {
        stream,
        form,
        input,
        voiceBtn,
        audioBtn,
        chipNodes
      }
    };
  }

  // Public API
  return {
    create: createChatInterface,
    defaultConfig
  };
})();