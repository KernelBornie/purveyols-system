const express = require('express');
const { body, validationResult } = require('express-validator');
const SafetyReport = require('../models/SafetyReport');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/safety-reports
router.post(
  '/',
  authenticate,
  authorize('safety', 'foreman', 'engineer', 'director'),
  [
    body('site').trim().notEmpty().withMessage('Site is required'),
    body('incidentType').notEmpty().withMessage('Incident type is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { site, incidentType, description, date, actionTaken, severity } = req.body;
      const report = await SafetyReport.create({
        site,
        incidentType,
        description,
        date,
        actionTaken,
        severity,
        reportedBy: req.user._id,
      });
      await report.populate('reportedBy', 'name email role');
      res.status(201).json({ report });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/safety-reports
router.get(
  '/',
  authenticate,
  authorize('safety', 'director', 'engineer'),
  async (req, res) => {
    try {
      const { status, site, severity } = req.query;
      const filter = {};
      if (req.user.role === 'safety') filter.reportedBy = req.user._id;
      if (status) filter.status = status;
      if (site) filter.site = site;
      if (severity) filter.severity = severity;

      const reports = await SafetyReport.find(filter)
        .populate('reportedBy', 'name email role')
        .sort({ date: -1 });
      res.json({ reports });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/safety-reports/:id/status
router.put('/:id/status', authenticate, authorize('safety', 'director'), async (req, res) => {
  try {
    const report = await SafetyReport.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, actionTaken: req.body.actionTaken },
      { new: true }
    ).populate('reportedBy', 'name email role');
    if (!report) return res.status(404).json({ message: 'Safety report not found' });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
