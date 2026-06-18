const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role phone nrc mobileMoneyNumber lastLogin createdAt');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get current user settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.settings || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update settings
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update profile – properly saves all fields
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, nrc, mobileMoneyNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check email uniqueness
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already taken' });
    }
    
    // Update all fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || '';
    user.nrc = nrc || '';
    user.mobileMoneyNumber = mobileMoneyNumber || '';
    user.updatedAt = new Date();
    
    await user.save();
    
    // Return full user data
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone, 
        nrc: user.nrc, 
        mobileMoneyNumber: user.mobileMoneyNumber,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      } 
    });
  } catch (err) { 
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
