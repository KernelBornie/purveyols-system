require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const workerRoutes = require('./src/routes/workers');
const paymentRoutes = require('./src/routes/payments');
const fundingRoutes = require('./src/routes/fundingRequests');
const materialRoutes = require('./src/routes/materialRequests');
const logbookRoutes = require('./src/routes/logbooks');
const safetyRoutes = require('./src/routes/safetyReports');
const reportRoutes = require('./src/routes/reports');

const app = express();

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/funding-requests', fundingRoutes);
app.use('/api/material-requests', materialRoutes);
app.use('/api/logbooks', logbookRoutes);
app.use('/api/safety-reports', safetyRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', generalLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purveyols';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
