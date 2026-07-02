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
const PaymentEngine = require('../services/paymentService'); // ← UNIFIED PAYMENT ENGINE

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
      const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
      for (let user of adminsAndAccountants) {
        await createNotification(
          user._id,
          'payment_failed',
          'Payment Failed',
          `Payment of ${formatCurrency(amount)} to ${recipientName} failed because Airtel credentials are missing. Please contact system administrator.`,
          `/payments`
        );
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
      // Notify admins and accountants about failure
      const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
      for (let user of adminsAndAccountants) {
        await createNotification(
          user._id,
          'payment_failed',
          'Payment Failed',
          `Payment of ${formatCurrency(amount)} to ${recipientName} failed. Please review.`,
          `/payments/${payment._id}`
        );
      }
      return res.status(500).json({ error: 'Airtel payment failed.', payment });
    }

    // ─── Successful payment ──────────────────────────────────────────
    // ─── RECORD IN UNIFIED PAYMENT ENGINE ──────────────────────────
    let transactionId = null;
    try {
      transactionId = await PaymentEngine.processPayment({
        amount: payment.amount,
        currency: 'ZMW',
        sourceModule: 'Payment',          // model name
        sourceId: payment._id,
        description: `Payment to ${payment.recipientName} (ref: ${payment.reference})`,
        recipient: payment.worker,        // worker ID if exists; if not, maybe paidBy?
        approvedBy: req.user.id,
        metadata: { reference: payment.reference }
      }, req.user.id);
      // store transactionId back to payment
      payment.transactionId = transactionId;
      await payment.save();
    } catch (engineErr) {
      console.error('PaymentEngine error:', engineErr);
      // Even if engine fails, we already sent Airtel money, so we must notify admins
      const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
      for (let user of adminsAndAccountants) {
        await createNotification(
          user._id,
          'payment_engine_error',
          'Payment Engine Error',
          `Payment to ${recipientName} succeeded in Airtel but failed to record in ledger. Please check.`,
          `/payments/${payment._id}`
        );
      }
      // We still return success because money was sent, but with a warning
      return res.status(201).json({ ...payment.toObject(), warning: 'Ledger recording failed. Manual intervention required.' });
    }

    const senderName = await getSenderName(req.user.id);

    // Notify admins and accountants
    const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
    for (let user of adminsAndAccountants) {
      await createNotification(
        user._id,
        'payment_made',
        'Payment Made',
        `${senderName} paid ${recipientName} ${formatCurrency(amount)} (Txn: ${transactionId})`,
        `/payments/${payment._id}`
      );
    }

    // Notify the recipient (worker) if they have a user account
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
      const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
      for (let user of adminsAndAccountants) {
        await createNotification(
          user._id,
          'payment_failed',
          'Bulk Payment Failed',
          `Bulk payment failed because Airtel credentials are missing.`,
          `/payments`
        );
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
        // ——— RECORD IN UNIFIED PAYMENT ENGINE ———
        let txId = null;
        try {
          txId = await PaymentEngine.processPayment({
            amount: payment.amount,
            currency: 'ZMW',
            sourceModule: 'Payment',
            sourceId: payment._id,
            description: `Bulk payment to ${worker.name}`,
            recipient: payment.worker,
            approvedBy: req.user.id,
            metadata: { bulk: true }
          }, req.user.id);
          payment.transactionId = txId;
          await payment.save();
        } catch (engineErr) {
          console.error('PaymentEngine error for bulk:', engineErr);
          // still push to created but with warning
          payment.transactionId = 'ENGINE_ERROR';
          await payment.save();
          // we'll notify later
        }

        created.push(payment);
        // Notify the worker if they have a user account
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
        const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
        for (let user of adminsAndAccountants) {
          await createNotification(
            user._id,
            'payment_failed',
            'Bulk Payment Failed',
            `Payment of ${formatCurrency(p.amount)} to ${worker.name} failed.`,
            `/payments`
          );
        }
      }
    }

    const totalAmount = created.reduce((sum, p) => sum + p.amount, 0);
    if (created.length > 0) {
      const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
      for (let user of adminsAndAccountants) {
        await createNotification(
          user._id,
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

    // Notify ONLY admins and accountants
    const adminsAndAccountants = await User.find({ role: { $in: ['admin', 'accountant'] } });
    for (let user of adminsAndAccountants) {
      await createNotification(
        user._id,
        'payment_failed',
        'Payment Failed',
        `Payment of ${formatCurrency(payment.amount)} to ${payment.recipientName} failed. Please review.`,
        `/payments/${payment._id}`
      );
    }

    res.json({ message: 'Payment marked as failed', payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;