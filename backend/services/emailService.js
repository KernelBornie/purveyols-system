const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;
  try {
    // For production, use configured email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail', // or any SMTP
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('📧 Email transporter initialized (production)');
      return transporter;
    }
    // Fallback: Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal test email account:', testAccount.user);
    return transporter;
  } catch (err) {
    console.warn('⚠️ Email service not available, emails will be logged to console.');
    return null;
  }
};

const sendEmail = async (to, subject, html, text) => {
  try {
    const transporter = await initTransporter();
    if (!transporter) {
      console.log(`📧 Email would be sent: To: ${to}, Subject: ${subject}, Text: ${text || html?.replace(/<[^>]*>/g, '')}`);
      return { messageId: 'fallback' };
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Purveyols CMS" <noreply@purveyols.com>',
      to,
      subject,
      text: text || html?.replace(/<[^>]*>/g, '') || '',
      html: html || '',
    });
    console.log('📧 Email sent:', info.messageId);
    if (info.previewURL) console.log('🔗 Preview URL:', info.previewURL);
    return info;
  } catch (err) {
    console.error('Email send error:', err);
    return null;
  }
};

module.exports = { sendEmail };
