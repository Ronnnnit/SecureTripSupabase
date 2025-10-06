// API Debug Console JavaScript - Live Activity Logger
const API_BASE_URL = 'http://localhost:3000';
let currentUserId = null;
let currentBookingId = null;
let liveLoggingInterval = null;
let isLiveLoggingEnabled = false;
let logCount = 0;
let lastLogTimestamp = null;

// Console logging functions
function logToConsole(message, type = 'info', source = 'SYSTEM') {
    const console = document.getElementById('responseConsole');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    
    logEntry.className = `console-${type}`;
    logEntry.innerHTML = `[${timestamp}] [${source}] ${message}`;
    
    console.appendChild(logEntry);
    console.scrollTop = console.scrollHeight;
    
    // Limit console to 100 entries to prevent memory issues
    const entries = console.querySelectorAll('div');
    if (entries.length > 100) {
        entries[0].remove();
    }
}

function clearConsole() {
    document.getElementById('responseConsole').innerHTML = '<p>Live API activity logs will appear here...</p>';
    logCount = 0;
}

// Live Activity Logging functionality
function toggleAutoRefresh() {
    const toggleBtn = document.getElementById('refreshToggleBtn');
    const logStatus = document.getElementById('logStatus');
    const indicator = document.getElementById('refreshIndicator');
    
    if (isLiveLoggingEnabled) {
        // Stop live logging
        clearInterval(liveLoggingInterval);
        isLiveLoggingEnabled = false;
        toggleBtn.textContent = 'Start Live Logs';
        toggleBtn.classList.remove('active');
        logStatus.textContent = '🔴 Live logging stopped';
        logStatus.classList.remove('live');
        indicator.textContent = 'Live Logs: OFF';
        indicator.classList.remove('active');
        logToConsole('🛑 Essential monitoring stopped', 'warning');
    } else {
        // Start live logging
        isLiveLoggingEnabled = true;
        toggleBtn.textContent = 'Stop Live Logs';
        toggleBtn.classList.add('active');
        logStatus.textContent = '🟢 Live logging active';
        logStatus.classList.add('live');
        indicator.textContent = 'Live Logs: ON';
        indicator.classList.add('active');
            logToConsole('🚀 Essential monitoring started - tracking bookings, cancellations, and session tokens', 'success');
        
        // Start monitoring every 2 seconds for real-time activity
        liveLoggingInterval = setInterval(() => {
            monitorServerActivity();
        }, 2000);
        
        // Initial activity check
        monitorServerActivity();
    }
}

async function monitorServerActivity() {
    if (!isLiveLoggingEnabled) return;
    
    // Only monitor essential activities
    if (currentUserId) {
        // Monitor bookings and history for logged-in users
        await monitorEssentialEndpoint(`/api/bookings?userId=${currentUserId}`, 'BOOKINGS');
        await monitorEssentialEndpoint(`/api/history?userId=${currentUserId}`, 'HISTORY');
    } else {
        logToConsole('ℹ️ No user logged in - monitoring session tokens only', 'info', 'MONITOR');
    }
    
    // Always monitor DevRev token generation (essential for functionality)
    await testDevRevEndpoint();
}

async function monitorEndpointActivity(endpoint, source) {
    try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
            const data = await response.json();
            const dataSize = JSON.stringify(data).length;
            logToConsole(`📊 ${endpoint} - Status: ${response.status} | Response time: ${responseTime}ms | Data size: ${dataSize} bytes`, 'info', source);
        } else {
            logToConsole(`⚠️ ${endpoint} - Error ${response.status}: ${response.statusText}`, 'warning', source);
        }
    } catch (error) {
        logToConsole(`❌ ${endpoint} - Connection failed: ${error.message}`, 'error', source);
    }
}

async function monitorEssentialEndpoint(endpoint, source) {
    try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
            const data = await response.json();
            const dataSize = JSON.stringify(data).length;
            logToConsole(`📊 ${source} - Status: ${response.status} | Response time: ${responseTime}ms | Data size: ${dataSize} bytes`, 'info', source);
            } else {
            logToConsole(`⚠️ ${source} - Error ${response.status}: ${response.statusText}`, 'warning', source);
        }
    } catch (error) {
        logToConsole(`❌ ${source} - Connection failed: ${error.message}`, 'error', source);
    }
}

async function testDevRevEndpoint() {
    try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/generate-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: "test@example.com",
                display_name: "Test User"
            })
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response.ok) {
            const data = await response.json();
            logToConsole(`🔑 Session Token Generated - Status: ${response.status} | Response time: ${responseTime}ms`, 'success', 'SESSION');
        } else {
            logToConsole(`⚠️ Session Token Error - ${response.status}: ${response.statusText}`, 'warning', 'SESSION');
        }
    } catch (error) {
        logToConsole(`❌ Session Token Failed - ${error.message}`, 'error', 'SESSION');
    }
}

