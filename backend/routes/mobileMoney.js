const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// Initiate payment – sends USSD prompt to accountant's phone
router.post('/initiate', auth, async (req, res) => {
  try {
    const { recipientPhone, amount, workerId, note } = req.body;
    if (!recipientPhone || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({ error: 'Accountant mobile money number not set. Please update your profile.' });
    }

    // Find worker if provided
    let worker = null;
    if (workerId) {
      worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ error: 'Worker not found' });
    }

    // Generate a unique reference
    const reference = `MOB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Store pending payment (status: pending)
    const payment = new Payment({
      type: 'worker',
      recipientName: worker ? worker.name : 'Mobile Money Recipient',
      recipientPhone,
      amount: parseFloat(amount),
      reference,
      paidBy: req.user.id,
      worker: worker ? worker._id : null,
      status: 'pending', // awaiting confirmation on phone
      notes: note || 'Airtel Money payment initiated',
    });
    await payment.save();

    // Simulate USSD prompt: In real life, you'd call Airtel Money API here.
    // For simulation, we'll return a message that the USSD prompt has been sent.
    // The accountant will confirm on their phone (simulated by a button in the frontend).

    res.status(201).json({
      message: 'Airtel Money USSD prompt sent to your phone.',
      reference,
      payment,
      requiresConfirmation: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment (after accountant confirms on phone)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { reference } = req.body;
    const payment = await Payment.findOne({ reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }
    // Update status to completed
    payment.status = 'completed';
    await payment.save();

    // Notify
    const user = await User.findById(req.user.id);
    await createNotification(
      req.user.id,
      'payment_made',
      'Payment Confirmed',
      `You confirmed payment of ZMW ${payment.amount} to ${payment.recipientName}`,
      `/payments/${payment._id}`
    );

    res.json({ message: 'Payment confirmed successfully', payment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get payment status
router.get('/status/:reference', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ reference: req.params.reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ status: payment.status, payment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
