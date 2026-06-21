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
 * OpenAI response – with instruction to generate SVG or tables when requested.
 */
const getOpenAIResponse = async (query, userId) => {
  try {
    const systemData = await gatherSystemData(userId);
    const context = buildContextString(systemData);

    const systemPrompt = `You are PURVEYOLS ASSISTANT AI, a knowledgeable construction management assistant.
You have access to the following real data from the user's system:

${context}

Your task is to answer the user's question as thoroughly and helpfully as possible.
- If the question asks to "draw" something (e.g., site plan, diagram), generate a valid SVG code block in your response. Use simple shapes (rect, circle, path) and include a scale bar and labels. Provide the SVG inside a code block with language "svg".
- If the question asks for a complex table (e.g., BOQ, cost breakdown), generate a Markdown table with clear headers and rows.
- For other questions, provide detailed, practical answers.
- Always respond in plain text, using Markdown for tables and code blocks when appropriate.
- Be conversational and friendly.

Question: ${query}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 800,
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
    return await getRuleBasedResponse(query, userId);
  }
};

/**
 * Rule-based fallback – now includes SVG site plan and Markdown tables.
 */
const getRuleBasedResponse = async (query, userId) => {
  const q = query.toLowerCase();
  const systemData = await gatherSystemData(userId);
  const { projects, workers, funding, payments, procurement, boqs, subcontracts, stats } = systemData;

  // ─── 1. System data queries (unchanged) ──────────────────────
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
    if (boqs && boqs.length > 0) {
      let response = '📊 Your BOQs:\n';
      boqs.forEach(b => {
        response += `- ${b.project?.name || 'Unknown'} – Items: ${b.items?.length || 0} – Total: K${b.grandTotal?.toLocaleString() || 0} (${b.status})\n`;
      });
      return { text: response, type: 'boq' };
    } else {
      // Provide detailed BOQ explanation with a sample table
      return {
        text: `📋 **What is a BOQ (Bill of Quantities)?**

A Bill of Quantities is a construction document that lists all the materials, parts, and labor required for a project, with their quantities, unit rates, and total costs.

**Key purposes:**
• Helps in cost estimation and budgeting
• Serves as a basis for tendering and bidding
• Provides a clear breakdown of project costs
• Acts as a reference during project execution

**Example BOQ Table:**

| Item | Description | Qty | Unit | Rate (ZMW) | Amount (ZMW) |
|------|-------------|-----|------|------------|--------------|
| 1    | Site Clearance | 1   | LS   | 5,000      | 5,000        |
| 2    | Excavation    | 100 | m³   | 150        | 15,000       |
| 3    | Concrete C25  | 50  | m³   | 2,500      | 125,000      |
| 4    | Reinforcement | 5000| kg   | 8          | 40,000       |
| 5    | Fencing       | 200 | m    | 120        | 24,000       |
|      | **Sub‑Total** |     |      |            | **209,000**  |
|      | Preliminaries (5%) | |      |            | **10,450**   |
|      | Contingency (2%) |   |      |            | **4,180**    |
|      | VAT (16%)      |     |      |            | **33,440**   |
|      | **GRAND TOTAL** |    |      |            | **257,070**  |

In PURVEYOLS CMS, you can create, edit, and approve BOQs for each project.`,
        type: 'boq'
      };
    }
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

  // ─── 2. Draw site plan – SVG generation ──────────────────────
  if (q.includes('draw') && (q.includes('site plan') || q.includes('plan') || q.includes('layout'))) {
    return {
      text: `📐 **Here’s a simple SVG site plan you can copy and view in your browser:**

\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="100%" height="auto">
  <!-- Property boundary -->
  <rect x="50" y="50" width="400" height="300" fill="#f0f8f0" stroke="#333" stroke-width="2" />
  
  <!-- Title -->
  <text x="250" y="30" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">SITE PLAN – EXAMPLE</text>
  
  <!-- Scale bar -->
  <line x1="50" y1="370" x2="150" y2="370" stroke="#000" stroke-width="2" />
  <line x1="50" y1="365" x2="50" y2="375" stroke="#000" stroke-width="1" />
  <line x1="150" y1="365" x2="150" y2="375" stroke="#000" stroke-width="1" />
  <text x="100" y="390" text-anchor="middle" font-family="Arial" font-size="10">0    10    20 m</text>
  
  <!-- Existing building -->
  <rect x="100" y="100" width="120" height="80" fill="#d4e2f0" stroke="#333" stroke-width="2" />
  <text x="160" y="145" text-anchor="middle" font-family="Arial" font-size="10">Existing Building</text>
  
  <!-- Proposed building -->
  <rect x="280" y="120" width="130" height="90" fill="#ffd9b3" stroke="#333" stroke-width="2" stroke-dasharray="5,5" />
  <text x="345" y="170" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">Proposed Building</text>
  
  <!-- Road/driveway -->
  <rect x="50" y="220" width="400" height="30" fill="#ccc" stroke="#333" stroke-width="1" />
  <text x="250" y="240" text-anchor="middle" font-family="Arial" font-size="10">Driveway / Access Road</text>
  
  <!-- Trees -->
  <circle cx="80" cy="80" r="12" fill="#2e7d32" stroke="#1b5e20" stroke-width="1" />
  <circle cx="75" cy="75" r="6" fill="#388e3c" />
  <text x="80" y="70" text-anchor="middle" font-family="Arial" font-size="8">Tree</text>
  
  <circle cx="430" cy="80" r="12" fill="#2e7d32" stroke="#1b5e20" stroke-width="1" />
  <circle cx="425" cy="75" r="6" fill="#388e3c" />
  <text x="430" y="70" text-anchor="middle" font-family="Arial" font-size="8">Tree</text>
  
  <!-- Fence line -->
  <line x1="50" y1="50" x2="450" y2="50" stroke="#8d6e63" stroke-width="2" stroke-dasharray="8,4" />
  <line x1="450" y1="50" x2="450" y2="350" stroke="#8d6e63" stroke-width="2" stroke-dasharray="8,4" />
  <text x="460" y="200" font-family="Arial" font-size="10" transform="rotate(90,460,200)">Fence Line</text>
  
  <!-- North arrow -->
  <polygon points="470,50 480,70 475,70 480,90 485,70 480,70" fill="#000" />
  <text x="480" y="45" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">N</text>

  <!-- Dimensions -->
  <text x="250" y="360" text-anchor="middle" font-family="Arial" font-size="10">Total Site Area: 40m × 30m = 1200 m²</text>
</svg>
\`\`\`

**How to use:**  
Copy the SVG code and save it as a `.svg` file, or paste it into an online SVG viewer.  
This is a basic template – you can modify the dimensions, labels, and elements to match your project.`,
      type: 'general'
    };
  }

  // ─── 3. Complex tables (BOQ, cost breakdown, etc.) ──────────
  if (q.includes('table') || q.includes('boq') || q.includes('breakdown') || q.includes('cost') || q.includes('estimate')) {
    // If they specifically ask for a complex table, provide a sample BOQ table.
    return {
      text: `📊 **Complex Table – Sample BOQ with Quantities and Costs**

| Item | Description | Qty | Unit | Rate (ZMW) | Amount (ZMW) |
|------|-------------|-----|------|------------|--------------|
| 1    | Site Clearance | 1   | LS   | 5,000      | 5,000        |
| 2    | Topsoil Removal | 200 | m³   | 80         | 16,000       |
| 3    | Excavation – Foundation | 150 | m³ | 150        | 22,500       |
| 4    | Concrete C25 – Footings | 40 | m³  | 2,500      | 100,000      |
| 5    | Concrete C25 – Columns | 25 | m³  | 2,800      | 70,000       |
| 6    | Reinforcement – Footings | 4000 | kg | 8 | 32,000 |
| 7    | Reinforcement – Columns | 3000 | kg | 8 | 24,000 |
| 8    | Formwork – Footings | 120 | m²  | 150        | 18,000       |
| 9    | Formwork – Columns | 80  | m²  | 180        | 14,400       |
| 10   | Fencing – Chain link | 250 | m   | 120        | 30,000       |
| 11   | Gates and fittings | 2   | No. | 4,000      | 8,000        |
|      | **Sub‑Total** |     |      |            | **339,900**  |
|      | Preliminaries (5%) | |      |            | **16,995**   |
|      | Contingency (2%)   | |      |            | **6,798**    |
|      | VAT (16%)          | |      |            | **58,591**   |
|      | **GRAND TOTAL**    | |      |            | **422,284**  |

This table can be used as a reference for your own BOQ. Adjust quantities, rates, and items to match your project.`,
      type: 'general'
    };
  }

  // ─── 4. Other construction knowledge ──────────────────────────
  if (q.includes('fence') || q.includes('measurement') || q.includes('foundation') || q.includes('concrete') || q.includes('safety')) {
    return {
      text: `🛠️ **Construction Knowledge**

**Fence Measurement:**
1. Mark boundary corners.
2. Measure total length along the boundary.
3. Decide post spacing (e.g., 2.5m).
4. Calculate number of posts = length / spacing.
5. Add 5-10% for wastage.

**Foundation Types:**
• Strip footing – for load‑bearing walls.
• Pad footing – for columns.
• Raft foundation – for weak soils.
• Pile foundation – for deep or soft soil.

**Concrete Mix Design (C25):**
• Cement: 1 part
• Sand: 2 parts
• Gravel: 4 parts
• Water: ~0.5 parts (water/cement ratio 0.5)

**Site Safety Essentials:**
• PPE: Hard hat, high‑vis vest, steel‑toe boots, safety glasses, gloves.
• Daily safety briefings.
• First aid kit on site.
• Fall protection for heights >2m.

Ask about any specific topic for more details!`,
      type: 'general'
    };
  }

  // ─── 5. Definitions ────────────────────────────────────────────
  if (q.includes('what is') || q.includes('define') || q.includes('meaning') || q.includes('explain')) {
    return {
      text: `📖 **I can help define construction terms!**

**BOQ (Bill of Quantities)** – A document listing materials, quantities, and costs.

**Site Plan** – A scaled drawing showing the layout of the construction site.

**Foundation** – The structure that transfers building loads to the ground.

**Rebar** – Steel reinforcement used in concrete to increase tensile strength.

**Formwork** – Molds used to shape poured concrete.

**Preliminaries** – Costs for site setup, security, insurance, and project management.

**Contingency** – A budget reserve (5-10%) for unexpected costs.

**VAT** – Value Added Tax, usually added to the total cost.

What term would you like me to explain in detail?`,
      type: 'general'
    };
  }

  // ─── 6. Default fallback ──────────────────────────────────────
  return {
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can help with:

📊 **System Data:**
• "How many workers do we have?"
• "What's our total budget?"
• "Show me pending funding requests"

🏗️ **Construction Knowledge:**
• "Draw a site plan" – I'll generate an SVG.
• "Show me a complex BOQ table"
• "How to measure a fence?"
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"

💡 **Ask a question and I'll give a detailed answer!`,
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
