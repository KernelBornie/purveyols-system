const axios = require('axios');
const crypto = require('crypto');

/**
 * Send money via Airtel Money API (real integration)
 * Uses environment variables:
 *   - AIRTEL_CLIENT_ID
 *   - AIRTEL_CLIENT_SECRET
 *   - AIRTEL_API_URL (e.g., https://openapi.airtel.africa)
 *   - AIRTEL_API_KEY (if required)
 *
 * Returns: { status, transactionId, data }
 */
const sendMoney = async (recipientPhone, amount, reference, description) => {
  const clientId = process.env.AIRTEL_CLIENT_ID;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET;
  const apiUrl = process.env.AIRTEL_API_URL || 'https://openapi.airtel.africa';

  if (!clientId || !clientSecret) {
    throw new Error('AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET are required');
  }

  try {
    // Step 1: Obtain access token
    const tokenResponse = await axios.post(
      `${apiUrl}/auth/oauth/token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      throw new Error('Failed to obtain Airtel access token');
    }

    // Step 2: Initiate payment
    const paymentPayload = {
      reference: reference || `PAY-${Date.now()}`,
      subscriber: {
        country: 'ZM',
        currency: 'ZMW',
        msisdn: recipientPhone.replace(/^0+/, '260'), // Normalize to 260...
      },
      transaction: {
        amount: amount.toString(),
        country: 'ZM',
        currency: 'ZMW',
        description: description || 'Payment from Purveyols CMS',
      },
    };

    const paymentResponse = await axios.post(
      `${apiUrl}/merchant/v2/payments/`,
      paymentPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Country': 'ZM',
          'X-Currency': 'ZMW',
        },
      }
    );

    return {
      status: 'success',
      transactionId: paymentResponse.data?.data?.transactionId || paymentResponse.data?.transactionId,
      data: paymentResponse.data,
    };

  } catch (error) {
    console.error('Airtel Money API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Airtel payment failed');
  }
};

/**
 * Check transaction status with Airtel
 */
const checkTransactionStatus = async (reference) => {
  const clientId = process.env.AIRTEL_CLIENT_ID;
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET;
  const apiUrl = process.env.AIRTEL_API_URL || 'https://openapi.airtel.africa';

  if (!clientId || !clientSecret) {
    throw new Error('AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET are required');
  }

  try {
    // Obtain access token again
    const tokenResponse = await axios.post(
      `${apiUrl}/auth/oauth/token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      throw new Error('Failed to obtain Airtel access token');
    }

    const statusResponse = await axios.get(
      `${apiUrl}/merchant/v2/payments/status/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Country': 'ZM',
          'X-Currency': 'ZMW',
        },
      }
    );

    return statusResponse.data;

  } catch (error) {
    console.error('Airtel status check error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Status check failed');
  }
};

module.exports = { sendMoney, checkTransactionStatus };
