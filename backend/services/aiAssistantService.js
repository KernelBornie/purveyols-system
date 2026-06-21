const axios = require('axios');
const User = require('../models/User');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const FundingRequest = require('../models/FundingRequest');
const Payment = require('../models/Payment');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');

/**
 * Get AI response for any construction‑related question.
 * Uses OpenAI if API key exists, otherwise falls back to rule‑based.
 */
const getAIResponse = async (query, userId) => {
  try {
    // 1. Gather system data for context
    const systemData = await gatherSystemData(userId);

    // 2. Check if OpenAI key exists
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      return await getOpenAIResponse(query, systemData, openaiKey);
    }

    // 3. Fallback: rule‑based responses
    return await getRuleBasedResponse(query, systemData);
  } catch (error) {
    console.error('AI service error:', error);
    return {
      text: 'I encountered an error while processing your request. Please try again later.',
      type: 'error'
    };
  }
};

/**
 * Gather relevant system data
 */
const gatherSystemData = async (userId) => {
  try {
    const [projects, workers, funding, payments, procurement, boqs, subcontracts] = await Promise.all([
      Project.find().populate('manager', 'name').limit(20),
      Worker.find().limit(20),
      FundingRequest.find().populate('project', 'name').limit(20),
      Payment.find().populate('worker', 'name').limit(20),
      ProcurementOrder.find().populate('project', 'name').limit(20),
      BOQ.find().populate('project', 'name').limit(20),
      Subcontract.find().populate('project', 'name').limit(20),
    ]);

    return {
      projects,
      workers,
      funding,
      payments,
      procurement,
      boqs,
      subcontracts,
      stats: {
        totalProjects: await Project.countDocuments(),
        totalWorkers: await Worker.countDocuments(),
        totalFunding: await FundingRequest.countDocuments(),
        totalPayments: await Payment.countDocuments(),
        pendingFunding: await FundingRequest.countDocuments({ status: 'pending' }),
      }
    };
  } catch (err) {
    console.error('Error gathering system data:', err);
    return {};
  }
};

/**
 * OpenAI‑powered response – answers any question
 */
