const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  console.log('👤 Visitor GET - user:', req.user?.role, req.user?.id);
  try {
    const visitors = await Visitor.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .sort({ checkIn: -1 });
    console.log(`✅ Found ${visitors.length} visitors`);
    res.json(visitors);
  } catch (err) {
    console.error('❌ Error fetching visitors:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'receptionist', 'security', 'civil-engineer', 'foreman'), async (req, res) => {
  try {
    const visitor = new Visitor({
      ...req.body,
      createdBy: req.user.id
    });
    await visitor.save();
    const populated = await Visitor.findById(visitor._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'receptionist', 'security', 'civil-engineer', 'foreman'), async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    res.json(visitor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── CHECK OUT ──────────────────────────────────────────────────────
router.put('/:id/checkout', auth, authorize('admin', 'director', 'receptionist', 'security'), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status === 'departed') {
      return res.status(400).json({ error: 'Visitor already departed' });
    }
    visitor.status = 'departed';
    visitor.checkOut = new Date();
    await visitor.save();
    const populated = await Visitor.findById(visitor._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await Visitor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Visitor not found' });
    res.json({ message: 'Visitor deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;