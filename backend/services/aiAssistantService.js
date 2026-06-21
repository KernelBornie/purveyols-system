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
- If the question is about general construction, engineering, safety, materials, drawing, design, or any other topic, provide a detailed, informative answer.
- If the question is about drawing, drafting, or design, explain the process, provide step‑by‑step guidance, and mention relevant standards or best practices.
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
 * Expanded rule-based fallback – covers complex topics including drawing.
 */
const getRuleBasedResponse = async (query, userId) => {
  const q = query.toLowerCase();
  const systemData = await gatherSystemData(userId);
  const { projects, workers, funding, payments, procurement, boqs, subcontracts, stats } = systemData;

  // ─── 1. System data queries ──────────────────────────────────────
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
      return {
        text: `📋 **What is a BOQ (Bill of Quantities)?**

A Bill of Quantities is a construction document that lists all the materials, parts, and labor required for a project, with their quantities, unit rates, and total costs.

**Key purposes:**
• Helps in cost estimation and budgeting
• Serves as a basis for tendering and bidding
• Provides a clear breakdown of project costs
• Acts as a reference during project execution

**Typical structure:**
1. Item descriptions
2. Quantities (m³, kg, No., etc.)
3. Unit rates (cost per unit)
4. Total amounts (quantity × unit rate)
5. Preliminaries, contingencies, and VAT

**Example BOQ items:**
• Excavation – 100 m³ @ K150/m³ = K15,000
• Concrete C25 – 50 m³ @ K2,500/m³ = K125,000
• Reinforcement steel – 5,000 kg @ K8/kg = K40,000

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

  // ─── 2. Complex topics: Drawing, Design, Structural Analysis ───
  if (q.includes('draw') || q.includes('design') || q.includes('architect') || q.includes('structural') || q.includes('plan')) {
    if (q.includes('site plan') || q.includes('drawing') || q.includes('sketch')) {
      return {
        text: `📐 **How to Draw a Site Plan – Step-by-Step**

A site plan is a scaled drawing that shows the layout of a construction site.

**Step 1: Survey the Site**
• Walk the property and record accurate measurements
• Note existing structures, trees, roads, and utilities
• Use a measuring tape or GPS for large areas

**Step 2: Choose a Scale**
• Common scales: 1:100, 1:200, 1:500
• 1:100 means 1cm on paper = 1m on site

**Step 3: Draw the Boundary**
• Start with the property boundary lines
• Add dimensions and bearings (angles)

**Step 4: Add Existing Features**
• Buildings, roads, fences, trees, power lines
• Show their positions and dimensions

**Step 5: Position Proposed Structures**
• New building footprint, driveway, parking
• Show setbacks from boundaries

**Step 6: Include Utilities**
• Water supply, sewer, electricity, gas
• Mark connection points

**Step 7: Show Drainage & Grading**
• Slope arrows, catch basins, stormwater pipes

**Step 8: Label Everything**
• Dimensions, notes, title block
• Include a north arrow and scale bar

**Step 9: Review & Approve**
• Check for accuracy
• Get approval from the client/authorities

**In PURVEYOLS CMS:** you can create site plans, drawings, and surveys directly from the platform, with tools for editing, revisions, and BOQ generation.`,
        type: 'general'
      };
    }
    // General design/structural question
    return {
      text: `🏗️ **Construction Drawing & Design Principles**

**Key design documents:**
• **Site Plan** – overall layout of the project site.
• **Floor Plans** – layout of each building level.
• **Elevations** – exterior views of the building.
• **Sections** – cut‑through views showing construction details.
• **Structural Drawings** – foundation, columns, beams, slabs.
• **Services Drawings** – plumbing, electrical, HVAC.

**Design process:**
1. Concept design – sketches and feasibility.
2. Schematic design – basic plans and elevations.
3. Design development – detailed plans, coordination.
4. Construction documentation – final drawings and specifications.
5. Bidding and construction.

**Key standards:**
• Use ISO or local standards for symbols and conventions.
• Ensure all drawings are to scale.
• Include a title block with project details.

Need more detail on a specific type of drawing? Just ask!`,
      type: 'general'
    };
  }

  // ─── 3. Other construction knowledge ────────────────────────────
  if (q.includes('fence') || q.includes('measurement') || q.includes('foundation') || q.includes('concrete') || q.includes('safety')) {
    // Provide detailed answers for these – you can expand this section as needed.
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

  // ─── 4. Definitions and general knowledge ──────────────────────
  if (q.includes('what is') || q.includes('define') || q.includes('meaning') || q.includes('explain')) {
    return {
      text: `📖 **I can help define construction terms!**

Some common terms:

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

  // ─── 5. Default fallback ────────────────────────────────────────
  return {
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can help with:

📊 **System Data:**
• "How many workers do we have?"
• "What's our total budget?"
• "Show me pending funding requests"

🏗️ **Construction Knowledge:**
• "How to draw a site plan?"
• "What is a BOQ?"
• "How to measure a fence?"
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"
• "What are the project management phases?"

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
