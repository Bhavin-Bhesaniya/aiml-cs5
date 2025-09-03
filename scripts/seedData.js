const database = require('../config/database');

class DataSeeder {
    constructor() {
        this.categories = [
            { name: 'Electronics', description: 'Phones, Laptops, TV & more', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&h=200&fit=crop' },
            { name: 'Fashion', description: 'Clothing, Shoes & Accessories', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop' },
            { name: 'Books', description: 'Books, eBooks & Audiobooks', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop' },
            { name: 'Home', description: 'Furniture, Kitchen & Garden', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop' },
            { name: 'Sports', description: 'Sports & Fitness Equipment', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop' },
            { name: 'Beauty', description: 'Beauty & Personal Care', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop' }
        ];

        this.products = [
            // Electronics
            {
                name: 'iPhone 15 Pro',
                description: 'Latest iPhone with A17 Pro chip and titanium design',
                price: 134900,
                discountPrice: 124900,
                stock: 25,
                categoryName: 'Electronics',
                rating: 4.8,
                reviewCount: 1245,
                images: [
                    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'MacBook Air M3',
                description: '13-inch MacBook Air with M3 chip, 8GB RAM, 256GB SSD',
                price: 114900,
                discountPrice: 109900,
                stock: 15,
                categoryName: 'Electronics',
                rating: 4.7,
                reviewCount: 892,
                images: [
                    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Samsung 55" 4K Smart TV',
                description: 'Crystal UHD 4K Smart TV with HDR and Alexa built-in',
                price: 45000,
                discountPrice: 39999,
                stock: 8,
                categoryName: 'Electronics',
                rating: 4.5,
                reviewCount: 567,
                images: [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Sony WH-1000XM5 Headphones',
                description: 'Industry-leading noise canceling wireless headphones',
                price: 29990,
                discountPrice: 24990,
                stock: 30,
                categoryName: 'Electronics',
                rating: 4.9,
                reviewCount: 2134,
                images: [
                    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=400&fit=crop'
                ]
            },

            // Fashion
            {
                name: 'Nike Air Max 270',
                description: 'Comfortable running shoes with Max Air cushioning',
                price: 12995,
                discountPrice: 9999,
                stock: 50,
                categoryName: 'Fashion',
                rating: 4.6,
                reviewCount: 789,
                images: [
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Levi\'s 511 Slim Jeans',
                description: 'Classic slim fit jeans in dark wash',
                price: 3999,
                discountPrice: 2999,
                stock: 75,
                categoryName: 'Fashion',
                rating: 4.4,
                reviewCount: 445,
                images: [
                    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Adidas Ultraboost 22',
                description: 'Premium running shoes with Boost midsole technology',
                price: 16999,
                discountPrice: 13999,
                stock: 40,
                categoryName: 'Fashion',
                rating: 4.7,
                reviewCount: 623,
                images: [
                    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=400&fit=crop'
                ]
            },

            // Books
            {
                name: 'The Psychology of Money',
                description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel',
                price: 399,
                discountPrice: 299,
                stock: 100,
                categoryName: 'Books',
                rating: 4.8,
                reviewCount: 1876,
                images: [
                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Atomic Habits',
                description: 'An Easy & Proven Way to Build Good Habits by James Clear',
                price: 499,
                discountPrice: 349,
                stock: 85,
                categoryName: 'Books',
                rating: 4.9,
                reviewCount: 2456,
                images: [
                    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=400&fit=crop'
                ]
            },

            // Home
            {
                name: 'IKEA Office Chair',
                description: 'Ergonomic office chair with lumbar support',
                price: 12999,
                discountPrice: 9999,
                stock: 20,
                categoryName: 'Home',
                rating: 4.3,
                reviewCount: 234,
                images: [
                    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Smart LED Bulbs (4-Pack)',
                description: 'WiFi enabled color changing LED bulbs compatible with Alexa',
                price: 2999,
                discountPrice: 1999,
                stock: 60,
                categoryName: 'Home',
                rating: 4.5,
                reviewCount: 567,
                images: [
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop'
                ]
            },

            // Sports
            {
                name: 'Yoga Mat Premium',
                description: 'Non-slip yoga mat with alignment lines, 6mm thick',
                price: 2499,
                discountPrice: 1799,
                stock: 45,
                categoryName: 'Sports',
                rating: 4.6,
                reviewCount: 789,
                images: [
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'Resistance Bands Set',
                description: '5-piece resistance bands with door anchor and handles',
                price: 1999,
                discountPrice: 1299,
                stock: 35,
                categoryName: 'Sports',
                rating: 4.4,
                reviewCount: 445,
                images: [
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop'
                ]
            },

            // Beauty
            {
                name: 'Neutrogena Hydrating Foaming Cleanser',
                description: 'Gentle daily face cleanser for all skin types',
                price: 699,
                discountPrice: 549,
                stock: 80,
                categoryName: 'Beauty',
                rating: 4.5,
                reviewCount: 1123,
                images: [
                    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=400&fit=crop'
                ]
            },
            {
                name: 'The Ordinary Niacinamide Serum',
                description: '10% Niacinamide + 1% Zinc serum for blemish-prone skin',
                price: 1299,
                discountPrice: 999,
                stock: 65,
                categoryName: 'Beauty',
                rating: 4.7,
                reviewCount: 892,
                images: [
                    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=400&fit=crop'
                ]
            }
        ];
    }

    async seedDatabase() {
        try {
            console.log('Starting database seeding...');
            
            // Connect to database
            await database.connect();
            
            // Clear existing data
            await this.clearData();
            
            // Seed categories
            await this.seedCategories();
            
            // Seed products
            await this.seedProducts();
            
            console.log('Database seeding completed successfully!');
            
        } catch (error) {
            console.error('Database seeding failed:', error);
            throw error;
        }
    }

    async clearData() {
        console.log('Clearing existing data...');
        
        const queries = [
            'DELETE FROM orderItems WHERE 1=1',
            'DELETE FROM orders WHERE 1=1',
            'DELETE FROM cart WHERE 1=1',
            'DELETE FROM wishlist WHERE 1=1',
            'DELETE FROM products WHERE 1=1',
            'DELETE FROM categories WHERE 1=1'
        ];

        for (const query of queries) {
            await new Promise((resolve, reject) => {
                database.db.run(query, [], (err) => {
                    if (err) {
                        // Ignore errors for non-existent tables during first run
                        console.log(`Table might not exist yet: ${err.message}`);
                    }
                    resolve();
                });
            });
        }
    }

    async seedCategories() {
        console.log('Seeding categories...');
        
        for (const category of this.categories) {
            await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO categories (name, description, image) VALUES (?, ?, ?)',
                    [category.name, category.description, category.image],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`Added category: ${category.name}`);
                            resolve(this.lastID);
                        }
                    }
                );
            });
        }
    }

    async seedProducts() {
        console.log('Seeding products...');
        
        // First, get category IDs
        const categoryMap = await new Promise((resolve, reject) => {
            database.db.all('SELECT id, name FROM categories', [], (err, rows) => {
                if (err) reject(err);
                else {
                    const map = {};
                    rows.forEach(row => {
                        map[row.name] = row.id;
                    });
                    resolve(map);
                }
            });
        });

        for (const product of this.products) {
            const categoryId = categoryMap[product.categoryName];
            const imagesJson = JSON.stringify(product.images);
            
            await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO products (name, description, price, discountPrice, stock, categoryId, images, rating, reviewCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        product.name,
                        product.description,
                        product.price,
                        product.discountPrice,
                        product.stock,
                        categoryId,
                        imagesJson,
                        product.rating,
                        product.reviewCount
                    ],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`Added product: ${product.name}`);
                            resolve(this.lastID);
                        }
                    }
                );
            });
        }
    }
}

// Run the seeder
async function runSeeder() {
    const seeder = new DataSeeder();
    try {
        await seeder.seedDatabase();
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runSeeder();
}

module.exports = DataSeeder;
