const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('../config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Ensure DB connection for incoming requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    next();
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/categories', require('../routes/categoryRoutes'));
app.use('/api/products', require('../routes/productRoutes'));
app.use('/api/stores', require('../routes/storeRoutes'));
app.use('/api/cart', require('../routes/cartRoutes'));
app.use('/api/wishlist', require('../routes/wishlistRoutes'));
app.use('/api/reviews', require('../routes/reviewRoutes'));
app.use('/api/orders', require('../routes/orderRoutes'));
app.use('/api/admin', require('../routes/adminRoutes'));
app.use('/api/pos', require('../routes/posRoutes'));
app.use('/api/notifications', require('../routes/notificationRoutes'));
app.use('/api/stock', require('../routes/stockRoutes'));
app.use('/api/accounts', require('../routes/accountRoutes'));
app.use('/api/hp', require('../routes/hpRoutes'));
app.use('/api/loyalty', require('../routes/loyaltyRoutes'));
app.use('/api/currency', require('../routes/currencyRoutes'));
app.use('/api/delivery', require('../routes/deliveryRoutes'));
app.use('/api/hr', require('../routes/hrRoutes'));
app.use('/api/payroll', require('../routes/payrollRoutes'));
app.use('/api/settings', require('../routes/settingsRoutes'));
app.use('/api/expenses', require('../routes/expenseRoutes'));
app.use('/api/finance', require('../routes/financeRoutes'));
app.use('/api/promotions', require('../routes/promotionRoutes'));
app.use('/api/suppliers', require('../routes/supplierRoutes'));
app.use('/api/returns', require('../routes/returnRoutes'));
app.use('/api/barcodes', require('../routes/barcodeRoutes'));
app.use('/api/supplier-payments', require('../routes/supplierPaymentRoutes'));
app.use('/api/predictions', require('../routes/predictionRoutes'));
app.use('/api/overtime', require('../routes/overtimeRoutes'));
app.use('/api/upload', require('../routes/uploadRoutes'));
app.use('/api/reloads', require('../routes/reloadRoutes'));
app.use('/api/repairs', require('../routes/repairRoutes'));

app.get('/', (req, res) => {
  res.send('Mobile Hub API is running...');
});

app.get('/api', (req, res) => {
  res.json({ message: 'Mobile Hub API is active', status: 'online' });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
