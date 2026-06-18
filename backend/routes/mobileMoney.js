const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { sendMoney, checkTransactionStatus } = require('../services/airtelMoneyService');

// Initiate payment – send real Airtel Money API request
router.post('/initiate', auth, async (req, res) => {
  try {
    const { recipientPhone, amount, workerId, note } = req.body;
    if (!recipientPhone || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({ 
        error: 'Accountant mobile money number not set. Please update your profile.' 
      });
    }

    let worker = null;
    if (workerId) {
      worker = await Worker.findById(workerId);
      if (!worker) return res.status(404).json({ error: 'Worker not found' });
    }

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create pending payment record
    const payment = new Payment({
      type: 'worker',
      recipientName: worker ? worker.name : 'Mobile Money Recipient',
      recipientPhone,
      amount: parseFloat(amount),
      reference,
      paidBy: req.user.id,
      worker: worker ? worker._id : null,
      status: 'pending',
      notes: note || 'Airtel Money payment',
    });
    await payment.save();

    // Send real Airtel Money API request
    try {
      console.log(`📱 Sending Airtel Money payment...`);
      console.log(`   Amount: ZMW ${amount}`);
      console.log(`   Recipient: ${recipientPhone}`);
      console.log(`   Reference: ${reference}`);
      
      const airtelResponse = await sendMoney(
        recipientPhone,
        amount,
        reference,
        note || `Payment to ${worker?.name || 'Worker'}`
      );
      
      // Update payment with Airtel response
      payment.airtelResponse = airtelResponse;
      payment.airtelTransactionId = airtelResponse?.data?.transactionId || airtelResponse?.transactionId;
      await payment.save();
      
      // Notify accountant
      await createNotification(
        req.user.id,
        'payment_initiated',
        'Payment Initiated',
        `Payment of ZMW ${amount} sent to ${worker?.name || recipientPhone}`,
        `/payments/${payment._id}`
      );
      
      // If Airtel returns immediate success, mark as completed
      if (airtelResponse?.status === 'success' || airtelResponse?.data?.status === 'SUCCESS') {
        payment.status = 'completed';
        await payment.save();
        
        // Notify worker (if they have a user account)
        if (worker) {
          const workerUser = await User.findOne({ phone: recipientPhone });
          if (workerUser) {
            await createNotification(
              workerUser._id,
              'payment_received',
              'Payment Received',
              `You received ZMW ${amount} from ${accountant.name}`,
              `/payments/${payment._id}`
            );
          }
        }
      }
      
      res.status(201).json({
        message: 'Payment initiated successfully',
        reference,
        payment,
        requiresConfirmation: payment.status === 'pending',
        airtelResponse,
      });
      
    } catch (airtelError) {
      console.error('Airtel API error:', airtelError);
      payment.status = 'failed';
      payment.errorMessage = airtelError.message;
      await payment.save();
      
      // Notify accountant of failure
      await createNotification(
        req.user.id,
        'payment_failed',
        'Payment Failed',
        `Payment of ZMW ${amount} to ${worker?.name || recipientPhone} failed. Please try again.`,
        `/payments/${payment._id}`
      );
      
      return res.status(500).json({
        error: 'Payment failed: ' + (airtelError.message || 'Airtel service error'),
        payment,
      });
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment (check status from Airtel)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { reference } = req.body;
    const payment = await Payment.findOne({ reference });
    if (!payment) return res.status(404).json({ error: 'Transaction not found' });
    
    if (payment.status === 'completed') {
      return res.json({ message: 'Payment already completed', payment });
    }
    
    // Check status with Airtel
    const status = await checkTransactionStatus(reference);
    
    if (status?.status === 'SUCCESS' || status?.data?.status === 'SUCCESS') {
      payment.status = 'completed';
      await payment.save();
      
      // Notify accountant
      await createNotification(
        req.user.id,
        'payment_confirmed',
        'Payment Confirmed',
        `Payment of ZMW ${payment.amount} to ${payment.recipientName} confirmed`,
        `/payments/${payment._id}`
      );
      
      res.json({
        message: 'Payment confirmed successfully',
        payment,
        status: 'completed',
      });
    } else {
      res.status(400).json({
        error: 'Payment not confirmed on Airtel',
        status: status?.status || 'PENDING',
        payment,
      });
    }
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
    
    // Check with Airtel
    const status = await checkTransactionStatus(req.params.reference);
    
    res.json({
      payment,
      airtelStatus: status,
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
