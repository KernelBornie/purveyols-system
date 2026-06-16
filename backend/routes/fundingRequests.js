const express = require('express');
const router = express.Router();
const FundingRequest = require('../models/FundingRequest');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const requests = await FundingRequest.find().populate('project requestedBy approvedBy');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
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

router.put('/:id/approve', auth, async (req, res) => {
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

router.put('/:id/reject', auth, async (req, res) => {
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

module.exports = router;
