const express = require('express');
const router = express.Router();
const ProcurementOrder = require('../models/ProcurementOrder');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProcurementOrder.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const order = new ProcurementOrder({ ...req.body, createdBy: req.user.id });
    await order.save();
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/fund', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = 'funded';
    order.fundedBy = req.user.id;
    order.fundedAt = new Date();
    await order.save();
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await ProcurementOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
