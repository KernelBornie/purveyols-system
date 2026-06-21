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
 * Get AI response for ANY question – uses OpenAI if available,
 * falls back to rule-based if no key.
 * Returns: { text: string, type: string }
 */
const getAIResponse = async (query, userId) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      // Use OpenAI for all queries
      return await getOpenAIResponse(query, userId);
    }
    // Fallback: rule-based
    return await getRuleBasedResponse(query, userId);
  } catch (error) {
    console.error('AI service error:', error);
    return {
      text: 'I encountered an error while processing your request. Please try again later.',
      type: 'error'
    };
  }
};

/**
 * OpenAI response for ANY question – no restrictions.
 */
const getOpenAIResponse = async (query, userId) => {
  try {
    // Gather system data for context
    const systemData = await gatherSystemData(userId);
    const context = buildContextString(systemData);

    const systemPrompt = `You are PURVEYOLS ASSISTANT AI, a knowledgeable construction management assistant.
You have access to the following real data from the user's system:

${context}

Your task is to answer the user's question as thoroughly and helpfully as possible.
- If the question is about their specific data (projects, workers, funding, etc.), use the data above.
- If the question is about general construction, engineering, safety, materials, or any other topic, provide a detailed, informative answer.
- If the question is about drawing, drafting, design, or technical details, explain the process or provide step‑by‑step guidance.
- Always respond in plain text, no markdown, with clear sections if needed.
- Be conversational and friendly.
- Keep responses under 500 words unless the question requires a longer explanation.

Question: ${query}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 600,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const text = response.data.choices[0].message.content.trim();
      return { text, type: 'general' };
    }
    throw new Error('Unexpected OpenAI response format');
  } catch (error) {
    console.error('OpenAI error:', error);
    // Fallback to rule-based if OpenAI fails
    return await getRuleBasedResponse(query, userId);
  }
};

/**
 * Rule-based fallback – only used when OpenAI is not available.
 */
const getRuleBasedResponse = async (query, userId) => {
  const q = query.toLowerCase();
  const systemData = await gatherSystemData(userId);
  const { projects, workers, funding, payments, procurement, boqs, subcontracts, stats } = systemData;

  // ─── Check for specific data queries ────────────────────────────
  if (q.includes('project') || q.includes('projects')) {
    if (!projects || projects.length === 0) return { text: 'No projects found.', type: 'project' };
    let response = '📋 Your projects:\n';
    projects.forEach(p => {
      response += `- ${p.name} (${p.status}) – Budget: K${p.budget?.toLocaleString() || 0}\n`;
    });
    return { text: response, type: 'project' };
  }
  if (q.includes('worker') || q.includes('workers') || q.includes('employee')) {
    if (!workers || workers.length === 0) return { text: 'No workers enrolled.', type: 'worker' };
    let response = '👷 Workers:\n';
    workers.forEach(w => {
      response += `- ${w.name} (${w.status}) – Rate: K${w.dailyRate || 0}/day\n`;
    });
    return { text: response, type: 'worker' };
  }
  if (q.includes('funding') || q.includes('fund')) {
    if (!funding || funding.length === 0) return { text: 'No funding requests.', type: 'funding' };
    let response = '💰 Funding requests:\n';
    funding.forEach(f => {
      response += `- ${f.project?.name || 'Unknown'} – K${f.amount?.toLocaleString() || 0} (${f.status})\n`;
    });
    return { text: response, type: 'funding' };
  }
  if (q.includes('payment') || q.includes('payments')) {
    if (!payments || payments.length === 0) return { text: 'No payments recorded.', type: 'payment' };
    let response = '💳 Payments:\n';
    payments.forEach(p => {
      response += `- ${p.recipientName || p.worker?.name || 'Unknown'} – K${p.amount?.toLocaleString() || 0} (${p.status})\n`;
    });
    return { text: response, type: 'payment' };
  }
  if (q.includes('procurement') || q.includes('order') || q.includes('requisition')) {
    if (!procurement || procurement.length === 0) return { text: 'No procurement orders.', type: 'procurement' };
    let response = '📦 Procurement orders:\n';
    procurement.forEach(o => {
      response += `- ${o.project?.name || 'N/A'} – Total: K${o.grandTotal?.toLocaleString() || 0} (${o.status})\n`;
    });
    return { text: response, type: 'procurement' };
  }
  if (q.includes('boq') || q.includes('bill of quantities')) {
    if (!boqs || boqs.length === 0) return { text: 'No BOQs.', type: 'boq' };
    let response = '📊 BOQs:\n';
    boqs.forEach(b => {
      response += `- ${b.project?.name || 'Unknown'} – Items: ${b.items?.length || 0} – Total: K${b.grandTotal?.toLocaleString() || 0} (${b.status})\n`;
    });
    return { text: response, type: 'boq' };
  }
  if (q.includes('subcontract') || q.includes('vendor')) {
    if (!subcontracts || subcontracts.length === 0) return { text: 'No subcontracts.', type: 'subcontract' };
    let response = '📄 Subcontracts:\n';
    subcontracts.forEach(s => {
      response += `- ${s.vendor} – Service: ${s.service || 'N/A'} – K${s.amount?.toLocaleString() || 0} (${s.status})\n`;
    });
    return { text: response, type: 'subcontract' };
  }
  if (q.includes('status') || q.includes('overview') || q.includes('summary')) {
    return {
      text: `📊 Overview:\n- ${stats.totalProjects || 0} projects\n- ${stats.totalWorkers || 0} workers\n- ${stats.totalFunding || 0} funding requests (${stats.pendingFunding || 0} pending)\n- ${stats.totalPayments || 0} payments`,
      type: 'stats'
    };
  }

  // ─── General construction knowledge (if no OpenAI) ──────────────
  if (q.includes('fence') || q.includes('measurement') || q.includes('draw') || q.includes('site plan')) {
    return {
      text: 'I can help with fence measurements and site plans! Here’s a basic guide:\n\n**Fence Measurement:**\n1. Mark the boundary corners.\n2. Measure the distance between corners.\n3. Note the terrain (slopes may need extra material).\n4. Decide on post spacing (usually 2–3m).\n5. Calculate total length and number of posts.\n\n**Site Plan Drawing:**\n1. Start with the property boundary.\n2. Add existing features (buildings, trees).\n3. Position new structures (house, driveway).\n4. Show utilities (water, sewer, electricity).\n5. Use a scale (e.g., 1:100).\n6. Add dimensions and labels.\n\nWould you like more details on any step?',
      type: 'general'
    };
  }

  // Default fallback
  return {
    text: 'I can help with projects, workers, funding, payments, procurement, BOQs, subcontracts, and general construction knowledge. What would you like to know?',
    type: 'general'
  };
};

/**
 * Gather system data for context
 */
const gatherSystemData = async (userId) => {
  try {
    const [projects, workers, funding, payments, procurement, boqs, subcontracts] = await Promise.all([
      Project.find().populate('manager', 'name').limit(10),
      Worker.find().limit(10),
      FundingRequest.find().populate('project', 'name').limit(10),
      Payment.find().populate('worker', 'name').limit(10),
      ProcurementOrder.find().populate('project', 'name').limit(10),
      BOQ.find().populate('project', 'name').limit(10),
      Subcontract.find().populate('project', 'name').limit(10),
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
 * Build context string
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
