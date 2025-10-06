// Confirmation page functionality
let bookingData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    loadBookingDetails();
});

// Load user from localStorage
function loadCurrentUser() {
    const userData = localStorage.getItem('fairbnb_user');
    currentUser = userData ? JSON.parse(userData) : null;
    
    if (!currentUser) {
        showAlert('Please sign in to view booking details.', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
        return;
    }
}

// Load booking details from URL parameter
async function loadBookingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    if (!bookingId) {
        showAlert('No booking ID provided.', 'error');
        setTimeout(() => {
            window.location.href = 'history.html';
        }, 1500);
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch booking details');
        }
        
        bookingData = await response.json();
        renderBookingDetails();
        
    } catch (error) {
        console.error('Error loading booking details:', error);
        showAlert('Failed to load booking details. Please try again.', 'error');
        setTimeout(() => {
            window.location.href = 'history.html';
        }, 2000);
    }
}

// Render booking details
function renderBookingDetails() {
    if (!bookingData) return;
    
    // Hide loading section and show content
    document.getElementById('loading-section').style.display = 'none';
    document.getElementById('confirmation-content').style.display = 'block';
    
    // Populate booking information
    document.getElementById('booking-id').textContent = bookingData._id;
    document.getElementById('booking-date').textContent = formatDate(bookingData.date);
    document.getElementById('payment-status').textContent = bookingData.payment_status || 'Pending';
    document.getElementById('payment-method').textContent = bookingData.payment_method || 'N/A';
    document.getElementById('payment-date').textContent = bookingData.paid_at ? formatDate(bookingData.paid_at) : 'N/A';
    
    // Populate trip details
    document.getElementById('pickup-location').textContent = bookingData.pickup_location || 'N/A';
    document.getElementById('transport-mode').textContent = bookingData.transport_mode || 'N/A';
    document.getElementById('stay-option').textContent = bookingData.stay_option || 'N/A';
    document.getElementById('room-type').textContent = bookingData.room_type || 'N/A';
    document.getElementById('guests').textContent = bookingData.guests || 'N/A';
    
    // Populate packages
    renderPackages();
    
    // Populate payment summary
    document.getElementById('subtotal').textContent = formatCurrency(bookingData.total);
    document.getElementById('total-paid').textContent = formatCurrency(bookingData.total);
}

// Render packages list
function renderPackages() {
    const packagesContainer = document.getElementById('packages-list');
    
    if (!bookingData.packages || bookingData.packages.length === 0) {
        packagesContainer.innerHTML = '<p>No packages found.</p>';
        return;
    }
    
    // Handle both array and string formats for packages
    if (Array.isArray(bookingData.packages)) {
        // Original array format
        packagesContainer.innerHTML = bookingData.packages.map(pkg => `
            <div class="package-item">
                <img src="${pkg.image || '/assets/images/placeholder.jpg'}" alt="${pkg.title || pkg.name}">
                <div class="package-details">
                    <h4>${pkg.title || pkg.name}</h4>
                    <p>${pkg.location || 'Location not specified'}</p>
                    <p>Quantity: ${pkg.quantity || 1}</p>
                </div>
                <div class="package-price">
                    <div class="price">${formatCurrency((pkg.price || 0) * (pkg.quantity || 1))}</div>
                </div>
            </div>
        `).join('');
    } else if (typeof bookingData.packages === 'string') {
        // New text format - display as simple text
        packagesContainer.innerHTML = `
            <div class="package-item">
                <div class="package-details">
                    <h4>📦 Packages</h4>
                    <p>${bookingData.packages}</p>
                    <p>Total: ${formatCurrency(bookingData.total)}</p>
                </div>
            </div>
        `;
    } else {
        // Fallback for unexpected format
        packagesContainer.innerHTML = `
            <div class="package-item">
                <div class="package-details">
                    <h4>📦 Package Details</h4>
                    <p>Package information not available</p>
                    <p>Total: ${formatCurrency(bookingData.total)}</p>
                </div>
            </div>
        `;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency in INR
function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}
