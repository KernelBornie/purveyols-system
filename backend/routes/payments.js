const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const crypto = require('crypto');
const { createNotification, getSenderName, formatCurrency } = require('../utils/notificationHelper');
const { sendMoney } = require('../services/airtelMoneyService');

// ─── GET all payments ──────────────────────────────────────────────────
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

// ─── GET single payment by ID ─────────────────────────────────────────
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

// ─── CREATE single payment ─────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { type, recipientName, recipientPhone, amount, project, worker, subcontract, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // ─── Check for missing Airtel credentials ──────────────────────
    if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
      // ─── Create notification for the user ────────────────────────
      await createNotification(
        req.user.id,
        'payment_failed',
        'Payment Failed',
        `❌ Payment of ${formatCurrency(amount)} to ${recipientName} failed because Airtel credentials are missing. Please contact system administrator.`,
        `/payments`
      );
      // ─── Also notify admins ──────────────────────────────────────
      const admins = await User.find({ role: 'admin' });
      for (let admin of admins) {
        if (admin._id.toString() !== req.user.id) {
          await createNotification(
            admin._id,
            'payment_failed',
            'Payment Failed',
            `Payment of ${formatCurrency(amount)} to ${recipientName} failed due to missing Airtel credentials.`,
            `/payments`
          );
        }
      }
      return res.status(500).json({
        error: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.'
      });
    }

    const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    let airtelResponse = null;
    let status = 'pending';

    try {
      airtelResponse = await sendMoney(
        recipientPhone,
        amount,
        reference,
        `Payment to ${recipientName}`
      );
      if (airtelResponse?.status === 'success' || airtelResponse?.data?.status === 'SUCCESS') {
        status = 'completed';
      } else {
        status = 'failed';
      }
    } catch (err) {
      console.error('Airtel sendMoney error:', err);
      status = 'failed';
      airtelResponse = { error: err.message };
    }

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
      status,
      airtelResponse,
      errorMessage: status === 'failed' ? (airtelResponse?.error || 'Airtel payment failed') : undefined,
    });
    await payment.save();

    if (status === 'failed') {
      await createNotification(
        req.user.id,
        'payment_failed',
        'Payment Failed',
        `❌ Payment of ${formatCurrency(amount)} to ${recipientName} failed. Please check Airtel logs.`,
        `/payments/${payment._id}`
      );
      return res.status(500).json({ error: 'Airtel payment failed.', payment });
    }

    const senderName = await getSenderName(req.user.id);

    // ─── Notify accountants ──────────────────────────────────────────
    const accountants = await User.find({ role: 'accountant' });
    for (let accountant of accountants) {
      await createNotification(
        accountant._id,
        'payment_made',
        'Payment Made',
        `${senderName} paid ${recipientName} ${formatCurrency(amount)}`,
        `/payments/${payment._id}`
      );
    }

    // Notify worker if they have a user account
    if (worker) {
      const workerUser = await User.findOne({ email: recipientPhone });
      if (workerUser) {
        await createNotification(
          workerUser._id,
          'payment_made',
          'You Received Payment',
          `You received ${formatCurrency(amount)} from ${senderName}`,
          `/payments/${payment._id}`
        );
      }
    }
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── BULK payments ──────────────────────────────────────────────────────
router.post('/bulk', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !payments.length) return res.status(400).json({ error: 'No payments provided' });

    // ─── Check Airtel credentials ────────────────────────────────────
    if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
      // ─── Create notification for the user ────────────────────────
      await createNotification(
        req.user.id,
        'payment_failed',
        'Bulk Payment Failed',
        `❌ Bulk payment failed because Airtel credentials are missing. Please contact system administrator.`,
        `/payments`
      );
      // ─── Also notify admins ──────────────────────────────────────
      const admins = await User.find({ role: 'admin' });
      for (let admin of admins) {
        if (admin._id.toString() !== req.user.id) {
          await createNotification(
            admin._id,
            'payment_failed',
            'Bulk Payment Failed',
            `Bulk payment failed due to missing Airtel credentials.`,
            `/payments`
          );
        }
      }
      return res.status(500).json({
        error: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.'
      });
    }

    const senderName = await getSenderName(req.user.id);
    const created = [];
    const failed = [];

    for (let p of payments) {
      const worker = await Worker.findById(p.workerId);
      if (!worker) {
        failed.push({ workerId: p.workerId, error: 'Worker not found' });
        continue;
      }
      const phone = worker.mobileMoneyNumber || worker.phone;
      if (!phone) {
        failed.push({ workerId: p.workerId, name: worker.name, error: 'No phone number' });
        continue;
      }
      if (p.amount <= 0) continue;

      const reference = `BULK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      let airtelResponse = null;
      let status = 'pending';

      try {
        airtelResponse = await sendMoney(
          phone,
          p.amount,
          reference,
          `Bulk payment to ${worker.name}`
        );
        if (airtelResponse?.status === 'success' || airtelResponse?.data?.status === 'SUCCESS') {
          status = 'completed';
        } else {
          status = 'failed';
        }
      } catch (err) {
        console.error(`Airtel error for ${worker.name}:`, err);
        status = 'failed';
        airtelResponse = { error: err.message };
      }

      const payment = new Payment({
        type: 'worker',
        recipientName: worker.name,
        recipientPhone: phone,
        amount: p.amount,
        reference,
        paidBy: req.user.id,
        worker: worker._id,
        project: worker.project,
        status,
        airtelResponse,
        errorMessage: status === 'failed' ? (airtelResponse?.error || 'Airtel payment failed') : undefined,
        notes: 'Bulk payment',
      });
      await payment.save();

      if (status === 'completed') {
        created.push(payment);
        // Notify worker if user account exists
        const workerUser = await User.findOne({ email: phone });
        if (workerUser) {
          await createNotification(
            workerUser._id,
            'payment_made',
            'You Received Payment',
            `You received ${formatCurrency(p.amount)} from ${senderName} (bulk)`,
            `/payments/${payment._id}`
          );
        }
      } else {
        failed.push({ workerId: p.workerId, name: worker.name, amount: p.amount, error: 'Airtel payment failed' });
        await createNotification(
          req.user.id,
          'payment_failed',
          'Bulk Payment Failed',
          `❌ Payment of ${formatCurrency(p.amount)} to ${worker.name} failed.`,
          `/payments`
        );
      }
    }

    const totalAmount = created.reduce((sum, p) => sum + p.amount, 0);
    if (created.length > 0) {
      // Notify accountants about successful bulk payments
      const accountants = await User.find({ role: 'accountant' });
      for (let accountant of accountants) {
        await createNotification(
          accountant._id,
          'payment_made',
          'Bulk Payments Made',
          `${senderName} made bulk payments totaling ${formatCurrency(totalAmount)}`,
          `/payments`
        );
      }
    }

    res.status(201).json({
      message: 'Bulk payments processed',
      successful: created.length,
      failed: failed.length,
      created,
      failed
    });
  } catch (err) {
    console.error('Bulk payment error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── Search workers for payment ──────────────────────────────────────
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

// ─── Mark payment as failed ──────────────────────────────────────────
router.put('/:id/fail', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status === 'failed') return res.status(400).json({ error: 'Already failed' });

    payment.status = 'failed';
    payment.notes = payment.notes ? `${payment.notes} (Failed)` : 'Failed';
    await payment.save();

    const senderName = await getSenderName(req.user.id);
    const users = await User.find({ role: { $in: ['admin', 'accountant'] } });
    for (let user of users) {
      await Notification.create({
        user: user._id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Payment of ${formatCurrency(payment.amount)} to ${payment.recipientName} failed. Please review.`,
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