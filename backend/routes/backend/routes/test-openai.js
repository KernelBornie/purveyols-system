const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(400).json({ error: 'OPENAI_API_KEY not set' });
  }
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "API works" in one word.' }],
        max_tokens: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        timeout: 5000,
      }
    );
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
      status: err.response?.status,
    });
  }
});

module.exports = router;
