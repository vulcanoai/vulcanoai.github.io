/*
  panels.js — Binocu-style overlay panels and floating blocks
  - Creates floating orange blocks for 3D room effect
  - Handles panel open/close with focus management
  - Provides app-like transitions and interactions
*/
(() => {
  // Create floating orange blocks
  function createFloatingBlocks() {
    const numBlocks = 12;
    const body = document.body;

    for (let i = 0; i < numBlocks; i++) {
      const block = document.createElement('div');
      block.className = 'floating-block';

      // Random positioning
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;

      block.style.left = `${x}px`;
      block.style.top = `${y}px`;

      // Assign random animation
      const animations = ['float3d-1', 'float3d-2', 'float3d-3'];
      const animation = animations[i % 3];
      const duration = 8 + Math.random() * 16; // 8-24 seconds
      const delay = Math.random() * 4; // 0-4 second delay

      block.style.animation = `${animation} ${duration}s ease-in-out infinite`;
      block.style.animationDelay = `${delay}s`;

      body.appendChild(block);
    }
  }

  // Panel management
  class PanelManager {
    constructor() {
      this.openPanel = null;
      this.previousFocus = null;
      this.init();
    }

    init() {
      // Listen for panel triggers
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-open-panel]');
        if (trigger) {
          e.preventDefault();
          const panelId = trigger.getAttribute('data-open-panel');
          this.openPanelById(panelId);
        }

        // Close on backdrop click
        const overlay = e.target.closest('.panel-overlay');
        if (overlay && e.target === overlay) {
          this.closeCurrentPanel();
        }

        // Close button click
        const closeBtn = e.target.closest('.panel-close');
        if (closeBtn) {
          e.preventDefault();
          this.closeCurrentPanel();
        }
      });

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.openPanel) {
          this.closeCurrentPanel();
        }
      });
    }

    openPanelById(panelId) {
      const overlay = document.querySelector(`[data-panel="${panelId}"]`);
      if (!overlay) {
        console.warn(`Panel with id "${panelId}" not found`);
        return;
      }

      // Close any open panel first
      if (this.openPanel) {
        this.closeCurrentPanel();
      }

      // Store current focus
      this.previousFocus = document.activeElement;

      // Open the panel
      overlay.classList.add('open');
      this.openPanel = overlay;

      // Focus management
      requestAnimationFrame(() => {
        const focusTarget = overlay.querySelector('.panel-close') ||
                          overlay.querySelector('button, input, select, textarea, a[href]');
        if (focusTarget) {
          focusTarget.focus();
        }
      });

      // Trap focus within panel
      this.trapFocus(overlay);
    }

    closeCurrentPanel() {
      if (!this.openPanel) return;

      this.openPanel.classList.remove('open');
      this.openPanel = null;

      // Restore focus
      if (this.previousFocus) {
        this.previousFocus.focus();
        this.previousFocus = null;
      }
    }

    trapFocus(element) {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      const cleanup = () => {
        document.removeEventListener('keydown', handleTabKey);
      };

      document.addEventListener('keydown', handleTabKey);

      // Store cleanup function for later
      element._focusTrapCleanup = cleanup;
    }
  }

  // Enhanced action button feedback
  function enhanceActionButtons() {
    const actionCards = document.querySelectorAll('.action-card');

    actionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Enhanced visual feedback
        card.style.transform = 'translateY(2px) scale(0.95)';
        card.style.boxShadow = '0 2px 8px rgba(255, 75, 0, 0.2)';

        setTimeout(() => {
          card.style.transform = '';
          card.style.boxShadow = '';
        }, 200);

        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(20);
        }
      });
    });
  }

  // Initialize when DOM is ready
  function init() {
    // Respect user's motion preferences
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      createFloatingBlocks();
    }

    // Initialize panel management
    new PanelManager();

    // Enhance action buttons
    enhanceActionButtons();

    // Add grid-room class to body if not present
    if (!document.body.classList.contains('grid-room')) {
      document.body.classList.add('grid-room');
    }
  }

  // Auto-initialize or expose for manual init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for potential external use
  window.BinocuPanels = {
    init,
    createFloatingBlocks
  };
})();