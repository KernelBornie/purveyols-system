const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'materialRequests endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'materialRequests created' }));
module.exports = router;
const express = require('express');
const router = express.Router();
const MaterialRequest = require('../models/MaterialRequest');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── GET all ──────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const requests = await MaterialRequest.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single ──────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!request) return res.status(404).json({ error: 'Material request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ──────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const request = new MaterialRequest({ ...req.body, createdBy: req.user.id });
    await request.save();
    const populated = await MaterialRequest.findById(request._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const updated = await MaterialRequest.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!updated) return res.status(404).json({ error: 'Material request not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const deleted = await MaterialRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Material request not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
