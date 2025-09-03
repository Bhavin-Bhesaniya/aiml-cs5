class CartManager {
    constructor() {
        this.cartItems = [];
        this.cartCount = 0;
        this.totalAmount = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCart();
        
        // Listen for auth changes
        authManager.onAuthChange((isAuthenticated) => {
            if (isAuthenticated) {
                this.loadCart();
            } else {
                this.clearCartUI();
            }
        });
    }

    bindEvents() {
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                showPage('cart');
                this.loadCart();
            });
        }
    }

    async loadCart() {
        if (!authManager.isAuthenticated()) {
            this.clearCartUI();
            return;
        }

        try {
            const response = await api.getCart();
            if (response.success) {
                this.cartItems = response.cartItems || [];
                this.cartCount = response.itemCount || 0;
                this.totalAmount = response.totalAmount || 0;
                this.updateCartCount();
                this.renderCart();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        if (!authManager.isAuthenticated()) {
            authManager.requireAuth(() => this.addToCart(productId, quantity));
            return;
        }

        try {
            showLoading(true);
            const response = await api.addToCart(productId, quantity);
            if (response.success) {
                showToast('Item added to cart', 'success');
                this.loadCart();
            } else {
                showToast(response.message || 'Failed to add to cart', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to add to cart', 'error');
        } finally {
            showLoading(false);
        }
    }

    async updateCartItem(productId, quantity) {
        if (quantity < 1) {
            this.removeFromCart(productId);
            return;
        }

        try {
            const response = await api.updateCartItem(productId, quantity);
            if (response.success) {
                this.loadCart();
            } else {
                showToast(response.message || 'Failed to update cart', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to update cart', 'error');
        }
    }

    async removeFromCart(productId) {
        try {
            const response = await api.removeFromCart(productId);
            if (response.success) {
                showToast('Item removed from cart', 'info');
                this.loadCart();
            } else {
                showToast(response.message || 'Failed to remove from cart', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to remove from cart', 'error');
        }
    }

    async clearCart() {
        try {
            const response = await api.clearCart();
            if (response.success) {
                showToast('Cart cleared', 'info');
                this.loadCart();
            } else {
                showToast(response.message || 'Failed to clear cart', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to clear cart', 'error');
        }
    }

    updateCartCount() {
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = this.cartCount;
            cartCountElement.style.display = this.cartCount > 0 ? 'flex' : 'none';
        }
    }

    clearCartUI() {
        this.cartItems = [];
        this.cartCount = 0;
        this.totalAmount = 0;
        this.updateCartCount();
        this.renderCart();
    }

    renderCart() {
        const cartContent = document.getElementById('cartContent');
        const cartSummary = document.getElementById('cartSummary');
        
        if (!cartContent) return;

        if (!this.cartItems.length) {
            cartContent.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started!</p>
                    <button class="btn-primary" onclick="showPage('home')">Continue Shopping</button>
                </div>
            `;
            if (cartSummary) cartSummary.innerHTML = '';
            return;
        }

        cartContent.innerHTML = `
            <div class="cart-items">
                ${this.cartItems.map(item => this.createCartItemHTML(item)).join('')}
            </div>
        `;

        if (cartSummary) {
            cartSummary.innerHTML = `
                <div class="cart-summary-content">
                    <h3>Order Summary</h3>
                    <div class="summary-line">
                        <span>Subtotal (${this.cartCount} items):</span>
                        <span>₹${this.totalAmount}</span>
                    </div>
                    <div class="summary-line">
                        <span>Shipping:</span>
                        <span>₹0</span>
                    </div>
                    <div class="summary-line total">
                        <span><strong>Total:</strong></span>
                        <span><strong>₹${this.totalAmount}</strong></span>
                    </div>
                    <button class="btn-primary checkout-btn" onclick="cartManager.proceedToCheckout()">
                        Proceed to Checkout
                    </button>
                    <button class="btn-secondary" onclick="cartManager.clearCart()">
                        Clear Cart
                    </button>
                </div>
            `;
        }
    }

    createCartItemHTML(item) {
        const mainImage = item.images && item.images.length > 0 ? item.images[0] : 
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop';

        const itemTotal = (item.discountPrice || item.price) * item.quantity;

        return `
            <div class="cart-item">
                <img src="${mainImage}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop'">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <div class="cart-item-price">
                        <span class="current-price">₹${item.discountPrice || item.price}</span>
                        ${item.discountPrice ? `<span class="original-price">₹${item.price}</span>` : ''}
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="cartManager.updateCartItem(${item.productId}, ${item.quantity - 1})">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="cartManager.updateCartItem(${item.productId}, ${item.quantity + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="cartManager.removeFromCart(${item.productId})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <strong>₹${itemTotal.toFixed(2)}</strong>
                </div>
            </div>
        `;
    }

    proceedToCheckout() {
        if (!authManager.isAuthenticated()) {
            authManager.requireAuth(() => this.proceedToCheckout());
            return;
        }

        if (!this.cartItems.length) {
            showToast('Your cart is empty', 'warning');
            return;
        }

        showPage('payment');
        this.renderCheckoutSummary();
        profileManager.loadAddressesForCheckout();
    }

    renderCheckoutSummary() {
        const orderSummary = document.getElementById('orderSummary');
        if (!orderSummary) return;

        orderSummary.innerHTML = `
            <div class="order-items">
                ${this.cartItems.map(item => `
                    <div class="order-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">x${item.quantity}</span>
                        <span class="item-price">₹${((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>₹${this.totalAmount}</span>
                </div>
                <div class="total-line">
                    <span>Shipping:</span>
                    <span>₹0</span>
                </div>
                <div class="total-line final">
                    <strong>Total: ₹${this.totalAmount}</strong>
                </div>
            </div>
        `;
    }

    async placeOrder(addressId, paymentMethod = 'razorpay') {
        try {
            showLoading(true);
            const response = await api.createOrder({ addressId, paymentMethod });
            
            if (response.success) {
                showToast('Order placed successfully!', 'success');
                this.loadCart(); // This will clear the cart
                showPage('profile');
                profileManager.showTab('orders');
            } else {
                showToast(response.message || 'Failed to place order', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to place order', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Create global cart manager instance
const cartManager = new CartManager();
