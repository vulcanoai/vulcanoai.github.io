/*
  holographic-viewer.js — Immersive capsule visualization system
  Creates a full-screen glassmorphism overlay for exploring capsule metadata
*/

window.VulcanoHolographicViewer = (() => {

  let currentOverlay = null;
  let currentCapsules = [];
  let currentIndex = 0;
  let isOpen = false;
  let shareFeedbackTimeout = null;

  // Touch gesture state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwiping = false;

  // Voice playback state
  let currentPlaybackRate = 1.0;
  const playbackRates = [0.75, 1.0, 1.25, 1.5];

  function createHolographicViewer() {
    if (currentOverlay) return currentOverlay;

    const overlay = document.createElement('div');
    overlay.className = 'holographic-overlay';
    overlay.innerHTML = `
      <button class="holographic-nav prev" type="button" aria-label="Cápsula anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div class="holographic-capsule">
        <div class="holographic-particles"></div>

        <div class="holographic-header">
          <div class="holographic-meta">
            <h1 class="holographic-title"></h1>
            <p class="holographic-summary"></p>
            <div class="holographic-meta-details">
              <span class="holographic-timestamp"></span>
              <span class="holographic-meta-authors"></span>
            </div>
          </div>
          <div class="holographic-actions">
            <div class="holographic-voice-controls">
              <button class="holographic-voiceover-btn" type="button" title="Escuchar cápsula" aria-label="Escuchar cápsula">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
              <button class="holographic-speed-btn" type="button" title="Velocidad de reproducción" aria-label="Cambiar velocidad">
                <span class="speed-label">1.0x</span>
              </button>
            </div>
            <div class="holographic-share" role="group" aria-label="Compartir cápsula">
              <button class="holographic-share-btn" type="button" data-channel="native" title="Compartir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="16"/>
                </svg>
              </button>
              <button class="holographic-share-btn" type="button" data-channel="linkedin" title="Compartir en LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm.52 6.5H2v11h3.5zm5.72 0H7.75v11h3.47v-6c0-1.59.78-2.49 2.1-2.49 1.13 0 1.68.82 1.68 2.49v6h3.5v-6.64c0-3.08-1.64-4.52-3.83-4.52-1.77 0-2.56.98-3 1.67h-.05z"/>
                </svg>
              </button>
              <button class="holographic-share-btn" type="button" data-channel="x" title="Compartir en X">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 3h3.7l4.03 6.04L15.92 3H21l-7.06 8.2L21 21h-3.7l-4.22-6.31L8.19 21H3l7.2-8.35z"/>
                </svg>
              </button>
              <span class="holographic-share-feedback" aria-live="polite"></span>
            </div>
            <button class="holographic-close" type="button" aria-label="Cerrar visualización">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="holographic-content">
          <div class="holographic-section holographic-overview-section">
            <h3 class="holographic-section-title">Ficha técnica</h3>
            <div class="holographic-overview-grid">
              <div class="holographic-overview-item">
                <span class="holographic-overview-label">Idea central</span>
                <p class="holographic-main-idea"></p>
              </div>
              <div class="holographic-overview-item">
                <span class="holographic-overview-label">Autores</span>
                <p class="holographic-authors-list"></p>
              </div>
              <div class="holographic-overview-item">
                <span class="holographic-overview-label">Fuente principal</span>
                <p class="holographic-primary-source"></p>
              </div>
            </div>
          </div>

          <div class="holographic-section holographic-content-section">
            <h3 class="holographic-section-title">Contenido</h3>
            <div class="holographic-body"></div>
          </div>

          <div class="holographic-section holographic-tags-section">
            <h3 class="holographic-section-title">Etiquetas</h3>
            <div class="holographic-tags"></div>
          </div>

          <div class="holographic-section holographic-sources-section">
            <h3 class="holographic-section-title">Fuentes</h3>
            <div class="holographic-sources"></div>
          </div>
        </div>
      </div>

      <button class="holographic-nav next" type="button" aria-label="Siguiente cápsula">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    `;

    document.body.appendChild(overlay);
    currentOverlay = overlay;
    setupEventListeners(overlay);
    setupShareHandlers(overlay);
    createFloatingParticles(overlay.querySelector('.holographic-particles'));

    return overlay;
  }

  function setupEventListeners(overlay) {
    const closeBtn = overlay.querySelector('.holographic-close');
    const prevBtn = overlay.querySelector('.holographic-nav.prev');
    const nextBtn = overlay.querySelector('.holographic-nav.next');
    const voiceoverBtn = overlay.querySelector('.holographic-voiceover-btn');
    const speedBtn = overlay.querySelector('.holographic-speed-btn');
    const capsule = overlay.querySelector('.holographic-capsule');

    // Close handlers
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Navigation handlers
    prevBtn.addEventListener('click', () => navigateTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => navigateTo(currentIndex + 1));

    // Voiceover handler
    if (voiceoverBtn) {
      voiceoverBtn.addEventListener('click', () => toggleVoiceover(voiceoverBtn));
    }

    // Speed control handler
    if (speedBtn) {
      speedBtn.addEventListener('click', () => cyclePlaybackSpeed(speedBtn));
    }

    // Touch gesture handlers
    if (capsule) {
      capsule.addEventListener('touchstart', handleTouchStart, { passive: true });
      capsule.addEventListener('touchmove', handleTouchMove, { passive: false });
      capsule.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);
  }

  function setupShareHandlers(overlay) {
    const shareGroup = overlay.querySelector('.holographic-share');
    if (!shareGroup) return;

    shareGroup.addEventListener('click', event => {
      const button = event.target.closest('.holographic-share-btn');
      if (!button || button.disabled) return;
      event.preventDefault();
      const capsule = currentCapsules[currentIndex];
      if (!capsule) return;

      const shareData = buildShareData(capsule);
      switch (button.dataset.channel) {
        case 'native':
          handleNativeShare(shareData, button);
          break;
        case 'linkedin':
          shareOnLinkedIn(shareData);
          break;
        case 'x':
          shareOnX(shareData);
          break;
      }
    });

    // Disable until the first render
    updateShareButtons(null);
  }

  function handleKeydown(e) {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        close();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateTo(currentIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateTo(currentIndex + 1);
        break;
    }
  }

  function handleTouchStart(e) {
    if (!isOpen || !e.touches || !e.touches[0]) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }

  function handleTouchMove(e) {
    if (!isOpen || !e.touches || !e.touches[0]) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;

    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);

    // Detect horizontal swipe (more horizontal than vertical)
    if (deltaX > deltaY && deltaX > 10) {
      isSwiping = true;
      e.preventDefault(); // Prevent scroll during swipe
    }
  }

  function handleTouchEnd(e) {
    if (!isOpen || !isSwiping) return;

    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(touchEndY - touchStartY);
    const minSwipeDistance = 50;

    // Only trigger swipe if horizontal movement is significant
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 2) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        navigateTo(currentIndex - 1);
      } else {
        // Swipe left - go to next
        navigateTo(currentIndex + 1);
      }
    }

    // Reset state
    isSwiping = false;
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
  }

  function createFloatingParticles(container) {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'holographic-particle';

      // Random positioning and timing
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.animationDuration = `${8 + Math.random() * 4}s`;

      container.appendChild(particle);
    }
  }

  function show(capsules, initialIndex = 0) {
    currentCapsules = Array.isArray(capsules) ? capsules : [capsules];
    currentIndex = Math.max(0, Math.min(initialIndex, currentCapsules.length - 1));

    const overlay = createHolographicViewer();

    renderCapsule(currentCapsules[currentIndex]);
    updateNavigation();

    const current = currentCapsules[currentIndex];
    if (current && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vulcano:holographic-open', {
        detail: { capsuleId: current.id || null }
      }));
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Show overlay with animation
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    isOpen = true;
  }

  function close() {
    if (!currentOverlay || !isOpen) return;

    currentOverlay.classList.remove('active');
    document.body.style.overflow = '';
    clearShareFeedback();
    isOpen = false;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vulcano:holographic-close'));
    }

    // Clean up after animation
    setTimeout(() => {
      if (currentOverlay && currentOverlay.parentNode) {
        currentOverlay.parentNode.removeChild(currentOverlay);
        currentOverlay = null;
      }
    }, 400);
  }

  function navigateTo(index) {
    if (!currentCapsules.length) return;

    const newIndex = Math.max(0, Math.min(index, currentCapsules.length - 1));
    if (newIndex === currentIndex) return;

    currentIndex = newIndex;
    renderCapsule(currentCapsules[currentIndex]);
    updateNavigation();
  }

  function renderCapsule(capsule) {
    if (!currentOverlay || !capsule) return;

    const titleEl = currentOverlay.querySelector('.holographic-title');
    const summaryEl = currentOverlay.querySelector('.holographic-summary');
    const timestampEl = currentOverlay.querySelector('.holographic-timestamp');
    const metaAuthorsEl = currentOverlay.querySelector('.holographic-meta-authors');
    const mainIdeaEl = currentOverlay.querySelector('.holographic-main-idea');
    const overviewAuthorsEl = currentOverlay.querySelector('.holographic-authors-list');
    const primarySourceEl = currentOverlay.querySelector('.holographic-primary-source');
    const bodyEl = currentOverlay.querySelector('.holographic-body');
    const tagsEl = currentOverlay.querySelector('.holographic-tags');
    const sourcesEl = currentOverlay.querySelector('.holographic-sources');
    const tagsSection = currentOverlay.querySelector('.holographic-tags-section');
    const sourcesSection = currentOverlay.querySelector('.holographic-sources-section');

    // Render title and summary
    titleEl.textContent = capsule.title || 'Sin título';
    summaryEl.textContent = capsule.summary || capsule.mainIdea || '';

    // Render main idea & authors overview
    renderMetadataAuthors(metaAuthorsEl, capsule.authors);
    renderTextOrPlaceholder(mainIdeaEl, capsule.mainIdea, 'Idea principal no registrada.');
    renderTextOrPlaceholder(overviewAuthorsEl, Array.isArray(capsule.authors) && capsule.authors.length ? capsule.authors.join(', ') : '', 'Autoría no especificada.');
    renderPrimarySource(primarySourceEl, capsule.sources);

    // Render timestamp
    if (capsule.createdAt || capsule.createdISO) {
      const date = new Date(capsule.createdAt || capsule.createdISO);
      timestampEl.textContent = formatTimestamp(date);
    } else {
      timestampEl.textContent = '';
    }

    // Render body content
    renderBodyContent(bodyEl, capsule.body);

    // Render tags
    tagsEl.innerHTML = '';
    if (capsule.tags && Array.isArray(capsule.tags) && capsule.tags.length) {
      capsule.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'holographic-tag';
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
      });
      if (tagsSection) tagsSection.style.display = 'block';
    } else if (tagsSection) {
      tagsSection.style.display = 'none';
    }

    // Render sources
    sourcesEl.innerHTML = '';
    if (capsule.sources && Array.isArray(capsule.sources) && capsule.sources.length) {
      capsule.sources.forEach(source => {
        const sourceEl = document.createElement('div');
        sourceEl.className = 'holographic-source';

        const iconEl = document.createElement('div');
        iconEl.className = 'holographic-source-icon';
        iconEl.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        `;

        const contentEl = document.createElement('div');
        contentEl.className = 'holographic-source-content';

        const titleEl = document.createElement('div');
        titleEl.className = 'holographic-source-title';
        titleEl.textContent = source.title || source.source || 'Fuente';

        contentEl.appendChild(titleEl);

        if (source.url) {
          const urlEl = document.createElement('div');
          urlEl.className = 'holographic-source-url';
          urlEl.textContent = source.url;
          contentEl.appendChild(urlEl);

          sourceEl.style.cursor = 'pointer';
          sourceEl.addEventListener('click', () => {
            window.open(source.url, '_blank', 'noopener,noreferrer');
          });
        }

        sourceEl.appendChild(iconEl);
        sourceEl.appendChild(contentEl);
        sourcesEl.appendChild(sourceEl);
      });
      if (sourcesSection) sourcesSection.style.display = 'block';
    } else if (sourcesSection) {
      sourcesSection.style.display = 'none';
    }

    // Add archive badge if this is an older capsule
    currentOverlay.dataset.capsuleId = capsule.id || '';
    setShareFeedback('');
    updateShareButtons(capsule);
    addArchiveBadgeIfNeeded(capsule);
  }

  function renderMetadataAuthors(element, authors) {
    if (!element) return;
    if (authors && authors.length) {
      const label = authors.length === 1 ? 'Autor' : 'Autores';
      element.textContent = `${label}: ${authors.join(', ')}`;
      element.style.display = '';
    } else {
      element.textContent = '';
      element.style.display = 'none';
    }
  }

  function renderTextOrPlaceholder(element, text, placeholder) {
    if (!element) return;
    if (text) {
      element.textContent = text;
      element.classList.remove('is-muted');
    } else {
      element.textContent = placeholder || '';
      if (placeholder) {
        element.classList.add('is-muted');
      } else {
        element.classList.remove('is-muted');
      }
    }
  }

  function renderPrimarySource(element, sources) {
    if (!element) return;
    element.innerHTML = '';
    element.classList.remove('is-muted');

    const primary = Array.isArray(sources) && sources.length ? sources[0] : null;
    if (primary) {
      const title = primary.title || primary.url || 'Fuente principal';
      if (primary.url) {
        const link = document.createElement('a');
        link.href = primary.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = title;
        element.appendChild(link);
      } else {
        element.textContent = title;
      }
    } else {
      element.textContent = 'Fuente no declarada.';
      element.classList.add('is-muted');
    }
  }

  function renderBodyContent(container, body) {
    if (!container) return;
    container.innerHTML = '';

    const appendPlaceholder = () => {
      const placeholder = document.createElement('p');
      placeholder.className = 'holographic-placeholder';
      placeholder.textContent = 'Sin contenido estructurado.';
      container.appendChild(placeholder);
    };

    if (Array.isArray(body) && body.length) {
      const cleaned = body.map(item => (item ? item.trim() : '')).filter(Boolean);
      if (cleaned.length > 1) {
        const list = document.createElement('ol');
        list.className = 'holographic-body-list';
        cleaned.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          list.appendChild(li);
        });
        if (list.childElementCount) {
          container.appendChild(list);
          return;
        }
      }

      if (cleaned.length === 1) {
        const p = document.createElement('p');
        p.textContent = cleaned[0];
        container.appendChild(p);
        return;
      }
    } else if (typeof body === 'string' && body.trim()) {
      const p = document.createElement('p');
      p.textContent = body.trim();
      container.appendChild(p);
      return;
    }

    appendPlaceholder();
  }

  function updateShareButtons(capsule) {
    if (!currentOverlay) return;
    const buttons = currentOverlay.querySelectorAll('.holographic-share-btn');
    const enabled = Boolean(capsule);

    buttons.forEach(button => {
      if (enabled) {
        button.disabled = false;
        button.removeAttribute('aria-disabled');
      } else {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
    });
  }

  function buildShareData(capsule) {
    if (!capsule) return { title: '', summary: '', url: '' };
    const title = capsule.title || 'Cápsula Vulcano';
    const summary = capsule.summary || capsule.mainIdea || '';
    const url = buildShareUrl(capsule);
    return { title, summary, url };
  }

  function buildShareUrl(capsule) {
    if (!capsule || typeof window === 'undefined') return '';
    const { location } = window;
    if (!location) return '';
    const base = `${location.origin}${location.pathname}${location.search}`;
    if (!capsule.id) return base;
    return `${base}#capsule=${encodeURIComponent(capsule.id)}`;
  }

  function handleNativeShare(shareData, button) {
    if (!shareData || !shareData.url) return;

    const payload = {
      title: shareData.title,
      text: shareData.summary,
      url: shareData.url
    };

    if (navigator.share) {
      navigator.share(payload)
        .then(() => {
          setShareFeedback('Compartido.');
        })
        .catch(err => {
          if (err && err.name === 'AbortError') return;
          handleShareFallback(shareData, button);
        });
      return;
    }

    handleShareFallback(shareData, button);
  }

  function handleShareFallback(shareData, button) {
    if (!shareData || !shareData.url) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(`${shareData.title} — ${shareData.url}`)
        .then(() => {
          setShareFeedback('Enlace copiado.');
          if (button) {
            button.classList.add('is-active');
            setTimeout(() => button.classList.remove('is-active'), 1600);
          }
        })
        .catch(() => {
          openShareWindow(shareData.url);
        });
      return;
    }

    openShareWindow(shareData.url);
  }

  function shareOnLinkedIn(shareData) {
    if (!shareData || !shareData.url) return;
    const url = 'https://www.linkedin.com/shareArticle?mini=true'
      + `&url=${encodeURIComponent(shareData.url)}`
      + (shareData.title ? `&title=${encodeURIComponent(shareData.title)}` : '')
      + (shareData.summary ? `&summary=${encodeURIComponent(shareData.summary)}` : '');
    openShareWindow(url, 760, 640);
    setShareFeedback('Abriendo LinkedIn…');
  }

  function shareOnX(shareData) {
    if (!shareData || !shareData.url) return;
    const text = truncateText(`${shareData.title || 'Cápsula Vulcano'} — ${shareData.summary || ''}`, 240);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareData.url)}`;
    openShareWindow(url, 700, 540);
    setShareFeedback('Prepara tu publicación en X.');
  }

  function openShareWindow(url, width = 720, height = 640) {
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    window.open(url, '_blank', `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`);
  }

  function truncateText(value, maxLength) {
    const text = String(value || '').trim();
    if (!maxLength || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }

  function setShareFeedback(message) {
    const overlay = currentOverlay;
    if (!overlay) return;
    const feedbackEl = overlay.querySelector('.holographic-share-feedback');
    if (!feedbackEl) return;

    if (shareFeedbackTimeout) {
      clearTimeout(shareFeedbackTimeout);
      shareFeedbackTimeout = null;
    }

    if (!message) {
      feedbackEl.textContent = '';
      feedbackEl.classList.remove('visible');
      return;
    }

    feedbackEl.textContent = message;
    feedbackEl.classList.add('visible');
    shareFeedbackTimeout = setTimeout(() => {
      if (!currentOverlay) return;
      const el = currentOverlay.querySelector('.holographic-share-feedback');
      if (el) {
        el.textContent = '';
        el.classList.remove('visible');
      }
      shareFeedbackTimeout = null;
    }, 2400);
  }

  function clearShareFeedback() {
    if (shareFeedbackTimeout) {
      clearTimeout(shareFeedbackTimeout);
      shareFeedbackTimeout = null;
    }
    if (currentOverlay) {
      const feedbackEl = currentOverlay.querySelector('.holographic-share-feedback');
      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.classList.remove('visible');
      }
    }
  }

  function addArchiveBadgeIfNeeded(capsule) {
    // Remove existing badge
    const existingBadge = currentOverlay.querySelector('.holographic-archive-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Check if this is an archived capsule (older than 7 days)
    const capsuleDate = new Date(capsule.createdAt || capsule.createdISO);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (capsuleDate < weekAgo) {
      const badge = document.createElement('div');
      badge.className = 'holographic-archive-badge';
      badge.textContent = 'Archivo';
      currentOverlay.querySelector('.holographic-capsule').appendChild(badge);
    }
  }

  function updateNavigation() {
    if (!currentOverlay) return;

    const prevBtn = currentOverlay.querySelector('.holographic-nav.prev');
    const nextBtn = currentOverlay.querySelector('.holographic-nav.next');

    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= currentCapsules.length - 1;

    // Hide navigation if only one capsule
    if (currentCapsules.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  function cyclePlaybackSpeed(button) {
    const currentIndex = playbackRates.indexOf(currentPlaybackRate);
    const nextIndex = (currentIndex + 1) % playbackRates.length;
    currentPlaybackRate = playbackRates[nextIndex];

    const label = button.querySelector('.speed-label');
    if (label) {
      label.textContent = `${currentPlaybackRate}x`;
    }

    // If currently playing, update the rate
    if (window.speechSynthesis.speaking) {
      const voiceBtn = currentOverlay?.querySelector('.holographic-voiceover-btn');
      if (voiceBtn) {
        window.speechSynthesis.cancel();
        setTimeout(() => toggleVoiceover(voiceBtn), 100);
      }
    }
  }

  function toggleVoiceover(button) {
    // Cancel any existing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      button.classList.remove('is-playing');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      return;
    }

    const capsule = currentCapsules[currentIndex];
    if (!capsule) return;

    const textToRead = buildVoiceoverText(capsule);
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-ES';
    utterance.rate = currentPlaybackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      button.classList.add('is-playing');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
    };

    utterance.onend = () => {
      button.classList.remove('is-playing');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    };

    utterance.onerror = () => {
      button.classList.remove('is-playing');
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  function formatTimestamp(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Fecha desconocida';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy ' + date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      return 'Ayer ' + date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (isOpen) {
      document.body.style.overflow = '';
    }
  });

  // Public API
  return {
    show,
    close,
    isOpen: () => isOpen,
    navigateTo,
    getCurrentCapsule: () => currentCapsules[currentIndex] || null,
    getCurrentIndex: () => currentIndex,
    getCapsuleCount: () => currentCapsules.length
  };
})();
