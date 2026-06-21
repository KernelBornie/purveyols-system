const axios = require('axios');
const User = require('../models/User');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const FundingRequest = require('../models/FundingRequest');
const Payment = require('../models/Payment');
const ProcurementOrder = require('../models/ProcurementOrder');

/**
 * Get AI response based on user query
 * @param {string} query - The user's question
 * @param {string} userId - The current user's ID
 * @returns {Promise<string>} AI response text
 */
const getAIResponse = async (query, userId) => {
  try {
    // 1. Check for system data queries (construction-specific)
    const systemResponse = await handleSystemQuery(query, userId);
    if (systemResponse) {
      return systemResponse;
    }

    // 2. If no system data matches, use external AI (OpenAI/other)
    //    Fallback to a friendly message if no API key is configured
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return "I'm your construction assistant. I can help with project data, worker info, funding requests, and more. Try asking: 'Show me all projects' or 'What's the total budget?'";
    }

    // 3. Call external AI (e.g., OpenAI)
    const response = await callExternalAI(query, apiKey);
    return response;

  } catch (error) {
    console.error('AI service error:', error);
    return "I'm having trouble connecting to my AI service right now. Please try again later, or ask a specific question about your projects, workers, or funding.";
  }
};

/**
 * Handle queries about the system data (projects, workers, funding, payments)
 */
const handleSystemQuery = async (query, userId) => {
  const q = query.toLowerCase();

  // ─── Projects ──────────────────────────────────────────────
  if (q.includes('project') || q.includes('projects')) {
    const projects = await Project.find().populate('manager', 'name').limit(5);
    if (projects.length === 0) {
      return "You don't have any projects yet. Create your first project from the Projects page.";
    }
    let response = "Here are your recent projects:\n";
    projects.forEach(p => {
      response += `- ${p.name} (${p.status || 'planning'}) – Budget: K${p.budget?.toLocaleString() || 0}\n`;
    });
    return response;
  }

  // ─── Workers ──────────────────────────────────────────────
  if (q.includes('worker') || q.includes('workers') || q.includes('employee') || q.includes('staff')) {
    const workers = await Worker.find().limit(5);
    if (workers.length === 0) {
      return "No workers enrolled yet. Visit the Workers page to enroll your team.";
    }
    let response = "Recent workers:\n";
    workers.forEach(w => {
      response += `- ${w.name} (${w.status || 'active'}) – Daily rate: K${w.dailyRate || 0}\n`;
    });
    return response;
  }

  // ─── Funding Requests ──────────────────────────────────────
  if (q.includes('funding') || q.includes('fund') || q.includes('budget')) {
    const requests = await FundingRequest.find().populate('project', 'name').limit(5);
    if (requests.length === 0) {
      return "No funding requests found. You can request funding from the Funding page.";
    }
    let response = "Recent funding requests:\n";
    requests.forEach(r => {
      response += `- ${r.project?.name || 'Unknown project'} – Amount: K${r.amount?.toLocaleString() || 0} (${r.status || 'pending'})\n`;
    });
    return response;
  }

  // ─── Payments ──────────────────────────────────────────────
  if (q.includes('payment') || q.includes('payments') || q.includes('paid')) {
    const payments = await Payment.find().populate('worker', 'name').limit(5);
    if (payments.length === 0) {
      return "No payments recorded yet. Process payments from the Payments page.";
    }
    let response = "Recent payments:\n";
    payments.forEach(p => {
      response += `- ${p.recipientName || p.worker?.name || 'Unknown'} – Amount: K${p.amount?.toLocaleString() || 0} (${p.status || 'pending'})\n`;
    });
    return response;
  }

  // ─── Procurement Orders ──────────────────────────────────
  if (q.includes('procurement') || q.includes('order') || q.includes('requisition')) {
    const orders = await ProcurementOrder.find().populate('project', 'name').limit(5);
    if (orders.length === 0) {
      return "No procurement orders yet. Create one from the Procurement page.";
    }
    let response = "Recent procurement orders:\n";
    orders.forEach(o => {
      response += `- Order #${o.orderNumber || o._id.slice(-6)} – ${o.project?.name || 'N/A'} (${o.status || 'pending'}) – Total: K${o.grandTotal?.toLocaleString() || 0}\n`;
    });
    return response;
  }

  // ─── General stats ────────────────────────────────────────
  if (q.includes('status') || q.includes('overview') || q.includes('summary') || q.includes('stats')) {
    const projectCount = await Project.countDocuments();
    const workerCount = await Worker.countDocuments();
    const fundingCount = await FundingRequest.countDocuments();
    const paymentCount = await Payment.countDocuments();
    return `📊 System Summary:\n- ${projectCount} projects\n- ${workerCount} workers\n- ${fundingCount} funding requests\n- ${paymentCount} payments`;
  }

  // No match – return null so external AI is used
  return null;
};

/**
 * Call external AI API (e.g., OpenAI)
 */
const callExternalAI = async (query, apiKey) => {
  // Example with OpenAI – adjust URL and payload to your provider
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a construction management assistant. Answer questions about construction projects, workers, procurement, and funding. Keep responses concise and helpful.'
        },
        { role: 'user', content: query }
      ],
      max_tokens: 300,
      temperature: 0.7,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000,
    }
  );

  if (response.data && response.data.choices && response.data.choices.length > 0) {
    return response.data.choices[0].message.content.trim();
  }
  throw new Error('Unexpected AI response format');
};

module.exports = { getAIResponse };
