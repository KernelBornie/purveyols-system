const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users (for messaging, etc.)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user (already exists in auth route, but we'll keep it)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, nrc } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
