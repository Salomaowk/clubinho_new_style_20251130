// Global filter state
let currentStatusFilter = 'all';

// Orders management functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Orders JS loaded');

    // Set default date to today for new orders
    const orderDateInput = document.getElementById('orderDate');
    if (orderDateInput) {
        const today = new Date().toISOString().split('T')[0];
        orderDateInput.value = today;
    }

    // Initialize sticky action section detection
    initializeStickyActionSection();
});

// Detect when action section becomes sticky and add visual effect
function initializeStickyActionSection() {
    const actionSection = document.querySelector('.action-section');
    if (!actionSection) return;

    // Use Intersection Observer to detect when element sticks
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.intersectionRatio < 1) {
            // Element is partially out of view (sticky active)
            actionSection.classList.add('sticky-active');
        } else {
            // Element is fully in view
            actionSection.classList.remove('sticky-active');
        }
    }, {
        threshold: [1]
    });

    observer.observe(actionSection);
}

// Search functionality (combined with status filter)
function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const orderCards = document.querySelectorAll('.order-card');

    orderCards.forEach(card => {
        const searchText = card.getAttribute('data-search-text');
        const cardStatus = card.dataset.status;

        // Check both search term and status filter
        const matchesSearch = !searchTerm || (searchText && searchText.includes(searchTerm));
        const matchesStatus = currentStatusFilter === 'all' || cardStatus === currentStatusFilter;

        if (matchesSearch && matchesStatus) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Open add modal
function openAddModal() {
    console.log('➕ Opening add modal');
    
    // Reset form
    document.getElementById('orderForm').reset();
    
    // Set modal title and action
    document.getElementById('orderModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>Add New Order';
    document.getElementById('orderAction').value = 'add';
    document.getElementById('orderSubmitBtn').innerHTML = '<i class="fas fa-save me-2"></i>Save Order';
    
    // Set default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    
    // Clear order ID
    document.getElementById('orderIdInput').value = '';
}

// Edit order function
function editOrder(orderId, customerName, assetName, orderDate, orderReal, orderIen, freteBrasil, freteJp, totalValue, deliveryDate, paymentType) {
    console.log('✏️ Editing order:', orderId, 'Asset:', assetName);
    
    // Set modal title and action
    document.getElementById('orderModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Order';
    document.getElementById('orderAction').value = 'edit';
    document.getElementById('orderSubmitBtn').innerHTML = '<i class="fas fa-save me-2"></i>Update Order';
    
    // Populate form fields
    document.getElementById('orderIdInput').value = orderId;
    
    // Handle customer input
    const customerInput = document.getElementById('orderCustomerName');
    if (customerInput && customerName) {
        customerInput.value = customerName;
        console.log('Set customer value to:', customerName);
    }

    // Handle asset input
    const assetInput = document.getElementById('orderAssetName');
    if (assetInput && assetName) {
        assetInput.value = assetName;
        console.log('Set asset value to:', assetName);
    }
    
    // Format date properly for HTML date input (YYYY-MM-DD)
    let formattedDate = '';
    if (orderDate) {
        // Check if date is in MM/DD/YYYY format and convert to YYYY-MM-DD
        if (orderDate.includes('/')) {
            const parts = orderDate.split('/');
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
            }
        } else if (orderDate.includes('-')) {
            formattedDate = orderDate; // Already in YYYY-MM-DD format
        }
    }
    
    // Set all other field values
    document.getElementById('orderDate').value = formattedDate;
    document.getElementById('orderReal').value = orderReal || '';
    document.getElementById('orderIen').value = orderIen || '';
    document.getElementById('freteBrasil').value = freteBrasil || '';
    document.getElementById('freteJp').value = freteJp || '';
    document.getElementById('totalValue').value = totalValue || '';
    document.getElementById('deliveryDate').value = deliveryDate || '';
    document.getElementById('paymentType').value = paymentType || '';
    
    console.log('✅ All fields populated');
}

// Delete order function
function deleteOrder(orderId, customerName) {
    console.log('🗑️ Deleting order:', orderId);
    
    // Set form data
    document.getElementById('deleteOrderId').value = orderId;
    document.getElementById('deleteOrderCustomer').textContent = customerName || 'Unknown Customer';
    
    // Show the modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    deleteModal.show();
}

// Switch to calculator tab
function switchToCalculator() {
    console.log('🧮 Switching to calculator tab');
    const calculatorTab = document.getElementById('calculator-tab');
    if (calculatorTab) {
        calculatorTab.click();
    }
}

// Switch to orders tab  
function switchToOrders() {
    console.log('📋 Switching to orders tab');
    const ordersTab = document.getElementById('orders-tab');
    if (ordersTab) {
        ordersTab.click();
    }
}

// Function to refresh orders data
async function refreshOrdersData() {
    try {
        // Reload the page to refresh orders data
        window.location.reload();
    } catch (error) {
        console.error('Error refreshing orders:', error);
    }
}

// Make it globally available
window.refreshOrdersData = refreshOrdersData;

// Add event listener for edit buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-edit')) {
        const btn = e.target.closest('.btn-edit');
        const orderId = btn.dataset.orderId;
        const customerName = btn.dataset.customerName;
        const assetName = btn.dataset.assetName;
        const orderDate = btn.dataset.orderDate;
        const orderReal = btn.dataset.orderReal;
        const orderIen = btn.dataset.orderIen;
        const freteBrasil = btn.dataset.freteBrasil;
        const freteJp = btn.dataset.freteJp;
        const totalValue = btn.dataset.totalValue;
        const deliveryDate = btn.dataset.deliveryDate;
        const paymentType = btn.dataset.paymentType;
        
        editOrder(orderId, customerName, assetName, orderDate, orderReal, orderIen, freteBrasil, freteJp, totalValue, deliveryDate, paymentType);
    }
});

