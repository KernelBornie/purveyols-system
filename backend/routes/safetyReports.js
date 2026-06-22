const express = require('express');
const router = express.Router();
const SafetyReport = require('../models/SafetyReport');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const reports = await SafetyReport.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id)
      .populate('createdBy', 'name role');
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE
router.post('/', auth, async (req, res) => {
  try {
    const report = new SafetyReport({ ...req.body, createdBy: req.user.id });
    await report.save();
    const populated = await SafetyReport.findById(report._id)
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    // Notify directors and safety officers
    const admins = await User.find({ role: { $in: ['director', 'admin', 'safety-officer'] } });
    for (let admin of admins) {
      await createNotification(
        admin._id,
        'safety_report_created',
        'New Safety Report',
        `${senderName} created a safety report: ${report.title || 'Untitled'}`,
        `/safety-reports/${report._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
  try {
    const report = await SafetyReport.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'name role');
    if (!report) return res.status(404).json({ error: 'Not found' });
    // Optionally notify about update
    res.json(report);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await SafetyReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
