require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: CORS_ORIGIN is not set. All origins are permitted in production.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Origin not in whitelist – block without exposing server details
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Return a clear JSON 503 response for any API request when MongoDB is not ready
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
  }
  next();
});

// General rate limiter for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' }
});

// Rate limiting is disabled in test environments to avoid interference between test cases
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', apiLimiter);
  app.use('/api/auth', authLimiter);
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/funding-requests', require('./routes/fundingRequests'));
app.use('/api/logbooks', require('./routes/logbooks'));
app.use('/api/procurement', require('./routes/procurement'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/boq', require('./routes/boq'));
app.use('/api/subcontracts', require('./routes/subcontracts'));
app.use('/api/material-requests', require('./routes/materialRequests'));
app.use('/api/safety-reports', require('./routes/safetyReports'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/attendance', require('./routes/attendance'));

// Health check endpoint (used by Render and other hosting platforms)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', db: dbState });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
