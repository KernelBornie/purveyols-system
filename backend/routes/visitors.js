const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const visitors = await Visitor.find()
      .populate('loggedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('loggedBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Not found' });
    res.json(visitor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const visitor = new Visitor({
      ...req.body,
      loggedBy: req.user.id,
      checkIn: req.body.checkIn || new Date(),
    });
    await visitor.save();
    const populated = await Visitor.findById(visitor._id)
      .populate('loggedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    // Notify receptionists and directors
    const recipients = await User.find({ role: { $in: ['receptionist', 'director', 'admin'] } });
    for (let rec of recipients) {
      await createNotification(
        rec._id,
        'visitor_logged',
        'New Visitor Logged',
        `${senderName} logged a visitor: ${visitor.name || 'Unknown'}`,
        `/visitors/${visitor._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('loggedBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Not found' });
    res.json(visitor);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
