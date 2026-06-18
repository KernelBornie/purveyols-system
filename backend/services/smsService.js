const axios = require('axios');

// SMS Service using Africa's Talking or Twilio
const sendSMS = async (phoneNumber, message) => {
  try {
    const provider = process.env.SMS_PROVIDER || 'africastalking';
    
    if (provider === 'africastalking') {
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
          to: phoneNumber,
          message: message,
          from: process.env.AFRICASTALKING_SENDER_ID || 'PURVEYOLS',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': process.env.AFRICASTALKING_API_KEY,
          },
        }
      );
      return response.data;
    } else if (provider === 'twilio') {
      const client = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const response = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      return response;
    }
    console.log(`📱 [SMS] Would send to ${phoneNumber}: ${message}`);
    return { success: true, message: 'SMS simulated' };
  } catch (error) {
    console.error('SMS error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
