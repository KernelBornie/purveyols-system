const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const records = await Attendance.find().populate('worker', 'name nrc');
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/worker/:workerId', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ worker: req.params.workerId }).sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { workerId, site, rate, notes } = req.body;
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const finalRate = rate || worker.dailyRate;
    const finalSite = site || worker.site;
    const attendance = new Attendance({
      worker: workerId,
      site: finalSite,
      rate: finalRate,
      notes,
    });
    await attendance.save();
    if (rate && rate !== worker.dailyRate) worker.dailyRate = rate;
    if (site && site !== worker.site) worker.site = site;
    await worker.save();

    // Notify accountant and director
    const accountants = await User.find({ role: 'accountant' });
    const directors = await User.find({ role: 'director' });
    const recipients = [...accountants, ...directors];
    for (let recipient of recipients) {
      await createNotification(
        recipient._id,
        'worker_checked_in',
        'Worker Checked In',
        `${worker.name} checked in at ${finalSite} (rate: ${finalRate})`,
        `/workers/${worker._id}`
      );
    }
    res.status(201).json(attendance);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
