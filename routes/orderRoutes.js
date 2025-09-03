const express = require('express');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class OrderController {
    static async createOrder(req, res) {
        const { addressId, paymentMethod = 'razorpay' } = req.body;

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: 'Address ID is required'
            });
        }

        try {
            // Get cart items
            const cartItems = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT c.*, p.price, p.discountPrice, p.stock
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

            if (cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Calculate total amount
            const totalAmount = cartItems.reduce((sum, item) => {
                const price = item.discountPrice || item.price;
                return sum + (price * item.quantity);
            }, 0);

            // Create order
            const orderId = await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO orders (userId, addressId, totalAmount, paymentId) VALUES (?, ?, ?, ?)',
                    [req.user.userId, addressId, totalAmount, `rzp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            // Create order items
            for (const item of cartItems) {
                const price = item.discountPrice || item.price;
                await new Promise((resolve, reject) => {
                    database.db.run(
                        'INSERT INTO orderItems (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
                        [orderId, item.productId, item.quantity, price],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            // Clear cart
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

            logger.info(`Order created: ${orderId} for user ${req.user.userId}`);
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderId,
                totalAmount
            });

        } catch (error) {
            logger.error('Create order error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to create order'
            });
        }
    }

    static async getOrders(req, res) {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        try {
            const orders = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT o.*, a.fullName, a.addressLine1, a.city, a.state
                     FROM orders o
                     LEFT JOIN addresses a ON o.addressId = a.id
                     WHERE o.userId = ?
                     ORDER BY o.orderDate DESC
                     LIMIT ? OFFSET ?`,
                    [req.user.userId, parseInt(limit), parseInt(offset)],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            // Get order items for each order
            for (const order of orders) {
                const orderItems = await new Promise((resolve, reject) => {
                    database.db.all(
                        `SELECT oi.*, p.name, p.images
                         FROM orderItems oi
                         JOIN products p ON oi.productId = p.id
                         WHERE oi.orderId = ?`,
                        [order.id],
                        (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows.map(item => ({
                                ...item,
                                images: item.images ? JSON.parse(item.images) : []
                            })));
                        }
                    );
                });
                order.items = orderItems;
            }

            res.json({
                success: true,
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            logger.error('Get orders error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get orders'
            });
        }
    }

    static async getOrder(req, res) {
        const { id } = req.params;

        try {
            const order = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT o.*, a.fullName, a.addressLine1, a.addressLine2, a.city, a.state, a.zipCode
                     FROM orders o
                     LEFT JOIN addresses a ON o.addressId = a.id
                     WHERE o.id = ? AND o.userId = ?`,
                    [id, req.user.userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Get order items
            const orderItems = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT oi.*, p.name, p.images
                     FROM orderItems oi
                     JOIN products p ON oi.productId = p.id
                     WHERE oi.orderId = ?`,
                    [order.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows.map(item => ({
                            ...item,
                            images: item.images ? JSON.parse(item.images) : []
                        })));
                    }
                );
            });

            order.items = orderItems;

            res.json({
                success: true,
                order
            });

        } catch (error) {
            logger.error('Get order error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get order'
            });
        }
    }
}

// Routes
router.post('/', AuthMiddleware.verifyToken, OrderController.createOrder);
router.get('/', AuthMiddleware.verifyToken, OrderController.getOrders);
router.get('/:id', AuthMiddleware.verifyToken, OrderController.getOrder);

module.exports = router;
