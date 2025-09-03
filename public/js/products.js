class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadFeaturedProducts();
    }

    bindEvents() {
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const searchCategory = document.getElementById('searchCategory');

        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        // Category filters
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', this.handleSort.bind(this));
        }

        // Price filter
        const applyPriceFilter = document.getElementById('applyPriceFilter');
        if (applyPriceFilter) {
            applyPriceFilter.addEventListener('click', this.handlePriceFilter.bind(this));
        }
    }

    async loadCategories() {
        try {
            const response = await api.getCategories();
            if (response.success) {
                this.categories = response.categories;
                this.renderCategories();
                this.populateSearchCategories();
                this.renderCategoryFilters();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadFeaturedProducts() {
        try {
            const response = await api.getFeaturedProducts();
            if (response.success) {
                this.renderFeaturedProducts(response.products);
            }
        } catch (error) {
            console.error('Failed to load featured products:', error);
        }
    }

    async loadProducts(filters = {}) {
        try {
            showLoading(true);
            const response = await api.getProducts(filters);
            if (response.success) {
                this.products = response.products;
                this.renderProducts(response.products);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            showToast('Failed to load products', 'error');
        } finally {
            showLoading(false);
        }
    }

    renderCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (!categoriesGrid) return;

        const categoryIcons = {
            'Electronics': 'fas fa-laptop',
            'Fashion': 'fas fa-tshirt',
            'Books': 'fas fa-book',
            'Home': 'fas fa-home',
            'Sports': 'fas fa-football-ball',
            'Beauty': 'fas fa-heart',
            'Toys': 'fas fa-gamepad',
            'Automotive': 'fas fa-car'
        };

        categoriesGrid.innerHTML = this.categories.map(category => `
            <div class="category-card" onclick="productManager.filterByCategory('${category.name}')">
                <i class="${categoryIcons[category.name] || 'fas fa-tag'}"></i>
                <h3>${category.name}</h3>
            </div>
        `).join('');
    }

    populateSearchCategories() {
        const searchCategory = document.getElementById('searchCategory');
        if (!searchCategory) return;

        searchCategory.innerHTML = '<option value="">All</option>' + 
            this.categories.map(category => 
                `<option value="${category.name}">${category.name}</option>`
            ).join('');
    }

    renderCategoryFilters() {
        const categoryFilters = document.getElementById('categoryFilters');
        if (!categoryFilters) return;

        categoryFilters.innerHTML = this.categories.map(category => `
            <div class="filter-item">
                <input type="checkbox" id="cat_${category.id}" value="${category.name}" 
                       onchange="productManager.handleCategoryFilter()">
                <label for="cat_${category.id}">${category.name}</label>
            </div>
        `).join('');
    }

    renderFeaturedProducts(products) {
        const featuredProducts = document.getElementById('featuredProducts');
        if (!featuredProducts || !products.length) return;

        featuredProducts.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    renderProducts(products) {
        const categoryProducts = document.getElementById('categoryProducts');
        if (!categoryProducts) return;

        if (!products.length) {
            categoryProducts.innerHTML = '<p class="text-center">No products found</p>';
            return;
        }

        categoryProducts.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const discountPercent = product.discountPrice ? 
            Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
        
        const rating = parseFloat(product.rating || 0);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        const mainImage = product.images && product.images.length > 0 ? product.images[0] : 
            `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop`;

        return `
            <div class="product-card" onclick="productManager.showProductDetails(${product.id})">
                <img src="${mainImage}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">₹${product.discountPrice || product.price}</span>
                        ${product.discountPrice ? `
                            <span class="original-price">₹${product.price}</span>
                            <span class="discount">(${discountPercent}% off)</span>
                        ` : ''}
                    </div>
                    <div class="product-rating">
                        <span class="rating-stars">${stars}</span>
                        <span class="rating-text">(${product.reviewCount || 0})</span>
                    </div>
                    <div class="product-actions" onclick="event.stopPropagation()">
                        <button class="btn-primary" onclick="cartManager.addToCart(${product.id})">
                            Add to Cart
                        </button>
                        <button class="btn-secondary" onclick="wishlistManager.toggleWishlist(${product.id})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async showProductDetails(productId) {
        try {
            showLoading(true);
            const response = await api.getProduct(productId);
            if (response.success) {
                this.renderProductModal(response.product);
            }
        } catch (error) {
            console.error('Failed to load product details:', error);
            showToast('Failed to load product details', 'error');
        } finally {
            showLoading(false);
        }
    }

    renderProductModal(product) {
        const productDetails = document.getElementById('productDetails');
        const productModal = document.getElementById('productModal');
        if (!productDetails || !productModal) return;

        const discountPercent = product.discountPrice ? 
            Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
        
        const rating = parseFloat(product.rating || 0);
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        const images = product.images && product.images.length > 0 ? product.images : 
            ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=400&fit=crop'];

        productDetails.innerHTML = `
            <div class="product-modal-content">
                <div class="product-images">
                    <img src="${images[0]}" alt="${product.name}" id="mainProductImage">
                    ${images.length > 1 ? `
                        <div class="thumbnail-images">
                            ${images.map((img, index) => `
                                <img src="${img}" alt="${product.name}" 
                                     onclick="document.getElementById('mainProductImage').src='${img}'"
                                     class="thumbnail ${index === 0 ? 'active' : ''}">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="product-info-detailed">
                    <h2>${product.name}</h2>
                    <div class="product-rating">
                        <span class="rating-stars">${stars}</span>
                        <span class="rating-text">${rating} (${product.reviewCount || 0} reviews)</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">₹${product.discountPrice || product.price}</span>
                        ${product.discountPrice ? `
                            <span class="original-price">₹${product.price}</span>
                            <span class="discount">${discountPercent}% off</span>
                        ` : ''}
                    </div>
                    <p class="product-description">${product.description || 'No description available.'}</p>
                    <div class="product-meta">
                        <p><strong>Category:</strong> ${product.categoryName || 'N/A'}</p>
                        <p><strong>Stock:</strong> ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn-primary" onclick="cartManager.addToCart(${product.id})" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="btn-secondary" onclick="wishlistManager.toggleWishlist(${product.id})">
                            <i class="fas fa-heart"></i> Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        `;

        productModal.classList.add('show');
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchCategory = document.getElementById('searchCategory');
        
        const filters = {
            search: searchInput?.value.trim(),
            category: searchCategory?.value
        };

        this.currentFilters = { ...this.currentFilters, ...filters };
        this.loadProducts(this.currentFilters);
        showPage('categories');
    }

    filterByCategory(categoryName) {
        this.currentFilters = { ...this.currentFilters, category: categoryName };
        this.loadProducts(this.currentFilters);
        showPage('categories');
        
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            categoryTitle.textContent = categoryName;
        }
    }

    handleCategoryFilter() {
        const checkedCategories = Array.from(
            document.querySelectorAll('#categoryFilters input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value);

        this.currentFilters = { ...this.currentFilters, category: checkedCategories.join(',') };
        this.loadProducts(this.currentFilters);
    }

    handleSort() {
        const sortBy = document.getElementById('sortBy');
        if (!sortBy) return;

        const [field, order] = sortBy.value.includes('_desc') ? 
            [sortBy.value.replace('_desc', ''), 'DESC'] : [sortBy.value, 'ASC'];

        this.currentFilters = { ...this.currentFilters, sortBy: field, sortOrder: order };
        this.loadProducts(this.currentFilters);
    }

    handlePriceFilter() {
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');

        const filters = {};
        if (minPrice?.value) filters.minPrice = minPrice.value;
        if (maxPrice?.value) filters.maxPrice = maxPrice.value;

        this.currentFilters = { ...this.currentFilters, ...filters };
        this.loadProducts(this.currentFilters);
    }
}

// Create global product manager instance
const productManager = new ProductManager();
