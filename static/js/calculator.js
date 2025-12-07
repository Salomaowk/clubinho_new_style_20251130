// Calculator JavaScript - calculator.js
class Calculator {
    constructor() {
        this.customers = [];
        this.assets = [];
        this.currentResult = null;
        this.isEditingProfit = false;
        this.initialized = false;
        
        console.log('Calculator constructor called');
        this.init();
    }

    async init() {
        console.log('🚀 Initializing calculator...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', () => this.initAfterDOM());
        } else {
            this.initAfterDOM();
        }
    }

    async initAfterDOM() {
        console.log('📋 DOM ready, starting initialization...');
        
        try {
            await this.loadData();
            this.setupEventListeners();
            this.setupTabSwitching();
            
            // Initialize if calculator tab is already active
            if (this.isCalculatorTabActive()) {
                this.initializeCalculator();
            }
            
            console.log('✅ Calculator initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('❌ Error initializing calculator:', error);
            this.showError('Failed to initialize calculator: ' + error.message);
        }
    }

    isCalculatorTabActive() {
        const calculatorTab = document.getElementById('calculator-tab');
        // If no tab exists (standalone page), return true
        if (!calculatorTab) return true;
        return calculatorTab.classList.contains('active');
    }

    setupTabSwitching() {
        const calculatorTab = document.getElementById('calculator-tab');
        if (calculatorTab) {
            calculatorTab.addEventListener('click', () => {
                setTimeout(() => {
                    this.initializeCalculator();
                }, 100);
            });
        }
    }

    initializeCalculator() {
        console.log('🔧 Initializing calculator components...');

        const calculatorContent = document.getElementById('calculator-content');
        const calculatorForm = document.getElementById('calculatorForm');

        // Check if we're on a standalone calculator page (no tabs) OR if tab is active
        const isStandalonePage = !calculatorContent && calculatorForm;
        const isTabActive = calculatorContent && calculatorContent.classList.contains('active');

        if (!isStandalonePage && !isTabActive) {
            console.log('Calculator tab not active and not standalone page, skipping initialization');
            return;
        }

        this.initializeComboboxes();
        this.setupCalculatorEventListeners();
        this.populateShippingDropdown();
        this.validateForm();

        console.log('✅ Calculator components initialized');
    }

    populateShippingDropdown() {
        const shippingSelect = document.getElementById('shipping-cost');
        if (!shippingSelect) {
            console.warn('⚠️ Shipping dropdown not found');
            return;
        }

        // Clear existing options except the first one
        while (shippingSelect.children.length > 1) {
            shippingSelect.removeChild(shippingSelect.lastChild);
        }

        // Add shipping options (R$ 20.00 to R$ 200.00 in R$ 5.00 intervals)
        for (let i = 20; i <= 200; i += 5) {
            const option = document.createElement('option');
            option.value = i.toFixed(2);
            option.textContent = `R$ ${i.toFixed(2).replace('.', ',')}`;
            shippingSelect.appendChild(option);
        }

        // Add custom option at the end
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Outros valores (personalizado)';
        shippingSelect.appendChild(customOption);

        console.log('✅ Shipping dropdown populated with values');
    }

    async loadData() {
        console.log('📊 Loading data from APIs...');
        
        try {
            // Load customers
            console.log('🔍 Fetching customers...');
            const customersResponse = await fetch('/api/customers');
            console.log('📡 Customers response status:', customersResponse.status);
            
            if (customersResponse.ok) {
                const customersData = await customersResponse.json();
                console.log('📝 Customers data:', customersData);
                
                if (customersData.success && customersData.customers) {
                    this.customers = customersData.customers;
                    console.log('✅ Loaded customers:', this.customers.length, this.customers);
                } else {
                    console.warn('⚠️ No customers data or unsuccessful response');
                    this.customers = [];
                }
            } else {
                console.error('❌ Failed to load customers, status:', customersResponse.status);
                const errorText = await customersResponse.text();
                console.error('❌ Error details:', errorText);
            }

            // Load assets
            // Load assets
            console.log('🔍 Fetching assets...');
            const assetsResponse = await fetch('/api/assets');
            console.log('📡 Assets response status:', assetsResponse.status);

            if (assetsResponse.ok) {
                const assetsData = await assetsResponse.json();
                console.log('📝 Assets data:', assetsData);
                
                if (assetsData.success && assetsData.assets) {
                    // Store the full asset objects for price lookup
                    this.assetsWithPrices = assetsData.assets;
                    // Extract just the names for the dropdown
                    this.assets = assetsData.assets.map(asset => asset.name);
                    console.log('✅ Loaded assets:', this.assets.length, this.assets);
                } else {
                    console.warn('⚠️ No assets data or unsuccessful response');
                    this.assets = [];
                    this.assetsWithPrices = [];
                }
            } else {
                console.error('❌ Failed to load assets, status:', assetsResponse.status);
                const errorText = await assetsResponse.text();
                console.error('❌ Error details:', errorText);
            }
            
            console.log('📊 Data loading completed. Customers:', this.customers.length, 'Assets:', this.assets.length);
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError('Failed to load customer and book data: ' + error.message);
        }
    }

    initializeComboboxes() {
        console.log('🔧 Initializing comboboxes...');
        
        const customerInput = document.getElementById('customer-name');
        const bookInput = document.getElementById('book-title');
        
        if (!customerInput || !bookInput) {
            console.warn('⚠️ Combobox inputs not found, skipping initialization');
            return;
        }
        
        console.log('📋 Customers for combobox:', this.customers);
        console.log('📚 Assets for combobox:', this.assets);
        
        this.setupCombobox('customer-name', this.customers, 'Add New Customer');
        this.setupCombobox('book-title', this.assets, 'Add New Asset');
    }

    setupCombobox(inputId, dataArray, addNewText) {
        console.log(`🔧 Setting up combobox for ${inputId} with ${dataArray.length} items`);
        
        const input = document.getElementById(inputId);
        if (!input) {
            console.error(`❌ Input ${inputId} not found in DOM`);
            return;
        }
    
        console.log(`✅ Found input element:`, input);
    
        const container = input.parentElement;
        
        const existingDropdown = container.querySelector('.combobox-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
    
        const dropdown = document.createElement('div');
        dropdown.className = 'combobox-dropdown';
        dropdown.style.display = 'none';
        container.appendChild(dropdown);
    
        console.log(`✅ Created dropdown for ${inputId}`);
    
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    
        newInput.addEventListener('input', (e) => {
            console.log(`📝 Input event on ${inputId}:`, e.target.value);
            this.filterDropdown(newInput, dropdown, dataArray, addNewText);
            
            // Auto-populate price if this is the book title input
            if (inputId === 'book-title') {
                this.autoPopulateBookPrice(e.target.value);
            }
        });
    
        newInput.addEventListener('focus', (e) => {
            console.log(`🎯 Focus event on ${inputId}`);
            this.filterDropdown(newInput, dropdown, dataArray, addNewText);
        });
    
        newInput.addEventListener('blur', (e) => {
            console.log(`👋 Blur event on ${inputId}`);
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });
    
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    autoPopulateBookPrice(bookTitle) {
        if (!this.assetsWithPrices || !bookTitle) return;
        
        const matchingAsset = this.assetsWithPrices.find(asset => 
            asset.name.toLowerCase() === bookTitle.toLowerCase()
        );
        
        if (matchingAsset && matchingAsset.price > 0) {
            const bookPriceInput = document.getElementById('book-price');
            if (bookPriceInput) {
                bookPriceInput.value = matchingAsset.price.toFixed(2);
                console.log(`💰 Auto-populated book price: R$ ${matchingAsset.price.toFixed(2)}`);
                this.updateProfitDisplay();
                this.validateForm();
            }
        }
    }


    filterDropdown(input, dropdown, dataArray, addNewText) {
        const value = input.value.toLowerCase();
        console.log(`🔍 Filtering dropdown with value: "${value}" from ${dataArray.length} items`);
        
        const filtered = dataArray.filter(item => 
            item.toLowerCase().includes(value)
        );

        console.log(`📋 Filtered results: ${filtered.length} items`, filtered);

        dropdown.innerHTML = '';

        filtered.slice(0, 10).forEach(item => {
            const option = document.createElement('div');
            option.className = 'combobox-option';
            option.textContent = item;
            option.addEventListener('click', () => {
                console.log(`👆 Selected item: ${item}`);
                input.value = item;
                dropdown.style.display = 'none';
                
                // Auto-populate price if this is the book title input
                if (input.id === 'book-title') {
                    this.autoPopulateBookPrice(item);
                }
                
                this.validateForm();
            });
            dropdown.appendChild(option);
        });

        if (value && !dataArray.some(item => item.toLowerCase() === value)) {
            const addOption = document.createElement('div');
            addOption.className = 'combobox-option add-new';
            addOption.innerHTML = `<i class="fas fa-plus me-2"></i>${addNewText}: "${input.value}"`;
            addOption.addEventListener('click', () => {
                console.log(`➕ Add new selected: ${input.value}`);
                dropdown.style.display = 'none';
                this.validateForm();
            });
            dropdown.appendChild(addOption);
        }

        dropdown.style.display = filtered.length > 0 || value ? 'block' : 'none';
        console.log(`👁️ Dropdown display: ${dropdown.style.display}`);
    }

    setupEventListeners() {
        console.log('🎧 Setting up main event listeners...');

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'calculatorForm') {
                e.preventDefault();
                console.log('📝 Form submitted via delegation');
                this.calculateQuote();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-profit')) {
                this.toggleProfitEdit();
            } else if (e.target.closest('#calculate-btn')) {
                e.preventDefault();
                console.log('🧮 Calculate button clicked via delegation');
                this.calculateQuote();
            } else if (e.target.closest('#clear-btn')) {
                console.log('🗑️ Clear button clicked via delegation');
                this.clearForm();
            }
        });

        console.log('🎧 Main event listeners setup completed');
    }

    setupCalculatorEventListeners() {
        console.log('🎧 Setting up calculator-specific event listeners...');

        const inputIds = ['book-price', 'shipping-cost', 'custom-profit', 'shipping-adjustment'];
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                console.log(`✅ Found input: ${id}`);
                
                const newInput = input.cloneNode(true);
                input.parentNode.replaceChild(newInput, input);
                
                newInput.addEventListener('input', () => this.validateForm());
                newInput.addEventListener('change', () => this.validateForm());
            } else {
                console.warn(`⚠️ Input not found: ${id}`);
            }
        });

        // Set up book price input for automatic profit calculation
        const bookPriceInput = document.getElementById('book-price');
        if (bookPriceInput) {
            const newBookPriceInput = bookPriceInput.cloneNode(true);
            bookPriceInput.parentNode.replaceChild(newBookPriceInput, bookPriceInput);
            
            newBookPriceInput.addEventListener('input', () => {
                this.updateProfitDisplay();
                this.validateForm();
            });
            newBookPriceInput.addEventListener('change', () => {
                this.updateProfitDisplay();
                this.validateForm();
            });
        }

        // Set up custom profit input for dynamic percentage updates
        const customProfitInput = document.getElementById('custom-profit');
        if (customProfitInput) {
            const newCustomProfitInput = customProfitInput.cloneNode(true);
            customProfitInput.parentNode.replaceChild(newCustomProfitInput, customProfitInput);
            
            newCustomProfitInput.addEventListener('input', () => {
                this.updateProfitDisplay();
                this.validateForm();
            });
            newCustomProfitInput.addEventListener('change', () => {
                this.updateProfitDisplay();
                this.validateForm();
            });
        }

        // Set up shipping cost dropdown with custom option handling
        const shippingSelect = document.getElementById('shipping-cost');
        if (shippingSelect) {
            const newShippingSelect = shippingSelect.cloneNode(true);
            shippingSelect.parentNode.replaceChild(newShippingSelect, shippingSelect);
            
            newShippingSelect.addEventListener('change', () => {
                this.handleShippingSelection();
                this.validateForm();
            });
        }

        console.log('🎧 Calculator event listeners setup completed');
    }

    handleShippingSelection() {
        const shippingSelect = document.getElementById('shipping-cost');
        const customInput = document.getElementById('shipping-custom');
        
        if (!shippingSelect || !customInput) {
            console.warn('⚠️ Shipping elements not found');
            return;
        }

        if (shippingSelect.value === 'custom') {
            customInput.style.display = 'block';
            customInput.required = true;
            customInput.focus();
            console.log('📦 Custom shipping input shown');
        } else {
            customInput.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
            console.log('📦 Custom shipping input hidden');
        }
    }

    updateProfitDisplay() {
        const bookPriceElement = document.getElementById('book-price');
        const customProfitElement = document.getElementById('custom-profit');
        
        if (!bookPriceElement) {
            console.warn('⚠️ Book price element not found for profit calculation');
            return;
        }
        
        const bookPrice = parseFloat(bookPriceElement.value) || 0;
        
        if (bookPrice <= 0) {
            console.log('📊 Book price is 0 or negative, skipping profit calculation');
            // Reset profit label to default
            const profitLabel = document.querySelector('.profit-label');
            if (profitLabel) {
                profitLabel.innerHTML = '<i class="fas fa-chart-line me-2"></i>Profit (30%) <span class="text-danger">*</span>';
            }
            return;
        }
        
        // Get profit percentage (custom or default 30%)
        let profitPercent = 30; // default
        if (this.isEditingProfit && customProfitElement && customProfitElement.value) {
            const customPercent = parseFloat(customProfitElement.value);
            if (!isNaN(customPercent) && customPercent >= 0 && customPercent <= 100) {
                profitPercent = customPercent;
            }
        }
        
        // Calculate profit amount
        const profitAmount = bookPrice * (profitPercent / 100);
        
        // Update the profit label to show the calculated amount OUTSIDE the input
        const profitLabel = document.querySelector('.profit-label');
        if (profitLabel) {
            profitLabel.innerHTML = `<i class="fas fa-chart-line me-2"></i>Profit (${profitPercent}%) - R$ ${profitAmount.toFixed(2)} <span class="text-danger">*</span>`;
        }
        
        console.log(`💰 Updated profit display: ${profitPercent}% of R$ ${bookPrice.toFixed(2)} = R$ ${profitAmount.toFixed(2)}`);
    }

    toggleProfitEdit() {
        console.log('🔄 Toggling profit edit mode');
        this.isEditingProfit = !this.isEditingProfit;
        const customInput = document.querySelector('.custom-input');
        const profitLabel = document.querySelector('.profit-label');
        
        if (customInput && profitLabel) {
            if (this.isEditingProfit) {
                customInput.style.display = 'block';
                profitLabel.innerHTML = '<i class="fas fa-chart-line me-2"></i>Custom Profit % <span class="text-danger">*</span>';
            } else {
                customInput.style.display = 'none';
                const customProfitInput = document.getElementById('custom-profit');
                if (customProfitInput) {
                    customProfitInput.value = '';
                }
                // Reset to default display
                this.updateProfitDisplay();
            }
            console.log(`🔧 Profit edit mode: ${this.isEditingProfit}`);
        }
        
        // Update profit display and validate form
        this.updateProfitDisplay();
        this.validateForm();
    }

    validateForm() {
        const bookPriceElement = document.getElementById('book-price');
        const shippingCostElement = document.getElementById('shipping-cost');
        const calculateBtn = document.getElementById('calculate-btn');
        
        if (!bookPriceElement || !shippingCostElement || !calculateBtn) {
            console.warn('⚠️ Form elements not found for validation');
            return;
        }
        
        const bookPrice = parseFloat(bookPriceElement.value) || 0;
        const shippingCost = this.getShippingCost();
        
        const isValid = bookPrice > 0 && shippingCost > 0;
        
        console.log(`🔍 Form validation - Book: ${bookPrice}, Shipping: ${shippingCost}, Valid: ${isValid}`);
        
        calculateBtn.disabled = !isValid;
        
        if (isValid) {
            calculateBtn.classList.remove('disabled');
        } else {
            calculateBtn.classList.add('disabled');
        }
    }

    getShippingCost() {
        const shippingSelect = document.getElementById('shipping-cost');
        const customShippingInput = document.getElementById('shipping-custom');
        
        if (!shippingSelect) return 0;
        
        if (shippingSelect.value === 'custom') {
            return parseFloat(customShippingInput?.value) || 0;
        } else {
            return parseFloat(shippingSelect.value) || 0;
        }
    }

    async calculateQuote() {
        console.log('🧮 Starting quote calculation...');
        
        const customerNameElement = document.getElementById('customer-name');
        const bookTitleElement = document.getElementById('book-title');
        const bookPriceElement = document.getElementById('book-price');
        const customProfitElement = document.getElementById('custom-profit');
        const shippingAdjustmentElement = document.getElementById('shipping-adjustment');
        
        if (!customerNameElement || !bookTitleElement || !bookPriceElement) {
            console.error('❌ Required form elements not found');
            this.showError('Form elements not available');
            return;
        }
        
        const customerName = customerNameElement.value || '';
        const bookTitle = bookTitleElement.value || '';
        const bookPrice = parseFloat(bookPriceElement.value) || 0;
        const shippingCost = this.getShippingCost();
        const customProfit = parseFloat(customProfitElement?.value) || 0;
        const shippingAdjustment = parseFloat(shippingAdjustmentElement?.value) || 0;

        console.log('📊 Calculation inputs:', {
            customerName, bookTitle, bookPrice, shippingCost, customProfit, shippingAdjustment
        });

        if (!bookPrice || !shippingCost) {
            console.warn('⚠️ Missing required fields');
            this.showError('Please fill in book price and shipping cost');
            return;
        }

        const profitPercent = this.isEditingProfit && customProfit > 0 ? customProfit : 30;

        try {
            const calculateBtn = document.getElementById('calculate-btn');
            const originalText = calculateBtn.innerHTML;
            calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calculating...';
            calculateBtn.disabled = true;

            console.log('📡 Sending calculation request...');

            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    book_title: bookTitle,
                    book_price: bookPrice,
                    shipping_cost: shippingCost,
                    profit_percent: profitPercent,
                    shipping_adjustment_jpy: shippingAdjustment
                })
            });

            console.log('📡 Calculation response status:', response.status);

            const data = await response.json();
            console.log('📊 Calculation response data:', data);
            
            if (data.success) {
                this.currentResult = data;
                this.displayResults(data);
                this.showSuccess('Quote calculated successfully!');
                console.log('✅ Quote calculation successful');
            } else {
                console.error('❌ Calculation failed:', data.error);
                this.showError(data.error || 'Calculation failed');
            }
        } catch (error) {
            console.error('❌ Calculation error:', error);
            this.showError('Network error occurred: ' + error.message);
        } finally {
            const calculateBtn = document.getElementById('calculate-btn');
            if (calculateBtn) {
                calculateBtn.innerHTML = '<i class="fas fa-calculator me-2"></i>Calculate Quote';
                this.validateForm();
            }
        }
    }

    displayResults(result) {
        console.log('📋 Displaying results:', result);
        
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) {
            console.error('❌ Results div not found');
            return;
        }

        resultsDiv.innerHTML = `
            <div class="result-item">
                <span class="result-label">Book Price:</span>
                <span class="result-value">R$ ${result.book_price.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Profit (${result.profit_percent}%):</span>
                <span class="result-value">R$ ${result.profit.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Shipping Cost:</span>
                <span class="result-value">R$ ${result.shipping_cost.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total (BRL):</span>
                <span class="result-value">R$ ${result.total_brl.toFixed(2)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Shipping Adjustment:</span>
                <span class="result-value">¥${result.shipping_adjustment_jpy}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Final Total (JPY):</span>
                <div class="copy-container flex gap-3 items-center">
                    <span class="result-value">¥${result.total_jpy.toLocaleString()}</span>
                    <button class="px-4 py-2 bg-background-hover border-2 border-white/20 text-white font-semibold rounded-lg hover:border-primary/50 hover:bg-background-card transition-all duration-200" onclick="calculator.copyToClipboard()">
                        <i class="fas fa-copy mr-2"></i>Copy
                    </button>
                    <button class="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200" onclick="calculator.showApprovalModal()">
                        <i class="fas fa-check mr-2"></i>Review & Approve
                    </button>
                </div>
            </div>
            <div class="exchange-info">
                Exchange rate: 1 BRL = ${result.exchange_rate} JPY (${result.rate_source})
            </div>
        `;

        resultsDiv.style.display = 'block';
        
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log('✅ Results displayed successfully');
    }

    async copyToClipboard() {
        if (!this.currentResult) {
            this.showError('No calculation to copy');
            return;
        }

        try {
            // Format current date and time as dd/mm/yyyy - hh:mm
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedDateTime = `${day}/${month}/${year} - ${hours}:${minutes}`;
            
            // Get customer name
            const customerNameElement = document.getElementById('customer-name');
            const clienteName = customerNameElement ? customerNameElement.value.trim() : '';
            
            // Create the message to copy
            const resultYen = `¥${this.currentResult.total_jpy.toLocaleString()}`;
            let messageTooCopy;
            
            if (clienteName) {
                messageTooCopy = `Valor do pedido ${formattedDateTime} - ${clienteName}: ${resultYen}`;
            } else {
                messageTooCopy = `Valor do pedido ${formattedDateTime}: ${resultYen}`;
            }
            
            await navigator.clipboard.writeText(messageTooCopy);
            
            // Visual feedback
            const btnCopy = document.querySelector('.btn-copy');
            if (btnCopy) {
                const originalText = btnCopy.innerHTML;
                btnCopy.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                btnCopy.classList.add('copied');
                
                setTimeout(() => {
                    btnCopy.innerHTML = originalText;
                    btnCopy.classList.remove('copied');
                }, 2000);
            }
            
            this.showSuccess('✅ Valor copiado para a área de transferência!');
            console.log('📋 Copied to clipboard:', messageTooCopy);
            
        } catch (err) {
            // Fallback for older browsers
            const resultYen = `¥${this.currentResult.total_jpy.toLocaleString()}`;
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedDateTime = `${day}/${month}/${year} - ${hours}:${minutes}`;
            
            const customerNameElement = document.getElementById('customer-name');
            const clienteName = customerNameElement ? customerNameElement.value.trim() : '';
            
            let messageTooCopy;
            if (clienteName) {
                messageTooCopy = `Valor do pedido ${formattedDateTime} - ${clienteName}: ${resultYen}`;
            } else {
                messageTooCopy = `Valor do pedido ${formattedDateTime}: ${resultYen}`;
            }
            
            const textArea = document.createElement('textarea');
            textArea.value = messageTooCopy;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showSuccess('✅ Valor copiado para a área de transferência!');
            } catch (fallbackErr) {
                alert('Não foi possível copiar automaticamente. Mensagem: ' + messageTooCopy);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    showApprovalModal() {
        console.log('📋 Showing approval modal...');

        // Check if Bootstrap is available
        if (typeof bootstrap === 'undefined') {
            console.error('❌ Bootstrap is not loaded!');
            this.showError('Modal system not available. Please refresh the page.');
            return;
        }

        if (!this.currentResult) {
            this.showError('No calculation to review');
            return;
        }

        const customerNameElement = document.getElementById('customer-name');
        const bookTitleElement = document.getElementById('book-title');

        const customerName = customerNameElement?.value || '';
        const bookTitle = bookTitleElement?.value || '';

        if (!customerName || !bookTitle) {
            this.showError('Please enter customer name and book title');
            return;
        }

        // Check if modal element exists
        const modalElement = document.getElementById('quoteApprovalModal');
        if (!modalElement) {
            console.error('❌ Modal element not found!');
            this.showError('Modal not found. Please refresh the page.');
            return;
        }

        console.log('✅ Modal element found, populating data...');

        // Populate modal with current result data
        document.getElementById('modal-customer-name').textContent = customerName;
        document.getElementById('modal-book-title').textContent = bookTitle;
        document.getElementById('modal-book-price').textContent = `R$ ${this.currentResult.book_price.toFixed(2)}`;
        document.getElementById('modal-profit').textContent = `R$ ${this.currentResult.profit.toFixed(2)} (${this.currentResult.profit_percent}%)`;
        document.getElementById('modal-shipping').textContent = `R$ ${this.currentResult.shipping_cost.toFixed(2)}`;
        document.getElementById('modal-total-brl').textContent = `R$ ${this.currentResult.total_brl.toFixed(2)}`;
        document.getElementById('modal-shipping-adj').textContent = `¥${this.currentResult.shipping_adjustment_jpy}`;
        document.getElementById('modal-total-jpy').textContent = `¥${this.currentResult.total_jpy.toLocaleString()}`;
        document.getElementById('modal-exchange-rate').textContent = `1 BRL = ${this.currentResult.exchange_rate} JPY (${this.currentResult.rate_source})`;

        console.log('✅ Modal data populated, creating modal instance...');

        // Show the modal
        const modal = new bootstrap.Modal(modalElement);
        console.log('✅ Modal instance created, showing modal...');
        modal.show();

        // Set up the confirm button handler
        const confirmBtn = document.getElementById('confirm-approve-quote');
        if (!confirmBtn) {
            console.error('❌ Confirm button not found!');
            return;
        }

        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            console.log('✅ Approve button clicked, hiding modal and saving...');
            modal.hide();
            this.saveQuote(customerName, bookTitle);
        });

        console.log('✅ Approval modal shown and event handler attached');
    }

    async saveQuote(customerName, bookTitle) {
        console.log('✅ Saving quote...');

        if (!this.currentResult) {
            this.showError('No calculation to save');
            return;
        }

        try {
            console.log('📡 Sending quote save request...');

            const response = await fetch('/api/save-quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: customerName,
                    book_title: bookTitle,
                    book_price: this.currentResult.book_price,
                    profit_percent: this.currentResult.profit_percent,
                    profit: this.currentResult.profit,
                    shipping_cost: this.currentResult.shipping_cost,
                    shipping_adjustment_jpy: this.currentResult.shipping_adjustment_jpy,
                    total_brl: this.currentResult.total_brl,
                    total_jpy: this.currentResult.total_jpy,
                    exchange_rate: this.currentResult.exchange_rate,
                    rate_source: this.currentResult.rate_source
                })
            });

            console.log('📡 Quote save response status:', response.status);

            const data = await response.json();
            console.log('📊 Quote save response data:', data);

            if (data.success) {
                this.showSuccess('Quote saved successfully! It will appear in the Quotes section for final approval. Quote ID: ' + data.quote_id);
                this.clearForm();

                // Refresh customers and assets lists
                await this.loadData();
                this.initializeComboboxes();

                console.log('✅ Quote saved successfully');

                // Navigate to orders page quotes tab after 2 seconds
                setTimeout(() => {
                    window.location.href = '/orders#quotes';
                }, 2000);
            } else {
                console.error('❌ Failed to save quote:', data.error);
                this.showError(data.error || 'Failed to save quote');
            }
        } catch (error) {
            console.error('❌ Save quote error:', error);
            this.showError('Network error occurred: ' + error.message);
        }
    }

    clearForm() {
        console.log('🗑️ Clearing form...');
        
        // Clear all form inputs
        const inputs = ['customer-name', 'book-title', 'book-price', 'shipping-cost', 'custom-profit', 'shipping-adjustment'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Reset shipping dropdown
        const shippingSelect = document.getElementById('shipping-cost');
        if (shippingSelect) {
            shippingSelect.selectedIndex = 0;
        }

        // Hide custom shipping input
        const customShippingInput = document.getElementById('shipping-custom');
        if (customShippingInput) {
            customShippingInput.style.display = 'none';
            customShippingInput.value = '';
            customShippingInput.required = false;
        }

        // Hide results
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }

        // Reset profit editing and display
        if (this.isEditingProfit) {
            this.toggleProfitEdit();
        }

        // Reset profit label to default
        const profitLabel = document.querySelector('.profit-label');
        if (profitLabel) {
            profitLabel.innerHTML = '<i class="fas fa-chart-line me-2"></i>Profit (30%) <span class="text-danger">*</span>';
        }

        // Clear messages
        this.clearMessages();

        this.currentResult = null;
        this.validateForm();
        
        console.log('✅ Form cleared');
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

        // Add to messages container
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.appendChild(messageDiv);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, 5000);
        } else {
            console.warn('⚠️ Messages container not found');
        }
    }

    clearMessages() {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }
}

// Global functions for template access
function switchToCalculator() {
    const calculatorTab = document.getElementById('calculator-tab');
    if (calculatorTab) {
        calculatorTab.click();
    }
}

function switchToOrders() {
    const ordersTab = document.getElementById('orders-tab');
    if (ordersTab) {
        ordersTab.click();
    }
}

function switchToQuotes() {
    const quotesTab = document.getElementById('quotes-tab');
    if (quotesTab) {
        quotesTab.click();
    }
}

// Initialize calculator when DOM is loaded
let calculator;

// Function to ensure calculator is initialized when needed
function ensureCalculatorInitialized() {
    if (!calculator || !calculator.initialized) {
        console.log('📋 Initializing calculator...');
        calculator = new Calculator();
    }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('🔄 DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOMContentLoaded fired, initializing calculator...');
        ensureCalculatorInitialized();
    });
} else {
    console.log('📋 DOM already loaded, initializing calculator immediately...');
    ensureCalculatorInitialized();
}

// Export for global access
window.calculator = calculator;
window.ensureCalculatorInitialized = ensureCalculatorInitialized;