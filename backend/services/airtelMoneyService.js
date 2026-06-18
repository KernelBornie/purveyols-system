const axios = require('axios');

// Airtel Money API Configuration
// Replace these with your actual credentials from Airtel
const AIRTEL_CONFIG = {
  baseURL: process.env.AIRTEL_API_URL || 'https://openapi.airtel.africa',
  clientId: process.env.AIRTEL_CLIENT_ID || '',
  clientSecret: process.env.AIRTEL_CLIENT_SECRET || '',
  apiKey: process.env.AIRTEL_API_KEY || '',
  // For Zambia, the country code is 'ZM'
  country: 'ZM',
  currency: 'ZMW',
};

// Get access token from Airtel
const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `${AIRTEL_CONFIG.baseURL}/auth/oauth2/token`,
      {
        client_id: AIRTEL_CONFIG.clientId,
        client_secret: AIRTEL_CONFIG.clientSecret,
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get Airtel access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Airtel Money API');
  }
};

// Send money to a recipient
const sendMoney = async (recipientPhone, amount, reference, description = 'Worker Payment') => {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Format phone number (remove + if present, ensure country code)
    let phone = recipientPhone.replace(/^\+/, '');
    if (!phone.startsWith('26')) {
      phone = `26${phone.replace(/^0/, '')}`;
    }
    
    // Prepare payment payload
    const payload = {
      reference: reference,
      subscriber: {
        country: AIRTEL_CONFIG.country,
        currency: AIRTEL_CONFIG.currency,
        msisdn: phone,
      },
      transaction: {
        amount: parseFloat(amount).toFixed(2),
        description: description || 'Worker Payment',
        country: AIRTEL_CONFIG.country,
        currency: AIRTEL_CONFIG.currency,
      },
    };
    
    console.log(`📤 Sending payment to Airtel:`, payload);
    
    const response = await axios.post(
      `${AIRTEL_CONFIG.baseURL}/standard/v1/payments`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Country': AIRTEL_CONFIG.country,
          'X-Currency': AIRTEL_CONFIG.currency,
          'api-key': AIRTEL_CONFIG.apiKey,
        },
      }
    );
    
    console.log('✅ Airtel payment successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Airtel payment failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Airtel payment failed');
  }
};

// Check transaction status
const checkTransactionStatus = async (reference) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${AIRTEL_CONFIG.baseURL}/standard/v1/payments/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Country': AIRTEL_CONFIG.country,
          'api-key': AIRTEL_CONFIG.apiKey,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Status check failed:', error.response?.data || error.message);
    return { status: 'FAILED' };
  }
};

module.exports = {
  sendMoney,
  checkTransactionStatus,
};
