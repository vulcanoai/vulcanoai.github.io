/**
 * Vulcano AI - Theme Switching System
 * Handles dynamic color theme switching with localStorage persistence
 */

class ThemeManager {
  constructor() {
    this.themes = {
      default: 'GitHub Dark',
      cybernetic: 'Cybernetic',
      andromeda: 'Andromeda',
      retro: 'Terminal',
      arctic: 'Arctic'
    };

    this.currentTheme = 'default';
    this.themeToggle = null;
    this.themeMenu = null;
    this.themeOptions = null;

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Get DOM elements
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeMenu = document.getElementById('theme-menu');
    this.themeOptions = document.querySelectorAll('.theme-option');

    if (!this.themeToggle || !this.themeMenu) {
      console.warn('Theme selector elements not found');
      return;
    }

    // Load saved theme or use default
    this.loadSavedTheme();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial theme
    this.applyTheme(this.currentTheme);
    this.updateActiveOption();
  }

  setupEventListeners() {
    // Toggle menu on button click
    this.themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.themeMenu.contains(e.target) && !this.themeToggle.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Handle theme option clicks
    this.themeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = option.dataset.theme;
        this.setTheme(theme);
        this.closeMenu();
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen()) {
        this.closeMenu();
        this.themeToggle.focus();
      }
    });
  }

  loadSavedTheme() {
    try {
      const savedTheme = localStorage.getItem('vulcano-theme');
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      }
    } catch (error) {
      console.warn('Could not load saved theme:', error);
    }
  }

  saveTheme(theme) {
    try {
      localStorage.setItem('vulcano-theme', theme);
    } catch (error) {
      console.warn('Could not save theme:', error);
    }
  }

  setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Unknown theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.updateActiveOption();
    this.saveTheme(theme);

    // Dispatch custom event for other scripts to listen to
    const event = new CustomEvent('themeChanged', {
      detail: { theme, themeName: this.themes[theme] }
    });
    document.dispatchEvent(event);
  }

  applyTheme(theme) {
    const html = document.documentElement;

    // Remove any existing theme attribute
    Object.keys(this.themes).forEach(t => {
      html.removeAttribute(`data-theme`);
    });

    // Apply new theme (default theme has no data attribute)
    if (theme !== 'default') {
      html.setAttribute('data-theme', theme);
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
  }

  updateMetaThemeColor(theme) {
    const themeColors = {
      default: '#161b22',
      cybernetic: '#1a1f2e',
      andromeda: '#2d1b3d',
      retro: '#002200',
      arctic: '#f8fafc'
    };

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    metaThemeColor.content = themeColors[theme] || themeColors.default;
  }

  updateActiveOption() {
    this.themeOptions.forEach(option => {
      const isActive = option.dataset.theme === this.currentTheme;
      option.classList.toggle('active', isActive);
    });
  }

  toggleMenu() {
    const isOpen = this.isMenuOpen();
    if (isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.themeMenu.classList.add('open');
    this.themeToggle.setAttribute('aria-expanded', 'true');

    // Focus first theme option for keyboard navigation
    const firstOption = this.themeMenu.querySelector('.theme-option');
    if (firstOption) {
      firstOption.focus();
    }
  }

  closeMenu() {
    this.themeMenu.classList.remove('open');
    this.themeToggle.setAttribute('aria-expanded', 'false');
  }

  isMenuOpen() {
    return this.themeMenu.classList.contains('open');
  }

  // Public API for external scripts
  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeName(theme = this.currentTheme) {
    return this.themes[theme] || 'Unknown';
  }

  getAvailableThemes() {
    return { ...this.themes };
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use by other scripts
window.VulcanoTheme = themeManager;