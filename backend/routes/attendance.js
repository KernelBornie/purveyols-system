const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

// ─── GET all attendance ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const records = await Attendance.find().populate('worker', 'name nrc');
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET attendance for a worker ─────────────────────────────────────
router.get('/worker/:workerId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ worker: req.params.workerId }).sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADD attendance (check‑in) ──────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs'), async (req, res) => {
  try {
    const { workerId, date, days, rate, site, notes } = req.body;

    if (!workerId) return res.status(400).json({ error: 'Worker ID is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (!days || days <= 0) return res.status(400).json({ error: 'Days must be a positive number' });
    if (!rate || rate < 0) return res.status(400).json({ error: 'Rate must be a positive number' });

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Calculate total
    const total = days * rate;

    const attendance = new Attendance({
      worker: workerId,
      date: new Date(date),
      days,
      rate,
      total,
      site: site || worker.site || '',
      notes: notes || 'Checked in',
      recordedBy: req.user.id,
    });
    await attendance.save();

    // Optionally update worker's daily rate and site
    if (rate && rate !== worker.dailyRate) {
      worker.dailyRate = rate;
      await worker.save();
    }
    if (site && site !== worker.site) {
      worker.site = site;
      await worker.save();
    }

    // Notify accountant and director
    const recipients = await User.find({ role: { $in: ['accountant', 'director'] } });
    const sender = await User.findById(req.user.id);
    for (let recipient of recipients) {
      await createNotification(
        recipient._id,
        'worker_checked_in',
        'Worker Checked In',
        `${worker.name} checked in for ${days} day(s) at rate ${rate} (total ${total}) by ${sender.name}`,
        `/workers/${worker._id}`
      );
    }

    const populated = await Attendance.findById(attendance._id)
      .populate('worker', 'name nrc')
      .populate('recordedBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Check‑in error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE attendance ──────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { days, rate } = req.body;
    // Recalculate total if days or rate changed
    if (days || rate) {
      const existing = await Attendance.findById(req.params.id);
      if (existing) {
        const newDays = days || existing.days;
        const newRate = rate || existing.rate;
        req.body.total = newDays * newRate;
      }
    }
    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE attendance ──────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;