const express = require('express');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const FundingRequest = require('../models/FundingRequest');
const MaterialRequest = require('../models/MaterialRequest');
const DriverLogbook = require('../models/DriverLogbook');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const getDateRange = (period, year, week, month) => {
  if (period === 'weekly') {
    // ISO week - get start of week
    const d = new Date(year, 0, 1 + (week - 1) * 7);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }
};

// GET /api/reports/summary
router.get('/summary', authenticate, authorize('director', 'accountant'), async (req, res) => {
  try {
    const { period = 'monthly', year, week, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const w = parseInt(week) || 1;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const { start, end } = getDateRange(period, y, w, m);

    const [paymentStats, workerCount, pendingFunding, pendingMaterials, logbookStats] =
      await Promise.all([
        Payment.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Worker.countDocuments({ isActive: true }),
        FundingRequest.countDocuments({ status: 'pending' }),
        MaterialRequest.countDocuments({ status: 'pending' }),
        DriverLogbook.aggregate([
          { $match: { date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalDistance: { $sum: '$distanceKm' },
              totalFuel: { $sum: '$fuelLitres' },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    res.json({
      period,
      range: { start, end },
      payments: {
        totalAmount: paymentStats[0]?.total || 0,
        count: paymentStats[0]?.count || 0,
      },
      workers: { active: workerCount },
      fundingRequests: { pending: pendingFunding },
      materialRequests: { pending: pendingMaterials },
      logistics: {
        totalDistance: logbookStats[0]?.totalDistance || 0,
        totalFuel: logbookStats[0]?.totalFuel || 0,
        trips: logbookStats[0]?.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/payments
router.get('/payments', authenticate, authorize('director', 'accountant'), async (req, res) => {
  try {
    const { period = 'monthly', year, week, month, site } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const w = parseInt(week) || 1;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const { start, end } = getDateRange(period, y, w, m);

    const matchFilter = { createdAt: { $gte: start, $lte: end } };
    if (site) matchFilter.site = site;

    const payments = await Payment.find(matchFilter)
      .populate('worker', 'name nrc phone site')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });

    const summary = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ payments, summary, range: { start, end } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/workers
router.get('/workers', authenticate, authorize('director', 'accountant'), async (req, res) => {
  try {
    const { site } = req.query;
    const filter = { isActive: true };
    if (site) filter.site = site;

    const workers = await Worker.find(filter)
      .populate('enrolledBy', 'name email role')
      .sort({ site: 1, name: 1 });

    const bySite = await Worker.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$site', count: { $sum: 1 }, totalDailyRate: { $sum: '$dailyRate' } } },
    ]);

    res.json({ workers, bySite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/logbooks
router.get(
  '/logbooks',
  authenticate,
  authorize('director', 'accountant'),
  async (req, res) => {
    try {
      const { period = 'monthly', year, week, month } = req.query;
      const y = parseInt(year) || new Date().getFullYear();
      const w = parseInt(week) || 1;
      const m = parseInt(month) || new Date().getMonth() + 1;
      const { start, end } = getDateRange(period, y, w, m);

      const entries = await DriverLogbook.find({ date: { $gte: start, $lte: end } })
        .populate('driver', 'name email')
        .sort({ date: -1 });

      res.json({ entries, range: { start, end } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
