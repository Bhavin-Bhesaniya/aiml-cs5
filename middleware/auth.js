const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthMiddleware {
    static verifyToken(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            logger.warn('Access denied - No token provided');
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            logger.error('Invalid token:', error.message);
            res.status(400).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    }

    static optionalAuth(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
            } catch (error) {
                logger.warn('Optional auth - Invalid token:', error.message);
            }
        }
        next();
    }
}

module.exports = AuthMiddleware;
