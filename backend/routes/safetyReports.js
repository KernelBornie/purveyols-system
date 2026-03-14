const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const SafetyReport = require('../models/SafetyReport');

// GET /api/safety-reports
router.get('/', auth, async (req, res) => {
  try {
    const filter = ['director', 'engineer'].includes(req.user.role)
      ? {}
      : { reportedBy: req.user._id };
    const reports = await SafetyReport.find(filter)
      .populate('reportedBy', 'name email role')
      .populate('project', 'name')
      .sort({ date: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/safety-reports
router.post('/', auth, async (req, res) => {
  try {
    const report = new SafetyReport({ ...req.body, reportedBy: req.user._id });
    await report.save();
    await report.populate('reportedBy', 'name email role');
    await report.populate('project', 'name');
    res.status(201).json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/safety-reports/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('project', 'name');
    if (!report) return res.status(404).json({ message: 'Safety report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/safety-reports/:id/status – director/engineer only
router.put('/:id/status', auth, roleCheck('director', 'engineer'), async (req, res) => {
  try {
    const { status } = req.body;
    const report = await SafetyReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('reportedBy', 'name email role')
      .populate('project', 'name');
    if (!report) return res.status(404).json({ message: 'Safety report not found' });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
