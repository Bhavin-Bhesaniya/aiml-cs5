const express = require('express');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class ProductController {
    static async getAllProducts(req, res) {
        const { page = 1, limit = 20, category, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        try {
            let query = `
                SELECT p.*, c.name as categoryName 
                FROM products p 
                LEFT JOIN categories c ON p.categoryId = c.id 
                WHERE 1=1
            `;
            const params = [];

            if (category) {
                query += ` AND c.name LIKE ?`;
                params.push(`%${category}%`);
            }

            if (search) {
                query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const products = await new Promise((resolve, reject) => {
                database.db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Parse images JSON
            const processedProducts = products.map(product => ({
                ...product,
                images: product.images ? JSON.parse(product.images) : []
            }));

            res.json({
                success: true,
                products: processedProducts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            logger.error('Get products error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get products'
            });
        }
    }

    static async getProduct(req, res) {
        const { id } = req.params;

        try {
            const product = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT p.*, c.name as categoryName 
                     FROM products p 
                     LEFT JOIN categories c ON p.categoryId = c.id 
                     WHERE p.id = ?`,
                    [id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            // Parse images JSON
            product.images = product.images ? JSON.parse(product.images) : [];

            res.json({
                success: true,
                product
            });

        } catch (error) {
            logger.error('Get product error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get product'
            });
        }
    }

    static async getCategories(req, res) {
        try {
            const categories = await new Promise((resolve, reject) => {
                database.db.all(
                    'SELECT * FROM categories ORDER BY name',
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            res.json({
                success: true,
                categories
            });

        } catch (error) {
            logger.error('Get categories error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get categories'
            });
        }
    }

    static async getFeaturedProducts(req, res) {
        try {
            const products = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT p.*, c.name as categoryName 
                     FROM products p 
                     LEFT JOIN categories c ON p.categoryId = c.id 
                     WHERE p.rating >= 4.0 
                     ORDER BY p.rating DESC, p.reviewCount DESC 
                     LIMIT 12`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            const processedProducts = products.map(product => ({
                ...product,
                images: product.images ? JSON.parse(product.images) : []
            }));

            res.json({
                success: true,
                products: processedProducts
            });

        } catch (error) {
            logger.error('Get featured products error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get featured products'
            });
        }
    }
}

// Routes
router.get('/', ProductController.getAllProducts);
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getProduct);

module.exports = router;
