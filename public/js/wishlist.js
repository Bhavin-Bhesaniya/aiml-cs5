class WishlistManager {
    constructor() {
        this.wishlistItems = [];
        this.wishlistCount = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadWishlist();
        
        // Listen for auth changes
        authManager.onAuthChange((isAuthenticated) => {
            if (isAuthenticated) {
                this.loadWishlist();
            } else {
                this.clearWishlistUI();
            }
        });
    }

    bindEvents() {
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                if (authManager.isAuthenticated()) {
                    showPage('profile');
                    profileManager.showTab('wishlist');
                } else {
                    authManager.requireAuth(() => {
                        showPage('profile');
                        profileManager.showTab('wishlist');
                    });
                }
            });
        }
    }

    async loadWishlist() {
        if (!authManager.isAuthenticated()) {
            this.clearWishlistUI();
            return;
        }

        try {
            const response = await api.getWishlist();
            if (response.success) {
                this.wishlistItems = response.wishlistItems || [];
                this.wishlistCount = response.itemCount || 0;
                this.updateWishlistCount();
            }
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        }
    }

    async addToWishlist(productId) {
        if (!authManager.isAuthenticated()) {
            authManager.requireAuth(() => this.addToWishlist(productId));
            return;
        }

        try {
            const response = await api.addToWishlist(productId);
            if (response.success) {
                showToast('Added to wishlist', 'success');
                this.loadWishlist();
            } else {
                showToast(response.message || 'Failed to add to wishlist', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to add to wishlist', 'error');
        }
    }

    async removeFromWishlist(productId) {
        try {
            const response = await api.removeFromWishlist(productId);
            if (response.success) {
                showToast('Removed from wishlist', 'info');
                this.loadWishlist();
                this.renderWishlist(); // Refresh the wishlist display
            } else {
                showToast(response.message || 'Failed to remove from wishlist', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to remove from wishlist', 'error');
        }
    }

    async toggleWishlist(productId) {
        if (!authManager.isAuthenticated()) {
            authManager.requireAuth(() => this.toggleWishlist(productId));
            return;
        }

        try {
            const response = await api.checkWishlistStatus(productId);
            if (response.success) {
                if (response.inWishlist) {
                    this.removeFromWishlist(productId);
                } else {
                    this.addToWishlist(productId);
                }
            }
        } catch (error) {
            // If we can't check status, try to add (API will handle duplicates)
            this.addToWishlist(productId);
        }
    }

    updateWishlistCount() {
        const wishlistCountElement = document.getElementById('wishlistCount');
        if (wishlistCountElement) {
            wishlistCountElement.textContent = this.wishlistCount;
            wishlistCountElement.style.display = this.wishlistCount > 0 ? 'flex' : 'none';
        }
    }

    clearWishlistUI() {
        this.wishlistItems = [];
        this.wishlistCount = 0;
        this.updateWishlistCount();
        this.renderWishlist();
    }

    renderWishlist() {
        const wishlistTab = document.getElementById('wishlistTab');
        if (!wishlistTab) return;

        if (!this.wishlistItems.length) {
            wishlistTab.innerHTML = `
                <div class="empty-wishlist">
                    <i class="fas fa-heart" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>Your wishlist is empty</h3>
                    <p>Save items you love for later!</p>
                    <button class="btn-primary" onclick="showPage('home')">Continue Shopping</button>
                </div>
            `;
            return;
        }

        wishlistTab.innerHTML = `
            <h3>My Wishlist (${this.wishlistCount} items)</h3>
            <div class="wishlist-grid">
                ${this.wishlistItems.map(item => this.createWishlistItemHTML(item)).join('')}
            </div>
        `;
    }

    createWishlistItemHTML(item) {
        const mainImage = item.images && item.images.length > 0 ? item.images[0] : 
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop';

        const rating = parseFloat(item.rating || 0);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        return `
            <div class="wishlist-item">
                <img src="${mainImage}" alt="${item.name}" class="wishlist-item-image"
                     onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'">
                <div class="wishlist-item-details">
                    <h4 class="wishlist-item-name">${item.name}</h4>
                    <div class="wishlist-item-rating">
                        <span class="rating-stars">${stars}</span>
                        <span class="rating-text">${rating} (${item.reviewCount || 0})</span>
                    </div>
                    <div class="wishlist-item-price">
                        <span class="current-price">₹${item.discountPrice || item.price}</span>
                        ${item.discountPrice ? `<span class="original-price">₹${item.price}</span>` : ''}
                    </div>
                    <div class="wishlist-item-actions">
                        <button class="btn-primary" onclick="cartManager.addToCart(${item.productId})">
                            Add to Cart
                        </button>
                        <button class="btn-secondary" onclick="wishlistManager.removeFromWishlist(${item.productId})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async moveToCart(productId) {
        await cartManager.addToCart(productId);
        await this.removeFromWishlist(productId);
    }
}

// Create global wishlist manager instance
const wishlistManager = new WishlistManager();
