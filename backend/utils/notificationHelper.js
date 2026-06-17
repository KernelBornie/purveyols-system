const Notification = require('../models/Notification');
const User = require('../models/User');

// Lazy load email service – will return a mock if not available
const getEmailService = () => {
  try {
    return require('../services/emailService');
  } catch (err) {
    // Fallback: mock email service
    return {
      sendEmail: async (to, subject, html) => {
        console.log(`📧 [MOCK] Email to ${to} - Subject: ${subject}`);
        console.log(`📧 [MOCK] HTML: ${html}`);
        return { messageId: 'mock-' + Date.now() };
      }
    };
  }
};

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
      const emailService = getEmailService();
      await emailService.sendEmail(user.email, `Purveyols: ${title}`, emailHtml);
    }
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

module.exports = { createNotification };
