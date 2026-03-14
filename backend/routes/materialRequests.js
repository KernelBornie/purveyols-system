const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const MaterialRequest = require('../models/MaterialRequest');

// GET /api/material-requests
router.get('/', auth, async (req, res) => {
  try {
    const filter = ['director', 'procurement'].includes(req.user.role)
      ? {}
      : { requestedBy: req.user._id };
    const requests = await MaterialRequest.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/material-requests
router.post('/', auth, async (req, res) => {
  try {
    const request = new MaterialRequest({ ...req.body, requestedBy: req.user._id });
    await request.save();
    await request.populate('requestedBy', 'name email role');
    await request.populate('project', 'name');
    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/material-requests/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id)
      .populate('requestedBy', 'name email role')
      .populate('project', 'name');
    if (!request) return res.status(404).json({ message: 'Material request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/material-requests/:id/status – procurement/director only
router.put('/:id/status', auth, roleCheck('procurement', 'director'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await MaterialRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('requestedBy', 'name email role')
      .populate('project', 'name');
    if (!request) return res.status(404).json({ message: 'Material request not found' });
    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
