const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find().populate('enrolledBy', 'name role');
    const enriched = await Promise.all(workers.map(async (worker) => {
      const attendance = await Attendance.find({ worker: worker._id });
      const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
      const payments = await Payment.find({ worker: worker._id, status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker._doc, totalEarned, totalPaid, balance: totalEarned - totalPaid };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant'), async (req, res) => {
  try {
    const worker = new Worker({ ...req.body, enrolledBy: req.user.id });
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);

    // ─── Notify creator (you enrolled a worker) ──────────────
    await createNotification(
      req.user.id,
      'worker_enrolled',
      'Worker Enrolled',
      `✅ You enrolled ${worker.name} as a worker`,
      `/workers/${worker._id}`
    );

    // ─── Notify accountants and directors ────────────────────
    const accountants = await User.find({ role: 'accountant' });
    const directors = await User.find({ role: 'director' });
    const recipients = [...accountants, ...directors];
    for (let recipient of recipients) {
      await createNotification(
        recipient._id,
        'worker_enrolled',
        'New Worker Enrolled',
        `${senderName} (${senderRole}) enrolled ${worker.name}`,
        `/workers/${worker._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant'), async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('enrolledBy', 'name role');
    res.json(worker);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/activate', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'active';
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/deactivate', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'inactive';
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/suspend', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'suspended';
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('enrolledBy', 'name role');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const attendance = await Attendance.find({ worker: worker._id });
    const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
    const payments = await Payment.find({ worker: worker._id, status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ ...worker._doc, totalEarned, totalPaid, balance: totalEarned - totalPaid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
