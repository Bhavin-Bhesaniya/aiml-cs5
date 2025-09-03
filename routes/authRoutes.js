const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const logger = require('../utils/logger');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

class AuthController {
    static async register(req, res) {
        const { username, email, password, firstName, lastName, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        try {
            // Check if user exists
            const existingUser = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT id FROM users WHERE username = ? OR email = ?',
                    [username, email],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const userId = await new Promise((resolve, reject) => {
                database.db.run(
                    'INSERT INTO users (username, email, password, firstName, lastName, phone) VALUES (?, ?, ?, ?, ?, ?)',
                    [username, email, hashedPassword, firstName, lastName, phone],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            // Generate token
            const token = jwt.sign(
                { userId, username, email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            logger.info(`User registered successfully: ${username}`);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token,
                user: { userId, username, email, firstName, lastName }
            });

        } catch (error) {
            logger.error('Registration error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    }

    static async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        try {
            // Find user
            const user = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT * FROM users WHERE username = ? OR email = ?',
                    [username, username],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            logger.info(`User logged in: ${user.username}`);
            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });

        } catch (error) {
            logger.error('Login error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await new Promise((resolve, reject) => {
                database.db.get(
                    'SELECT id, username, email, firstName, lastName, phone, createdAt FROM users WHERE id = ?',
                    [req.user.userId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            logger.error('Get profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile'
            });
        }
    }
}

// Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', AuthMiddleware.verifyToken, AuthController.getProfile);

module.exports = router;
