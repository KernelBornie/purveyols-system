const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Simulate mobile money payment
const simulateMobileMoney = async (network, phone, amount) => {
  // Simulated delay for mobile money processing
  await new Promise((resolve) => setTimeout(resolve, 300));
  const ref = `${network.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  // 95% success rate simulation
  const success = Math.random() > 0.05;
  return { success, transactionRef: ref };
};

// POST /api/payments - process wage payment
router.post(
  '/',
  authenticate,
  authorize('accountant', 'director'),
  [
    body('workerId').notEmpty().withMessage('Worker ID is required'),
    body('days').isInt({ min: 1 }).withMessage('Days must be a positive integer'),
    body('mobileNetwork')
      .isIn(['airtel', 'mtn'])
      .withMessage('Mobile network must be airtel or mtn'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { workerId, days, mobileNetwork, paymentPeriodStart, paymentPeriodEnd, notes } =
        req.body;

      const worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ message: 'Worker not found' });

      const amount = worker.dailyRate * days;

      const payment = await Payment.create({
        worker: worker._id,
        amount,
        days,
        mobileNetwork,
        phoneNumber: worker.phone,
        status: 'processing',
        processedBy: req.user._id,
        site: worker.site,
        paymentPeriodStart,
        paymentPeriodEnd,
        notes,
      });

      // Simulate mobile money transfer
      const result = await simulateMobileMoney(mobileNetwork, worker.phone, amount);

      payment.status = result.success ? 'completed' : 'failed';
      payment.transactionRef = result.transactionRef;
      await payment.save();

      await payment.populate([
        { path: 'worker', select: 'name nrc phone site' },
        { path: 'processedBy', select: 'name email role' },
      ]);

      res.status(201).json({ payment, message: result.success ? 'Payment successful' : 'Payment failed' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/payments - list payments
router.get('/', authenticate, authorize('accountant', 'director'), async (req, res) => {
  try {
    const { workerId, status, startDate, endDate, site } = req.query;
    const filter = {};
    if (workerId) filter.worker = workerId;
    if (status) filter.status = status;
    if (site) filter.site = site;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('worker', 'name nrc phone site')
      .populate('processedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/:id
router.get('/:id', authenticate, authorize('accountant', 'director'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('worker', 'name nrc phone site')
      .populate('processedBy', 'name email role');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
