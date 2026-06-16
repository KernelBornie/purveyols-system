const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');

// Get all attendance (with worker populated)
router.get('/', auth, async (req, res) => {
  try {
    const records = await Attendance.find().populate('worker', 'name nrc');
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get attendance for a specific worker
router.get('/worker/:workerId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ worker: req.params.workerId })
      .sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new attendance entry (check‑in)
router.post('/', auth, async (req, res) => {
  try {
    const { workerId, site, rate, notes } = req.body;
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // If rate not provided, use worker's current rate
    const finalRate = rate || worker.dailyRate;
    const finalSite = site || worker.site;

    const attendance = new Attendance({
      worker: workerId,
      site: finalSite,
      rate: finalRate,
      notes,
    });
    await attendance.save();

    // Optionally update worker's default rate/site if provided
    if (rate && rate !== worker.dailyRate) {
      worker.dailyRate = rate;
      await worker.save();
    }
    if (site && site !== worker.site) {
      worker.site = site;
      await worker.save();
    }

    res.status(201).json(attendance);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
