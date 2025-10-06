// Global variables
let currentUser = null;
let cart = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    updateCartCount();
    setupMobileNav();
    setupSmoothAnimations();
    setupScrollEffects();
});

// Initialize authentication state
function initializeAuth() {
    const savedUser = localStorage.getItem('fairbnb_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateNavbar();
    }
}

// Update navbar based on auth state
function updateNavbar() {
    const authSection = document.getElementById('auth-section');
    const authLink = document.getElementById('auth-link');
    
    if (currentUser) {
        authSection.innerHTML = `
            <span class="user-name">Hi, ${currentUser.name}</span>
            <a href="#" class="nav-link" onclick="signOut()">Sign Out</a>
        `;
    } else {
        authSection.innerHTML = `
            <a href="signin.html" class="nav-link" id="auth-link">Sign In</a>
        `;
    }
}

// Sign out function
function signOut() {
    localStorage.removeItem('fairbnb_user');
    currentUser = null;
    showAlert('Signed out successfully!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Update cart count in navbar
function updateCartCount() {
    const cartData = localStorage.getItem('fairbnb_cart');
    cart = cartData ? JSON.parse(cartData) : [];
    
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Setup mobile navigation
function setupMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

// Show popup notification messages
function showAlert(message, type = 'info') {
    // Remove existing popup alerts
    const existingAlert = document.querySelector('.popup-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create new popup alert
    const alert = document.createElement('div');
    alert.className = `popup-alert popup-${type}`;
    alert.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div class="popup-message">${message}</div>
            <button class="popup-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to body for fixed positioning
    document.body.appendChild(alert);
    
    // Show animation
    setTimeout(() => {
        alert.classList.add('show');
    }, 100);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.add('hide');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Add to cart function (global)
function addToCart(packageId) {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const existingItem = cart.find(item => item.id === packageId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: packageId,
            title: pkg.title,
            location: pkg.location,
            price: pkg.price,
            image: pkg.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('fairbnb_cart', JSON.stringify(cart));
    updateCartCount();
    showAlert('Package added to cart!', 'success');
}

// Format currency in INR
function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Check if user is logged in
function requireAuth() {
    if (!currentUser) {
        showAlert('Please sign in to access this feature.', 'error');
        setTimeout(() => {
            window.location.href = 'signin.html';
        }, 1500);
        return false;
    }
    return true;
}

// Session management
function saveUserSession(user) {
    currentUser = user;
    localStorage.removeItem('fairbnb_user'); // optional cleanup
    localStorage.setItem('fairbnb_user', JSON.stringify(user));
    updateNavbar();
}   

// Generate unique ID
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Setup smooth animations and interactions
function setupSmoothAnimations() {
    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.cta-button, .btn, .nav-link, .destination-card, .feature-card, .testimonial-card, .package-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('.cta-button, .btn, .quantity-btn, .add-to-cart-btn, .view-details-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
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
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS for ripple animation
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Setup scroll effects and animations
function setupScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.destination-card, .feature-card, .testimonial-card, .package-card, .cart-item, .history-item');
    
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.transitionDelay = `${index * 0.1}s`;
        
        observer.observe(element);
    });

    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }
}
