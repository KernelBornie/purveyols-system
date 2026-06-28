const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role phone nrc mobileMoneyNumber lastLogin createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, darkMode } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.settings = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : user.settings?.emailNotifications ?? true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : user.settings?.pushNotifications ?? true,
      darkMode: darkMode !== undefined ? darkMode : user.settings?.darkMode ?? false,
    };
    user.updatedAt = new Date();
    await user.save();
    res.json(user.settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, nrc, mobileMoneyNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already taken' });
      user.email = email;
    }
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (nrc !== undefined) user.nrc = nrc;
    if (mobileMoneyNumber !== undefined) user.mobileMoneyNumber = mobileMoneyNumber;
    user.updatedAt = new Date();
    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;