const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName, getSenderRole } = require('../utils/notificationHelper');

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

    // ─── Get sender info ──────────────────────────────────────
    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);
    
    // ─── For debugging (remove in production) ────────────────
    console.log(`📢 Visitor logged by: ${senderName} (${senderRole})`);

    // ─── 1. Personal notification for the creator ────────────
    await createNotification(
      req.user.id,
      'visitor_logged',
      'Visitor Logged',
      `✅ You logged a visitor: ${visitor.name || 'Unknown'}`,
      `/visitors/${visitor._id}`
    );

    // ─── 2. Notification for others (directors & admins) ────
    // ⚠️ IMPORTANT: use the exact role names as stored in your DB
    const recipients = await User.find({ role: { $in: ['director', 'admin'] } });
    
    // ─── Exclude the creator from this list ──────────────────
    const filteredRecipients = recipients.filter(
      r => r._id.toString() !== req.user.id
    );

    console.log(`📤 Sending "others" notification to ${filteredRecipients.length} users`);

    for (let recipient of filteredRecipients) {
      await createNotification(
        recipient._id,
        'visitor_logged',
        'New Visitor Logged',
        `${senderName} (${senderRole}) logged a visitor: ${visitor.name || 'Unknown'}`,
        `/visitors/${visitor._id}`
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ Visitor creation error:', err);
    res.status(400).json({ error: err.message });
  }
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
