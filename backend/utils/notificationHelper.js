// backend/utils/notificationHelper.js
const Notification = require('../models/Notification');
const User = require('../models/User');

// ─── Format role for display ──────────────────────────────────────
const formatRole = (role) => {
  const map = {
    'admin': 'Admin',
    'director': 'Director',
    'accountant': 'Accountant',
    'civil-engineer': 'Civil Engineer',
    'quantity-surveyor': 'Quantity Surveyor',
    'procurement-officer': 'Procurement Officer',
    'foreman': 'Foreman',
    'driver': 'Driver',
    'safety-officer': 'Safety Officer',
    'qs': 'Quantity Surveyor',
    'receptionist': 'Receptionist',
  };
  return map[role] || role;
};

// ─── Get sender's name ─────────────────────────────────────────────
const getSenderName = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user ? user.name : 'Unknown User';
  } catch (err) {
    return 'Unknown User';
  }
};

// ─── Get sender's role ─────────────────────────────────────────────
const getSenderRole = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user ? user.role : 'unknown';
  } catch (err) {
    return 'unknown';
  }
};

// ─── Create a notification ──────────────────────────────────────────
const createNotification = async (userId, type, title, message, link) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      link: link || '#',
      read: false,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

// ─── Format currency ────────────────────────────────────────────────
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(amount || 0);
};

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
  createNotification,
  getSenderName,
  getSenderRole,
  formatRole,
  formatCurrency,
};