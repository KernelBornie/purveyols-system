const express = require('express');
const router = express.Router();
const Subcontract = require('../models/Subcontract');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subcontract.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = new Subcontract({ ...req.body, createdBy: req.user.id });
    await sub.save();
    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);

    await createNotification(
      req.user.id,
      'subcontract_created',
      'Subcontract Created',
      `✅ You created a subcontract for ${sub.vendor || 'vendor'}`,
      `/subcontracts/${sub._id}`
    );

    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'subcontract_created',
        'New Subcontract',
        `${senderName} created a subcontract for ${sub.vendor || 'vendor'}`,
        `/subcontracts/${sub._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = await Subcontract.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    await Subcontract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ──────────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    if (sub.status !== 'pending' && sub.status !== 'draft') {
      return res.status(400).json({ error: 'Only pending or draft subcontracts can be approved' });
    }
    sub.status = 'approved';
    sub.approvedBy = req.user.id;
    sub.approvedAt = new Date();
    await sub.save();

    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    await createNotification(
      sub.createdBy,
      'subcontract_approved',
      'Subcontract Approved',
      `✅ Your subcontract for "${sub.vendor || 'vendor'}" was approved by ${senderName}`,
      `/subcontracts/${sub._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── FUND ─────────────────────────────────────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subcontract not found' });

    if (sub.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved subcontracts can be funded' });
    }

    sub.status = 'funded';
    sub.fundedBy = req.user.id;
    sub.fundedAt = new Date();
    await sub.save();

    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    if (sub.createdBy) {
      await createNotification(
        sub.createdBy,
        'subcontract_funded',
        'Subcontract Funded',
        `💰 Your subcontract for "${sub.vendor || 'vendor'}" was funded by ${senderName}`,
        `/subcontracts/${sub._id}`
      );
    }

    const recipients = await User.find({ role: { $in: ['director', 'accountant', 'admin'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'subcontract_funded',
        'Subcontract Funded',
        `${senderName} funded a subcontract for ${sub.vendor || 'vendor'}`,
        `/subcontracts/${sub._id}`
      );
    }

    res.json(populated);
  } catch (err) {
    console.error('Funding error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;