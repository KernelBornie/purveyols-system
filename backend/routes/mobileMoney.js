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

    let worker = null;
    if (workerId) {
      worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ error: 'Worker not found' });
    }

    // Generate a unique reference
    const reference = `MOB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Store pending payment
    const payment = new Payment({
      type: 'worker',
      recipientName: worker ? worker.name : 'Mobile Money Recipient',
      recipientPhone,
      amount: parseFloat(amount),
      reference,
      paidBy: req.user.id,
      worker: worker ? worker._id : null,
      status: 'pending',
      notes: note || 'Airtel Money payment initiated',
    });
    await payment.save();

    // In production: Call Airtel Money API to send USSD prompt to accountant's phone
    // const airtelResponse = await callAirtelAPI({
    //   phone: accountant.mobileMoneyNumber,
    //   amount: parseFloat(amount),
    //   reference: reference,
    // });

    // SIMULATION: Log the USSD prompt details
    console.log(`📱 [AIRTEL MONEY] USSD prompt sent to: ${accountant.mobileMoneyNumber}`);
    console.log(`   Amount: ZMW ${amount}`);
    console.log(`   Recipient: ${recipientPhone} (${worker?.name || 'unknown'})`);
    console.log(`   Reference: ${reference}`);
    console.log(`   Accountant: ${accountant.name} (${accountant.email})`);
    console.log('');
    console.log('📌 INSTRUCTIONS:');
    console.log(`   1. Check phone ${accountant.mobileMoneyNumber} for USSD prompt`);
    console.log('   2. Enter your Airtel Money PIN on your phone');
    console.log('   3. Click "I Have Confirmed" button in the app after PIN entry');

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

// Confirm payment (after accountant enters PIN on phone)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { reference } = req.body;
    const payment = await Payment.findOne({ reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // In production: Verify with Airtel Money API
    // const status = await checkAirtelStatus(reference);
    // if (status === 'completed') {
    //   payment.status = 'completed';
    // } else {
    //   return res.status(400).json({ error: 'Payment not confirmed on phone' });
    // }

    // For simulation: mark as completed
    payment.status = 'completed';
    await payment.save();

    // Notify accountant
    await createNotification(
      req.user.id,
      'payment_made',
      'Payment Confirmed',
      `You confirmed payment of ZMW ${payment.amount} to ${payment.recipientName}`,
      `/payments/${payment._id}`
    );

    res.json({ 
      message: 'Payment confirmed successfully', 
      payment,
      reference: payment.reference,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Check payment status
router.get('/status/:reference', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ reference: req.params.reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ status: payment.status, payment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
