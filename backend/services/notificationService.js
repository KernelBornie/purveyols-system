const User = require('../models/User');
const Notification = require('../models/Notification');

// Store io instance for broadcasting
let io = null;

const setIo = (socketIo) => {
  io = socketIo;
};

/**
 * Broadcast notification to all users (except payment and private chat)
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - Link to the resource
 * @param {string} excludeType - Exclude specific notification types (e.g., 'payment')
 */
const broadcastNotification = async (type, title, message, link, excludeType = null) => {
  if (!io) {
    console.warn('Socket.IO not initialized for notification broadcasting');
    return;
  }

  // Skip payment notifications (handled separately)
  if (excludeType === 'payment' || ['payment_made', 'payment_confirmed', 'payment_failed', 'funding_approved', 'funding_rejected'].includes(type)) {
    return;
  }

  try {
    // Get all users
    const users = await User.find({}, '_id');
    
    // Create notification for each user
    const notificationPromises = users.map(user => 
      Notification.create({
        user: user._id,
        type,
        title,
        message,
        link,
        read: false
      })
    );

    await Promise.all(notificationPromises);

    // Broadcast via Socket.IO
    io.emit('notification', {
      type,
      title,
      message,
      link,
      timestamp: new Date().toISOString()
    });

    console.log(`📢 Broadcasted notification: ${title} to ${users.length} users`);
  } catch (err) {
    console.error('Error broadcasting notification:', err);
  }
};

/**
 * Send notification to specific users
 * @param {Array} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - Link to the resource
 */
const sendToUsers = async (userIds, type, title, message, link) => {
  if (!io) {
    console.warn('Socket.IO not initialized for notification sending');
    return;
  }

  try {
    const notificationPromises = userIds.map(userId => 
      Notification.create({
        user: userId,
        type,
        title,
        message,
        link,
        read: false
      })
    );

    await Promise.all(notificationPromises);

    // Send to specific users via Socket.IO
    userIds.forEach(userId => {
      io.emit(`notification-${userId}`, {
        type,
        title,
        message,
        link,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`📢 Sent notification: ${title} to ${userIds.length} users`);
  } catch (err) {
    console.error('Error sending notification to users:', err);
  }
};

module.exports = {
  setIo,
  broadcastNotification,
  sendToUsers
};
