const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

// Initialize DB connection
connectDB();

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// Ensure uploads directory exists (safely for serverless read-only environments)
try {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Upload directory creation skipped:', err.message);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// CORS: allow production frontend + any local dev port
// Set CORS_ORIGINS in .env for custom domains (comma-separated)
const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [
  'https://max-durakathana.netlify.app',
  'https://www.max-durakathana.netlify.app',
  'https://mobilehubtech.netlify.app',
  'https://www.mobilehubtech.netlify.app',
  'https://max-durakathana.netlify.app',
  'https://www.max-durakathana.netlify.app',
  'http://localhost:3000',
  ...envOrigins,
];
app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production' || !origin) {
      return callback(null, true);
    }
    const isLocalhost =
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
    const isNetlify = /\.netlify\.app$/.test(origin);
    const isVercel = /\.vercel\.app$/.test(origin);
    if (allowedOrigins.includes(origin) || isLocalhost || isNetlify || isVercel) {
      return callback(null, true);
    }
    return callback(null, true); // Allow request to proceed cleanly
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/pos', require('./routes/posRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/trade-in', require('./routes/tradeInRoutes'));
app.use('/api/accounts', require('./routes/accountRoutes'));
app.use('/api/hp', require('./routes/hpRoutes'));
app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
app.use('/api/currency', require('./routes/currencyRoutes'));


app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/hr', require('./routes/hrRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/barcodes', require('./routes/barcodeRoutes'));
app.use('/api/supplier-payments', require('./routes/supplierPaymentRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/api/overtime', require('./routes/overtimeRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reloads', require('./routes/reloadRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Mobixa API is running...');
});

app.get('/api', (req, res) => {
  res.json({ message: 'Mobixa API is active', status: 'online' });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

module.exports = app;


