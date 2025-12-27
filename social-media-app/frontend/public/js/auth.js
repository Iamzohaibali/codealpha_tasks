const API_URL = 'http://localhost:5000/api';

// Store token and user data
const saveAuthData = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const getToken = () => {
    return localStorage.getItem('token');
};

const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const isAuthenticated = () => {
    return !!getToken();
};

// Register function
async function register(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Registration failed');
            return;
        }

        saveAuthData(data.token, data.user);
        window.location.href = '/views/feed.html';
    } catch (error) {
        showError('An error occurred. Please try again.');
    }
}

// Login function
async function login(e) {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Login failed');
            return;
        }

        saveAuthData(data.token, data.user);
        window.location.href = '/views/feed.html';
    } catch (error) {
        showError('An error occurred. Please try again.');
    }
}

// Logout function
function logout() {
    clearAuthData();
    window.location.href = '/views/login.html';
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    const user = getUser();
    const currentPath = window.location.pathname;
    
    // Protected routes that require authentication
    const protectedRoutes = ['/views/feed.html', '/views/profile.html', '/views/create-post.html'];
    
    // Public routes that should redirect if authenticated
    const publicRoutes = ['/views/login.html', '/views/register.html', '/index.html'];
    
    // Check if current route is protected and user is not authenticated
    if (protectedRoutes.some(route => currentPath.includes(route))) {
        if (!token) {
            window.location.href = '/views/login.html';
            return;
        }
        
        // Update UI with user info
        updateUserUI();
    }
    
    // Check if current route is public and user is authenticated
    if (publicRoutes.some(route => currentPath.includes(route))) {
        if (token) {
            window.location.href = '/views/feed.html';
        }
    }
});

// Update UI with user information
function updateUserUI() {
    const user = getUser();
    if (!user) return;
    
    // Update profile picture in navigation
    const profilePicElements = document.querySelectorAll('.profile-pic, .nav-profile-pic');
    profilePicElements.forEach(el => {
        if (user.profilePicture) {
            el.src = user.profilePicture;
        }
    });
    
    // Update username in navigation
    const usernameElements = document.querySelectorAll('.nav-username');
    usernameElements.forEach(el => {
        el.textContent = user.username;
    });
}

// Initialize auth module
window.authModule = {
    register,
    login,
    logout,
    getToken,
    getUser,
    isAuthenticated,
    showError,
    showSuccess,
    API_URL
};