const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ProcurementOrder = require('../models/ProcurementOrder');

// GET /api/procurement
router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProcurementOrder.find()
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/procurement – procurement/engineer/director/foreman/driver/safety
router.post('/', auth, roleCheck('procurement', 'engineer', 'director', 'foreman', 'driver', 'safety'), async (req, res) => {
  try {
    const order = new ProcurementOrder({ ...req.body, requestedBy: req.user._id });
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/procurement/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id)
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/approve – director/engineer
router.put('/:id/approve', auth, roleCheck('director', 'engineer'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    )
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/reject – director/engineer
router.put('/:id/reject', auth, roleCheck('director', 'engineer'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const order = await ProcurementOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason },
      { new: true }
    )
      .populate('requestedBy', 'name email')
      .populate('project', 'name');
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    Object.assign(order, req.body);
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
