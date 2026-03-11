const express = require('express');
const { body, validationResult } = require('express-validator');
const MaterialRequest = require('../models/MaterialRequest');
const { authenticate, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/material-requests
router.post(
  '/',
  generalLimiter,
  authenticate,
  authorize('engineer', 'foreman', 'procurement'),
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('site').trim().notEmpty().withMessage('Site is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { itemName, quantity, unit, estimatedCost, urgency, site, notes } = req.body;
      const request = await MaterialRequest.create({
        itemName,
        quantity,
        unit,
        estimatedCost,
        urgency,
        site,
        notes,
        requestedBy: req.user._id,
      });
      await request.populate('requestedBy', 'name email role');
      res.status(201).json({ request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/material-requests
router.get(
  '/',
  generalLimiter,
  authenticate,
  authorize('engineer', 'foreman', 'procurement', 'accountant', 'director'),
  async (req, res) => {
    try {
      const { status, site } = req.query;
      const filter = {};
      if (req.user.role === 'engineer' || req.user.role === 'foreman') {
        filter.requestedBy = req.user._id;
      }
      if (status) filter.status = status;
      if (site) filter.site = site;

      const requests = await MaterialRequest.find(filter)
        .populate('requestedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 });
      res.json({ requests });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/material-requests/:id/status
router.put(
  '/:id/status',
  generalLimiter,
  authenticate,
  authorize('procurement', 'director'),
  async (req, res) => {
    try {
      const { status, supplier, notes } = req.body;
      const request = await MaterialRequest.findByIdAndUpdate(
        req.params.id,
        { status, supplier, notes, assignedTo: req.user._id },
        { new: true, runValidators: true }
      )
        .populate('requestedBy', 'name email role')
        .populate('assignedTo', 'name email role');
      if (!request) return res.status(404).json({ message: 'Material request not found' });
      res.json({ request });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
