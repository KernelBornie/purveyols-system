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
 * Get AI response – uses OpenAI if available, otherwise rule‑based.
 */
const getAIResponse = async (query, userId) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        return await getOpenAIResponse(query, userId);
      } catch (err) {
        console.log('OpenAI failed, falling back to rule‑based:', err.message);
        return await getRuleBasedResponse(query, userId);
      }
    }
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
 * OpenAI response – asks to answer ANY question.
 */
const getOpenAIResponse = async (query, userId) => {
  const systemData = await gatherSystemData(userId);
  const context = buildContextString(systemData);

  const systemPrompt = `You are PURVEYOLS ASSISTANT AI, an expert construction and engineering consultant.

You have access to the following real data from the user's system:

${context}

Your task is to answer the user's question as thoroughly and helpfully as possible.
- If the question is about the user's specific data (projects, workers, funding, etc.), use the data above and format it as a Markdown table when appropriate.
- If the question asks to "draw" something (site plan, diagram, layout), generate an SVG code block with proper labels, dimensions, and a scale bar.
- For tables (BOQ, cost breakdown, project lists), provide a Markdown table with realistic figures.
- If the question is about general knowledge, provide a clear, accurate answer.
- Always respond in plain text, using Markdown for tables and code blocks where helpful.
- Be friendly and authoritative.

Question: ${query}`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 1000,
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
};

/**
 * Rule‑based fallback – covers all tested topics.
 */
