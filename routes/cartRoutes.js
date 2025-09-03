const express = require('express');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class CartController {
    static async getCart(req, res) {
        try {
            const cartItems = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT c.*, p.name, p.price, p.discountPrice, p.images, p.stock
                     FROM cart c
                     JOIN products p ON c.productId = p.id
                     WHERE c.userId = ?`,
                    [req.user.userId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            const processedItems = cartItems.map(item => ({
                ...item,
                images: item.images ? JSON.parse(item.images) : []
            }));

            const totalAmount = processedItems.reduce((sum, item) => {
                const price = item.discountPrice || item.price;
                return sum + (price * item.quantity);
            }, 0);

            res.json({
                success: true,
                cartItems: processedItems,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                itemCount: processedItems.length
            });

        } catch (error) {
            logger.error('Get cart error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get cart items'
            });
        }
    }

    static async addToCart(req, res) {
        const { productId, quantity = 1 } = req.body;

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
                    'SELECT id, stock FROM products WHERE id = ?',
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

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }

            // Check if item already in cart
            const existingItem = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT * FROM cart WHERE userId = ? AND productId = ?',
                    [req.user.userId, productId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existingItem) {
                // Update quantity
                await new Promise((resolve, reject) => {
                    database.db.run(
                        'UPDATE cart SET quantity = quantity + ? WHERE userId = ? AND productId = ?',
                        [quantity, req.user.userId, productId],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            } else {
                // Add new item
                await new Promise((resolve, reject) => {
                    database.db.run(
                        'INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)',
                        [req.user.userId, productId, quantity],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            logger.info(`Item added to cart: User ${req.user.userId}, Product ${productId}`);
            res.json({
                success: true,
                message: 'Item added to cart successfully'
            });

        } catch (error) {
            logger.error('Add to cart error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to cart'
            });
        }
    }

    static async updateCartItem(req, res) {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required'
            });
        }

        try {
            const result = await new Promise((resolve, reject) => {
                database.db.run(
                    'UPDATE cart SET quantity = ? WHERE userId = ? AND productId = ?',
                    [quantity, req.user.userId, productId],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            res.json({
                success: true,
                message: 'Cart item updated successfully'
            });

        } catch (error) {
            logger.error('Update cart item error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart item'
            });
        }
    }

    static async removeFromCart(req, res) {
        const { productId } = req.params;

        try {
            const result = await new Promise((resolve, reject) => {
                database.db.run(
                    'DELETE FROM cart WHERE userId = ? AND productId = ?',
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
                    message: 'Cart item not found'
                });
            }

            logger.info(`Item removed from cart: User ${req.user.userId}, Product ${productId}`);
            res.json({
                success: true,
                message: 'Item removed from cart successfully'
            });

        } catch (error) {
            logger.error('Remove from cart error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart'
            });
        }
    }

    static async clearCart(req, res) {
        try {
            await new Promise((resolve, reject) => {
                database.db.run(
                    'DELETE FROM cart WHERE userId = ?',
                    [req.user.userId],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            logger.info(`Cart cleared for user: ${req.user.userId}`);
            res.json({
                success: true,
                message: 'Cart cleared successfully'
            });

        } catch (error) {
            logger.error('Clear cart error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cart'
            });
        }
    }
}

// Routes
router.get('/', AuthMiddleware.verifyToken, CartController.getCart);
router.post('/add', AuthMiddleware.verifyToken, CartController.addToCart);
router.put('/:productId', AuthMiddleware.verifyToken, CartController.updateCartItem);
router.delete('/:productId', AuthMiddleware.verifyToken, CartController.removeFromCart);
router.delete('/', AuthMiddleware.verifyToken, CartController.clearCart);

module.exports = router;
