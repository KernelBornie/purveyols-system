const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── GET all visitors ──────────────────────────────────────────
router.get('/', auth, authorize('admin', 'director', 'accountant', 'safety'), async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('project', 'name')
      .populate('recordedBy', 'name role')
      .sort({ checkIn: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single visitor ────────────────────────────────────────
router.get('/:id', auth, authorize('admin', 'director', 'accountant', 'safety'), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('project', 'name')
      .populate('recordedBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE visitor ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const visitor = new Visitor({
      ...req.body,
      recordedBy: req.user.id,
    });
    await visitor.save();
    const populated = await Visitor.findById(visitor._id)
      .populate('project', 'name')
      .populate('recordedBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE visitor ─────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'accountant', 'safety'), async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('recordedBy', 'name role');
    res.json(visitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE visitor ─────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'accountant', 'safety'), async (req, res) => {
  try {
    const deleted = await Visitor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Visitor not found' });
    res.json({ message: 'Visitor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHECK OUT (set checkOut time) ─────────────────────────────
router.put('/:id/checkout', auth, authorize('admin', 'director', 'accountant', 'safety'), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    visitor.checkOut = new Date();
    await visitor.save();
    const populated = await Visitor.findById(visitor._id)
      .populate('project', 'name')
      .populate('recordedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;