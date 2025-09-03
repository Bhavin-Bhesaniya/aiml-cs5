const express = require('express');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class WishlistController {
    static async getWishlist(req, res) {
        try {
            const wishlistItems = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT w.*, p.name, p.price, p.discountPrice, p.images, p.rating, p.reviewCount
                     FROM wishlist w
                     JOIN products p ON w.productId = p.id
                     WHERE w.userId = ?
                     ORDER BY w.addedAt DESC`,
                    [req.user.userId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            const processedItems = wishlistItems.map(item => ({
                ...item,
                images: item.images ? JSON.parse(item.images) : []
            }));

            res.json({
                success: true,
                wishlistItems: processedItems,
                itemCount: processedItems.length
            });

        } catch (error) {
            logger.error('Get wishlist error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get wishlist items'
            });
        }
    }

    static async addToWishlist(req, res) {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        try {
            // Check if product exists
            const product = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT id FROM products WHERE id = ?',
                    [productId],
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

            // Check if item already in wishlist
            const existingItem = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT * FROM wishlist WHERE userId = ? AND productId = ?',
                    [req.user.userId, productId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existingItem) {
                return res.status(400).json({
                    success: false,
                    message: 'Item already in wishlist'
                });
            }

            // Add to wishlist
            await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO wishlist (userId, productId) VALUES (?, ?)',
                    [req.user.userId, productId],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            logger.info(`Item added to wishlist: User ${req.user.userId}, Product ${productId}`);
            res.json({
                success: true,
                message: 'Item added to wishlist successfully'
            });

        } catch (error) {
            logger.error('Add to wishlist error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to wishlist'
            });
        }
    }

    static async removeFromWishlist(req, res) {
        const { productId } = req.params;

        try {
            const result = await new Promise((resolve, reject) => {
                database.db.run(
                    'DELETE FROM wishlist WHERE userId = ? AND productId = ?',
                    [req.user.userId, productId],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Wishlist item not found'
                });
            }

            logger.info(`Item removed from wishlist: User ${req.user.userId}, Product ${productId}`);
            res.json({
                success: true,
                message: 'Item removed from wishlist successfully'
            });

        } catch (error) {
            logger.error('Remove from wishlist error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from wishlist'
            });
        }
    }

    static async checkWishlistStatus(req, res) {
        const { productId } = req.params;

        try {
            const item = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT id FROM wishlist WHERE userId = ? AND productId = ?',
                    [req.user.userId, productId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            res.json({
                success: true,
                inWishlist: !!item
            });

        } catch (error) {
            logger.error('Check wishlist status error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to check wishlist status'
            });
        }
    }
}

// Routes
router.get('/', AuthMiddleware.verifyToken, WishlistController.getWishlist);
router.post('/add', AuthMiddleware.verifyToken, WishlistController.addToWishlist);
router.delete('/:productId', AuthMiddleware.verifyToken, WishlistController.removeFromWishlist);
router.get('/check/:productId', AuthMiddleware.verifyToken, WishlistController.checkWishlistStatus);

module.exports = router;
