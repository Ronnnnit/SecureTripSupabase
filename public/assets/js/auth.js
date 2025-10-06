// Authentication functionality
document.addEventListener('DOMContentLoaded', () => {
    setupAuthForms();
});

// Setup authentication forms
function setupAuthForms() {
    const signinForm = document.getElementById('signin-form');
    const registerForm = document.getElementById('register-form');
    
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle sign in
async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    clearErrorMessages();

    // Validation
    if (!validateEmail(email)) {
        showAuthMessage('Enter a valid email', 'error');
        return;
    }

    if (!password) {
        showAuthMessage('Password is required', 'error');
        return;
    }

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        // Save session and redirect
        //console.log("The User data is: ",data.user)
        //console.log("The Data of the User data: ",data);
        saveUserSession(data.user);
        showAuthMessage('Welcome back!', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (err) {
        showAuthMessage(err.message, 'error');
    }
}


// Handle registration
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    clearErrorMessages();

    // Validation
    let isValid = true;
    if (!name) {
        showFieldError('name', 'Name is required');
        isValid = false;
    }
    if (!validateEmail(email)) {
        showFieldError('email', 'Enter a valid email address');
        isValid = false;
    }
    if (password.length < 6) {
        showFieldError('password', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password !== confirmPassword) {
        showFieldError('confirm-password', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) return;

    // Send data to backend
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        // Check response
        console.log("Response status:", res.status); // 🔍 Add this line
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // Save session and redirect
        saveUserSession(data.user); // Use the user data returned from server
        showAuthMessage('Account created successfully!', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (err) {
        showAuthMessage(err.message, 'error');
        console.error("Registration error:", err);
        showAuthMessage(err.message || 'Something went wrong', 'error');
    }
}

// Show authentication message
function showAuthMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    
    // Insert before form
    const form = document.querySelector('.auth-form form');
    form.parentNode.insertBefore(messageDiv, form);
}

// Show field-specific error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// Clear all error messages
function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
