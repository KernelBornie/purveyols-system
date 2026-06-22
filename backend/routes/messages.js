const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ Added for ObjectId validation
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── Inbox ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user.id })
      .populate('from', 'name role')
      .populate('to', 'name role')
      .sort({ read: 1, createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Inbox error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Sent messages ──────────────────────────────────────────
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ from: req.user.id })
      .populate('from', 'name role')
      .populate('to', 'name role')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Sent messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Send a message ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, content } = req.body;

    // ─── Validate required fields ──────────────────────────
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    // ─── Validate that `to` is a valid ObjectId ────────────
    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ error: 'Invalid recipient ID format' });
    }

    // ─── Check if recipient exists ─────────────────────────
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // ─── Get sender's name for notification ────────────────
    const senderName = await getSenderName(req.user.id);

    // ─── Create and save the message ────────────────────────
    const message = new Message({
      from: req.user.id,
      to,
      subject: subject || '',
      content,
    });
    await message.save();

    // ─── Log for debugging ──────────────────────────────────
    console.log(`📩 Message sent from ${req.user.id} to ${to}`);

    // ─── Notify only the recipient ──────────────────────────
    await createNotification(
      recipient._id,
      'message_received',
      'New Message',
      `You have a new message from ${senderName}`,
      `/messages/${message._id}`
    );

    // ─── Populate and return the saved message ──────────────
    const populated = await Message.findById(message._id)
      .populate('from', 'name role')
      .populate('to', 'name role');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── Mark as read ──────────────────────────────────────────
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, to: req.user.id });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    message.read = true;
    await message.save();
    res.json(message);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only sender or recipient can delete
    if (message.from.toString() !== req.user.id && message.to.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Unread count ──────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read: false });
    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Conversation between two users (optional) ────────────
router.get('/conversation/:otherUserId', auth, async (req, res) => {
  try {
    const { otherUserId } = req.params;

    // Validate otherUserId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const messages = await Message.find({
      $or: [
        { from: req.user.id, to: otherUserId },
        { from: otherUserId, to: req.user.id }
      ]
    })
      .populate('from', 'name role')
      .populate('to', 'name role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Conversation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
