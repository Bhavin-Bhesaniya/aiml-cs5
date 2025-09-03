class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Modal controls
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const logoutLink = document.getElementById('logoutLink');

        if (loginLink) loginLink.addEventListener('click', () => this.showModal('login'));
        if (registerLink) registerLink.addEventListener('click', () => this.showModal('register'));
        if (showRegister) showRegister.addEventListener('click', () => this.showModal('register'));
        if (showLogin) showLogin.addEventListener('click', () => this.showModal('login'));
        if (logoutLink) logoutLink.addEventListener('click', this.handleLogout.bind(this));

        // Close modals
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', this.closeModals.bind(this));
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await api.getProfile();
                if (response.success) {
                    this.setUser(response.user, token);
                } else {
                    this.clearAuth();
                }
            } catch (error) {
                this.clearAuth();
            }
        } else {
            this.updateAuthUI(false);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            showLoading(true);
            const response = await api.login(credentials);
            
            if (response.success) {
                this.setUser(response.user, response.token);
                this.closeModals();
                showToast('Login successful!', 'success');
                e.target.reset();
            } else {
                showToast(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
        } finally {
            showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            password: formData.get('password')
        };

        try {
            showLoading(true);
            const response = await api.register(userData);
            
            if (response.success) {
                this.setUser(response.user, response.token);
                this.closeModals();
                showToast('Registration successful!', 'success');
                e.target.reset();
            } else {
                showToast(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            showLoading(false);
        }
    }

    handleLogout() {
        this.clearAuth();
        showToast('Logged out successfully', 'info');
        // Redirect to home page
        showPage('home');
    }

    setUser(user, token) {
        this.currentUser = user;
        api.setAuthToken(token);
        this.updateAuthUI(true);
        this.notifyAuthCallbacks();
    }

    clearAuth() {
        this.currentUser = null;
        api.removeAuthToken();
        this.updateAuthUI(false);
        this.notifyAuthCallbacks();
    }

    updateAuthUI(isAuthenticated) {
        const userName = document.getElementById('userName');
        const authLinks = document.getElementById('authLinks');
        const userLinks = document.getElementById('userLinks');

        if (isAuthenticated && this.currentUser) {
            if (userName) {
                userName.textContent = this.currentUser.firstName || this.currentUser.username;
            }
            if (authLinks) authLinks.classList.add('hidden');
            if (userLinks) userLinks.classList.remove('hidden');
        } else {
            if (userName) userName.textContent = 'Account';
            if (authLinks) authLinks.classList.remove('hidden');
            if (userLinks) userLinks.classList.add('hidden');
        }
    }

    showModal(type) {
        this.closeModals();
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    isAuthenticated() {
        return !!this.currentUser && !!api.token;
    }

    requireAuth(callback) {
        if (this.isAuthenticated()) {
            callback();
        } else {
            showToast('Please login to continue', 'warning');
            this.showModal('login');
        }
    }

    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    notifyAuthCallbacks() {
        this.authCallbacks.forEach(callback => {
            callback(this.isAuthenticated(), this.currentUser);
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();
