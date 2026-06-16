const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

router.get('/cors-test', (req, res) => {
  res.json({ 
    origin: req.headers.origin || 'unknown',
    headers: req.headers,
    message: 'CORS test successful'
  });
});

module.exports = router;
