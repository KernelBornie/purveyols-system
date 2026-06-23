const express = require('express');
const router = express.Router();
const SafetyReport = require('../models/SafetyReport');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const reports = await SafetyReport.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id)
      .populate('createdBy', 'name role');
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const report = new SafetyReport({ ...req.body, createdBy: req.user.id });
    await report.save();
    const populated = await SafetyReport.findById(report._id)
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const senderRole = req.user.role; // we can also get from helper

    // ─── Notify creator (personal) ──────────────────────────────
    await createNotification(
      req.user.id,
      'safety_report_created',
      'Safety Report Created',
      `✅ You created a safety report: "${report.title || 'Untitled'}"`,
      `/safety-reports/${report._id}`
    );

    // ─── Notify others (exclude creator) ─────────────────────────
    const recipients = await User.find({ role: { $in: ['director', 'admin', 'safety-officer'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let rec of filtered) {
      await createNotification(
        rec._id,
        'safety_report_created',
        'New Safety Report',
        `${senderName} (${senderRole}) created a safety report: "${report.title || 'Untitled'}"`,
        `/safety-reports/${report._id}`
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('Safety report create error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const report = await SafetyReport.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'name role');
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await SafetyReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
