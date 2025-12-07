// quotes.js - Quote management functionality
class QuotesManager {
    constructor() {
        this.quotes = [];
        this.initialized = false;
        this.init();
    }

    async init() {
        console.log('🔖 Initializing quotes manager...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initAfterDOM());
        } else {
            this.initAfterDOM();
        }
    }

    async initAfterDOM() {
        console.log('📋 DOM ready for quotes, starting initialization...');
        
        try {
            this.setupTabSwitching();
            console.log('✅ Quotes manager initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('❌ Error initializing quotes manager:', error);
        }
    }

    setupTabSwitching() {
        const quotesTab = document.getElementById('quotes-tab');
        if (quotesTab) {
            quotesTab.addEventListener('click', () => {
                setTimeout(() => {
                    this.loadQuotes();
                }, 100);
            });
        }
    }

    async loadQuotes() {
        console.log('📊 Loading quotes...');
        
        const quotesListContainer = document.getElementById('quotes-list');
        if (!quotesListContainer) {
            console.warn('⚠️ Quotes list container not found');
            return;
        }

        try {
            // Show loading state
            quotesListContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading quotes...</p>
                </div>
            `;

            const response = await fetch('/api/quotes');
            console.log('📡 Quotes response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📝 Quotes data:', data);

                if (data.success) {
                    this.quotes = data.quotes;
                    this.displayQuotes();
                } else {
                    this.showError('Failed to load quotes: ' + data.error);
                }
            } else {
                this.showError('Failed to load quotes');
            }

        } catch (error) {
            console.error('❌ Error loading quotes:', error);
            this.showError('Network error occurred: ' + error.message);
        }
    }

    displayQuotes() {
        console.log('📋 Displaying quotes:', this.quotes.length);
        
        const quotesListContainer = document.getElementById('quotes-list');
        if (!quotesListContainer) {
            console.warn('⚠️ Quotes list container not found');
            return;
        }

        if (this.quotes.length === 0) {
            quotesListContainer.innerHTML = `
                <div class="empty-quotes">
                    <i class="fas fa-file-invoice"></i>
                    <h4>No Pending Quotes</h4>
                    <p>All quotes have been processed or no quotes have been created yet.</p>
                    <button class="btn btn-primary" onclick="switchToCalculator()">
                        <i class="fas fa-calculator me-2"></i>Create New Quote
                    </button>
                </div>
            `;
            return;
        }

        const quotesHtml = this.quotes.map(quote => this.createQuoteCard(quote)).join('');
        quotesListContainer.innerHTML = quotesHtml;
    }

    createQuoteCard(quote) {
        const createdDate = new Date(quote.created_at).toLocaleDateString();
        const createdTime = new Date(quote.created_at).toLocaleTimeString();
        
        return `
            <div class="quote-card" data-quote-id="${quote.quote_id}">
                <div class="quote-header">
                    <div class="quote-info">
                        <h5>${quote.customer_name}</h5>
                        <p><i class="fas fa-book me-1"></i>${quote.book_title}</p>
                        <p><i class="fas fa-calendar me-1"></i>Created: ${createdDate} ${createdTime}</p>
                    </div>
                    <div class="quote-actions">
                        <button class="btn-approve-quote" onclick="quotesManager.approveQuote(${quote.quote_id})">
                            <i class="fas fa-check"></i>Approve
                        </button>
                        <button class="btn-reject-quote" onclick="quotesManager.rejectQuote(${quote.quote_id})">
                            <i class="fas fa-times"></i>Reject
                        </button>
                    </div>
                </div>
                
                <div class="quote-details">
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Book Price:</span>
                        <span class="quote-detail-value">R$ ${quote.book_price.toFixed(2)}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Profit (${quote.profit_percent}%):</span>
                        <span class="quote-detail-value">R$ ${quote.profit.toFixed(2)}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Shipping Cost:</span>
                        <span class="quote-detail-value">R$ ${quote.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Total (BRL):</span>
                        <span class="quote-detail-value">R$ ${quote.total_brl.toFixed(2)}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Shipping Adjustment:</span>
                        <span class="quote-detail-value">¥${quote.shipping_adjustment_jpy}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Final Total (JPY):</span>
                        <span class="quote-detail-value">¥${quote.total_jpy.toLocaleString()}</span>
                    </div>
                    <div class="quote-detail-row">
                        <span class="quote-detail-label">Exchange Rate:</span>
                        <span class="quote-detail-value">1 BRL = ${quote.exchange_rate} JPY (${quote.rate_source})</span>
                    </div>
                </div>
            </div>
        `;
    }

    async approveQuote(quoteId) {
        console.log('✅ Approving quote:', quoteId);
        
        if (!confirm('Are you sure you want to approve this quote and convert it to an order?')) {
            return;
        }

        try {
            const response = await fetch(`/api/quotes/${quoteId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Quote approved successfully! Order #${data.order_id} created. Redirecting to orders...`);
                this.loadQuotes(); // Refresh the quotes list

                // Redirect to orders page with success message
                setTimeout(() => {
                    // Store order ID in sessionStorage to highlight it after page load
                    sessionStorage.setItem('newOrderId', data.order_id);
                    window.location.href = '/orders';
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Error approving quote:', error);
            this.showError('Network error occurred: ' + error.message);
        }
    }

    async rejectQuote(quoteId) {
        console.log('❌ Rejecting quote:', quoteId);
        
        if (!confirm('Are you sure you want to reject and delete this quote?')) {
            return;
        }

        try {
            const response = await fetch(`/api/quotes/${quoteId}/reject`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Quote rejected and deleted successfully.');
                this.loadQuotes(); // Refresh the quotes list
            } else {
                this.showError('Failed to reject quote: ' + data.error);
            }

        } catch (error) {
            console.error('❌ Error rejecting quote:', error);
            this.showError('Network error occurred: ' + error.message);
        }
    }

    showError(message) {
        console.log('❌ Showing error:', message);
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        console.log('✅ Showing success:', message);
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        this.clearMessages();

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to quotes container
        const quotesContainer = document.querySelector('.quotes-container');
        if (quotesContainer) {
            quotesContainer.insertBefore(messageDiv, quotesContainer.firstChild);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    clearMessages() {
        const quotesContainer = document.querySelector('.quotes-container');
        if (quotesContainer) {
            const alerts = quotesContainer.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
        }
    }
}

// Global function for template access
function switchToQuotes() {
    const quotesTab = document.getElementById('quotes-tab');
    if (quotesTab) {
        quotesTab.click();
    }
}

// Initialize quotes manager when DOM is loaded
let quotesManager;

// Function to ensure quotes manager is initialized when needed
function ensureQuotesManagerInitialized() {
    if (!quotesManager || !quotesManager.initialized) {
        console.log('📋 Initializing quotes manager...');
        quotesManager = new QuotesManager();
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('🔄 DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOMContentLoaded fired, initializing quotes manager...');
        ensureQuotesManagerInitialized();
    });
} else {
    console.log('📋 DOM already loaded, initializing quotes manager immediately...');
    ensureQuotesManagerInitialized();
}

// Export for global access
window.quotesManager = quotesManager;
window.ensureQuotesManagerInitialized = ensureQuotesManagerInitialized;