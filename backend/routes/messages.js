const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── Cloudinary configuration ──────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'messages',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mp3', 'wav', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage });

// ─── Inbox ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      to: userId,
      deletedBy: { $ne: userId }
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

// ─── Send a message with attachments ────────────────────────
router.post('/', auth, upload.array('attachments', 10), async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    if (!to || (!content && !req.files?.length)) {
      return res.status(400).json({ error: 'Recipient and content or attachment are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ error: 'Invalid recipient ID format' });
    }
    const recipient = await User.findById(to);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const attachments = (req.files || []).map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image'
            : file.mimetype.startsWith('audio/') ? 'audio'
            : file.mimetype.startsWith('video/') ? 'video'
            : 'document',
      url: file.path,
      filename: file.originalname,
      size: file.size,
    }));

    const senderName = await getSenderName(req.user.id);
    const message = new Message({
      from: req.user.id,
      to,
      subject: subject || '',
      content: content || '',
      attachments,
      deletedBy: [],
    });
    await message.save();

    await createNotification(
      recipient._id,
      'message_received',
      'New Message',
      `You have a new message from ${senderName} ${attachments.length > 0 ? 'with attachments' : ''}`,
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

// ─── Soft Delete (one) ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const fromStr = message.from?.toString ? message.from.toString() : String(message.from);
    const toStr = message.to?.toString ? message.to.toString() : String(message.to);
    const userIdStr = userId.toString();
    const isSender = fromStr === userIdStr;
    const isRecipient = toStr === userIdStr;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    if (message.deletedBy.includes(userId)) {
      return res.status(400).json({ error: 'Message already deleted by you' });
    }

    message.deletedBy.push(userId);
    await message.save();
    res.json({ message: 'Message deleted for you' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete all messages (soft delete) ──────────────────
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await Message.updateMany(
      {
        $or: [{ from: userId }, { to: userId }],
        deletedBy: { $ne: userId }
      },
      { $addToSet: { deletedBy: userId } }
    );
    res.json({ message: 'All messages deleted for you' });
  } catch (err) {
    console.error('Delete all messages error:', err);
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

// ─── Conversation ──────────────────────────────────────────
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
      deletedBy: { $ne: req.user.id }
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

// ─── Get a single message (FIXED) ─────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('from', 'name role')
      .populate('to', 'name role');
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const userId = req.user.id;

    // Use .equals() for safe ObjectId comparison
    const isSender = message.from?._id?.equals(userId) || false;
    const isRecipient = message.to?._id?.equals(userId) || false;

    if (!isSender && !isRecipient) {
      console.warn(`⚠️ User ${userId} not authorized to view message ${req.params.id}`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(message);
  } catch (err) {
    console.error('Get message error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;