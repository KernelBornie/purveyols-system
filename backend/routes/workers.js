const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole } = require('../utils/notificationHelper');

// GET all workers (populate project)
router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('enrolledBy', 'name role')
      .populate('project', 'name'); // 👈 populate project name
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

// ─── CREATE ────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'), async (req, res) => {
  try {
    const worker = new Worker({ ...req.body, enrolledBy: req.user.id });
    await worker.save();
    const populated = await Worker.findById(worker._id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);

    await createNotification(
      req.user.id,
      'worker_enrolled',
      'Worker Enrolled',
      `✅ You enrolled ${worker.name} as a worker`,
      `/workers/${worker._id}`
    );

    const recipients = await User.find({ role: { $in: ['accountant', 'director'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
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

// ─── UPDATE ────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'), async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.json(worker);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'accountant', 'qs'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── ACTIVATE ──────────────────────────────────────────────────────
router.put('/:id/activate', auth, authorize('admin', 'director', 'accountant', 'qs'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'active';
    await worker.save();
    const populated = await Worker.findById(worker._id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DEACTIVATE ────────────────────────────────────────────────────
router.put('/:id/deactivate', auth, authorize('admin', 'director', 'accountant', 'qs'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'inactive';
    await worker.save();
    const populated = await Worker.findById(worker._id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── SUSPEND ───────────────────────────────────────────────────────
router.put('/:id/suspend', auth, authorize('admin', 'director', 'accountant', 'qs'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    worker.status = 'suspended';
    await worker.save();
    const populated = await Worker.findById(worker._id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── GET SINGLE WORKER ────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const attendance = await Attendance.find({ worker: worker._id });
    const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
    const payments = await Payment.find({ worker: worker._id, status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ ...worker._doc, totalEarned, totalPaid, balance: totalEarned - totalPaid });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;