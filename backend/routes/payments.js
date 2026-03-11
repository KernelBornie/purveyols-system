const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Payment = require('../models/Payment');

// GET /api/payments – accountant/director only
router.get('/', auth, roleCheck('accountant', 'director'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('project', 'name')
      .populate('processedBy', 'name email');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/payments – accountant only
router.post('/', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const payment = new Payment({ ...req.body, processedBy: req.user._id });
    await payment.save();
    await payment.populate('project', 'name');
    await payment.populate('processedBy', 'name email');
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/payments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('project', 'name')
      .populate('processedBy', 'name email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/payments/:id – accountant only
router.put('/:id', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('processedBy', 'name email');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
