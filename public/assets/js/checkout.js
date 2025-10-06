// Checkout page functionality
let selectedPaymentMethod = null;
let currentBookingId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentUser();
    loadCart();
    renderCheckoutSummary();
    setupPaymentMethods();
    setupFormValidation();
});

// Load user from localStorage
function loadCurrentUser() {
    const userData = localStorage.getItem('fairbnb_user');
    currentUser = userData ? JSON.parse(userData) : null;
    
    if (!currentUser) {
        showAlert('Please sign in to proceed with checkout.', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
        return;
    }
}

// Load cart from localStorage
function loadCart() {
    const cartData = localStorage.getItem('fairbnb_cart');
    cart = cartData ? JSON.parse(cartData) : [];
    
    if (cart.length === 0) {
        showAlert('Your cart is empty. Please add items to proceed.', 'error');
        setTimeout(() => {
            window.location.href = 'packages.html';
        }, 1500);
        return;
    }
}

// Render checkout summary
function renderCheckoutSummary() {
    const packagesContainer = document.getElementById('checkout-packages');
    const subtotalElement = document.getElementById('checkout-subtotal');
    const totalElement = document.getElementById('checkout-total');
    
    let subtotal = 0;
    
    packagesContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="package-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="package-details">
                    <h4>${item.title}</h4>
                    <p>${item.location}</p>
                    <p>Quantity: ${item.quantity} × ${formatCurrency(item.price)}</p>
                </div>
            </div>
        `;
    }).join('');
    
    subtotalElement.textContent = formatCurrency(subtotal);
    totalElement.textContent = formatCurrency(subtotal);
    
    // Update UPI amount
    document.getElementById('upi-amount').textContent = formatCurrency(subtotal);
}

// Setup payment method selection
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    const cardForm = document.getElementById('card-form');
    const upiForm = document.getElementById('upi-form');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            // Remove selected class from all methods
            paymentMethods.forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked method
            method.classList.add('selected');
            
            // Get selected method
            selectedPaymentMethod = method.dataset.method;
            
            // Show/hide payment forms
            cardForm.classList.toggle('active', selectedPaymentMethod === 'card');
            upiForm.classList.toggle('active', selectedPaymentMethod === 'upi');
            
            // Enable checkout button
            checkoutBtn.disabled = false;
        });
    });
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('checkout-form');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedPaymentMethod) {
            showAlert('Please select a payment method.', 'error');
            return;
        }
        
        // Validate form fields
        const formData = new FormData(form);
        const bookingData = {
            pickup_location: formData.get('pickup_location'),
            transport_mode: formData.get('transport_mode'),
            stay_option: formData.get('stay_option'),
            room_type: formData.get('room_type'),
            guests: parseInt(formData.get('guests'))
        };
        
        // Validate required fields
        for (const [key, value] of Object.entries(bookingData)) {
            if (!value) {
                showAlert(`Please fill in the ${key.replace('_', ' ')} field.`, 'error');
                return;
            }
        }
        
        // Validate payment method specific fields
        if (selectedPaymentMethod === 'card') {
            if (!validateCardDetails()) {
                return;
            }
        }
        
        // Process payment
        await processPayment(bookingData);
    });
}

// Validate card details
function validateCardDetails() {
    const cardNumber = document.getElementById('card_number').value;
    const expiryDate = document.getElementById('expiry_date').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholder_name').value;
    
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        showAlert('Please fill in all card details.', 'error');
        return false;
    }
    
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length < 16) {
        showAlert('Please enter a valid card number.', 'error');
        return false;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showAlert('Please enter expiry date in MM/YY format.', 'error');
        return false;
    }
    
    if (cvv.length < 3) {
        showAlert('Please enter a valid CVV.', 'error');
        return false;
    }
    
    return true;
}

// Process payment
async function processPayment(bookingData) {
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';
    
    try {
        // Debug: Check currentUser and cart
        console.log('Current User:', currentUser);
        console.log('Cart:', cart);
        
        if (!currentUser) {
            throw new Error('User not logged in');
        }
        
        // If user doesn't have ID, try to get it from server using email
        let userId = currentUser.id;
        if (!userId && currentUser.email) {
            console.log('User ID missing, fetching from server using email...');
            try {
                const userResponse = await fetch(`/api/auth/user-id?email=${encodeURIComponent(currentUser.email)}`);
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.userId;
                    // Update the currentUser object with the ID
                    currentUser.id = userId;
                    // Save updated user to localStorage
                    localStorage.setItem('fairbnb_user', JSON.stringify(currentUser));
                    console.log('User ID retrieved and saved:', userId);
                } else {
                    throw new Error('Could not retrieve user ID from server');
                }
            } catch (error) {
                console.error('Error fetching user ID:', error);
                throw new Error('Could not retrieve user ID. Please login again.');
            }
        }
        
        if (!userId) {
            throw new Error('User ID not available. Please login again.');
        }
        
        if (!cart || cart.length === 0) {
            throw new Error('Cart is empty. Please add items to cart before checkout.');
        }
        
        // First, create the booking
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const booking = {
            userId: userId, // Use the resolved userId
            packages: [...cart],
            total: total,
            ...bookingData
        };
        
        console.log('Booking data being sent:', booking);
        
        const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        
        if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json();
            console.error('Booking creation failed:', errorData);
            throw new Error(errorData.error || errorData.message || 'Failed to create booking');
        }
        
        const bookingResult = await bookingResponse.json();
        currentBookingId = bookingResult.bookingId;
        
        // Process payment based on selected method
        if (selectedPaymentMethod === 'card') {
            await processCardPayment();
        } else if (selectedPaymentMethod === 'upi') {
            await processUPIPayment();
        }
        
    } catch (error) {
        console.error('Payment processing error:', error);
        showAlert('Payment failed. Please try again.', 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Complete Payment';
    }
}

// Process card payment
async function processCardPayment() {
    // Show OTP modal
    showOTPModal();
}

// Process UPI payment
async function processUPIPayment() {
    try {
        console.log('Processing UPI payment for booking:', currentBookingId);
        
        // Generate UPI QR code
        const upiResponse = await fetch('/api/payments/upi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                bookingId: currentBookingId
            })
        });
        
        if (!upiResponse.ok) {
            const errorData = await upiResponse.json();
            throw new Error(errorData.error || 'Failed to generate UPI QR code');
        }
        
        const upiData = await upiResponse.json();
        console.log('UPI QR generated:', upiData);
        
        // Show UPI QR code modal
        showUPIQROModal(upiData);
        
    } catch (error) {
        console.error('UPI payment error:', error);
        showAlert('UPI payment failed. Please try again.', 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Complete Payment';
    }
}

// Show UPI QR modal
function showUPIQROModal(upiData) {
    // Create or update UPI QR modal
    let modal = document.getElementById('upi-qr-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'upi-qr-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>UPI Payment</h3>
                <div class="upi-qr-container">
                    <img src="${upiData.qrCode.url}" alt="UPI QR Code" class="upi-qr-code">
                    <div class="upi-details">
                        <p><strong>Amount:</strong> ₹${upiData.qrCode.amount}</p>
                        <p><strong>Merchant:</strong> ${upiData.qrCode.merchantName}</p>
                        <p><strong>UPI ID:</strong> ${upiData.qrCode.upiId}</p>
                    </div>
                    <div class="upi-instructions">
                        <h4>Instructions:</h4>
                        <ol>
                            ${upiData.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>
                    <button id="confirm-upi-payment" class="btn btn-primary">I have paid</button>
                    <button id="cancel-upi-payment" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close').onclick = () => modal.style.display = 'none';
        modal.querySelector('#cancel-upi-payment').onclick = () => {
            modal.style.display = 'none';
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Complete Payment';
        };
        modal.querySelector('#confirm-upi-payment').onclick = () => confirmUPIPayment(upiData.payment.paymentId);
    }
    
    modal.style.display = 'block';
}

// Confirm UPI payment
async function confirmUPIPayment(paymentId) {
    try {
        console.log('Confirming UPI payment:', paymentId);
        
        const confirmResponse = await fetch('/api/payments/upi/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                bookingId: currentBookingId,
                paymentId: paymentId
            })
        });
        
        if (!confirmResponse.ok) {
            const errorData = await confirmResponse.json();
            throw new Error(errorData.error || 'Failed to confirm UPI payment');
        }
        
        const confirmData = await confirmResponse.json();
        console.log('UPI payment confirmed:', confirmData);
        
        // Close modal
        document.getElementById('upi-qr-modal').style.display = 'none';
        
        showAlert('UPI payment successful!', 'success');
        redirectToConfirmation();
        
    } catch (error) {
        console.error('UPI confirmation error:', error);
        showAlert('Payment confirmation failed. Please try again.', 'error');
    }
}

// Show OTP modal
function showOTPModal() {
    const modal = document.getElementById('otp-modal');
    const otpInput = document.getElementById('otp-input');
    
    modal.classList.add('active');
    otpInput.focus();
    
    // Clear previous input
    otpInput.value = '';
}

// Close OTP modal
function closeOTPModal() {
    const modal = document.getElementById('otp-modal');
    modal.classList.remove('active');
    
    // Reset checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Complete Payment';
}

// Verify OTP
async function verifyOTP() {
    const otpInput = document.getElementById('otp-input');
    const enteredOTP = otpInput.value;
    
    if (!enteredOTP) {
        showAlert('Please enter the OTP.', 'error');
        return;
    }
    
    // Fixed OTP for demo (12345 as per server)
    if (enteredOTP === '12345') {
        try {
            console.log('Processing card payment for booking:', currentBookingId);
            
            const cardResponse = await fetch('/api/payments/card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    bookingId: currentBookingId,
                    amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    cardDetails: 'Demo Card',
                    otp: enteredOTP
                })
            });
            
            if (!cardResponse.ok) {
                const errorData = await cardResponse.json();
                throw new Error(errorData.error || 'Failed to process card payment');
            }
            
            const cardData = await cardResponse.json();
            console.log('Card payment successful:', cardData);
            
            closeOTPModal();
            showAlert('Payment successful!', 'success');
            redirectToConfirmation();
        } catch (error) {
            console.error('Payment update error:', error);
            showAlert('Payment verification failed. Please try again.', 'error');
        }
    } else {
        showAlert('Invalid OTP. Please enter 12345.', 'error');
        otpInput.value = '';
        otpInput.focus();
    }
}

// Update payment status
async function updatePaymentStatus(status, method) {
    if (!currentBookingId) {
        throw new Error('No booking ID available');
    }
    
    const response = await fetch(`/api/bookings/${currentBookingId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            payment_status: status,
            payment_method: method
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to update payment status');
    }
    
    return response.json();
}

// Redirect to confirmation page
function redirectToConfirmation() {
    // Clear cart
    cart = [];
    localStorage.setItem('fairbnb_cart', JSON.stringify(cart));
    updateCartCount();
    
    // Redirect to confirmation page
    setTimeout(() => {
        window.location.href = `confirmation.html?bookingId=${currentBookingId}`;
    }, 2000);
}

// Format card number input
document.addEventListener('DOMContentLoaded', () => {
    const cardNumberInput = document.getElementById('card_number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date input
    const expiryInput = document.getElementById('expiry_date');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Format CVV input
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Handle Enter key in OTP input
    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
        otpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyOTP();
            }
        });
    }
});
