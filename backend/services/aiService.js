const axios = require('axios');

// AI Service using OpenAI or Gemini
const getAIResponse = async (prompt, context = '') => {
  try {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    if (provider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are PURVEYOLS ASSISTANT AI, a construction management expert. Help with construction, project management, materials, safety, and industry questions.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.choices[0].message.content;
    } else if (provider === 'gemini') {
      // Gemini API
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        }
      );
      return response.data.candidates[0].content.parts[0].text;
    }
    return 'AI service not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY.';
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    return 'Sorry, I encountered an error. Please try again later.';
  }
};

module.exports = { getAIResponse };
