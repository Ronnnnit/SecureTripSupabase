//let currentUser1 = null; // Declare globally
// Cart page functionality
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();
    loadCurrentUser();
});

// Load cart from localStorage
function loadCart() {
    const cartData = localStorage.getItem('fairbnb_cart');
    cart = cartData ? JSON.parse(cartData) : [];
}

// Load user from localStorage
function loadCurrentUser() {
    const userData = localStorage.getItem('fairbnb_user');
    currentUser1 = userData ? JSON.parse(userData) : null;
}
// Render cart items
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartContent = document.querySelector('.cart-content');
    const emptyCart = document.getElementById('empty-cart');
    
    if (cart.length === 0) {
        cartContent.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    cartContent.style.display = 'grid';
    emptyCart.style.display = 'none';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.title}</h3>
                <p>${item.location}</p>
                <p class="cart-item-price">${formatCurrency(item.price)}</p>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateCartSummary();
}

// Update item quantity
function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
        return;
    }
    
    saveCart();
    renderCart();
    updateCartCount();
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    renderCart();
    updateCartCount();
    showAlert('Item removed from cart', 'info');
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        renderCart();
        updateCartCount();
        showAlert('Cart cleared successfully', 'info');
    }
}

// Update cart summary
function updateCartSummary() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const total = subtotal; // Add taxes/fees here if needed
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('total').textContent = formatCurrency(total);
    
    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = cart.length === 0;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('fairbnb_cart', JSON.stringify(cart));
}

// Proceed to checkout
function proceedToCheckout() {
    if (!requireAuth()) return;

    if (cart.length === 0) {
        showAlert('Your cart is empty', 'error');
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

