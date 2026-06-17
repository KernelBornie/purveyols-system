const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    const notif = new Notification({ user: userId, type, title, message, link, data });
    await notif.save();
    // Send email if user has email notifications enabled
    const user = await User.findById(userId);
    if (user && user.settings?.emailNotifications !== false) {
      const emailHtml = `
        <h2>${title}</h2>
        <p>${message}</p>
        ${link ? `<p><a href="${link}">View Details</a></p>` : ''}
        <p>— Purveyols CMS</p>
      `;
      await sendEmail(user.email, `Purveyols: ${title}`, emailHtml);
    }
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

module.exports = { createNotification };
