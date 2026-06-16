const express = require('express');
const router = express.Router();
const FundingRequest = require('../models/FundingRequest');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const requests = await FundingRequest.find()
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const request = new FundingRequest({ ...req.body, requestedBy: req.user.id });
    await request.save();
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
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
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
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
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
