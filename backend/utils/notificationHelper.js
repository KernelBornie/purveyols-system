const Notification = require('../models/Notification');

const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    const notif = new Notification({ user: userId, type, title, message, link, data });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

module.exports = { createNotification };
