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

    // Handle #calculator hash in URL - scroll to calculator section
    if (window.location.hash === '#calculator') {
        // Wait for page to fully load including calculator section
        setTimeout(() => {
            const calculatorSection = document.querySelector('.calculator-container');
            if (calculatorSection) {
                calculatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Flash highlight effect
                calculatorSection.style.transition = 'box-shadow 0.3s ease';
                calculatorSection.style.boxShadow = '0 0 0 4px var(--primary-light)';
                setTimeout(() => {
                    calculatorSection.style.boxShadow = '';
                }, 1000);
            }
        }, 500);
    }
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

// Search functionality
function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const orderCards = document.querySelectorAll('.order-card');

    orderCards.forEach(card => {
        const searchText = card.getAttribute('data-search-text');
        if (searchText && searchText.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter orders by status
function filterOrders(status) {
    console.log('🔍 Filtering orders by:', status);

    const orderCards = document.querySelectorAll('.order-card');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Update active button
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Filter orders
    orderCards.forEach(card => {
        if (status === 'all') {
            card.style.display = 'block';
            return;
        }

        // Check order status based on delivery_date
        const hasDeliveryDate = card.querySelector('[data-delivery-date]');
        const statusBadge = card.querySelector('.inline-flex.items-center.gap-2');

        let orderStatus = 'pending';
        if (statusBadge) {
            if (statusBadge.textContent.includes('Delivered')) {
                orderStatus = 'delivered';
            } else if (statusBadge.textContent.includes('Processing')) {
                orderStatus = 'processing';
            }
        }

        if (orderStatus === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Make filterOrders globally available
window.filterOrders = filterOrders;

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
    initializeBatchDeleteForm();
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

    // Batch delete button
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🗑️ Batch Delete clicked');
            window.openBatchDeleteModal();
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

// Open batch delete modal - Make it globally accessible
window.openBatchDeleteModal = function() {
    console.log('🗑️ Opening batch delete modal');
    const checkedBoxes = document.querySelectorAll('.order-select-checkbox:checked');

    if (checkedBoxes.length === 0) {
        console.warn('⚠️ No orders selected');
        return;
    }

    console.log('✅ Found', checkedBoxes.length, 'selected orders');

    // Collect order IDs and customer names
    const orderData = Array.from(checkedBoxes).map(checkbox => ({
        id: checkbox.dataset.orderId,
        customer: checkbox.dataset.customerName
    }));

    // Update modal content
    const batchDeleteOrderCount = document.getElementById('batchDeleteOrderCount');
    const batchDeleteOrderIds = document.getElementById('batchDeleteOrderIds');
    const batchDeleteOrderList = document.getElementById('batchDeleteOrderList');

    console.log('🔍 Element check:');
    console.log('  - batchDeleteOrderCount:', batchDeleteOrderCount);
    console.log('  - batchDeleteOrderIds:', batchDeleteOrderIds);
    console.log('  - batchDeleteOrderList:', batchDeleteOrderList);

    if (batchDeleteOrderCount) {
        batchDeleteOrderCount.textContent = checkedBoxes.length;
        console.log('✅ Set order count to:', checkedBoxes.length);
    }

    const orderIdsString = orderData.map(o => o.id).join(',');
    if (batchDeleteOrderIds) {
        batchDeleteOrderIds.value = orderIdsString;
        console.log('✅ Set order IDs to:', orderIdsString);
        console.log('✅ Verified input value:', batchDeleteOrderIds.value);
    } else {
        console.error('❌ batchDeleteOrderIds element not found!');
    }

    // Build order list
    if (batchDeleteOrderList) {
        batchDeleteOrderList.innerHTML = orderData.map(order => `
            <div class="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
                <i class="fas fa-shopping-cart text-primary"></i>
                <div>
                    <div class="text-white font-semibold">Order #${order.id}</div>
                    <div class="text-gray-400 text-sm">${order.customer || 'Unknown Customer'}</div>
                </div>
            </div>
        `).join('');
    }

    console.log('📤 Order IDs to delete:', orderData.map(o => o.id).join(','));

    // Show modal
    const batchDeleteModalElement = document.getElementById('batchDeleteModal');
    if (batchDeleteModalElement) {
        try {
            const batchModal = new bootstrap.Modal(batchDeleteModalElement, {
                backdrop: 'static',
                keyboard: false
            });
            batchModal.show();

            // Handle modal hidden event
            batchDeleteModalElement.addEventListener('hidden.bs.modal', function() {
                console.log('✅ Batch delete modal closed');
            }, { once: true });

            console.log('✅ Batch delete modal opened successfully');
        } catch (error) {
            console.error('❌ Error opening modal:', error);
        }
    } else {
        console.error('❌ Batch delete modal element not found');
    }
};

// Initialize batch delete form handling
function initializeBatchDeleteForm() {
    const batchDeleteForm = document.getElementById('batchDeleteForm');
    const batchDeleteModalElement = document.getElementById('batchDeleteModal');

    if (!batchDeleteForm || !batchDeleteModalElement) return;

    // Handle modal close button
    const closeButton = batchDeleteModalElement.querySelector('[data-bs-dismiss="modal"]');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const bsModal = bootstrap.Modal.getInstance(batchDeleteModalElement);
            if (bsModal) {
                bsModal.hide();
            }
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Listen for modal hidden event
    batchDeleteModalElement.addEventListener('hidden.bs.modal', function() {
        console.log('🔄 Batch delete modal hidden event fired');
        setTimeout(() => {
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }, 100);
    });

    // Form submission
    batchDeleteForm.addEventListener('submit', function(e) {
        e.preventDefault();

        console.log('📤 Batch delete form submitted');

        const formData = new FormData(this);
        const action = formData.get('action');
        const orderIds = formData.get('order_ids');

        console.log('Form data:', { action, orderIds });

        // Submit form normally (server will handle redirect)
        this.submit();
    });
}
