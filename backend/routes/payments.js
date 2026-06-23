const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const crypto = require('crypto');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all payments ──────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('paidBy', 'name')
      .populate('project', 'name')
      .populate('worker', 'name nrc phone');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single payment by ID ─────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('paidBy', 'name')
      .populate('project', 'name')
      .populate('worker', 'name nrc phone');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE single payment ─────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { type, recipientName, recipientPhone, amount, project, worker, subcontract, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const payment = new Payment({
      type,
      recipientName,
      recipientPhone,
      amount,
      reference,
      paidBy: req.user.id,
      project,
      worker,
      subcontract,
      notes,
      status: 'completed',
    });
    await payment.save();

    const senderName = await getSenderName(req.user.id);

    // ─── Notify accountants ──────────────────────────
    const accountants = await User.find({ role: 'accountant' });
    for (let accountant of accountants) {
      await createNotification(
        accountant._id,
        'payment_made',
        'Payment Made',
        `${senderName} paid ${recipientName} ZMW ${amount}`,
        `/payments/${payment._id}`
      );
    }

    // Optionally notify the worker if they have a user account
    if (worker) {
      const workerUser = await User.findOne({ email: recipientPhone });
      if (workerUser) {
        await createNotification(
          workerUser._id,
          'payment_made',
          'You Received Payment',
          `You received ZMW ${amount} from ${senderName}`,
          `/payments/${payment._id}`
        );
      }
    }
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── BULK payments ──────────────────────────────────────────
router.post('/bulk', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !payments.length) return res.status(400).json({ error: 'No payments provided' });
    const created = [];
    const senderName = await getSenderName(req.user.id);

    for (let p of payments) {
      const worker = await Worker.findById(p.workerId);
      if (!worker) throw new Error(`Worker ${p.workerId} not found`);
      if (p.amount <= 0) continue;
      const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const payment = new Payment({
        type: 'worker',
        recipientName: worker.name,
        recipientPhone: worker.phone,
        amount: p.amount,
        reference,
        paidBy: req.user.id,
        worker: worker._id,
        status: 'completed',
        notes: 'Bulk payment',
      });
      await payment.save();
      created.push(payment);

      // Notify worker if user account exists
      const workerUser = await User.findOne({ email: worker.phone });
      if (workerUser) {
        await createNotification(
          workerUser._id,
          'payment_made',
          'You Received Payment',
          `You received ZMW ${p.amount} from ${senderName}`,
          `/payments/${payment._id}`
        );
      }
    }

    // ─── Notify accountants about bulk payments ──────
    const accountants = await User.find({ role: 'accountant' });
    for (let accountant of accountants) {
      await createNotification(
        accountant._id,
        'payment_made',
        'Bulk Payments Made',
        `${senderName} made bulk payments totaling ZMW ${created.reduce((sum, p) => sum + p.amount, 0)}`,
        `/payments`
      );
    }

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Search workers for payment ────────────────────────────
router.get('/workers/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const workers = await Worker.find({
      $or: [
        { nrc: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    }).populate('enrolledBy', 'name role');
    const Attendance = require('../models/Attendance');
    const enriched = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.find({ worker: worker._id });
      const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
      const payments = await Payment.find({ worker: worker._id, status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker._doc, balance: totalEarned - totalPaid, totalPaid };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Mark payment as failed ──────────────────────────
router.put('/:id/fail', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'failed') return res.status(400).json({ error: 'Already failed' });

    payment.status = 'failed';
    payment.notes = payment.notes ? `${payment.notes} (Failed)` : 'Failed';
    await payment.save();

    const senderName = await getSenderName(req.user.id);

    // ─── Get admin and accountant users ──────────────────────────
    const users = await User.find({ role: { $in: ['admin', 'accountant'] } });

    // ─── Create notifications directly using Notification model ───
    for (let user of users) {
      await Notification.create({
        user: user._id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment of ZMW ${payment.amount} to ${payment.recipientName} failed. Please review.`,
        link: `/payments/${payment._id}`,
        read: false,
      });
    }

    res.json({ message: 'Payment marked as failed', payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;