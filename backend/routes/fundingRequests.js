const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const FundingRequest = require('../models/FundingRequest');
const { createNotification } = require('../utils/notifications');

// GET /api/funding-requests
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'director' || req.user.role === 'accountant'
      ? {}
      : { requestedBy: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const requests = await FundingRequest.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/funding-requests
router.post('/', auth, async (req, res) => {
  try {
    const request = new FundingRequest({ ...req.body, requestedBy: req.user._id });
    await request.save();
    await request.populate('requestedBy', 'name email role');
    await request.populate('project', 'name');
    createNotification(
      req.user._id,
      `Your funding request "${request.title}" has been submitted and is pending approval.`,
      'funding_request'
    );
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/funding-requests/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id)
      .populate('requestedBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    if (!request) return res.status(404).json({ message: 'Funding request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/funding-requests/:id/approve – director only
router.put('/:id/approve', auth, roleCheck('director'), async (req, res) => {
  try {
    const request = await FundingRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    )
      .populate('requestedBy', 'name email role')
      .populate('project', 'name')
      .populate('approvedBy', 'name email');
    if (!request) return res.status(404).json({ message: 'Funding request not found' });
    createNotification(
      request.requestedBy._id,
      `Your funding request "${request.title}" has been approved.`,
      'approval'
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/funding-requests/:id/reject – director only
router.put('/:id/reject', auth, roleCheck('director'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await FundingRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason },
      { new: true }
    )
      .populate('requestedBy', 'name email role')
      .populate('project', 'name');
    if (!request) return res.status(404).json({ message: 'Funding request not found' });
    createNotification(
      request.requestedBy._id,
      `Your funding request "${request.title}" has been rejected.`,
      'rejection'
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
