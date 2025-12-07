/* =============================================================================
   INTERACTIONS.JS - Enhanced UI Interactions and Animations
   ============================================================================= */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactions
    initStaggeredAnimations();
    initButtonRipple();
    initNumberCounters();
    initToastSystem();
    initSmoothScroll();
    initLazyLoading();
    initScrollAnimations();
    initCardInteractions();
});

/* ============ STAGGERED ANIMATIONS ON PAGE LOAD ============ */
function initStaggeredAnimations() {
    // Add stagger animation to cards
    const cards = document.querySelectorAll('.stat-card, .action-card, .item-card, .order-card, .activity-item');

    cards.forEach((card, index) => {
        card.classList.add('stagger-item', 'animate-stagger');
        card.style.animationDelay = `${index * 0.05}s`;
    });

    // Fade in page content
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        mainContent.classList.add('animate-fade-in');
    }
}

/* ============ BUTTON RIPPLE EFFECT ============ */
function initButtonRipple() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-success, .btn-info, .btn-warning, .btn-danger, .btn-add, .btn-calculate');

    buttons.forEach(button => {
        button.classList.add('btn-ripple', 'btn-press');

        button.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');

            // Calculate position
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;

            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/* ============ NUMBER COUNTING ANIMATION ============ */
function initNumberCounters() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, observerOptions);

    // Observe stat numbers
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const text = element.textContent.trim();

    // Extract number from text (handles currency symbols and formatting)
    const numberMatch = text.match(/[\d,]+/);
    if (!numberMatch) return;

    const targetValue = parseInt(numberMatch[0].replace(/,/g, ''));
    if (isNaN(targetValue)) return;

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    let step = 0;

    // Store prefix and suffix
    const prefix = text.substring(0, text.indexOf(numberMatch[0]));
    const suffix = text.substring(text.indexOf(numberMatch[0]) + numberMatch[0].length);

    element.classList.add('animate-count-up');

    const timer = setInterval(() => {
        current += increment;
        step++;

        if (step >= steps) {
            current = targetValue;
            clearInterval(timer);
        }

        // Format number with commas
        const formatted = Math.floor(current).toLocaleString();
        element.textContent = `${prefix}${formatted}${suffix}`;
    }, duration / steps);
}

/* ============ TOAST NOTIFICATION SYSTEM ============ */
let toastContainer = null;

function initToastSystem() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.setAttribute('role', 'region');
        toastContainer.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(toastContainer);
    } else {
        toastContainer = document.querySelector('.toast-container');
    }
}

