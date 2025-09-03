class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.addresses = [];
        this.orders = [];
        this.init();
    }

    init() {
        this.bindEvents();
        
        // Listen for auth changes
        authManager.onAuthChange((isAuthenticated, user) => {
            if (isAuthenticated && user) {
                this.currentUser = user;
                this.loadProfileData();
            } else {
                this.currentUser = null;
            }
        });
    }

    bindEvents() {
        // Profile navigation
        document.querySelectorAll('.profile-nav .nav-item').forEach(navItem => {
            navItem.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Profile links in header
        const profileLink = document.getElementById('profileLink');
        const ordersLink = document.getElementById('ordersLink');

        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                showPage('profile');
                this.showTab('profile');
            });
        }

        if (ordersLink) {
            ordersLink.addEventListener('click', (e) => {
                e.preventDefault();
                showPage('profile');
                this.showTab('orders');
            });
        }

        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', this.handlePlaceOrder.bind(this));
        }
    }

    showTab(tabName) {
        // Update navigation
        document.querySelectorAll('.profile-nav .nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const activeNav = document.querySelector(`[data-tab="${tabName}"]`);
        const activeTab = document.getElementById(`${tabName}Tab`);

        if (activeNav) activeNav.classList.add('active');
        if (activeTab) activeTab.classList.add('active');

        // Load specific tab data
        switch (tabName) {
            case 'profile':
                this.renderProfileForm();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'wishlist':
                wishlistManager.renderWishlist();
                break;
            case 'addresses':
                this.loadAddresses();
                break;
        }
    }

    async loadProfileData() {
        if (!authManager.isAuthenticated()) return;

        try {
            const response = await api.getProfile();
            if (response.success) {
                this.currentUser = response.user;
                this.updateProfileName();
                this.renderProfileForm();
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    updateProfileName() {
        const profileName = document.getElementById('profileName');
        if (profileName && this.currentUser) {
            const name = this.currentUser.firstName && this.currentUser.lastName ? 
                `${this.currentUser.firstName} ${this.currentUser.lastName}` : 
                this.currentUser.username;
            profileName.textContent = name;
        }
    }

    renderProfileForm() {
        const profileTab = document.getElementById('profileTab');
        if (!profileTab || !this.currentUser) return;

        profileTab.innerHTML = `
            <h3>Profile Information</h3>
            <form id="profileForm" onsubmit="profileManager.handleProfileUpdate(event)">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" value="${this.currentUser.username || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" value="${this.currentUser.email || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value="${this.currentUser.firstName || ''}">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value="${this.currentUser.lastName || ''}">
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" value="${this.currentUser.phone || ''}">
                </div>
                <button type="submit" class="btn-primary">Update Profile</button>
            </form>
        `;
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const profileData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone')
        };

        try {
            showLoading(true);
            const response = await api.updateProfile(profileData);
            if (response.success) {
                showToast('Profile updated successfully', 'success');
                this.loadProfileData();
            } else {
                showToast(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            showLoading(false);
        }
    }

    async loadOrders() {
        try {
            const response = await api.getOrders();
            if (response.success) {
                this.orders = response.orders || [];
                this.renderOrders();
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    }

    renderOrders() {
        const ordersTab = document.getElementById('ordersTab');
        if (!ordersTab) return;

        if (!this.orders.length) {
            ordersTab.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here!</p>
                    <button class="btn-primary" onclick="showPage('home')">Start Shopping</button>
                </div>
            `;
            return;
        }

        ordersTab.innerHTML = `
            <h3>Your Orders</h3>
            <div class="orders-list">
                ${this.orders.map(order => this.createOrderHTML(order)).join('')}
            </div>
        `;
    }

    createOrderHTML(order) {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const statusColors = {
            'pending': 'warning',
            'confirmed': 'info',
            'shipped': 'info',
            'delivered': 'success',
            'cancelled': 'error'
        };

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Order #${order.id}</h4>
                        <p>Placed on ${orderDate}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusColors[order.status] || 'info'}">${order.status}</span>
                        <span class="order-total">₹${order.totalAmount}</span>
                    </div>
                </div>
                <div class="order-items">
                    ${order.items ? order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.images && item.images[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop'}" 
                                 alt="${item.name}" class="order-item-image">
                            <div class="order-item-details">
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity">Qty: ${item.quantity}</span>
                                <span class="item-price">₹${item.price}</span>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
                <div class="order-address">
                    <p><strong>Delivery Address:</strong></p>
                    <p>${order.fullName}<br>
                       ${order.addressLine1}<br>
                       ${order.city}, ${order.state} ${order.zipCode}</p>
                </div>
            </div>
        `;
    }

    async loadAddresses() {
        try {
            const response = await api.getAddresses();
            if (response.success) {
                this.addresses = response.addresses || [];
                this.renderAddresses();
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
        }
    }

    renderAddresses() {
        const addressesTab = document.getElementById('addressesTab');
        if (!addressesTab) return;

        addressesTab.innerHTML = `
            <div class="addresses-header">
                <h3>Your Addresses</h3>
                <button class="btn-primary" onclick="profileManager.showAddressForm()">Add New Address</button>
            </div>
            <div class="addresses-list">
                ${this.addresses.map(address => this.createAddressHTML(address)).join('')}
            </div>
            <div id="addressForm" class="address-form hidden"></div>
        `;
    }

    createAddressHTML(address) {
        return `
            <div class="address-card ${address.isDefault ? 'default-address' : ''}">
                <div class="address-header">
                    <h4>${address.fullName} ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}</h4>
                    <div class="address-actions">
                        <button class="btn-sm" onclick="profileManager.editAddress(${address.id})">Edit</button>
                        <button class="btn-sm btn-danger" onclick="profileManager.deleteAddress(${address.id})">Delete</button>
                    </div>
                </div>
                <div class="address-details">
                    <p>${address.addressLine1}</p>
                    ${address.addressLine2 ? `<p>${address.addressLine2}</p>` : ''}
                    <p>${address.city}, ${address.state} ${address.zipCode}</p>
                    <p>${address.country}</p>
                    <p><strong>Type:</strong> ${address.type}</p>
                </div>
            </div>
        `;
    }

    showAddressForm(address = null) {
        const addressForm = document.getElementById('addressForm');
        if (!addressForm) return;

        const isEditing = !!address;
        addressForm.classList.remove('hidden');
        addressForm.innerHTML = `
            <h4>${isEditing ? 'Edit' : 'Add New'} Address</h4>
            <form onsubmit="profileManager.handleAddressSubmit(event, ${address ? address.id : 'null'})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="addressType">Type</label>
                        <select id="addressType" name="type" required>
                            <option value="home" ${address?.type === 'home' ? 'selected' : ''}>Home</option>
                            <option value="work" ${address?.type === 'work' ? 'selected' : ''}>Work</option>
                            <option value="other" ${address?.type === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="addressFullName">Full Name</label>
                    <input type="text" id="addressFullName" name="fullName" value="${address?.fullName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="addressLine1">Address Line 1</label>
                    <input type="text" id="addressLine1" name="addressLine1" value="${address?.addressLine1 || ''}" required>
                </div>
                <div class="form-group">
                    <label for="addressLine2">Address Line 2 (Optional)</label>
                    <input type="text" id="addressLine2" name="addressLine2" value="${address?.addressLine2 || ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="city">City</label>
                        <input type="text" id="city" name="city" value="${address?.city || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="state">State</label>
                        <input type="text" id="state" name="state" value="${address?.state || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="zipCode">ZIP Code</label>
                        <input type="text" id="zipCode" name="zipCode" value="${address?.zipCode || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="country">Country</label>
                    <input type="text" id="country" name="country" value="${address?.country || 'India'}" required>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="isDefault" ${address?.isDefault ? 'checked' : ''}>
                        Set as default address
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">${isEditing ? 'Update' : 'Add'} Address</button>
                    <button type="button" class="btn-secondary" onclick="profileManager.hideAddressForm()">Cancel</button>
                </div>
            </form>
        `;
    }

    hideAddressForm() {
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.classList.add('hidden');
        }
    }

    async handleAddressSubmit(e, addressId) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const addressData = {
            type: formData.get('type'),
            fullName: formData.get('fullName'),
            addressLine1: formData.get('addressLine1'),
            addressLine2: formData.get('addressLine2'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            country: formData.get('country'),
            isDefault: formData.has('isDefault')
        };

        try {
            showLoading(true);
            let response;
            if (addressId) {
                response = await api.updateAddress(addressId, addressData);
            } else {
                response = await api.addAddress(addressData);
            }

            if (response.success) {
                showToast(`Address ${addressId ? 'updated' : 'added'} successfully`, 'success');
                this.hideAddressForm();
                this.loadAddresses();
            } else {
                showToast(response.message || 'Failed to save address', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to save address', 'error');
        } finally {
            showLoading(false);
        }
    }

    editAddress(addressId) {
        const address = this.addresses.find(addr => addr.id === addressId);
        if (address) {
            this.showAddressForm(address);
        }
    }

    async deleteAddress(addressId) {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            showLoading(true);
            const response = await api.deleteAddress(addressId);
            if (response.success) {
                showToast('Address deleted successfully', 'success');
                this.loadAddresses();
            } else {
                showToast(response.message || 'Failed to delete address', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to delete address', 'error');
        } finally {
            showLoading(false);
        }
    }

    async loadAddressesForCheckout() {
        await this.loadAddresses();
        this.renderAddressSelection();
    }

    renderAddressSelection() {
        const addressSelection = document.getElementById('addressSelection');
        if (!addressSelection) return;

        if (!this.addresses.length) {
            addressSelection.innerHTML = `
                <p>No addresses found. Please add an address first.</p>
                <button class="btn-primary" onclick="showPage('profile'); profileManager.showTab('addresses')">
                    Add Address
                </button>
            `;
            return;
        }

        addressSelection.innerHTML = this.addresses.map(address => `
            <label class="address-option">
                <input type="radio" name="selectedAddress" value="${address.id}" 
                       ${address.isDefault ? 'checked' : ''}>
                <div class="address-card">
                    <h4>${address.fullName}</h4>
                    <p>${address.addressLine1}</p>
                    ${address.addressLine2 ? `<p>${address.addressLine2}</p>` : ''}
                    <p>${address.city}, ${address.state} ${address.zipCode}</p>
                </div>
            </label>
        `).join('');
    }

    handlePlaceOrder() {
        const selectedAddress = document.querySelector('input[name="selectedAddress"]:checked');
        const paymentMethod = document.querySelector('input[name="payment"]:checked');

        if (!selectedAddress) {
            showToast('Please select a delivery address', 'warning');
            return;
        }

        if (!paymentMethod) {
            showToast('Please select a payment method', 'warning');
            return;
        }

        const addressId = parseInt(selectedAddress.value);
        cartManager.placeOrder(addressId, paymentMethod.value);
    }
}

// Create global profile manager instance
const profileManager = new ProfileManager();
