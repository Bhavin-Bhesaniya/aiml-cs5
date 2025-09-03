const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DB_PATH || './database/ecommerce.db';
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Database connection failed:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeTables();
                    resolve();
                }
            });
        });
    }

    initializeTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                firstName TEXT,
                lastName TEXT,
                phone TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                image TEXT,
                parentId INTEGER,
                FOREIGN KEY (parentId) REFERENCES categories(id)
            )`,
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                discountPrice DECIMAL(10,2),
                stock INTEGER DEFAULT 0,
                categoryId INTEGER,
                images TEXT,
                rating DECIMAL(2,1) DEFAULT 0,
                reviewCount INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoryId) REFERENCES categories(id)
            )`,
            `CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                productId INTEGER,
                quantity INTEGER DEFAULT 1,
                addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id),
                FOREIGN KEY (productId) REFERENCES products(id)
            )`,
            `CREATE TABLE IF NOT EXISTS wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                productId INTEGER,
                addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id),
                FOREIGN KEY (productId) REFERENCES products(id)
            )`,
            `CREATE TABLE IF NOT EXISTS addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                type TEXT DEFAULT 'home',
                fullName TEXT NOT NULL,
                addressLine1 TEXT NOT NULL,
                addressLine2 TEXT,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                zipCode TEXT NOT NULL,
                country TEXT DEFAULT 'India',
                isDefault BOOLEAN DEFAULT 0,
                FOREIGN KEY (userId) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                addressId INTEGER,
                totalAmount DECIMAL(10,2) NOT NULL,
                status TEXT DEFAULT 'pending',
                paymentId TEXT,
                orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id),
                FOREIGN KEY (addressId) REFERENCES addresses(id)
            )`,
            `CREATE TABLE IF NOT EXISTS orderItems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                orderId INTEGER,
                productId INTEGER,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (orderId) REFERENCES orders(id),
                FOREIGN KEY (productId) REFERENCES products(id)
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = new Database();
