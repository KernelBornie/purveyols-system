const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');

// GET /api/payments – accountant/director only
router.get('/', auth, roleCheck('accountant', 'director'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('project', 'name')
      .populate('worker', 'name nrc phone site dailyRate')
      .populate('processedBy', 'name email');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/payments – accountant only
// Supports two formats:
//   1. Worker-based: { workerId, days, mobileNetwork }
//   2. General:      { paymentType, recipientName, amount, ... }
router.post('/', auth, roleCheck('accountant'), async (req, res) => {
  try {
    let paymentData = { processedBy: req.user._id };

    if (req.body.workerId) {
      const worker = await Worker.findById(req.body.workerId);
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      const days = parseInt(req.body.days);
      if (!days || days <= 0) return res.status(400).json({ message: 'Invalid days value - must be a positive integer' });
      const amount = worker.dailyRate * days;
      paymentData = {
        ...paymentData,
        paymentType: 'mobile_money',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount,
        worker: worker._id,
        days,
        mobileNetwork: req.body.mobileNetwork || worker.mobileNetwork || 'airtel',
        description: `Payment for ${days} day(s) work`,
        status: 'completed'
      };
    } else {
      paymentData = { ...paymentData, ...req.body };
    }

    const payment = new Payment(paymentData);
    await payment.save();
    await payment.populate('project', 'name');
    await payment.populate('worker', 'name nrc');
    await payment.populate('processedBy', 'name email');
    res.status(201).json({ payment, message: 'Payment processed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/payments/bulk – pay all active workers
router.post('/bulk', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const days = parseInt(req.body.days);
    if (!days || days <= 0) return res.status(400).json({ message: 'Invalid days value - must be a positive integer' });
    const mobileNetwork = req.body.mobileNetwork || 'airtel';

    const workers = await Worker.find({ status: 'active' });
    if (workers.length === 0) return res.json({ message: 'No active workers found', count: 0 });

    const payments = [];
    for (const worker of workers) {
      const amount = worker.dailyRate * days;
      const payment = new Payment({
        paymentType: 'mobile_money',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount,
        worker: worker._id,
        days,
        mobileNetwork: mobileNetwork || worker.mobileNetwork || 'airtel',
        description: `Bulk payment for ${days} day(s) work`,
        processedBy: req.user._id,
        status: 'completed'
      });
      await payment.save();
      payments.push(payment);
    }

    res.json({ message: `Paid ${payments.length} workers for ${days} day(s)`, count: payments.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/payments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('project', 'name')
      .populate('worker', 'name nrc')
      .populate('processedBy', 'name email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/payments/:id – accountant only
router.put('/:id', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('worker', 'name nrc')
      .populate('processedBy', 'name email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
