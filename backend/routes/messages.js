const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user.id })
      .populate('from', 'name role')
      .sort({ read: 1, createdAt: -1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { to, subject, content } = req.body;
    const recipient = await User.findById(to);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    const message = new Message({
      from: req.user.id,
      to,
      subject,
      content,
    });
    await message.save();
    await createNotification(
      recipient._id,
      'message_received',
      'New Message',
      `You have a new message from ${req.user.name}`,
      `/messages/${message._id}`
    );
    res.status(201).json(message);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, to: req.user.id });
    if (!message) return res.status(404).json({ error: 'Not found' });
    message.read = true;
    await message.save();
    res.json(message);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, to: req.user.id });
    if (!message) return res.status(404).json({ error: 'Not found' });
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
