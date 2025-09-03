// Main Application Controller
class App {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeApp();
    }

    bindEvents() {
        // Navigation links
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.showPage(page);
            });
        });

        // User dropdown toggle
        const userBtn = document.getElementById('userBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userBtn && userDropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        
        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('show');
            });
        }

        // Modal close events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    initializeApp() {
        // Initialize theme
        themeManager.init();
        
        // Check authentication status
        authManager.checkAuthStatus();
        
        // Load initial data
        productManager.loadCategories();
        productManager.loadFeaturedProducts();
        
        // Show default page
        this.showPage('home');
        
        // Initialize sample data if needed
        this.initializeSampleData();
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Load page-specific data
            this.loadPageData(pageName);
        }

        // Update navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');
    }

    loadPageData(pageName) {
        switch (pageName) {
            case 'categories':
                productManager.loadProducts(productManager.currentFilters);
                break;
            case 'profile':
                if (authManager.isAuthenticated()) {
                    profileManager.loadProfileData();
                } else {
                    authManager.showModal('login');
                    this.showPage('home');
                }
                break;
            case 'cart':
                cartManager.loadCart();
                break;
            case 'payment':
                if (!authManager.isAuthenticated()) {
                    authManager.showModal('login');
                    this.showPage('home');
                    return;
                }
                cartManager.renderCheckoutSummary();
                profileManager.loadAddressesForCheckout();
                break;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    async initializeSampleData() {
        // Add sample categories and products if database is empty
        try {
            const categoriesResponse = await api.getCategories();
            if (categoriesResponse.success && categoriesResponse.categories.length === 0) {
                await this.addSampleData();
            }
        } catch (error) {
            console.log('Could not check for sample data:', error);
        }
    }

    async addSampleData() {
        // This would typically be handled by the backend
        // For now, we'll just ensure the frontend can handle empty states
        console.log('Sample data initialization would happen here');
    }
}

// Utility Functions
function showPage(pageName) {
    if (window.app) {
        window.app.showPage(pageName);
    }
}

function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);

    // Add click to remove
    toast.addEventListener('click', () => toast.remove());
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        const page = e.state?.page || 'home';
        window.app.showPage(page);
    });
    
    // Update browser history when page changes
    const originalShowPage = window.app.showPage;
    window.app.showPage = function(pageName) {
        originalShowPage.call(this, pageName);
        history.pushState({ page: pageName }, '', `#${pageName}`);
    };
    
    // Handle initial hash
    const hash = window.location.hash.slice(1);
    if (hash && ['home', 'categories', 'profile', 'cart', 'payment'].includes(hash)) {
        window.app.showPage(hash);
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred. Please try again.', 'error');
});

// Handle offline/online status
window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showToast('Connection lost. Some features may not work.', 'warning');
});
