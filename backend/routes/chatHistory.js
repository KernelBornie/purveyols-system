const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const auth = require('../middleware/auth');

// Get chat history for current user
router.get('/', auth, async (req, res) => {
  try {
    let history = await ChatHistory.findOne({ user: req.user.id });
    if (!history) {
      history = new ChatHistory({ user: req.user.id, messages: [] });
      await history.save();
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a message to history
router.post('/message', auth, async (req, res) => {
  try {
    const { sender, text, type } = req.body;
    let history = await ChatHistory.findOne({ user: req.user.id });
    if (!history) {
      history = new ChatHistory({ user: req.user.id, messages: [] });
    }
    history.messages.push({ sender, text, type, timestamp: new Date() });
    history.updatedAt = new Date();
    await history.save();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear chat history
router.delete('/', auth, async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ user: req.user.id });
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
