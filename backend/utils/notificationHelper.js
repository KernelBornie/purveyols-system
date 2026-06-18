const Notification = require('../models/Notification');
const User = require('../models/User');

// Lazy load services
const getEmailService = () => {
  try {
    return require('../services/emailService');
  } catch (err) {
    return {
      sendEmail: async (to, subject, html) => {
        console.log(`📧 [MOCK] Email to ${to} - Subject: ${subject}`);
        return { messageId: 'mock-' + Date.now() };
      }
    };
  }
};

const getSMSService = () => {
  try {
    return require('../services/smsService');
  } catch (err) {
    return {
      sendSMS: async (phone, message) => {
        console.log(`📱 [MOCK] SMS to ${phone}: ${message}`);
        return { success: true };
      }
    };
  }
};

const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    const notif = new Notification({ user: userId, type, title, message, link, data });
    await notif.save();

    const user = await User.findById(userId);
    if (!user) return notif;

    // Send Email
    if (user.settings?.emailNotifications !== false) {
      try {
        const emailService = getEmailService();
        const emailHtml = `
          <h2>${title}</h2>
          <p>${message}</p>
          ${link ? `<p><a href="${link}">View Details</a></p>` : ''}
          <p>— Purveyols CMS</p>
        `;
        await emailService.sendEmail(user.email, `Purveyols: ${title}`, emailHtml);
      } catch (e) { console.error('Email notification failed:', e); }
    }

    // Send SMS (for critical notifications)
    if (user.phone && (type === 'payment_made' || type === 'funding_approved' || type === 'worker_enrolled')) {
      try {
        const smsService = getSMSService();
        const smsMessage = `${title}: ${message}`;
        await smsService.sendSMS(user.phone, smsMessage);
      } catch (e) { console.error('SMS notification failed:', e); }
    }

    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

module.exports = { createNotification };
