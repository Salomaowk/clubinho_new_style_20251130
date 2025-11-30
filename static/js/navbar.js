/**
 * Navbar Toggle - Handle mobile navigation
 * Manages parallax navbar mobile menu
 */

class NavbarToggle {
    constructor() {
        this.init();
    }

    /**
     * Initialize navbar functionality
     */
    init() {
        const toggleBtn = document.getElementById('navbar-toggle');
        const navMenu = document.getElementById('navbar-menu');
        const settingsBtn = document.getElementById('navbar-settings');

        if (!toggleBtn || !navMenu) {
            return; // Elements don't exist, navbar not being used
        }

        // Toggle menu on hamburger click
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navMenu.classList.toggle('show');
            toggleBtn.setAttribute('aria-expanded',
                navMenu.classList.contains('show') ? 'true' : 'false');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const isClickInside = navMenu.contains(e.target) || toggleBtn.contains(e.target);
            if (!isClickInside && navMenu.classList.contains('show')) {
                navMenu.classList.remove('show');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('show');
                toggleBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Handle settings button click
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Trigger settings from floating tools menu if available
                const settingsBtn = document.querySelector('[data-tool="settings"]');
                if (settingsBtn) {
                    settingsBtn.click();
                }
            });
        }

        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('show')) {
                navMenu.classList.remove('show');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navbarToggle = new NavbarToggle();
    });
} else {
    window.navbarToggle = new NavbarToggle();
}

console.log('%c📱 Navbar Toggle Ready', 'color: #ff6b35; font-size: 12px; font-weight: bold;');
