const getAIResponse = async (query, userId) => {
  try {
    // ... your logic
    const systemResponse = await handleSystemQuery(query, userId);
    if (systemResponse) return systemResponse; // should be string

    // External AI call
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return "I'm a construction assistant. I can help with project data, worker info, funding, and more. Try asking about specific data.";
    }
    const response = await callExternalAI(query, apiKey);
    return response; // should be string
  } catch (error) {
    console.error('AI service error:', error);
    return "I'm having trouble connecting to my AI service. Please try again later.";
  }
};
