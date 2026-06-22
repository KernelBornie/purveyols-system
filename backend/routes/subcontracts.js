const express = require('express');
const router = express.Router();
const Subcontract = require('../models/Subcontract');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subcontract.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = new Subcontract({ ...req.body, createdBy: req.user.id });
    await sub.save();
    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);

    // ─── Notify creator ──────────────────────────────────────
    await createNotification(
      req.user.id,
      'subcontract_created',
      'Subcontract Created',
      `✅ You created a subcontract for ${sub.vendor || 'vendor'}`,
      `/subcontracts/${sub._id}`
    );

    // ─── Notify directors, admins, accountants (exclude creator) ─
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

router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = await Subcontract.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    await Subcontract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
