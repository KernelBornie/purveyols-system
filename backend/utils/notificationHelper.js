const Notification = require('../models/Notification');

/**
 * Create an in-app notification for a user
 * @param {string} userId - The recipient's user ID
 * @param {string} type - The notification type (must match enum in Notification model)
 * @param {string} title - Short title
 * @param {string} message - Detailed message
 * @param {string} link - Optional link (e.g., '/messages/123')
 * @param {object} data - Optional extra data
 * @returns {Promise<object>} The created notification
 */
const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      link,
      data,
      read: false,
      createdAt: new Date(),
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Get sender's name from user ID (for notifications)
 * @param {string} userId - The sender's user ID
 * @returns {Promise<string>} The sender's name
 */
const getSenderName = async (userId) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);
    return user ? user.name : 'Unknown User';
  } catch (error) {
    return 'Unknown User';
  }
};

module.exports = { createNotification, getSenderName };
