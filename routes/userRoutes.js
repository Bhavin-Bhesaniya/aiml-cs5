const express = require('express');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class UserController {
    static async updateProfile(req, res) {
        const { firstName, lastName, phone } = req.body;

        try {
            await new Promise((resolve, reject) => {
                database.db.run(
                    'UPDATE users SET firstName = ?, lastName = ?, phone = ? WHERE id = ?',
                    [firstName, lastName, phone, req.user.userId],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            logger.info(`Profile updated for user: ${req.user.userId}`);
            res.json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            logger.error('Update profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }

    static async getAddresses(req, res) {
        try {
            const addresses = await new Promise((resolve, reject) => {
                database.db.all(
                    'SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC',
                    [req.user.userId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            res.json({
                success: true,
                addresses
            });

        } catch (error) {
            logger.error('Get addresses error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get addresses'
            });
        }
    }

    static async addAddress(req, res) {
        const {
            type,
            fullName,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country = 'India',
            isDefault = false
        } = req.body;

        if (!fullName || !addressLine1 || !city || !state || !zipCode) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: fullName, addressLine1, city, state, zipCode'
            });
        }

        try {
            // If setting as default, update existing default addresses
            if (isDefault) {
                await new Promise((resolve, reject) => {
                    database.db.run(
                        'UPDATE addresses SET isDefault = 0 WHERE userId = ?',
                        [req.user.userId],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            const addressId = await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO addresses (userId, type, fullName, addressLine1, addressLine2, city, state, zipCode, country, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [req.user.userId, type, fullName, addressLine1, addressLine2, city, state, zipCode, country, isDefault],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            logger.info(`Address added: ${addressId} for user ${req.user.userId}`);
            res.status(201).json({
                success: true,
                message: 'Address added successfully',
                addressId
            });

        } catch (error) {
            logger.error('Add address error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to add address'
            });
        }
    }

    static async updateAddress(req, res) {
        const { id } = req.params;
        const {
            type,
            fullName,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country,
            isDefault
        } = req.body;

        try {
            // If setting as default, update existing default addresses
            if (isDefault) {
                await new Promise((resolve, reject) => {
                    database.db.run(
                        'UPDATE addresses SET isDefault = 0 WHERE userId = ? AND id != ?',
                        [req.user.userId, id],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            const result = await new Promise((resolve, reject) => {
                database.db.run(
                    'UPDATE addresses SET type = ?, fullName = ?, addressLine1 = ?, addressLine2 = ?, city = ?, state = ?, zipCode = ?, country = ?, isDefault = ? WHERE id = ? AND userId = ?',
                    [type, fullName, addressLine1, addressLine2, city, state, zipCode, country, isDefault, id, req.user.userId],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            res.json({
                success: true,
                message: 'Address updated successfully'
            });

        } catch (error) {
            logger.error('Update address error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update address'
            });
        }
    }

    static async deleteAddress(req, res) {
        const { id } = req.params;

        try {
            const result = await new Promise((resolve, reject) => {
                database.db.run(
                    'DELETE FROM addresses WHERE id = ? AND userId = ?',
                    [id, req.user.userId],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.changes);
                    }
                );
            });

            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }

            logger.info(`Address deleted: ${id} for user ${req.user.userId}`);
            res.json({
                success: true,
                message: 'Address deleted successfully'
            });

        } catch (error) {
            logger.error('Delete address error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to delete address'
            });
        }
    }
}

// Routes
router.put('/profile', AuthMiddleware.verifyToken, UserController.updateProfile);
router.get('/addresses', AuthMiddleware.verifyToken, UserController.getAddresses);
router.post('/addresses', AuthMiddleware.verifyToken, UserController.addAddress);
router.put('/addresses/:id', AuthMiddleware.verifyToken, UserController.updateAddress);
router.delete('/addresses/:id', AuthMiddleware.verifyToken, UserController.deleteAddress);

module.exports = router;
