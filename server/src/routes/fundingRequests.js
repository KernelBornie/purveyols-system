const express = require('express');
const { body, validationResult } = require('express-validator');
const FundingRequest = require('../models/FundingRequest');
const { authenticate, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/funding-requests
router.post(
  '/',
  generalLimiter,
  authenticate,
  authorize('engineer', 'foreman', 'accountant', 'driver', 'procurement'),
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
router.get('/', generalLimiter, authenticate, async (req, res) => {
  try {
    const { status, site } = req.query;
    const filter = {};

    // Engineers, foremen, drivers & procurement see their own requests;
    // accountant sees engineer/foreman/driver/procurement requests + their own;
    // director sees all
    if (['engineer', 'foreman', 'driver', 'procurement'].includes(req.user.role)) {
      filter.requestedBy = req.user._id;
    } else if (req.user.role === 'accountant') {
      // accountant sees all non-director requests and their own
      filter.$or = [
        { requestedBy: req.user._id },
        { requestedByRole: { $in: ['engineer', 'foreman', 'driver', 'procurement'] } },
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
  generalLimiter,
  authenticate,
  authorize('accountant', 'director'),
  async (req, res) => {
    try {
      const request = await FundingRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Funding request not found' });

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request is not in pending status' });
      }

      // Accountant can approve engineer/foreman/driver/procurement requests; director can approve accountant requests
      if (
        req.user.role === 'accountant' &&
        !['engineer', 'foreman', 'driver', 'procurement'].includes(request.requestedByRole)
      ) {
        return res.status(403).json({ message: 'Accountant can only approve engineer/foreman/driver/procurement requests' });
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
  generalLimiter,
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
router.put('/:id/disburse', generalLimiter, authenticate, authorize('director'), async (req, res) => {
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
