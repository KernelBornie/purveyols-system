const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('paidBy', 'name')
      .populate('project', 'name')
      .populate('worker', 'name nrc phone');
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a single payment
router.post('/', auth, async (req, res) => {
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
    res.status(201).json(payment);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Bulk payment – pay multiple workers at once
router.post('/bulk', auth, async (req, res) => {
  try {
    const { payments } = req.body; // array of { workerId, amount }
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

// Search workers by NRC or phone
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
    // Include balance (we need to compute it)
    const enriched = await Promise.all(workers.map(async (worker) => {
      const attendance = await require('../models/Attendance').find({ worker: worker._id });
      const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
      const payments = await Payment.find({ worker: worker._id, status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker._doc, balance: totalEarned - totalPaid, totalPaid };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
