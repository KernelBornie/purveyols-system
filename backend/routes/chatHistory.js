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
