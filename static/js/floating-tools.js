/**
 * Floating Tools Menu - Desktop & Mobile
 * Right-side vertical menu for desktop, FAB drawer for mobile
 */

class FloatingToolsMenu {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.menuOpen = false;
        this.init();
    }

    init() {
        // Listen for window resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;

            // If switching between mobile/desktop, close any open menus
            if (wasMobile !== this.isMobile && this.menuOpen) {
                this.closeMenu();
            }
        });

        // Initialize mobile FAB if on mobile
        if (this.isMobile) {
            this.initMobileFAB();
        }

        // Keyboard shortcuts
        this.initKeyboardShortcuts();

        // Tool click handlers
        this.initToolHandlers();
    }

    /**
     * Initialize mobile FAB (Floating Action Button)
     */
    initMobileFAB() {
        const fabBtn = document.querySelector('.floating-fab-btn');
        const fabMenu = document.querySelector('.floating-fab-menu');
        const backdrop = document.querySelector('.floating-fab-backdrop');

        if (!fabBtn || !fabMenu || !backdrop) return;

        // FAB button click
        fabBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Backdrop click - close menu
        backdrop.addEventListener('click', () => {
            this.closeMenu();
        });

        // Close menu when clicking a menu item
        const menuItems = fabMenu.querySelectorAll('.floating-fab-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Small delay for visual feedback before closing
                setTimeout(() => this.closeMenu(), 200);
            });
        });

        // Swipe down to close
        this.initSwipeGesture(fabMenu);
    }

    /**
     * Toggle mobile menu open/closed
     */
    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open mobile menu
     */
    openMenu() {
        const fabBtn = document.querySelector('.floating-fab-btn');
        const fabMenu = document.querySelector('.floating-fab-menu');
        const backdrop = document.querySelector('.floating-fab-backdrop');

        if (!fabBtn || !fabMenu || !backdrop) return;

        this.menuOpen = true;
        fabBtn.classList.add('active');
        fabMenu.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('floating-menu-open');

        // Set focus to first menu item for accessibility
        const firstItem = fabMenu.querySelector('.floating-fab-item');
        if (firstItem) {
            setTimeout(() => firstItem.focus(), 300);
        }
    }

    /**
     * Close mobile menu
     */
    closeMenu() {
        const fabBtn = document.querySelector('.floating-fab-btn');
        const fabMenu = document.querySelector('.floating-fab-menu');
        const backdrop = document.querySelector('.floating-fab-backdrop');

        if (!fabBtn || !fabMenu || !backdrop) return;

        this.menuOpen = false;
        fabBtn.classList.remove('active');
        fabMenu.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('floating-menu-open');
    }

    /**
     * Swipe gesture to close menu
     */
    initSwipeGesture(element) {
        let touchStartY = 0;
        let touchEndY = 0;

        element.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            touchEndY = e.changedTouches[0].screenY;
            const swipeDistance = touchEndY - touchStartY;

            // If swiped down more than 100px, close menu
            if (swipeDistance > 100) {
                this.closeMenu();
            }
        }, { passive: true });
    }

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Close menu on Escape
            if (e.key === 'Escape' && this.menuOpen) {
                this.closeMenu();
                return;
            }

            // Keyboard shortcuts (Ctrl/Cmd + key)
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'h': // Ctrl+H - Dashboard
                        e.preventDefault();
                        this.navigateTo('/');
                        break;
                    case 'k': // Ctrl+K - Search
                        e.preventDefault();
                        this.triggerSearch();
                        break;
                    case 't': // Ctrl+T - Theme toggle
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }
        });
    }

    /**
     * Initialize tool click handlers
     */
    initToolHandlers() {
        // Theme toggle handler is in theme-toggle.js

        // Calculator tool
        const calcTool = document.querySelector('[data-tool="calculator"]');
        if (calcTool) {
            calcTool.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCalculator();
            });
        }

        // Search tool
        const searchTool = document.querySelector('[data-tool="search"]');
        if (searchTool) {
            searchTool.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerSearch();
            });
        }

        // Help tool
        const helpTool = document.querySelector('[data-tool="help"]');
        if (helpTool) {
            helpTool.addEventListener('click', (e) => {
                e.preventDefault();
                this.showHelp();
            });
        }

        // Settings tool
        const settingsTool = document.querySelector('[data-tool="settings"]');
        if (settingsTool) {
            settingsTool.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSettings();
            });
        }
    }

    /**
     * Navigate to a URL
     */
    navigateTo(url) {
        window.location.href = url;
    }

    /**
     * Open calculator (navigate to calculator section or modal)
     */
    openCalculator() {
        // Check if we're on a page with calculator section
        const calculatorSection = document.querySelector('.calculator-container');
        if (calculatorSection) {
            // Scroll to calculator
            calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Flash highlight effect
            calculatorSection.style.transition = 'box-shadow 0.3s ease';
            calculatorSection.style.boxShadow = '0 0 0 4px var(--primary-light)';
            setTimeout(() => {
                calculatorSection.style.boxShadow = '';
            }, 1000);
        } else {
            // Navigate to create order page (where calculator is located)
            this.navigateTo('/create_order');
        }
    }

    /**
     * Trigger search functionality
     */
    triggerSearch() {
        // Find first search input on page
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * Toggle theme - No longer needed (default dark theme only)
     */
    toggleTheme() {
        console.log('Theme toggle disabled - using default dark theme only');
    }

    /**
     * Show help modal/overlay
     */
    showHelp() {
        // Create simple help modal
        const helpContent = `
            <div class="help-overlay" id="helpOverlay">
                <div class="help-modal">
                    <div class="help-header">
                        <h3><i class="fas fa-question-circle"></i> Keyboard Shortcuts</h3>
                        <button class="help-close" onclick="document.getElementById('helpOverlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="help-content">
                        <div class="help-section">
                            <h4>Navigation</h4>
                            <ul>
                                <li><kbd>Ctrl</kbd> + <kbd>H</kbd> - Go to Dashboard</li>
                                <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Focus Search</li>
                                <li><kbd>Esc</kbd> - Close Menu/Modal</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h4>Appearance</h4>
                            <ul>
                                <li><kbd>Ctrl</kbd> + <kbd>T</kbd> - Toggle Light/Dark Theme</li>
                            </ul>
                        </div>
                        <div class="help-section">
                            <h4>Quick Actions</h4>
                            <ul>
                                <li>Use the floating menu on the right for quick access</li>
                                <li>Click any tool icon to see its label</li>
                                <li>On mobile, tap the <i class="fas fa-plus"></i> button for menu</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', helpContent);

        // Add styles if not already present
        if (!document.getElementById('helpStyles')) {
            const style = document.createElement('style');
            style.id = 'helpStyles';
            style.textContent = `
                .help-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }
                .help-modal {
                    background: var(--bg-card);
                    border-radius: var(--radius-lg);
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: var(--shadow-lg);
                }
                .help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: var(--gradient-header);
                    color: white;
                    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                }
                .help-header h3 {
                    margin: 0;
                    font-size: 20px;
                }
                .help-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                }
                .help-content {
                    padding: 24px;
                    color: var(--text-primary);
                }
                .help-section {
                    margin-bottom: 24px;
                }
                .help-section h4 {
                    color: var(--primary-color);
                    font-size: 16px;
                    margin-bottom: 12px;
                }
                .help-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .help-section li {
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-light);
                }
                .help-section li:last-child {
                    border-bottom: none;
                }
                kbd {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-medium);
                    border-radius: 4px;
                    padding: 2px 8px;
                    font-family: monospace;
                    font-size: 12px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Close on backdrop click
        document.getElementById('helpOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'helpOverlay') {
                e.target.remove();
            }
        });
    }

    /**
     * Show settings (placeholder)
     */
    showSettings() {
        alert('Settings panel coming soon!\n\nFor now, use the theme toggle to switch between light/dark modes.');
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.floatingToolsMenu = new FloatingToolsMenu();
    });
} else {
    window.floatingToolsMenu = new FloatingToolsMenu();
}
