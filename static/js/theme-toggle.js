/**
 * Theme Toggle - Light/Dark Mode System
 * Persists theme preference in localStorage
 */

class ThemeToggle {
    constructor() {
        this.STORAGE_KEY = 'clubinho-theme';
        this.currentTheme = 'dark'; // Always use dark theme
        this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
        // Always apply dark theme
        this.applyTheme('dark', false);
    }


    /**
     * Apply theme to document
     */
    applyTheme(theme, animate = true) {
        const root = document.documentElement;

        // Always set to dark theme
        root.setAttribute('data-theme', 'dark');
        this.currentTheme = 'dark';

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
    }


    /**
     * Get current theme (always dark)
     */
    getCurrentTheme() {
        return 'dark';
    }

    /**
     * Check if dark mode is active (always true)
     */
    isDarkMode() {
        return true;
    }
}

// Initialize theme system and expose globally
window.themeToggle = new ThemeToggle();

// Console helper
console.log('%c🎨 Dark Theme Active', 'color: #a78bfa; font-size: 14px; font-weight: bold;');
console.log('%cDark theme is permanently enabled', 'color: #b8b8b8; font-size: 12px;');
