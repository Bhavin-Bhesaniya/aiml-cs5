const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const database = require('./config/database');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await database.connect();
        logger.info('Database connected successfully');
        
        app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down server...');
    database.close();
    process.exit(0);
});

startServer();