// Generic API call function
async function makeApiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        logToConsole(`Making ${method} request to ${endpoint}`, 'info');
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const responseData = await response.json();
        
        if (response.ok) {
            logToConsole(`✅ Success: ${JSON.stringify(responseData, null, 2)}`, 'success');
            return responseData;
        } else {
            logToConsole(`❌ Error: ${JSON.stringify(responseData, null, 2)}`, 'error');
            return null;
        }
    } catch (error) {
        logToConsole(`🚨 Network Error: ${error.message}`, 'error');
        return null;
    }
}

// User Management Tests
async function testUserRegistration() {
    const userData = {
        name: "API Debug User",
        email: `debug-${Date.now()}@example.com`,
        password: "password123"
    };
    
    const response = await makeApiCall('/api/register', 'POST', userData);
    if (response && response.userId) {
        currentUserId = response.userId;
        logToConsole(`User registered with ID: ${currentUserId}`, 'success');
    }
}

async function testUserLogin() {
    const loginData = {
        email: "ronitmunde7@gmail.com",
        password: "123456"
    };
    
    const response = await makeApiCall('/api/login', 'POST', loginData);
    if (response && response.user) {
        currentUserId = response.user.id;
        logToConsole(`User logged in with ID: ${currentUserId}`, 'success');
        
        // Save to localStorage for session persistence
        localStorage.setItem('fairbnb_user', JSON.stringify(response.user));
        logToConsole('✅ User session saved - user-specific endpoints will now be monitored', 'success', 'AUTH');
    }
}

async function testGetUserById() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    await makeApiCall(`/api/users/${currentUserId}`);
}

// Package Tests
async function testGetPackages() {
    const response = await makeApiCall('/api/packages');
    if (response && Array.isArray(response)) {
        logToConsole(`Found ${response.length} packages`, 'success');
    }
}

async function testGetPackageById() {
    await makeApiCall('/api/packages/1');
}

// Booking Tests
async function testCreateBooking() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    const bookingData = {
        userId: currentUserId,
        packages: [
            {
                id: "pkg_debug_test",
                name: "Debug Test Package",
                price: 2500,
                quantity: 1
            }
        ],
        total: 2500,
        pickup_location: "Debug Airport",
        transport_mode: "Flight",
        stay_option: "Hotel",
        room_type: "Deluxe",
        guests: 2,
        start_date: "2025-10-15",
        end_date: "2025-10-22"
    };
    
    const response = await makeApiCall('/api/bookings', 'POST', bookingData);
    if (response && response.bookingId) {
        currentBookingId = response.bookingId;
        logToConsole(`Booking created with ID: ${currentBookingId}`, 'success');
    }
}

async function testGetBookings() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    const response = await makeApiCall(`/api/bookings?userId=${currentUserId}`);
    if (response && Array.isArray(response)) {
        logToConsole(`Found ${response.length} bookings for user`, 'success');
    }
}

async function testDeleteBooking() {
    if (!currentBookingId) {
        logToConsole('No booking ID available. Please create a booking first.', 'warning');
        return;
    }
    
    const response = await makeApiCall(`/api/bookings/${currentBookingId}?userId=${currentUserId}`, 'DELETE');
    if (response) {
        logToConsole(`Booking ${currentBookingId} deleted successfully`, 'success');
        currentBookingId = null;
    }
}

// Payment Tests
async function testCardPayment() {
    if (!currentUserId || !currentBookingId) {
        logToConsole('User ID and Booking ID required for payment test.', 'warning');
        return;
    }
    
    const paymentData = {
        userId: currentUserId,
        bookingId: currentBookingId,
        amount: 2500,
        cardDetails: "Debug Test Card",
        otp: "12345"
    };
    
    await makeApiCall('/api/payments/card', 'POST', paymentData);
}

async function testUPIPayment() {
    if (!currentUserId || !currentBookingId) {
        logToConsole('User ID and Booking ID required for payment test.', 'warning');
        return;
    }
    
    const paymentData = {
        userId: currentUserId,
        bookingId: currentBookingId,
        amount: 2500
    };
    
    await makeApiCall('/api/payments/upi', 'POST', paymentData);
}

async function testPaymentHistory() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    const response = await makeApiCall(`/api/history?userId=${currentUserId}`);
    if (response && Array.isArray(response)) {
        logToConsole(`Found ${response.length} payment records`, 'success');
    }
}