// Batch selection functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize checkbox event listeners
    initializeBatchSelection();
    initializeBatchEditForm();
});

function initializeBatchSelection() {
    // Listen for checkbox changes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('order-select-checkbox')) {
            updateBatchControls();
        }
    });

    // Batch edit button - with better error handling
    const batchEditBtn = document.getElementById('batchEditBtn');
    if (batchEditBtn) {
        batchEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔧 Batch Edit clicked');
            openBatchEditModal();
        });
    }

    // Clear selection button
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🗑️ Clear Selection clicked');
            clearAllSelections();
        });
    }
}

function updateBatchControls() {
    const checkboxes = document.querySelectorAll('.order-select-checkbox');
    const checkedBoxes = document.querySelectorAll('.order-select-checkbox:checked');
    const batchControls = document.getElementById('batchControls');
    const selectedCount = document.getElementById('selectedCount');

    if (checkedBoxes.length > 0) {
        batchControls.style.display = 'block';
        batchControls.classList.remove('hide');
        selectedCount.textContent = checkedBoxes.length;
        document.body.classList.add('batch-controls-visible');
    } else {
        batchControls.classList.add('hide');
        setTimeout(() => {
            if (document.querySelectorAll('.order-select-checkbox:checked').length === 0) {
                batchControls.style.display = 'none';
                document.body.classList.remove('batch-controls-visible');
            }
        }, 300);
    }
}

function clearAllSelections() {
    const checkboxes = document.querySelectorAll('.order-select-checkbox:checked');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    updateBatchControls();
}

function openBatchEditModal() {
    console.log('📝 Opening batch edit modal');
    const checkedBoxes = document.querySelectorAll('.order-select-checkbox:checked');

    if (checkedBoxes.length === 0) {
        console.warn('⚠️ No orders selected');
        return;
    }

    console.log('✅ Found', checkedBoxes.length, 'selected orders');

    // Collect order IDs
    const orderIds = Array.from(checkedBoxes).map(checkbox => {
        console.log('Order ID:', checkbox.dataset.orderId);
        return checkbox.dataset.orderId;
    });

    // Update modal content
    const batchOrderCount = document.getElementById('batchOrderCount');
    const batchOrderIds = document.getElementById('batchOrderIds');
    const batchDeliveryDate = document.getElementById('batchDeliveryDate');
    const batchPaymentType = document.getElementById('batchPaymentType');

    if (batchOrderCount) batchOrderCount.textContent = checkedBoxes.length;
    if (batchOrderIds) batchOrderIds.value = orderIds.join(',');
    if (batchDeliveryDate) batchDeliveryDate.value = '';
    if (batchPaymentType) batchPaymentType.value = '';

    console.log('📤 Order IDs to update:', orderIds.join(','));

    // Show modal
    const batchEditModalElement = document.getElementById('batchEditModal');
    if (batchEditModalElement) {
        try {
            const batchModal = new bootstrap.Modal(batchEditModalElement, {
                backdrop: 'static',  // Prevent closing when clicking outside
                keyboard: false      // Prevent closing with Escape key
            });
            batchModal.show();

            // Handle modal hidden event - preserve selections when modal closes
            batchEditModalElement.addEventListener('hidden.bs.modal', function() {
                console.log('✅ Batch edit modal closed, selections preserved');
            }, { once: true });

            console.log('✅ Batch edit modal opened successfully');
        } catch (error) {
            console.error('❌ Error opening modal:', error);
        }
    } else {
        console.error('❌ Batch edit modal element not found');
    }
}

// Initialize batch edit form handling
function initializeBatchEditForm() {
    const batchEditForm = document.getElementById('batchEditForm');
    const batchEditModalElement = document.getElementById('batchEditModal');

    if (!batchEditForm || !batchEditModalElement) return;

    // Handle modal close button - ensure backdrop is removed
    const closeButton = batchEditModalElement.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            // Ensure modal is properly hidden and backdrop removed
            const bsModal = bootstrap.Modal.getInstance(batchEditModalElement);
            if (bsModal) {
                bsModal.hide();
            }
            // Force remove backdrop if it's stuck
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            // Restore body scrolling
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Handle cancel button
    const cancelButton = batchEditModalElement.querySelector('button[data-bs-dismiss="modal"]');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }, 100);
        });
    }

    // Listen for modal hidden event to cleanup
    batchEditModalElement.addEventListener('hidden.bs.modal', function() {
        console.log('🔄 Modal hidden event fired');
        // Remove any lingering backdrops
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }, 100);
    });

    // Form submission
    batchEditForm.addEventListener('submit', function(e) {
        e.preventDefault();

        console.log('📤 Batch edit form submitted');

        const formData = new FormData(this);
        const action = formData.get('action');
        const orderIds = formData.get('order_ids');
        const deliveryDate = formData.get('delivery_date');
        const paymentType = formData.get('payment_type');

        console.log('Form data:', { action, orderIds, deliveryDate, paymentType });

        // Submit form normally (server will handle redirect)
        this.submit();
    });
}

// Status filter functionality
function filterByStatus(status) {
    console.log('🔍 Filtering by status:', status);

    currentStatusFilter = status;

    // Update button states
    document.querySelectorAll('.status-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });

    // Filter order cards
    const orderCards = document.querySelectorAll('.order-card');
    let visibleCount = 0;

    orderCards.forEach(card => {
        const cardStatus = card.dataset.status;

        if (status === 'all' || cardStatus === status) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease-in';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    console.log(`✅ Showing ${visibleCount} orders with status: ${status}`);
}

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
