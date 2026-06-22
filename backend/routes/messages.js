const express = require('express');
const router = express.Router();
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Sent messages ──────────────────────────────────────────
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ from: req.user.id })
      .populate('from', 'name role')
      .populate('to', 'name role')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Send a message ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }
    const recipient = await User.findById(to);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    // ✅ Get sender's name from database
    const senderName = await getSenderName(req.user.id);

    const message = new Message({
      from: req.user.id,
      to,
      subject: subject || '',
      content,
    });
    await message.save();

    // ─── Notify the recipient ──────────────────────────────
    await createNotification(
      recipient._id,
      'message_received',
      'New Message',
      `You have a new message from ${senderName}`,
      `/messages/${message._id}`
    );

    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── Mark as read ──────────────────────────────────────────
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, to: req.user.id });
    if (!message) return res.status(404).json({ error: 'Not found' });
    message.read = true;
    await message.save();
    res.json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Delete ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id });
    if (!message) return res.status(404).json({ error: 'Not found' });
    if (message.from.toString() !== req.user.id && message.to.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Unread count ──────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
