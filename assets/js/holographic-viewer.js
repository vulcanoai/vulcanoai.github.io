/*
  holographic-viewer.js — Immersive capsule visualization system
  Creates a full-screen glassmorphism overlay for exploring capsule metadata
*/

window.VulcanoHolographicViewer = (() => {

  let currentOverlay = null;
  let currentCapsules = [];
  let currentIndex = 0;
  let isOpen = false;

  function createHolographicViewer() {
    if (currentOverlay) return currentOverlay;

    const overlay = document.createElement('div');
    overlay.className = 'holographic-overlay';
    overlay.innerHTML = `
      <div class="holographic-capsule">
        <div class="holographic-particles"></div>

        <div class="holographic-header">
          <div class="holographic-meta">
            <h1 class="holographic-title"></h1>
            <p class="holographic-summary"></p>
            <div class="holographic-timestamp"></div>
          </div>
          <button class="holographic-close" type="button" aria-label="Cerrar visualización">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="holographic-content">
          <div class="holographic-section">
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

        <button class="holographic-nav prev" type="button" aria-label="Cápsula anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <button class="holographic-nav next" type="button" aria-label="Siguiente cápsula">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    setupEventListeners(overlay);
    createFloatingParticles(overlay.querySelector('.holographic-particles'));

    currentOverlay = overlay;
    return overlay;
  }

  function setupEventListeners(overlay) {
    const closeBtn = overlay.querySelector('.holographic-close');
    const prevBtn = overlay.querySelector('.holographic-nav.prev');
    const nextBtn = overlay.querySelector('.holographic-nav.next');

    // Close handlers
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Navigation handlers
    prevBtn.addEventListener('click', () => navigateTo(currentIndex - 1));
    nextBtn.addEventListener('click', () => navigateTo(currentIndex + 1));

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);
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
    isOpen = false;

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
    const bodyEl = currentOverlay.querySelector('.holographic-body');
    const tagsEl = currentOverlay.querySelector('.holographic-tags');
    const sourcesEl = currentOverlay.querySelector('.holographic-sources');

    // Render title and summary
    titleEl.textContent = capsule.title || 'Sin título';
    summaryEl.textContent = capsule.summary || '';

    // Render timestamp
    if (capsule.createdAt || capsule.createdISO) {
      const date = new Date(capsule.createdAt || capsule.createdISO);
      timestampEl.textContent = formatTimestamp(date);
    } else {
      timestampEl.textContent = '';
    }

    // Render body content
    bodyEl.innerHTML = '';
    if (capsule.body && Array.isArray(capsule.body)) {
      capsule.body.forEach(paragraph => {
        if (paragraph && paragraph.trim()) {
          const p = document.createElement('p');
          p.textContent = paragraph.trim();
          bodyEl.appendChild(p);
        }
      });
    } else if (capsule.body) {
      const p = document.createElement('p');
      p.textContent = capsule.body;
      bodyEl.appendChild(p);
    }

    // Render tags
    tagsEl.innerHTML = '';
    if (capsule.tags && Array.isArray(capsule.tags) && capsule.tags.length) {
      capsule.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'holographic-tag';
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
      });
      currentOverlay.querySelector('.holographic-tags-section').style.display = 'block';
    } else {
      currentOverlay.querySelector('.holographic-tags-section').style.display = 'none';
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
      currentOverlay.querySelector('.holographic-sources-section').style.display = 'block';
    } else {
      currentOverlay.querySelector('.holographic-sources-section').style.display = 'none';
    }

    // Add archive badge if this is an older capsule
    addArchiveBadgeIfNeeded(capsule);
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