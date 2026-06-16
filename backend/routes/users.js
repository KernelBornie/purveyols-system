const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get current user (already exists, but we'll keep)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, nrc } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Prevent email duplicates
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already taken' });
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || '';
    user.nrc = nrc || '';
    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, nrc: user.nrc } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
