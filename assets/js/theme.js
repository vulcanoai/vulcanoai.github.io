/**
 * Vulcano AI - Theme Switching System
 * Handles dynamic color theme switching with localStorage persistence
 */

class ThemeManager {
  constructor() {
    this.themes = {
      default: 'Dark',
      arctic: 'Light'
    };

    this.currentTheme = 'default';
    this.themeToggle = null;

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

    if (!this.themeToggle) {
      console.warn('Theme toggle button not found');
      return;
    }

    // Load saved theme or use default
    this.loadSavedTheme();

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial theme
    this.applyTheme(this.currentTheme);
    this.updateToggleState();
  }

  setupEventListeners() {
    // Toggle theme on button click
    this.themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleTheme();
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

  toggleTheme() {
    const newTheme = this.currentTheme === 'default' ? 'arctic' : 'default';
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    if (!this.themes[theme]) {
      console.warn(`Unknown theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.updateToggleState();
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

  updateToggleState() {
    // Update button appearance and label based on current theme
    const isLight = this.currentTheme === 'arctic';
    this.themeToggle.setAttribute('aria-label', `Cambiar a tema ${isLight ? 'oscuro' : 'claro'}`);
    this.themeToggle.setAttribute('data-theme', this.currentTheme);

    // Update icon if needed (could switch between sun/moon icons)
    const icon = this.themeToggle.querySelector('use');
    if (icon) {
      icon.setAttribute('href', `/assets/icons.svg#${isLight ? 'palette' : 'palette'}`);
    }
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