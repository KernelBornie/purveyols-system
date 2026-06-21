const express = require('express');
const router = express.Router();
const FundingRequest = require('../models/FundingRequest');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const requests = await FundingRequest.find().populate('project requestedBy approvedBy');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id).populate('project requestedBy approvedBy');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post(
  '/',
  auth,
  authorize(
    'admin',
    'director',
    'civil-engineer',
    'quantity-surveyor',
    'foreman',
    'driver',
    'safety-officer',
    'procurement-officer',
    'accountant'
  ),
  async (req, res) => {
  try {
    const request = new FundingRequest({ ...req.body, requestedBy: req.user.id });
    await request.save();
    const populated = await FundingRequest.findById(request._id).populate('project requestedBy approvedBy');
    // Notify accountant and director
    const accountants = await User.find({ role: 'accountant' });
    const directors = await User.find({ role: 'director' });
    const recipients = [...accountants, ...directors];
    for (let recipient of recipients) {
      await createNotification(
        recipient._id,
        'funding_requested',
        'New Funding Request',
        `${req.user.name} requested ZMW ${request.amount} for ${request.project?.name || 'project'}`,
        `/funding/${request._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const updated = await FundingRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project requestedBy approvedBy');
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();
    const populated = await FundingRequest.findById(request._id).populate('project requestedBy approvedBy');
    // Notify requester
    await createNotification(
      request.requestedBy,
      'funding_approved',
      'Funding Request Approved',
      `Your funding request for ZMW ${request.amount} was approved by ${req.user.name}`,
      `/funding/${request._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/reject', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.status = 'rejected';
    request.rejectionReason = req.body.reason || 'No reason provided';
    await request.save();
    const populated = await FundingRequest.findById(request._id).populate('project requestedBy approvedBy');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await FundingRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
