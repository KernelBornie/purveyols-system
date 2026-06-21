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
    // Validate that the type is in the enum (optional – will be caught by Mongoose)
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
    // Don't throw – just log so the main operation isn't interrupted
    return null;
  }
};

module.exports = { createNotification };