const getOpenAIResponse = async (query, systemData, apiKey) => {
  try {
    // Build context from system data
    const context = buildContextString(systemData);

    const systemPrompt = `You are PURVEYOLS ASSISTANT AI, an expert construction management assistant.
You have access to the following real data from the user's construction management system:

${context}

Rules:
- Answer the user's question concisely and accurately.
- If the question asks about specific data (projects, workers, funding, etc.), use the data above.
- If the question is about general construction knowledge, provide a helpful, detailed answer.
- Always respond in plain text, with bullet points or numbered lists if helpful.
- Keep responses under 400 words.
- Be friendly and professional.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const text = response.data.choices[0].message.content.trim();
      return { text, type: 'general' };
    }
    throw new Error('Unexpected OpenAI response format');
  } catch (error) {
    console.error('OpenAI error:', error);
    // Fallback to rule‑based
    return await getRuleBasedResponse(query, systemData);
  }
};

/**
 * Fallback rule‑based responses (only if OpenAI fails or no key)
 */
const getRuleBasedResponse = async (query, systemData) => {
  const q = query.toLowerCase();
  const { projects, workers, funding, payments, procurement, boqs, subcontracts, stats } = systemData;

  // ─── Project queries ──────────────────────────────
  if (q.includes('project') || q.includes('projects')) {
    if (!projects || projects.length === 0) {
      return { text: 'No projects found in the system. Create your first project from the Projects page.', type: 'project' };
    }
    let response = '📋 Here are your recent projects:\n';
    projects.forEach(p => {
      response += `- ${p.name} (${p.status || 'planning'}) – Budget: K${p.budget?.toLocaleString() || 0}\n`;
    });
    if (stats.totalProjects > projects.length) {
      response += `\n... and ${stats.totalProjects - projects.length} more projects.`;
    }
    return { text: response, type: 'project' };
  }

  // ─── Worker queries ──────────────────────────────
  if (q.includes('worker') || q.includes('workers') || q.includes('employee') || q.includes('staff')) {
    if (!workers || workers.length === 0) {
      return { text: 'No workers enrolled yet. Visit the Workers page to enroll your team.', type: 'worker' };
    }
    let response = '👷 Recent workers:\n';
    workers.forEach(w => {
      response += `- ${w.name} (${w.status || 'active'}) – Rate: K${w.dailyRate || 0}/day\n`;
    });
    if (stats.totalWorkers > workers.length) {
      response += `\n... and ${stats.totalWorkers - workers.length} more workers.`;
    }
    return { text: response, type: 'worker' };
  }

  // ─── Funding queries ──────────────────────────────
  if (q.includes('funding') || q.includes('fund') || q.includes('budget')) {
    if (!funding || funding.length === 0) {
      return { text: 'No funding requests found. You can request funding from the Funding page.', type: 'funding' };
    }
    let response = '💰 Recent funding requests:\n';
    funding.forEach(f => {
      response += `- ${f.project?.name || 'Unknown project'} – Amount: K${f.amount?.toLocaleString() || 0} (${f.status || 'pending'})\n`;
    });
    if (stats.pendingFunding > 0) {
      response += `\n⚠️ ${stats.pendingFunding} pending requests await approval.`;
    }
    return { text: response, type: 'funding' };
  }

  // ─── Payment queries ──────────────────────────────
  if (q.includes('payment') || q.includes('payments') || q.includes('paid')) {
    if (!payments || payments.length === 0) {
      return { text: 'No payments recorded yet. Process payments from the Payments page.', type: 'payment' };
    }
    let response = '💳 Recent payments:\n';
    payments.forEach(p => {
      response += `- ${p.recipientName || p.worker?.name || 'Unknown'} – Amount: K${p.amount?.toLocaleString() || 0} (${p.status || 'pending'})\n`;
    });
    return { text: response, type: 'payment' };
  }

  // ─── Procurement queries ──────────────────────────
  if (q.includes('procurement') || q.includes('order') || q.includes('requisition') || q.includes('material')) {
    if (!procurement || procurement.length === 0) {
      return { text: 'No procurement orders yet. Create one from the Procurement page.', type: 'procurement' };
    }
    let response = '📦 Recent procurement orders:\n';
    procurement.forEach(o => {
      response += `- Order #${o.orderNumber || o._id.slice(-6)} – ${o.project?.name || 'N/A'} (${o.status || 'pending'}) – Total: K${o.grandTotal?.toLocaleString() || 0}\n`;
    });
    return { text: response, type: 'procurement' };
  }

  // ─── BOQ queries ──────────────────────────────────
  if (q.includes('boq') || q.includes('bill of quantities') || q.includes('quantity')) {
    if (!boqs || boqs.length === 0) {
      return { text: 'No BOQs found. Create a BOQ from the BOQ page.', type: 'boq' };
    }
    let response = '📊 Recent Bills of Quantities:\n';
    boqs.forEach(b => {
      response += `- ${b.project?.name || 'Unknown project'} – Items: ${b.items?.length || 0} – Total: K${b.grandTotal?.toLocaleString() || 0} (${b.status || 'draft'})\n`;
    });
    return { text: response, type: 'boq' };
  }

  // ─── Subcontract queries ──────────────────────────
  if (q.includes('subcontract') || q.includes('vendor') || q.includes('service')) {
    if (!subcontracts || subcontracts.length === 0) {
      return { text: 'No subcontracts found. Create one from the Subcontracts page.', type: 'subcontract' };
    }
    let response = '📄 Recent subcontracts:\n';
    subcontracts.forEach(s => {
      response += `- ${s.vendor} – Service: ${s.service || 'N/A'} – Amount: K${s.amount?.toLocaleString() || 0} (${s.status || 'draft'})\n`;
    });
    return { text: response, type: 'subcontract' };
  }

  // ─── General construction knowledge ───────────────
  if (q.includes('construction') || q.includes('building') || q.includes('site') || q.includes('safety')) {
    return {
      text: '🏗️ I\'m your PURVEYOLS construction assistant. I can help you with:\n• Project management\n• Cost estimation and BOQs\n• Worker management\n• Procurement and materials\n• Safety and regulations\n• Site planning\n\nFeel free to ask specific questions!',
      type: 'general'
    };
  }

  // ─── Default fallback ──────────────────────────────
  return {
    text: 'I can help with projects, workers, funding, payments, procurement, BOQs, and subcontracts. What would you like to know?',
    type: 'general'
  };
};

/**
 * Build context string for OpenAI
 */
const buildContextString = (data) => {
  let ctx = '';
  if (data.projects && data.projects.length) {
    ctx += 'Projects:\n' + data.projects.map(p => `- ${p.name} (${p.status}) – Budget: K${p.budget}`).join('\n') + '\n';
  }
  if (data.workers && data.workers.length) {
    ctx += 'Workers:\n' + data.workers.map(w => `- ${w.name} (${w.status}) – Rate: K${w.dailyRate}/day`).join('\n') + '\n';
  }
  if (data.funding && data.funding.length) {
    ctx += 'Funding Requests:\n' + data.funding.map(f => `- ${f.project?.name} – K${f.amount} (${f.status})`).join('\n') + '\n';
  }
  if (data.payments && data.payments.length) {
    ctx += 'Payments:\n' + data.payments.map(p => `- ${p.recipientName || p.worker?.name} – K${p.amount} (${p.status})`).join('\n') + '\n';
  }
  if (data.stats) {
    ctx += `Stats: ${data.stats.totalProjects} projects, ${data.stats.totalWorkers} workers, ${data.stats.totalFunding} funding requests, ${data.stats.pendingFunding} pending.\n`;
  }
  return ctx || 'No system data available.';
};

module.exports = { getAIResponse };
