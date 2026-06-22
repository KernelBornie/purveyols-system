const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Delivery.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Delivery.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Delivery note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'accountant', 'foreman'), async (req, res) => {
  try {
    const note = new Delivery({ ...req.body, createdBy: req.user.id });
    await note.save();

    const senderName = await getSenderName(req.user.id);

    // ─── Notify creator ──────────────────────────────────────
    await createNotification(
      req.user.id,
      'logbook_entry', // or a specific type like 'delivery_created' – but we can reuse logbook_entry
      'Delivery Note Created',
      `✅ You created a delivery note`,
      `/delivery/${note._id}`
    );

    // ─── Notify directors, admins, accountants (exclude creator) ─
    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'logbook_entry',
        'New Delivery Note',
        `${senderName} created a delivery note`,
        `/delivery/${note._id}`
      );
    }

    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'accountant', 'foreman'), async (req, res) => {
  try {
    const updated = await Delivery.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Delivery note not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'accountant', 'foreman'), async (req, res) => {
  try {
    const deleted = await Delivery.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Delivery note not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