function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas ${iconMap[type]}" style="font-size: 1.25rem;"></i>
            <div style="flex: 1;">${message}</div>
            <button class="toast-close" aria-label="Close notification" style="background: none; border: none; cursor: pointer; font-size: 1.25rem; opacity: 0.7;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-progress"></div>
    `;

    toastContainer.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        dismissToast(toast);
    });

    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            dismissToast(toast);
        }, duration);
    }

    return toast;
}

function dismissToast(toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Expose toast function globally
window.showToast = showToast;

/* ============ SMOOTH SCROLL ============ */
function initSmoothScroll() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Scroll to top button (create if doesn't exist)
    if (!document.querySelector('.scroll-to-top')) {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            box-shadow: var(--shadow-lg);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 98;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(scrollBtn);

        // Show/hide on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/* ============ LAZY LOADING IMAGES ============ */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('animate-fade-in');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

/* ============ SCROLL REVEAL ANIMATIONS ============ */
function initScrollAnimations() {
    const animateOnScroll = document.querySelectorAll('.fade-in-scroll, [data-animate-scroll]');

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible', 'animate-fade-in');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animateOnScroll.forEach(el => {
        el.classList.add('fade-in-scroll');
        scrollObserver.observe(el);
    });
}

/* ============ CARD INTERACTIONS ============ */
function initCardInteractions() {
    // Add lift effect to cards
    const cards = document.querySelectorAll('.stat-card, .action-card, .item-card, .order-card');
    cards.forEach(card => {
        card.classList.add('card-lift');
    });

    // Add icon hover effects
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.classList.add('icon-hover-scale');
    });
}

/* ============ FORM ENHANCEMENTS ============ */

// Add floating label effect
function initFloatingLabels() {
    const formGroups = document.querySelectorAll('.form-floating');
    formGroups.forEach(group => {
        group.classList.add('form-floating-animated');
    });
}

// Validate form with animations
function validateFormWithAnimation(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('form-error');
            input.classList.add('animate-shake');

            setTimeout(() => {
                input.classList.remove('animate-shake');
            }, 500);

            isValid = false;
        } else {
            input.classList.remove('form-error');
            input.classList.add('form-success');
        }
    });

    return isValid;
}

// Expose validation function globally
window.validateFormWithAnimation = validateFormWithAnimation;

/* ============ COPY TO CLIPBOARD WITH FEEDBACK ============ */
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied', 'animate-bounce');

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied', 'animate-bounce');
        }, 2000);

        // Toast notification
        showToast('Copied to clipboard!', 'success', 2000);
    }).catch(err => {
        showToast('Failed to copy', 'error', 2000);
    });
}

// Expose copy function globally
window.copyToClipboard = copyToClipboard;

/* ============ LOADING STATE HELPERS ============ */

// Show loading spinner on button
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span> Loading...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = false;
    }
}

// Show skeleton loading
function showSkeleton(container) {
    container.innerHTML = `
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
    `;
}

// Expose loading helpers globally
window.setButtonLoading = setButtonLoading;
window.showSkeleton = showSkeleton;

/* ============ MODAL ENHANCEMENTS ============ */

// Enhance modals with animations
document.addEventListener('shown.bs.modal', function(e) {
    const modal = e.target;
    modal.querySelector('.modal-content')?.classList.add('animate-scale-up');
});

/* ============ SUCCESS ANIMATIONS ============ */

// Animate success message
function showSuccessAnimation(element) {
    element.classList.add('animate-bounce');

    setTimeout(() => {
        element.classList.remove('animate-bounce');
    }, 600);
}

// Expose success animation globally
window.showSuccessAnimation = showSuccessAnimation;

/* ============ ALERT AUTO-DISMISS ============ */

// Auto-dismiss Bootstrap alerts (excluding batch edit alert)
const alerts = document.querySelectorAll('.alert:not(#batchEditAlert)');
alerts.forEach(alert => {
    setTimeout(() => {
        if (alert && typeof bootstrap !== 'undefined') {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
});

/* ============ PERFORMANCE: INTERSECTION OBSERVER CLEANUP ============ */

// Clean up observers when leaving page
window.addEventListener('beforeunload', () => {
    // Observers will be garbage collected
});

/* ============ UTILITY FUNCTIONS ============ */

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Expose utilities globally
window.debounce = debounce;
window.throttle = throttle;

/* ============ BATCH SELECTION FOR ORDERS ============ */
function initBatchSelection() {
    const checkboxes = document.querySelectorAll('.order-select-checkbox');
    const batchControls = document.getElementById('batchControls');
    const selectedCountEl = document.getElementById('selectedCount');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    const batchEditBtn = document.getElementById('batchEditBtn');

    if (!checkboxes.length || !batchControls) return;

    // Track selected orders
    let selectedOrders = new Set();

    // Update batch controls visibility and count
    function updateBatchControls() {
        const count = selectedOrders.size;
        selectedCountEl.textContent = count;

        if (count > 0) {
            batchControls.style.display = 'block';
        } else {
            batchControls.style.display = 'none';
        }

        // Update card states
        checkboxes.forEach(checkbox => {
            const orderCard = checkbox.closest('.order-card');
            if (checkbox.checked) {
                orderCard.classList.add('selected');
            } else {
                orderCard.classList.remove('selected');
            }
        });
    }

    // Handle checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const orderId = this.dataset.orderId;

            if (this.checked) {
                selectedOrders.add(orderId);
            } else {
                selectedOrders.delete(orderId);
            }

            updateBatchControls();
        });
    });

    // Clear selection
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            selectedOrders.clear();
            updateBatchControls();
        });
    }

    // Batch edit functionality
    if (batchEditBtn) {
        batchEditBtn.addEventListener('click', function() {
            if (selectedOrders.size === 0) return;

            // You can implement batch edit modal here
            showToast(`Batch editing ${selectedOrders.size} orders`, 'info', 3000);
        });
    }
}

// Initialize batch selection if on orders page
if (document.querySelector('.order-select-checkbox')) {
    initBatchSelection();
}

/* ============ CONSOLE MESSAGE ============ */
console.log('%c✨ Interactions.js loaded successfully!', 'color: #9b7ab8; font-weight: bold; font-size: 14px;');
