const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// Get all workers with balance and paid amounts
router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find().populate('enrolledBy', 'name role');

    const enriched = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.find({ worker: worker._id });
      const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);

      const payments = await Payment.find({ worker: worker._id, status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      const balance = totalEarned - totalPaid;

      return {
        ...worker._doc,
        totalEarned,
        totalPaid,
        balance,
      };
    }));

    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Enroll worker
router.post('/', auth, async (req, res) => {
  try {
    const worker = new Worker({ ...req.body, enrolledBy: req.user.id });
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update worker
router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('enrolledBy', 'name role');
    res.json(worker);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete worker
router.delete('/:id', auth, async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get a single worker with balance
router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('enrolledBy', 'name role');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const attendance = await Attendance.find({ worker: worker._id });
    const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);

    const payments = await Payment.find({ worker: worker._id, status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const balance = totalEarned - totalPaid;

    res.json({ ...worker._doc, totalEarned, totalPaid, balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
