/**
 * Theme Toggle - Light/Dark Mode System
 * Persists theme preference in localStorage
 */

class ThemeToggle {
    constructor() {
        this.STORAGE_KEY = 'clubinho-theme';
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
        // Apply stored theme immediately
        this.applyTheme(this.currentTheme, false);

        // Set up toggle buttons
        this.setupToggleButtons();

        // Listen for system theme changes
        this.listenToSystemTheme();
    }

    /**
     * Get theme from localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('localStorage not available, using default theme');
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('Could not save theme to localStorage');
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme, animate = true) {
        const root = document.documentElement;

        // Add transition class for smooth theme change
        if (animate) {
            document.body.classList.add('theme-transitioning');
        }

        // Set theme attribute
        root.setAttribute('data-theme', theme);
        this.currentTheme = theme;

        // Update all toggle buttons
        this.updateToggleButtons(theme);

        // Save preference
        this.saveTheme(theme);

        // Remove transition class after animation
        if (animate) {
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 300);
        }

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    /**
     * Toggle between light, dark, and parallax themes
     */
    toggle() {
        let newTheme;
        if (this.currentTheme === 'light') {
            newTheme = 'dark';
        } else if (this.currentTheme === 'dark') {
            newTheme = 'parallax';
        } else {
            newTheme = 'light';
        }
        this.applyTheme(newTheme, true);
    }

    /**
     * Set up all theme toggle buttons
     */
    setupToggleButtons() {
        // Find all theme toggle buttons (desktop and mobile)
        const toggleButtons = document.querySelectorAll('[data-tool="theme-toggle"]');

        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();

                // Add click feedback animation
                button.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 150);
            });
        });
    }

    /**
     * Update toggle button icons based on current theme
     */
    updateToggleButtons(theme) {
        const toggleButtons = document.querySelectorAll('[data-tool="theme-toggle"]');

        toggleButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (!icon) return;

            // Remove existing theme classes
            icon.classList.remove('fa-moon', 'fa-sun', 'fa-layer-group');

            // Add appropriate icon based on current theme
            if (theme === 'light') {
                icon.classList.add('fa-moon');
                button.setAttribute('aria-label', 'Switch to dark mode');
                button.setAttribute('title', 'Dark Mode');
            } else if (theme === 'dark') {
                icon.classList.add('fa-layer-group');
                button.setAttribute('aria-label', 'Switch to parallax mode');
                button.setAttribute('title', 'Parallax Mode');
            } else {
                icon.classList.add('fa-sun');
                button.setAttribute('aria-label', 'Switch to light mode');
                button.setAttribute('title', 'Light Mode');
            }
        });

        // Update mobile FAB items if they exist
        const fabItems = document.querySelectorAll('.floating-fab-item[data-tool="theme-toggle"]');
        fabItems.forEach(item => {
            const icon = item.querySelector('i');
            const label = item.querySelector('span');

            if (icon) {
                icon.classList.remove('fa-moon', 'fa-sun', 'fa-layer-group');
                if (theme === 'light') {
                    icon.classList.add('fa-moon');
                } else if (theme === 'dark') {
                    icon.classList.add('fa-layer-group');
                } else {
                    icon.classList.add('fa-sun');
                }
            }

            if (label) {
                if (theme === 'light') {
                    label.textContent = 'Dark Mode';
                } else if (theme === 'dark') {
                    label.textContent = 'Parallax Mode';
                } else {
                    label.textContent = 'Light Mode';
                }
            }
        });
    }

    /**
     * Listen to system theme preference changes
     */
    listenToSystemTheme() {
        // Check if browser supports prefers-color-scheme
        if (!window.matchMedia) return;

        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Listen for system theme changes
        darkModeQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!this.getStoredTheme()) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme, true);
            }
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        const validThemes = ['light', 'dark', 'parallax'];
        if (!validThemes.includes(theme)) {
            console.warn('Invalid theme:', theme, 'Valid options:', validThemes);
            return;
        }
        this.applyTheme(theme, true);
    }

    /**
     * Reset to system preference
     */
    resetToSystemPreference() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('Could not clear theme from localStorage');
        }

        // Detect system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(systemTheme, true);
    }
}

// Initialize theme toggle and expose globally
window.themeToggle = new ThemeToggle();

// Expose toggle function for easy access
window.toggleTheme = () => window.themeToggle.toggle();

// Console helper
console.log('%c🎨 Theme Toggle Ready', 'color: #ff6b35; font-size: 14px; font-weight: bold;');
console.log('%cAvailable themes: light, dark, parallax', 'color: #b8b8b8; font-size: 12px;');
console.log('%cUse toggleTheme() to cycle themes or setTheme("parallax") to set directly', 'color: #808080; font-size: 12px;');
