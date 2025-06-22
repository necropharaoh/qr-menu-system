const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const tablesRoutes = require('./routes/tables');
const restaurantRoutes = require('./routes/restaurant');
const waiterRoutes = require('./routes/waiter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', ordersRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/tables', tablesRoutes);
app.use('/restaurant', restaurantRoutes);
app.use('/waiter', waiterRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// Export for Netlify Functions
exports.handler = serverless(app); 