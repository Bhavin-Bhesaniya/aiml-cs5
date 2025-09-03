class ApiService {
    constructor() {
        this.baseUrl = window.location.origin;
        this.token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    removeAuthToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async makeRequest(url, options = {}) {
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}${url}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication APIs
    async register(userData) {
        return this.makeRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.makeRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getProfile() {
        return this.makeRequest('/api/auth/profile');
    }

    // Product APIs
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.makeRequest(`/api/products${queryString ? '?' + queryString : ''}`);
    }

    async getProduct(id) {
        return this.makeRequest(`/api/products/${id}`);
    }

    async getFeaturedProducts() {
        return this.makeRequest('/api/products/featured');
    }

    async getCategories() {
        return this.makeRequest('/api/products/categories');
    }

    // Cart APIs
    async getCart() {
        return this.makeRequest('/api/cart');
    }

    async addToCart(productId, quantity = 1) {
        return this.makeRequest('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async updateCartItem(productId, quantity) {
        return this.makeRequest(`/api/cart/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(productId) {
        return this.makeRequest(`/api/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return this.makeRequest('/api/cart', {
            method: 'DELETE'
        });
    }

    // Wishlist APIs
    async getWishlist() {
        return this.makeRequest('/api/wishlist');
    }

    async addToWishlist(productId) {
        return this.makeRequest('/api/wishlist/add', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    }

    async removeFromWishlist(productId) {
        return this.makeRequest(`/api/wishlist/${productId}`, {
            method: 'DELETE'
        });
    }

    async checkWishlistStatus(productId) {
        return this.makeRequest(`/api/wishlist/check/${productId}`);
    }

    // Order APIs
    async createOrder(orderData) {
        return this.makeRequest('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.makeRequest(`/api/orders${queryString ? '?' + queryString : ''}`);
    }

    async getOrder(id) {
        return this.makeRequest(`/api/orders/${id}`);
    }

    // User APIs
    async updateProfile(userData) {
        return this.makeRequest('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async getAddresses() {
        return this.makeRequest('/api/user/addresses');
    }

    async addAddress(addressData) {
        return this.makeRequest('/api/user/addresses', {
            method: 'POST',
            body: JSON.stringify(addressData)
        });
    }

    async updateAddress(id, addressData) {
        return this.makeRequest(`/api/user/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(addressData)
        });
    }

    async deleteAddress(id) {
        return this.makeRequest(`/api/user/addresses/${id}`, {
            method: 'DELETE'
        });
    }
}

// Create global API instance
const api = new ApiService();
