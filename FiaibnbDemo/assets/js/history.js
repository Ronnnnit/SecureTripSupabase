
// Select container matching your HTML
const container = document.querySelector('#history-content');
const emptyHistory = document.querySelector('#empty-history');

function showLoading() {
    // Clear any existing content first
    container.innerHTML = '';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-container';
    loadingDiv.id = 'loading-widget';
    loadingDiv.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading your booking history...</p>
        </div>
    `;
    container.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-widget');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function renderBooking(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = 'history-item';
    bookingDiv.dataset.id = booking.id;
    
    console.log("Full booking data:", booking);
    console.log("Booking ID:", booking.id);
    console.log("User ID:", booking.user_id);
    console.log("Total amount:", booking.total);
    console.log("Booking date:", booking.date);

    // Format date and time
    const bookingDate = new Date(booking.date);
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    };
    
    const formattedDate = bookingDate.toLocaleDateString('en-IN', dateOptions);
    const formattedTime = bookingDate.toLocaleTimeString('en-IN', timeOptions);

    // Format payment date if available
    const paymentDate = booking.paid_at ? new Date(booking.paid_at) : null;
    const formattedPaymentDate = paymentDate ? paymentDate.toLocaleDateString('en-IN', dateOptions) : 'N/A';
    const formattedPaymentTime = paymentDate ? paymentDate.toLocaleTimeString('en-IN', timeOptions) : 'N/A';

    // Payment status styling
    const paymentStatusClass = booking.payment_status === 'Paid' ? 'status-paid' : 'status-pending';
    const paymentStatusIcon = booking.payment_status === 'Paid' ? '✅' : '⏳';

    // Handle both array and string formats for packages
    let packageDetails = '';
    
    if (Array.isArray(booking.packages)) {
        // Original array format
        packageDetails = booking.packages.map(pkg => `
            <div class="history-package">
                <div class="package-image-container">
                    <img src="${pkg.image || '/assets/images/placeholder.jpg'}" alt="${pkg.title || pkg.name}" class="package-image-small" />
                    <div class="package-overlay">
                        <span class="package-quantity">${pkg.quantity || 1}x</span>
                    </div>
                </div>
                <div class="package-details">
                    <h4 class="package-title">${pkg.title || pkg.name}</h4>
                    <p class="package-location">📍 ${pkg.location || 'Location not specified'}</p>
                    <p class="package-duration">⏱️ ${pkg.duration || pkg.id || 1} days</p>
                    <p class="package-price">₹${(pkg.price || 0).toLocaleString('en-IN')}</p>
                </div>
            </div>
        `).join('');
    } else if (typeof booking.packages === 'string') {
        // New text format - display as simple text
        packageDetails = `
            <div class="history-package">
                <div class="package-details">
                    <h4 class="package-title">📦 Packages</h4>
                    <p class="package-location">${booking.packages}</p>
                    <p class="package-price">Total: ₹${booking.total.toLocaleString('en-IN')}</p>
                </div>
            </div>
        `;
    } else {
        // Fallback for unexpected format
        packageDetails = `
            <div class="history-package">
                <div class="package-details">
                    <h4 class="package-title">📦 Package Details</h4>
                    <p class="package-location">Package information not available</p>
                    <p class="package-price">Total: ₹${booking.total.toLocaleString('en-IN')}</p>
                </div>
            </div>
        `;
    }

    bookingDiv.innerHTML = `
        <div class="history-item-header">
            <div class="booking-info">
                <div class="booking-date-time">
                    <div class="booking-date">${formattedDate}</div>
                    <div class="booking-time">${formattedTime}</div>
                </div>
                <div class="booking-details">
                    <div class="booking-id">Booking ID: ${booking.id}</div>
                </div>
            </div>
            <div class="booking-status">
                <div class="total-amount">₹${booking.total.toLocaleString('en-IN')}</div>
                <div class="payment-status ${paymentStatusClass}">
                    ${paymentStatusIcon} ${booking.payment_status || 'Pending'}
                </div>
            </div>
        </div>
        
        <div class="packages-container">
            ${packageDetails}
        </div>
        
        <div class="booking-details-section">
            <div class="details-grid">
                <div class="detail-group">
                    <h4 class="detail-group-title">Trip Details</h4>
                    <div class="detail-item">
                        <span class="detail-label">📍 Pickup Location:</span>
                        <span class="detail-value">${booking.pickup_location || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🚗 Transport Mode:</span>
                        <span class="detail-value">${booking.transport_mode || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🏨 Stay Option:</span>
                        <span class="detail-value">${booking.stay_option || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🛏️ Room Type:</span>
                        <span class="detail-value">${booking.room_type || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👥 Number of Guests:</span>
                        <span class="detail-value">${booking.guests || 'Not specified'}</span>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h4 class="detail-group-title">Payment Information</h4>
                    <div class="detail-item">
                        <span class="detail-label">💳 Payment Method:</span>
                        <span class="detail-value">${booking.payment_method || 'Not specified'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">💰 Total Amount:</span>
                        <span class="detail-value">₹${booking.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📅 Payment Date:</span>
                        <span class="detail-value">${formattedPaymentDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🕐 Payment Time:</span>
                        <span class="detail-value">${formattedPaymentTime}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="history-item-actions">
            <button class="cancel-booking-btn" onclick="cancelBooking('${booking.id}')">Cancel Booking</button>
        </div>
    `;

    container.appendChild(bookingDiv);
}

// Simple function to sort bookings by latest first
function sortBookingsByLatest(bookings) {
    return bookings.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function fetchBookingHistory(userId) {
    console.log('Starting to fetch booking history for userId:', userId);
    showLoading();
    
    // Add a timeout to automatically hide loading if API takes too long
    const loadingTimeout = setTimeout(() => {
        console.log('Loading timeout reached, hiding loading widget');
        hideLoading();
        showTimeoutMessage();
    }, 10000); // 10 seconds timeout
    
    try {
        const apiUrl = `/api/bookings?userId=${userId}`;
        console.log('Fetching from API:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API response status:', response.status);
        console.log('API response headers:', response.headers);
        
        // Clear the timeout since we got a response
        clearTimeout(loadingTimeout);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const bookings = await response.json();
        console.log('Received bookings data:', bookings);
        
        hideLoading();

        if (!bookings || bookings.length === 0) {
            console.log('No bookings found');
            emptyHistory.style.display = 'block';
            emptyHistory.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">H</div>
                    <h3>No Bookings Found</h3>
                    <p>You haven't made any bookings yet. Explore our travel packages to get started.</p>
                    <a href="packages.html" class="cta-button primary">View Packages</a>
                </div>
            `;
            return;
        }
        
        console.log(`Found ${bookings.length} bookings, rendering...`);
        emptyHistory.style.display = 'none';
        
        // Sort bookings by latest first and render
        const sortedBookings = sortBookingsByLatest(bookings);
        console.log('Sorted bookings:', sortedBookings);
        
        sortedBookings.forEach((booking, index) => {
            console.log(`Rendering booking ${index + 1}:`, booking);
            renderBooking(booking);
        });
        
        console.log('All bookings rendered successfully');
        
    } catch (error) {
        console.error('Error in fetchBookingHistory:', error);
        clearTimeout(loadingTimeout);
        hideLoading();
        emptyHistory.style.display = 'block';
        emptyHistory.innerHTML = `
            <div class="error-state">
                <div class="error-icon">T</div>
                <h2>Error Loading History</h2>
                <p>${error.message}</p>
                <p>Please check if the server is running properly</p>
                <button class="retry-btn" onclick="init()">Retry</button>
            </div>
        `;
    }
}
function init() {
    console.log('History page init started');
    
    // Check if user is logged in
    const userData = localStorage.getItem('fairbnb_user');
    console.log('User data from localStorage:', userData);
    
    if (!userData) {
        console.log('No user data found');
        emptyHistory.style.display = 'block';
        emptyHistory.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">A</div>
                <h3>Please Sign In</h3>
                <p>You need to be signed in to view your booking history.</p>
                <a href="signin.html" class="cta-button primary">Sign In</a>
            </div>
        `;
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('Parsed user data:', user);
        
        // Try different possible user ID fields
        let userId = user.id || user._id || user.userId || user.email;
        console.log('Using userId:', userId);
        
        if (!userId) {
            console.log('No valid userId found');
            emptyHistory.style.display = 'block';
            emptyHistory.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">!</div>
                    <h3>User ID Not Found</h3>
                    <p>Unable to identify user. Please try signing in again.</p>
                    <a href="signin.html" class="cta-button primary">Sign In Again</a>
                </div>
            `;
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        // Fetch booking history from API
        fetchBookingHistory(userId);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        emptyHistory.style.display = 'block';
        emptyHistory.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">!</div>
                <h3>Error Loading User Data</h3>
                <p>There was an error loading your user information.</p>
                <a href="signin.html" class="cta-button primary">Sign In Again</a>
                </div>
        `;
    }
}
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?'))return;

    try {
        // Get current user information
        const user = JSON.parse(localStorage.getItem('fairbnb_user') || '{}');
        let userId = user.id || user._id || user.userId || user.email;
        
        if (!userId) {
            throw new Error('User not logged in');
        }

        const response = await fetch(`/api/bookings/${bookingId}?userId=${encodeURIComponent(userId)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to cancel booking');
        }

        showAlert('Booking cancelled successfully', 'info');

        // Remove booking from DOM
        const bookingElem = document.querySelector(`.history-item[data-id="${bookingId}"]`);
        if (bookingElem) bookingElem.remove();

    } catch (err) {
        console.error('Cancel error:', err);
        showAlert('Failed to cancel booking. Please try again.', 'error');
    }
}


// Simple helper function to add packages to cart (if needed)
function addToCart(packageId) {
    // This function should be available from main.js
    if (typeof window.addToCart === 'function') {
        window.addToCart(packageId);
    } else {
        console.log('Add to cart function not available');
    }
}

// Function to show timeout message
function showTimeoutMessage() {
    emptyHistory.style.display = 'block';
    emptyHistory.innerHTML = `
        <div class="error-state">
            <div class="error-icon">T</div>
            <h2>Request Timeout</h2>
            <p>The server is taking too long to respond. This usually means:</p>
            <ul style="text-align: left; margin: 1rem 0; color: var(--secondary-text);">
                <li>The backend server is not running</li>
                <li>The API endpoint is incorrect</li>
                <li>There's a network issue</li>
            </ul>
            <button onclick="init()" class="cta-button">
                Retry
            </button>
        </div>
    `;
}

// Run init when DOM loaded
document.addEventListener('DOMContentLoaded', init);
