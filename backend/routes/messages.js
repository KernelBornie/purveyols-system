const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── Inbox ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      to: userId,
      deletedBy: { $ne: userId } // exclude messages the user has deleted
    })
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
    const userId = req.user.id;
    const messages = await Message.find({
      from: userId,
      deletedBy: { $ne: userId }
    })
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

    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ error: 'Invalid recipient ID format' });
    }

    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const senderName = await getSenderName(req.user.id);

    const message = new Message({
      from: req.user.id,
      to,
      subject: subject || '',
      content,
      deletedBy: [], // 👈 new messages start with empty deletedBy
    });
    await message.save();

    console.log(`📩 Message from ${req.user.id} to ${to}`);

    await createNotification(
      recipient._id,
      'message_received',
      'New Message',
      `You have a new message from ${senderName}`,
      `/messages/${message._id}`
    );

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

// ─── Soft Delete (per user) ──────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // User must be sender or recipient
    const isSender = message.from.toString() === userId;
    const isRecipient = message.to.toString() === userId;
    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // If already deleted by this user, ignore
    if (message.deletedBy.includes(userId)) {
      return res.status(400).json({ error: 'Message already deleted by you' });
    }

    // Add user to deletedBy
    message.deletedBy.push(userId);
    await message.save();

    console.log(`🗑️ User ${userId} soft‑deleted message ${req.params.id}`);

    // (Optional) Hard‑delete if both users have deleted it
    // const bothDeleted = message.deletedBy.length === 2 &&
    //   message.deletedBy.includes(message.from.toString()) &&
    //   message.deletedBy.includes(message.to.toString());
    // if (bothDeleted) {
    //   await Message.findByIdAndDelete(req.params.id);
    //   console.log(`🗑️ Both users deleted – message ${req.params.id} permanently removed`);
    // }

    res.json({ message: 'Message deleted for you' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Unread count ──────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user.id,
      read: false,
      deletedBy: { $ne: req.user.id }
    });
    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Conversation between two users ──────────────────────────
router.get('/conversation/:otherUserId', auth, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const messages = await Message.find({
      $or: [
        { from: req.user.id, to: otherUserId },
        { from: otherUserId, to: req.user.id }
      ],
      deletedBy: { $ne: req.user.id } // exclude current user's deletions
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
