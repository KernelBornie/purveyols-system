const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAIResponse } = require('../services/aiAssistantService');

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const response = await getAIResponse(message, req.user.id);
    res.json({ response });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
