const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const BOQ = require('../models/BOQ');

// GET /api/boq – list BOQs (engineer sees own; director/procurement see all)
router.get('/', auth, async (req, res) => {
  try {
    const filter = ['director', 'procurement', 'admin'].includes(req.user.role)
      ? {}
      : { createdBy: req.user._id };
    const boqs = await BOQ.find(filter)
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ boqs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/boq – create a BOQ
router.post('/', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const boq = new BOQ({ ...req.body, createdBy: req.user._id });
    await boq.save();
    await boq.populate('createdBy', 'name email role');
    await boq.populate('project', 'name');
    res.status(201).json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/boq/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name')
      .populate('sharedWith', 'name email role');
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    res.json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/boq/:id – update a BOQ
router.put('/:id', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    Object.assign(boq, req.body);
    await boq.save();
    await boq.populate('createdBy', 'name email role');
    await boq.populate('project', 'name');
    res.json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/boq/:id/submit – change status to submitted
router.put('/:id/submit', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndUpdate(
      req.params.id,
      { status: 'submitted' },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('project', 'name');
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    res.json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/boq/:id/share – mark as shared
router.put('/:id/share', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const { sharedWith } = req.body;
    const boq = await BOQ.findByIdAndUpdate(
      req.params.id,
      { status: 'shared', sharedWith: sharedWith || [] },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .populate('sharedWith', 'name email role');
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    res.json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/boq/:id/approve – director approves
router.put('/:id/approve', auth, roleCheck('director', 'admin'), async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name');
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    res.json({ boq });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/boq/:id
router.delete('/:id', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndDelete(req.params.id);
    if (!boq) return res.status(404).json({ message: 'BOQ not found' });
    res.json({ message: 'BOQ deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
