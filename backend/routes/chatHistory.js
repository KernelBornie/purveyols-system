const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    let history = await ChatHistory.findOne({ user: req.user.id });
    if (!history) {
      history = new ChatHistory({ user: req.user.id, messages: [] });
      await history.save();
    }
    res.json(history);
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/message', auth, async (req, res) => {
  try {
    const { sender, text, type } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: 'Sender and text are required' });
    }
    let history = await ChatHistory.findOne({ user: req.user.id });
    if (!history) {
      history = new ChatHistory({ user: req.user.id, messages: [] });
    }
    history.messages.push({ 
      sender, 
      text, 
      type: type || 'general', 
      timestamp: new Date() 
    });
    history.updatedAt = new Date();
    await history.save();
    res.json(history);
  } catch (err) {
    console.error('Save message error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE a specific message by ID ──────────────────────────────
router.delete('/message/:id', auth, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ user: req.user.id });
    if (!history) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    // Find the message index by _id
    const messageIndex = history.messages.findIndex(
      (msg) => msg._id.toString() === req.params.id
    );
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }
    // Remove the message
    history.messages.splice(messageIndex, 1);
    history.updatedAt = new Date();
    await history.save();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE entire chat history ──────────────────────────────────
router.delete('/', auth, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
