const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const crypto = require('crypto');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('paidBy', 'name')
      .populate('project', 'name')
      .populate('worker', 'name nrc phone');
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
    // Notify all accountants and directors
    const accountants = await User.find({ role: 'accountant' });
    const directors = await User.find({ role: 'director' });
    const recipients = [...accountants, ...directors];
    for (let recipient of recipients) {
      await createNotification(
        recipient._id,
        'payment_made',
        'Payment Made',
        `${req.user.name} paid ${recipientName} ZMW ${amount}`,
        `/payments/${payment._id}`
      );
    }
    // Notify the worker if they have a user account (optional)
    if (worker) {
      const workerUser = await User.findOne({ email: recipientPhone }); // simplistic
      if (workerUser) {
        await createNotification(
          workerUser._id,
          'payment_made',
          'You Received Payment',
          `You received ZMW ${amount} from ${req.user.name}`,
          `/payments/${payment._id}`
        );
      }
    }
    res.status(201).json(payment);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/bulk', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !payments.length) return res.status(400).json({ error: 'No payments provided' });
    const created = [];
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
    }
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
