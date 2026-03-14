const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Worker = require('../models/Worker');
const { authenticate, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/workers - enroll a worker (foreman, engineer, accountant, director)
router.post(
  '/',
  generalLimiter,
  authenticate,
  authorize('foreman', 'engineer', 'accountant', 'director'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('nrc').trim().notEmpty().withMessage('NRC is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('dailyRate').isNumeric().withMessage('Daily rate must be numeric'),
    body('site').trim().notEmpty().withMessage('Site is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, nrc, phone, dailyRate, site, mobileNetwork, jobRole } = req.body;
      const existing = await Worker.findOne({ nrc });
      if (existing) return res.status(400).json({ message: 'Worker with this NRC already exists' });

      const worker = await Worker.create({
        name,
        nrc,
        phone,
        dailyRate,
        site,
        jobRole: jobRole || '',
        mobileNetwork: mobileNetwork || 'airtel',
        enrolledBy: req.user._id,
      });
      await worker.populate('enrolledBy', 'name email role');
      res.status(201).json({ worker });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/workers - list workers
router.get(
  '/',
  generalLimiter,
  authenticate,
  authorize('accountant', 'director', 'engineer', 'foreman', 'procurement'),
  async (req, res) => {
    try {
      const { site, search } = req.query;
      const filter = {};
      if (site) filter.site = site;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nrc: { $regex: search, $options: 'i' } },
        ];
      }
      const workers = await Worker.find(filter)
        .populate('enrolledBy', 'name email role')
        .sort({ createdAt: -1 });
      res.json({ workers });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/workers/search - search by NRC
router.get(
  '/search',
  generalLimiter,
  authenticate,
  authorize('accountant', 'director', 'engineer', 'foreman'),
  [query('nrc').trim().notEmpty().withMessage('NRC query is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const worker = await Worker.findOne({ nrc: req.query.nrc }).populate(
        'enrolledBy',
        'name email role'
      );
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      res.json({ worker });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/workers/:id
router.get(
  '/:id',
  generalLimiter,
  authenticate,
  authorize('accountant', 'director', 'engineer', 'foreman'),
  async (req, res) => {
    try {
      const worker = await Worker.findById(req.params.id).populate('enrolledBy', 'name email role');
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      res.json({ worker });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/workers/:id
router.put(
  '/:id',
  generalLimiter,
  authenticate,
  authorize('foreman', 'engineer', 'accountant', 'director'),
  async (req, res) => {
    try {
      const { name, phone, dailyRate, site, mobileNetwork, jobRole, isActive } = req.body;
      const worker = await Worker.findByIdAndUpdate(
        req.params.id,
        { name, phone, dailyRate, site, mobileNetwork, jobRole, isActive },
        { new: true, runValidators: true }
      ).populate('enrolledBy', 'name email role');
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      res.json({ worker });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/workers/:id - deactivate worker
router.delete(
  '/:id',
  generalLimiter,
  authenticate,
  authorize('engineer', 'accountant', 'director'),
  async (req, res) => {
    try {
      const worker = await Worker.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      res.json({ message: 'Worker deactivated', worker });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