// Cart Tests
async function testGetCart() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    await makeApiCall(`/api/cart?userId=${currentUserId}`);
}

async function testAddToCart() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    const cartData = {
        userId: currentUserId,
        items: [
            {
                id: "pkg_cart_test",
                name: "Cart Test Package",
                price: 1500,
                quantity: 2
            }
        ],
        total: 3000
    };
    
    await makeApiCall('/api/cart', 'POST', cartData);
}

async function testUpdateCart() {
    if (!currentUserId) {
        logToConsole('No user ID available. Please register or login first.', 'warning');
        return;
    }
    
    const cartData = {
        userId: currentUserId,
        items: [
            {
                id: "pkg_cart_update",
                name: "Updated Cart Package",
                price: 2000,
                quantity: 1
            }
        ],
        total: 2000
    };
    
    await makeApiCall('/api/cart', 'PUT', cartData);
}

// DevRev Integration Tests
async function testDevRevToken() {
    const tokenData = {
        email: "ronitmunde7@gmail.com",
        display_name: "Ronnit"
    };
    
    const response = await makeApiCall('/generate-token', 'POST', tokenData);
    if (response && response.session_token) {
        logToConsole('DevRev token generated successfully', 'success');
    }
}

// Check for logged in user
function checkUserSession() {
    try {
        const userData = localStorage.getItem('fairbnb_user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.id) {
                currentUserId = user.id;
                logToConsole(`👤 User detected: ${user.name || user.email} (ID: ${user.id})`, 'success', 'AUTH');
                return true;
            }
        }
    } catch (error) {
        logToConsole('⚠️ Error reading user session', 'warning', 'AUTH');
    }
    return false;
}

// Monitor for important events (bookings, cancellations, payments)
function logImportantEvent(eventType, details) {
    const timestamp = new Date().toLocaleTimeString();
    let icon = '📋';
    let color = 'info';
    
    switch(eventType) {
        case 'BOOKING_CREATED':
            icon = '✅';
            color = 'success';
            break;
        case 'BOOKING_CANCELLED':
            icon = '❌';
            color = 'warning';
            break;
        case 'PAYMENT_SUCCESS':
            icon = '💰';
            color = 'success';
            break;
        case 'PAYMENT_FAILED':
            icon = '💸';
            color = 'error';
            break;
        case 'SESSION_STARTED':
            icon = '🔐';
            color = 'success';
            break;
        case 'SESSION_EXPIRED':
            icon = '🔓';
            color = 'warning';
            break;
    }
    
    logToConsole(`${icon} ${eventType}: ${details}`, color, 'EVENT');
}

// Initialize debug console
document.addEventListener('DOMContentLoaded', function() {
    logToConsole('🚀 Essential Activity Monitor initialized', 'success', 'SYSTEM');
    logToConsole('📡 Monitoring: Bookings, Cancellations, Session Tokens', 'info', 'SYSTEM');
    logToConsole('💡 Click "Start Live Logs" to begin monitoring', 'info', 'SYSTEM');
    
    // Check for existing user session
    if (checkUserSession()) {
        logToConsole('✅ User session found - will monitor bookings & cancellations', 'success', 'AUTH');
    } else {
        logToConsole('ℹ️ No user session - monitoring session tokens only', 'info', 'AUTH');
    }
    
    // Add click event to auto-refresh indicator
    const refreshIndicator = document.getElementById('refreshIndicator');
    if (refreshIndicator) {
        refreshIndicator.style.cursor = 'pointer';
        refreshIndicator.addEventListener('click', toggleAutoRefresh);
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearConsole();
        }
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            toggleAutoRefresh();
        }
    });
    
    // Auto-start live logging after 3 seconds
    setTimeout(() => {
        logToConsole('⚡ Auto-starting essential monitoring...', 'info', 'SYSTEM');
        toggleAutoRefresh();
    }, 3000);
});

// Export functions for global access
window.testUserRegistration = testUserRegistration;
window.testUserLogin = testUserLogin;
window.testGetUserById = testGetUserById;
window.testGetPackages = testGetPackages;
window.testGetPackageById = testGetPackageById;
window.testCreateBooking = testCreateBooking;
window.testGetBookings = testGetBookings;
window.testDeleteBooking = testDeleteBooking;
window.testCardPayment = testCardPayment;
window.testUPIPayment = testUPIPayment;
window.testPaymentHistory = testPaymentHistory;
window.testGetCart = testGetCart;
window.testAddToCart = testAddToCart;
window.testUpdateCart = testUpdateCart;
window.testDevRevToken = testDevRevToken;
window.clearConsole = clearConsole;
window.toggleAutoRefresh = toggleAutoRefresh;
