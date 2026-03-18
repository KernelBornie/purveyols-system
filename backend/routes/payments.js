const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const { createNotification } = require('../utils/notifications');

/**
 * Simulate a mobile money disbursement (Airtel Money / MTN Mobile Money Zambia).
 * Returns a network-prefixed transaction reference and a success flag.
 *
 * NOTE: The `phone` and `amount` parameters are intentionally kept here as
 * placeholders matching the real Airtel/MTN API signatures so they can be
 * wired up without changing all call-sites when live integration is added.
 * In production, replace this function body with calls to the actual APIs:
 *   – Airtel Money: https://developers.airtel.africa/
 *   – MTN MoMo:     https://momodeveloper.mtn.com/
 */
// eslint-disable-next-line no-unused-vars
async function simulateMobileMoney(network, phone, amount) {
  // Simulate network latency (200–500 ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.floor(Math.random() * 300)));
  const prefix = (network || 'airtel').toUpperCase() === 'MTN' ? 'MTN' : 'AIR';
  const ref = `${prefix}-ZM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  // 95% success rate
  const success = Math.random() > 0.05;
  return { success, transactionRef: ref };
}

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
      const mobileNetwork = req.body.mobileNetwork || worker.mobileNetwork || 'airtel';
      const { success, transactionRef } = await simulateMobileMoney(mobileNetwork, worker.phone, amount);
      paymentData = {
        ...paymentData,
        paymentType: 'mobile_money',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount,
        worker: worker._id,
        days,
        mobileNetwork,
        description: `Payment for ${days} day(s) work`,
        status: success ? 'completed' : 'failed',
        transactionRef
      };
    } else {
      paymentData = { ...paymentData, ...req.body };
    }

    const payment = new Payment(paymentData);
    await payment.save();
    await payment.populate('project', 'name');
    await payment.populate('worker', 'name nrc');
    await payment.populate('processedBy', 'name email');
    const recipient = payment.recipientName || 'Unknown Recipient';
    const amountVal = payment.amount != null ? `ZMW ${payment.amount.toLocaleString()}` : '';
    createNotification(
      req.user._id,
      `Payment of ${amountVal} to ${recipient} has been processed successfully.`,
      'payment'
    );
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
      const net = mobileNetwork || worker.mobileNetwork || 'airtel';
      const { success, transactionRef } = await simulateMobileMoney(net, worker.phone, amount);
      const payment = new Payment({
        paymentType: 'mobile_money',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount,
        worker: worker._id,
        days,
        mobileNetwork: net,
        description: `Bulk payment for ${days} day(s) work`,
        processedBy: req.user._id,
        status: success ? 'completed' : 'failed',
        transactionRef
      });
      await payment.save();
      payments.push(payment);
    }

    const succeeded = payments.filter(p => p.status === 'completed').length;
    const failed = payments.length - succeeded;
    res.json({
      message: `Paid ${payments.length} workers for ${days} day(s)`,
      count: payments.length,
      succeeded,
      failed
    });
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
