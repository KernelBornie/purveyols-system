const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const User = require('../models/User');

// GET /api/users – director/admin see all; others may filter by role for dropdowns
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;
    // Non-directors/non-admins may only query by role (for populating dropdowns)
    if (req.user.role !== 'director' && req.user.role !== 'admin' && !role) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    const filter = role ? { role, isActive: true } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users – admin/director only
router.post(
  '/',
  auth,
  roleCheck('admin', 'director'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['director', 'engineer', 'foreman', 'procurement', 'driver', 'accountant', 'safety', 'admin', 'worker'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'User with that email already exists' });

      const user = new User({ name, email, password, role: role || 'worker' });
      await user.save();

      res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// PUT /api/users/:id – director can update any, others can update own
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'director' && req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/:id – admin/director only (soft delete)
router.delete('/:id', auth, roleCheck('admin', 'director'), async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, deletedAt: new Date() },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
