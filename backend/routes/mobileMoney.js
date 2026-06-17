const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const { createNotification } = require('../utils/notificationHelper');

// Simulate Airtel Money payment
router.post('/pay', auth, async (req, res) => {
  try {
    const { recipientPhone, amount, pin, workerId } = req.body;
    if (!recipientPhone || !amount || !pin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (pin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits' });
    }

    // In real implementation, you'd call Airtel Money API here.
    // For simulation, we'll just validate the PIN (mock)
    if (pin !== '1234') {
      // In real, you'd validate against the account holder's PIN via API.
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Find worker if provided
    let worker = null;
    if (workerId) {
      worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ error: 'Worker not found' });
    }

    // Create payment record
    const reference = `MOB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const payment = new Payment({
      type: 'worker',
      recipientName: worker ? worker.name : 'Mobile Money Recipient',
      recipientPhone,
      amount: parseFloat(amount),
      reference,
      paidBy: req.user.id,
      worker: worker ? worker._id : null,
      status: 'completed',
      notes: 'Airtel Money payment',
    });
    await payment.save();

    // Notify accountant (and others)
    const notif = await createNotification(
      req.user.id,
      'payment_made',
      'Mobile Money Payment Sent',
      `You sent ZMW ${amount} to ${recipientPhone}${worker ? ' for ' + worker.name : ''}`,
      `/payments/${payment._id}`
    );

    res.status(201).json({
      message: 'Payment successful',
      reference,
      payment,
      notification: notif,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get transaction status (for UI polling – simulated)
router.get('/status/:reference', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ reference: req.params.reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ status: payment.status, payment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