const getRuleBasedResponse = async (query, userId) => {
  const q = query.toLowerCase().trim();
  const systemData = await gatherSystemData(userId);
  const { projects, workers, funding, payments, procurement, boqs, subcontracts, stats } = systemData;

  // ─── 1. App data queries (with tables) ──────────────────────────
  if (q.includes('project') || q.includes('projects')) {
    if (!projects || projects.length === 0) return { text: 'No projects found.', type: 'project' };
    let table = '| Name | Location | Status | Budget |\n|------|----------|--------|--------|\n';
    projects.forEach(p => {
      table += `| ${p.name} | ${p.location || '—'} | ${p.status} | K${p.budget?.toLocaleString() || 0} |\n`;
    });
    return { text: `📋 **Projects Table**\n\n${table}`, type: 'project' };
  }
  if (q.includes('worker') || q.includes('workers') || q.includes('employee')) {
    if (!workers || workers.length === 0) return { text: 'No workers enrolled.', type: 'worker' };
    let table = '| Name | NRC | Status | Rate (ZMW) |\n|------|-----|--------|------------|\n';
    workers.forEach(w => {
      table += `| ${w.name} | ${w.nrc || '—'} | ${w.status || 'active'} | ${w.dailyRate || 0} |\n`;
    });
    return { text: `👷 **Workers Table**\n\n${table}`, type: 'worker' };
  }
  if (q.includes('funding') || q.includes('fund')) {
    if (!funding || funding.length === 0) return { text: 'No funding requests.', type: 'funding' };
    let table = '| Project | Amount | Status |\n|---------|--------|--------|\n';
    funding.forEach(f => {
      table += `| ${f.project?.name || 'Unknown'} | K${f.amount?.toLocaleString() || 0} | ${f.status} |\n`;
    });
    return { text: `💰 **Funding Requests Table**\n\n${table}`, type: 'funding' };
  }
  if (q.includes('payment') || q.includes('payments')) {
    if (!payments || payments.length === 0) return { text: 'No payments recorded.', type: 'payment' };
    let table = '| Recipient | Amount | Status |\n|-----------|--------|--------|\n';
    payments.forEach(p => {
      table += `| ${p.recipientName || p.worker?.name || 'Unknown'} | K${p.amount?.toLocaleString() || 0} | ${p.status} |\n`;
    });
    return { text: `💳 **Payments Table**\n\n${table}`, type: 'payment' };
  }
  if (q.includes('procurement') || q.includes('order') || q.includes('requisition')) {
    if (!procurement || procurement.length === 0) return { text: 'No procurement orders.', type: 'procurement' };
    let table = '| Order # | Project | Total | Status |\n|---------|---------|-------|--------|\n';
    procurement.forEach(o => {
      table += `| ${o.orderNumber || o._id.slice(-6)} | ${o.project?.name || 'N/A'} | K${o.grandTotal?.toLocaleString() || 0} | ${o.status} |\n`;
    });
    return { text: `📦 **Procurement Orders Table**\n\n${table}`, type: 'procurement' };
  }
  if (q.includes('boq') || q.includes('bill of quantities')) {
    if (boqs && boqs.length > 0) {
      let table = '| Project | Items | Grand Total | Status |\n|---------|-------|-------------|--------|\n';
      boqs.forEach(b => {
        table += `| ${b.project?.name || 'Unknown'} | ${b.items?.length || 0} | K${b.grandTotal?.toLocaleString() || 0} | ${b.status} |\n`;
      });
      return { text: `📊 **BOQs Table**\n\n${table}`, type: 'boq' };
    } else {
      return {
        text: `📋 **Sample BOQ Table**

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

To create actual BOQs in the system, visit the BOQ page and use the "New BOQ" button.`,
        type: 'boq'
      };
    }
  }
  if (q.includes('subcontract') || q.includes('vendor')) {
    if (!subcontracts || subcontracts.length === 0) return { text: 'No subcontracts.', type: 'subcontract' };
    let table = '| Vendor | Service | Amount | Status |\n|--------|---------|--------|--------|\n';
    subcontracts.forEach(s => {
      table += `| ${s.vendor} | ${s.service || 'N/A'} | K${s.amount?.toLocaleString() || 0} | ${s.status} |\n`;
    });
    return { text: `📄 **Subcontracts Table**\n\n${table}`, type: 'subcontract' };
  }
  if (q.includes('status') || q.includes('overview') || q.includes('summary')) {
    return {
      text: `📊 **System Overview Table**

| Metric | Value |
|--------|-------|
| Projects | ${stats.totalProjects || 0} |
| Workers | ${stats.totalWorkers || 0} |
| Funding Requests | ${stats.totalFunding || 0} |
| Pending Funding | ${stats.pendingFunding || 0} |
| Payments | ${stats.totalPayments || 0} |
| Procurement Orders | ${procurement?.length || 0} |
| BOQs | ${boqs?.length || 0} |`,
      type: 'stats'
    };
  }

  // ─── 2. Draw requests – DETAILED SVG ──────────────────────────
  if (q.includes('draw') && (q.includes('site plan') || q.includes('plan') || q.includes('layout') || q.includes('diagram'))) {
    return {
      text: `📐 **Detailed SVG Site Plan with Dimensions**

\`\`\`svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="100%" height="auto">
  <!-- Property boundary -->
  <rect x="50" y="50" width="500" height="400" fill="#f0f8f0" stroke="#333" stroke-width="2" />
  <text x="300" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">SITE PLAN WITH DIMENSIONS</text>
  <line x1="50" y1="470" x2="250" y2="470" stroke="#000" stroke-width="2" />
  <line x1="50" y1="465" x2="50" y2="475" stroke="#000" stroke-width="1" />
  <line x1="100" y1="465" x2="100" y2="475" stroke="#000" stroke-width="1" />
  <line x1="150" y1="465" x2="150" y2="475" stroke="#000" stroke-width="1" />
  <line x1="200" y1="465" x2="200" y2="475" stroke="#000" stroke-width="1" />
  <line x1="250" y1="465" x2="250" y2="475" stroke="#000" stroke-width="1" />
  <text x="150" y="495" text-anchor="middle" font-family="Arial" font-size="10">0    10    20    30    40    50 m</text>
  <text x="300" y="470" text-anchor="middle" font-family="Arial" font-size="10">Boundary: 50m × 40m = 2,000 m²</text>
  <rect x="100" y="100" width="140" height="100" fill="#d4e2f0" stroke="#333" stroke-width="2" />
  <text x="170" y="155" text-anchor="middle" font-family="Arial" font-size="10">Existing Building</text>
  <text x="170" y="170" text-anchor="middle" font-family="Arial" font-size="9">14m × 10m</text>
  <rect x="320" y="140" width="160" height="110" fill="#ffd9b3" stroke="#333" stroke-width="2" stroke-dasharray="5,5" />
  <text x="400" y="200" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">Proposed Building</text>
  <text x="400" y="215" text-anchor="middle" font-family="Arial" font-size="9" fill="#333">16m × 11m</text>
  <rect x="70" y="70" width="460" height="360" fill="none" stroke="#ff6b6b" stroke-width="1" stroke-dasharray="4,4" />
  <text x="260" y="65" text-anchor="middle" font-family="Arial" font-size="8" fill="#ff6b6b">Setback: 5m from boundary</text>
  <rect x="50" y="280" width="500" height="40" fill="#ccc" stroke="#333" stroke-width="1" />
  <text x="300" y="305" text-anchor="middle" font-family="Arial" font-size="10">Driveway / Access Road (6m wide)</text>
  <rect x="350" y="330" width="100" height="60" fill="#e0e0e0" stroke="#333" stroke-width="1" />
  <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="8">Parking</text>
  <text x="400" y="360" text-anchor="middle" font-family="Arial" font-size="8">10m × 6m</text>
  <circle cx="80" cy="80" r="14" fill="#2e7d32" stroke="#1b5e20" stroke-width="1" />
  <circle cx="75" cy="75" r="7" fill="#388e3c" />
  <text x="80" y="65" text-anchor="middle" font-family="Arial" font-size="8">Tree 1</text>
  <circle cx="500" cy="80" r="14" fill="#2e7d32" stroke="#1b5e20" stroke-width="1" />
  <circle cx="495" cy="75" r="7" fill="#388e3c" />
  <text x="500" y="65" text-anchor="middle" font-family="Arial" font-size="8">Tree 2</text>
  <circle cx="80" cy="380" r="14" fill="#2e7d32" stroke="#1b5e20" stroke-width="1" />
  <circle cx="75" cy="375" r="7" fill="#388e3c" />
  <text x="80" y="405" text-anchor="middle" font-family="Arial" font-size="8">Tree 3</text>
  <line x1="50" y1="50" x2="550" y2="50" stroke="#8d6e63" stroke-width="2" stroke-dasharray="8,4" />
  <line x1="550" y1="50" x2="550" y2="450" stroke="#8d6e63" stroke-width="2" stroke-dasharray="8,4" />
  <text x="565" y="250" font-family="Arial" font-size="10" transform="rotate(90,565,250)">Fence Line</text>
  <polygon points="560,60 575,90 570,90 575,110 580,90 575,90" fill="#000" />
  <text x="575" y="50" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">N</text>
  <rect x="50" y="420" width="15" height="10" fill="#d4e2f0" stroke="#333" />
  <text x="70" y="429" font-family="Arial" font-size="8">Existing</text>
  <rect x="120" y="420" width="15" height="10" fill="#ffd9b3" stroke="#333" stroke-dasharray="2,2" />
  <text x="140" y="429" font-family="Arial" font-size="8">Proposed</text>
  <rect x="190" y="420" width="15" height="10" fill="#ccc" />
  <text x="210" y="429" font-family="Arial" font-size="8">Road</text>
  <circle cx="260" cy="425" r="6" fill="#2e7d32" />
  <text x="270" y="429" font-family="Arial" font-size="8">Tree</text>
</svg>
\`\`\`

**How to use:** Copy the SVG code and save it as a \`.svg\` file, or paste it into an online SVG viewer like [svgviewer.dev](https://www.svgviewer.dev/).  
This is a detailed template with dimensions, legend, scale bar, and north arrow.`,
      type: 'general'
    };
  }

  // ─── 3. General knowledge (expanded) ──────────────────────────
  const lower = q.toLowerCase();

  // AI / technology
  if (lower.includes('artificial intelligence') || lower.includes('ai') || lower.includes('machine learning')) {
    return {
      text: `🤖 **What is Artificial Intelligence (AI)?**

Artificial Intelligence (AI) is the simulation of human intelligence in machines that are programmed to think and learn like humans.

**Key types:**
• **Narrow AI (Weak AI)** – specific tasks (voice assistants, image recognition).
• **General AI (Strong AI)** – human‑level intelligence (theoretical).
• **Superintelligence** – beyond human intelligence (hypothetical).

**Applications:**
• Natural Language Processing (chatbots, translation)
• Computer Vision (facial recognition, autonomous vehicles)
• Robotics, healthcare, finance

**How it works:**
Uses algorithms, neural networks, and large datasets to learn patterns.

**In construction:** project planning, cost estimation, risk assessment, site safety monitoring, predictive maintenance.

Would you like to know more about AI in construction?`,
      type: 'general'
    };
  }

  // Capitals
  if (lower.includes('capital') || lower.includes('country') || lower.includes('city')) {
    if (lower.includes('zambia')) return { text: 'The capital of Zambia is **Lusaka**.', type: 'general' };
    if (lower.includes('france')) return { text: 'The capital of France is **Paris**.', type: 'general' };
    if (lower.includes('usa') || lower.includes('united states')) return { text: 'The capital of the USA is **Washington, D.C.**', type: 'general' };
    if (lower.includes('uk') || lower.includes('united kingdom')) return { text: 'The capital of the United Kingdom is **London**.', type: 'general' };
    if (lower.includes('kenya')) return { text: 'The capital of Kenya is **Nairobi**.', type: 'general' };
    return {
      text: 'I can help with geography! Ask me about specific countries or capitals.',
      type: 'general'
    };
  }

  // Water cycle
  if (lower.includes('water cycle') || lower.includes('hydrological cycle')) {
    return {
      text: `🌊 **The Water Cycle (Hydrological Cycle)**

The continuous movement of water on, above, and below the Earth's surface.

**Stages:**
• **Evaporation** – water turns into vapour from oceans, lakes, and soil.
• **Transpiration** – water vapour released from plants.
• **Condensation** – water vapour cools and forms clouds.
• **Precipitation** – water falls as rain, snow, sleet, or hail.
• **Runoff** – water flows over land into rivers, lakes, and oceans.
• **Infiltration** – water seeps into the ground (groundwater).

**Importance:** Regulates climate, supplies freshwater, and supports ecosystems.

Would you like more details on any stage?`,
      type: 'general'
    };
  }

  // Gravity
  if (lower.includes('gravity') || lower.includes('gravitational')) {
    return {
      text: `🌍 **What is Gravity?**

Gravity is a natural phenomenon by which all objects with mass attract each other.

**Key points:**
• **Newton's Law of Universal Gravitation:** F = G * (m1 * m2) / r².
• **Acceleration due to gravity** on Earth is **9.8 m/s²**.
• Keeps planets in orbit, holds the atmosphere, and governs tides.

**In construction:** Gravity affects structural loads, foundation design, and slope stability.

Need a calculation or more details?`,
      type: 'general'
    };
  }

  // Great Wall
  if (lower.includes('great wall') || lower.includes('wall of china')) {
    return {
      text: `🏯 **The Great Wall of China**

A series of fortifications built along the northern borders of China to protect against invasions.

**Key facts:**
• **Length:** Over 21,000 km (13,000 miles).
• **Built over centuries** – started in the 7th century BC, with major construction during the Qin (221–206 BC) and Ming (1368–1644) dynasties.
• **Materials:** Stone, brick, tamped earth, wood.
• **Purpose:** Defense, border control, and trade regulation.

**Today:** A UNESCO World Heritage Site and one of the New Seven Wonders of the World.

Would you like to know more about specific sections or construction techniques?`,
      type: 'general'
    };
  }

  // CCTV Installation
  if (lower.includes('cctv') || lower.includes('camera') || lower.includes('surveillance')) {
    return {
      text: `📹 **CCTV Installation Guide**

**1. Planning & Site Survey**
• Identify areas to cover: entry points, parking, storage, blind spots.
• Choose camera types: Dome (indoor), Bullet (outdoor long range), PTZ (large areas).
• Resolution: 2MP minimum, 4MP or 8MP for detailed identification.

**2. Cabling & Power**
• Use Cat5e/Cat6 for IP cameras (PoE simplifies wiring).
• For analog, use RG59 coax + power cable.
• Avoid power lines; use conduits for protection.

**3. Camera Placement**
• Mount at 2.5–3m height to avoid tampering.
• Angle downwards 10–20° for optimal coverage.

**4. Recording & Storage**
• DVR (analog) or NVR (IP).
• Storage: e.g., 4MP camera at 4Mbps, 24/7 recording ≈ 1.5TB/month.

**5. Networking & Remote Access**
• Assign static IPs to NVR/DVR.
• Set up port forwarding for remote viewing.

**6. Testing & Maintenance**
• Test each camera view, night vision (IR).
• Regular cleaning and firmware updates.

Need more details on a specific step?`,
      type: 'general'
    };
  }

  // Electrical installation / load calculation
  if (lower.includes('electrical') || lower.includes('wiring') || lower.includes('circuit') || lower.includes('panel') || lower.includes('breaker') || lower.includes('load calculation')) {
    return {
      text: `⚡ **Electrical Installation – Practical Guide**

**1. Load Calculation**
• Sum wattage of all appliances and lighting.
• Use diversity factor (not all run simultaneously).
Example: 3‑bedroom house:
  - Lighting: 2 kW
  - Sockets: 5 kW
  - Geyser: 3 kW
  - Stove: 5 kW
  - Total connected ≈ 15 kW → diversity 0.6 → 9 kW demand.

**2. Distribution Board (DB)**
• Main switch rating = demand × 1.25.
• MCBs: Lighting 6A/10A, Sockets 16A/20A, Heavy appliances 32A/40A.

**3. Wiring**
• Copper cables, PVC insulated.
• Cable size based on current and length (voltage drop ≤ 3%).
• Run in conduits.

**4. Earthing & Bonding**
• Earth rod ≥1.5m deep.
• Test earth resistance (<1 ohm).

**5. Safety**
• RCD (Residual Current Device) for leakage protection.
• Label circuits clearly.

**6. Testing**
• Continuity, insulation resistance, polarity.

Need a specific calculation? Ask!`,
      type: 'general'
    };
  }

  // Structural drawings
  if (lower.includes('structural') || lower.includes('drawing') || lower.includes('blueprint') || lower.includes('rebar') || lower.includes('bar bending')) {
    return {
      text: `🏗️ **Reading Structural Drawings – Key Points**

**1. Types**
• **Foundation Plan** – footings, columns, ground beams.
• **Floor Plans** – columns, beams, slab thickness.
• **Roof Plan** – trusses, purlins.
• **Sections** – cut through showing reinforcement.
• **Details** – connections, joints.

**2. Symbols**
• Lines: solid = visible, dashed = hidden.
• Reinforcement: T10 = 10mm bar, T12@200 = 12mm spaced 200mm.
• U‑bars = stirrups.

**3. Bar Bending Schedule (BBS)**
• Lists bar type, shape, length, quantity.
• Includes bend deductions.

**4. How to Interpret**
• Title block, scale, date.
• North arrow and orientation.
• General notes (cover, concrete strength).

**5. Common Mistakes**
• Missing dimensions, conflicting details.
• Forgetting cover (25mm footings, 20mm columns).

Need help with a specific drawing? Describe it.`,
      type: 'general'
    };
  }

  // Site safety
  if (lower.includes('safety') || lower.includes('ppe') || lower.includes('protection') || lower.includes('hazard') || lower.includes('risk')) {
    return {
      text: `🛡️ **Construction Site Safety Requirements**

**Essential PPE:**
• Hard hat
• High‑visibility vest
• Steel‑toe boots
• Safety glasses/goggles
• Gloves
• Ear protection (for loud areas)

**Key Safety Practices:**
• Daily safety briefings.
• Inspect equipment regularly.
• Keep first aid kits accessible.
• Maintain clear walkways and exits.
• Use fall protection for heights >2m.
• Store materials safely.

**Regulations:**
• Follow local standards (e.g., ZS 303 in Zambia).
• Conduct risk assessments and method statements.

**In PURVEYOLS CMS:** you can track safety reports and incidents from the Safety Reports module.`,
      type: 'general'
    };
  }

  // Cost estimation
  if (lower.includes('cost') || lower.includes('estimate') || lower.includes('budget') || lower.includes('estimation')) {
    return {
      text: `💰 **Construction Cost Estimation**

**Key Components:**
1. **Materials** – concrete, steel, timber, finishes.
2. **Labor** – skilled and unskilled.
3. **Equipment** – machinery, tools.
4. **Subcontractors** – specialist trades.
5. **Preliminaries** – site setup, security, insurance.
6. **Contingency** – 5‑10% for unexpected costs.
7. **Profit & Overheads** – typically 10‑20%.

**Methods:**
• **Elemental estimating** – by building elements.
• **Unit rate estimating** – cost per m², m³.
• **Parametric** – use historical data.

**In PURVEYOLS CMS:**
• Create BOQs with detailed cost breakdowns.
• Track project budgets.
• Monitor funding requests and payments.

Need a sample BOQ? Just ask!`,
      type: 'general'
    };
  }

  // Project management phases
  if (lower.includes('project management') || lower.includes('phases') || lower.includes('lifecycle') || lower.includes('initiation') || lower.includes('planning') || lower.includes('execution') || lower.includes('monitoring') || lower.includes('closure')) {
    return {
      text: `📊 **Project Management Phases**

**1. Initiation**
• Define scope and objectives.
• Feasibility study.
• Secure funding and approvals.

**2. Planning**
• Develop detailed plans and schedules (Gantt charts, milestones).
• Allocate resources and budget.
• Identify risks and mitigation.

**3. Execution**
• Mobilise site and resources.
• Carry out construction.
• Monitor progress against schedule.
• Manage quality and safety.

**4. Monitoring & Control**
• Track costs, time, and quality.
• Report progress to stakeholders.
• Manage changes and variations.

**5. Closure**
• Final inspections.
• Handover to client.
• Finalise documentation and payments.

**In PURVEYOLS CMS:** Use the Project Planning module to manage tasks, milestones, and Gantt charts.`,
      type: 'general'
    };
  }

  // ─── 4. Construction-specific general knowledge (concrete, foundation, steel, cement) ───
  if (lower.includes('concrete') || lower.includes('foundation') || lower.includes('steel') || lower.includes('cement')) {
    return {
      text: `🏗️ **Construction Materials & Techniques**

**Concrete:** Composite of cement, water, aggregates. Used for foundations, columns, beams, slabs, pavements. Strength grades: C15, C20, C25, etc.

**Reinforcement Steel (Rebar):** Steel bars to increase concrete's tensile strength. Deformed for better bonding.

**Foundations:**
• **Strip footing** – for load‑bearing walls.
• **Pad footing** – for columns.
• **Raft** – for weak soils.
• **Pile** – for deep or soft soils.

**Cement:** Binder that hardens when mixed with water. Types: Portland (most common), rapid‑hardening, sulphate‑resistant.

Would you like more details on any of these?`,
      type: 'general'
    };
  }

  // ─── 5. Catch‑all: helpful response ──────────────────────────
  return {
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can help with:

📊 **System Data** (in tables):
• "Show me projects" → project table
• "Show me workers" → worker table
• "Show me funding requests" → funding table

🏗️ **Drawings** (in SVG):
• "Draw a site plan" → detailed SVG site plan

🌍 **General Knowledge:**
• "What is artificial intelligence?"
• "What is the capital of Zambia?"
• "Explain concrete mix design"
• "How to install CCTV?"
• "Electrical load calculation"
• "How to read structural drawings?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"
• "Explain project management phases"

💡 **Just ask me anything** – I'll respond with a table, drawing, or clear explanation.`,
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
