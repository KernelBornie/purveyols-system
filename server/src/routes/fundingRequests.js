const express = require('express');
const { body, validationResult } = require('express-validator');
const FundingRequest = require('../models/FundingRequest');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/funding-requests
router.post(
  '/',
  authenticate,
  authorize('engineer', 'foreman', 'accountant'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isNumeric({ min: 0 }).withMessage('Amount must be a positive number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, description, amount, site, priority } = req.body;
      const request = await FundingRequest.create({
        title,
        description,
        amount,
        site,
        priority,
        requestedBy: req.user._id,
        requestedByRole: req.user.role,
      });
      await request.populate('requestedBy', 'name email role');
      res.status(201).json({ request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/funding-requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, site } = req.query;
    const filter = {};

    // Engineers & foremen see their own requests; accountant sees engineer requests + their own;
    // director sees all
    if (req.user.role === 'engineer' || req.user.role === 'foreman') {
      filter.requestedBy = req.user._id;
    } else if (req.user.role === 'accountant') {
      // accountant sees engineer/foreman requests and their own
      filter.$or = [
        { requestedBy: req.user._id },
        { requestedByRole: { $in: ['engineer', 'foreman'] } },
      ];
    }
    // director sees all

    if (status) filter.status = status;
    if (site) filter.site = site;

    const requests = await FundingRequest.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/funding-requests/:id/approve
router.put(
  '/:id/approve',
  authenticate,
  authorize('accountant', 'director'),
  async (req, res) => {
    try {
      const request = await FundingRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Funding request not found' });

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request is not in pending status' });
      }

      // Accountant can approve engineer/foreman requests; director can approve accountant requests
      if (
        req.user.role === 'accountant' &&
        !['engineer', 'foreman'].includes(request.requestedByRole)
      ) {
        return res.status(403).json({ message: 'Accountant can only approve engineer/foreman requests' });
      }

      if (req.user.role === 'director' && request.requestedByRole !== 'accountant') {
        return res.status(403).json({ message: 'Director can only approve accountant funding requests' });
      }

      request.status = 'approved';
      request.approvedBy = req.user._id;
      request.approvalNotes = req.body.approvalNotes || '';
      await request.save();

      await request.populate([
        { path: 'requestedBy', select: 'name email role' },
        { path: 'approvedBy', select: 'name email role' },
      ]);

      res.json({ request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/funding-requests/:id/reject
router.put(
  '/:id/reject',
  authenticate,
  authorize('accountant', 'director'),
  async (req, res) => {
    try {
      const request = await FundingRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Funding request not found' });

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request is not in pending status' });
      }

      request.status = 'rejected';
      request.approvedBy = req.user._id;
      request.rejectionReason = req.body.rejectionReason || '';
      await request.save();

      await request.populate([
        { path: 'requestedBy', select: 'name email role' },
        { path: 'approvedBy', select: 'name email role' },
      ]);

      res.json({ request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/funding-requests/:id/disburse
router.put('/:id/disburse', authenticate, authorize('director'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Funding request not found' });
    if (request.status !== 'approved')
      return res.status(400).json({ message: 'Request must be approved before disbursing' });

    request.status = 'disbursed';
    await request.save();
    await request.populate([
      { path: 'requestedBy', select: 'name email role' },
      { path: 'approvedBy', select: 'name email role' },
    ]);
    res.json({ request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
