const Notification = require('../models/Notification');

/**
 * Create a notification for one or more users.
 * @param {string|string[]} userIds - single userId or array of userIds
 * @param {string} message
 * @param {string} type
 */
async function createNotification(userIds, message, type) {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const docs = ids.map((userId) => ({ userId, message, type }));
    await Notification.insertMany(docs);
  } catch (err) {
    // Notifications are non-critical; log but do not throw
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
