const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { sendEmail } = require('../services/emailService');

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

    const reference = `MOB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
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

    // Log the USSD prompt (simulation)
    console.log(`📱 [SIMULATION] Airtel Money USSD prompt sent to ${accountant.mobileMoneyNumber}`);
    console.log(`   Amount: ZMW ${amount}`);
    console.log(`   Recipient: ${recipientPhone} (${worker?.name || 'unknown'})`);
    console.log(`   Reference: ${reference}`);

    // Send email to accountant with USSD prompt details (simulation)
    await sendEmail(
      accountant.email,
      'Airtel Money Payment Request',
      `
        <h2>Payment Request</h2>
        <p>You have initiated a payment of <strong>ZMW ${amount}</strong> to ${worker?.name || 'unknown worker'} (${recipientPhone}).</p>
        <p>Please check your phone (${accountant.mobileMoneyNumber}) for the USSD prompt to complete the transaction.</p>
        <p>Once you confirm on your phone, return to the app and click "I Have Confirmed".</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p>— Purveyols CMS</p>
      `
    );

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
    payment.status = 'completed';
    await payment.save();

    await createNotification(
      req.user.id,
      'payment_made',
      'Payment Confirmed',
      `You confirmed payment of ZMW ${payment.amount} to ${payment.recipientName}`,
      `/payments/${payment._id}`
    );

    // Notify the worker if they have an email
    if (payment.worker) {
      const worker = await Worker.findById(payment.worker);
      if (worker) {
        // If worker has a user account, notify them
        const workerUser = await User.findOne({ email: worker.phone }); // simplistic
        if (workerUser) {
          await createNotification(
            workerUser._id,
            'payment_made',
            'Payment Received',
            `You received ZMW ${payment.amount} from ${payment.paidBy?.name || 'accountant'}`,
            `/payments/${payment._id}`
          );
        }
      }
    }

    res.json({ message: 'Payment confirmed successfully', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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
