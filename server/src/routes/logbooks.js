const express = require('express');
const { body, validationResult } = require('express-validator');
const DriverLogbook = require('../models/DriverLogbook');
const { authenticate, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/logbooks
router.post(
  '/',
  authenticate,
  generalLimiter,
  authorize('driver'),
  [
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('timeIn').notEmpty().withMessage('Time in is required'),
    body('timeOut').notEmpty().withMessage('Time out is required'),
    body('distanceKm').isNumeric({ min: 0 }).withMessage('Distance must be numeric'),
    body('fuelLitres').isNumeric({ min: 0 }).withMessage('Fuel must be numeric'),
    body('route').trim().notEmpty().withMessage('Route is required'),
    body('purpose').trim().notEmpty().withMessage('Purpose is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { vehicleNumber, date, timeIn, timeOut, distanceKm, fuelLitres, route, purpose, site, notes } =
        req.body;
      const entry = await DriverLogbook.create({
        driver: req.user._id,
        vehicleNumber,
        date,
        timeIn,
        timeOut,
        distanceKm,
        fuelLitres,
        route,
        purpose,
        site,
        notes,
      });
      await entry.populate('driver', 'name email');
      res.status(201).json({ entry });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/logbooks
router.get(
  '/',
  authenticate,
  generalLimiter,
  authorize('driver', 'director', 'accountant'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filter = {};

      if (req.user.role === 'driver') {
        filter.driver = req.user._id;
      }

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      const entries = await DriverLogbook.find(filter)
        .populate('driver', 'name email')
        .sort({ date: -1, createdAt: -1 });
      res.json({ entries });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
