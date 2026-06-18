const User = require('../models/User');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');

// ============================================================
// SYSTEM QUERY HANDLERS – ALL SYSTEM DATA
// ============================================================

const systemHandlers = [
  // ===== WORKERS =====
  {
    keywords: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour', 'how many workers', 'worker count'],
    handler: async (userId) => {
      const workers = await Worker.find().populate('enrolledBy', 'name');
      const total = workers.length;
      const active = workers.filter(w => w.status === 'active').length;
      const suspended = workers.filter(w => w.status === 'suspended').length;
      const inactive = workers.filter(w => w.status === 'inactive').length;
      const topText = workers.slice(0, 5).map(w => `  - ${w.name} (${w.nrc}) - ${w.status}`).join('\n');
      return {
        text: `📊 **Workers Summary**\n\n• Total Workers: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`
      };
    }
  },
  {
    keywords: ['worker balance', 'balances', 'worker earning', 'how much workers earned'],
    handler: async (userId) => {
      const workers = await Worker.find();
      const balances = [];
      let totalOwed = 0;
      for (const w of workers) {
        const payments = await Payment.find({ worker: w._id, status: 'completed' });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const attendance = await Attendance.find({ worker: w._id });
        const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
        const balance = totalEarned - totalPaid;
        if (balance !== 0) {
          balances.push({ name: w.name, earned: totalEarned, paid: totalPaid, balance });
          totalOwed += balance;
        }
      }
      const topText = balances.slice(0, 5).map(w => `  - ${w.name}: Owing ZMW ${w.balance.toFixed(2)}`).join('\n');
      return {
        text: `⚖️ **Worker Balances**\n\n• Total Owing: ZMW ${totalOwed.toFixed(2)}\n• Workers with Balance: ${balances.length}\n\n**Top Balances:**\n${topText || 'No outstanding balances'}`
      };
    }
  },

  // ===== PROJECTS =====
  {
    keywords: ['projects', 'project', 'building', 'construction site', 'site', 'how many projects', 'project count'],
    handler: async (userId) => {
      const projects = await Project.find().populate('manager createdBy', 'name');
      const total = projects.length;
      const active = projects.filter(p => p.status === 'active').length;
      const planning = projects.filter(p => p.status === 'planning').length;
      const completed = projects.filter(p => p.status === 'completed').length;
      const paused = projects.filter(p => p.status === 'paused').length;
      const topText = projects.slice(0, 5).map(p => `  - ${p.name} (${p.location}) - Budget: ${p.budget}`).join('\n');
      return {
        text: `📋 **Projects Summary**\n\n• Total Projects: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Projects:**\n${topText || 'No projects found'}`
      };
    }
  },
  {
    keywords: ['project budget', 'project cost', 'budget', 'how much budget'],
    handler: async (userId) => {
      const projects = await Project.find();
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const topText = projects.map(p => `  - ${p.name}: ZMW ${p.budget.toLocaleString()}`).join('\n');
      return {
        text: `💰 **Project Budgets**\n\n• Total Budget: ZMW ${totalBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n**Breakdown:**\n${topText || 'No projects found'}`
      };
    }
  },

  // ===== FUNDING =====
  {
    keywords: ['funding', 'fund', 'fund request', 'funding requests', 'pending funding'],
    handler: async (userId) => {
      const funding = await FundingRequest.find().populate('project requestedBy', 'name');
      const total = funding.length;
      const pending = funding.filter(f => f.status === 'pending');
      const approved = funding.filter(f => f.status === 'approved');
      const rejected = funding.filter(f => f.status === 'rejected');
      const totalAmount = funding.reduce((sum, f) => sum + f.amount, 0);
      const pendingText = pending.slice(0, 5).map(f => `  - ${f.project?.name} (ZMW ${f.amount}) - by ${f.requestedBy?.name}`).join('\n');
      return {
        text: `📌 **Funding Requests**\n\n• Total: ${total}\n• Pending: ${pending.length}\n• Approved: ${approved.length}\n• Rejected: ${rejected.length}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Pending Requests:**\n${pendingText || 'No pending requests'}`
      };
    }
  },

  // ===== PAYMENTS =====
  {
    keywords: ['payment', 'payments', 'paid', 'salary', 'wage', 'earnings', 'total paid'],
    handler: async (userId) => {
      const payments = await Payment.find().populate('worker paidBy', 'name');
      const total = payments.length;
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const recent = payments.slice(0, 5);
      const topText = recent.map(p => `  - ${p.worker?.name || 'Unknown'} (ZMW ${p.amount})`).join('\n');
      return {
        text: `💳 **Payment Summary**\n\n• Total Payments: ${total}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Recent Payments:**\n${topText || 'No payments recorded'}`
      };
    }
  },

  // ===== PROCUREMENT =====
  {
    keywords: ['procurement', 'order', 'material', 'supplies', 'items', 'spare parts'],
    handler: async (userId) => {
      const orders = await ProcurementOrder.find().populate('project createdBy', 'name');
      const total = orders.length;
      const pending = orders.filter(o => o.status === 'pending').length;
      const funded = orders.filter(o => o.status === 'funded').length;
      const purchased = orders.filter(o => o.status === 'purchased').length;
      const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
      const pendingText = orders.filter(o => o.status === 'pending').slice(0, 5)
        .map(o => `  - ${o.project?.name || 'N/A'} (${o.items?.length || 0} items)`).join('\n');
      return {
        text: `📦 **Procurement Summary**\n\n• Total Orders: ${total}\n• Pending: ${pending}\n• Funded: ${funded}\n• Purchased: ${purchased}\n• Total Items: ${totalItems}\n\n**Pending Orders:**\n${pendingText || 'No pending orders'}`
      };
    }
  },

  // ===== BOQ =====
  {
    keywords: ['boq', 'bill of quantities', 'estimate', 'quantities'],
    handler: async (userId) => {
      const boqs = await BOQ.find().populate('project createdBy', 'name');
      const total = boqs.length;
      const submitted = boqs.filter(b => b.status === 'submitted').length;
      const approved = boqs.filter(b => b.status === 'approved').length;
      const draft = boqs.filter(b => b.status === 'draft').length;
      const totalItems = boqs.reduce((sum, b) => sum + (b.items?.length || 0), 0);
      return {
        text: `📋 **BOQ Summary**\n\n• Total BOQs: ${total}\n• Draft: ${draft}\n• Submitted: ${submitted}\n• Approved: ${approved}\n• Total Items: ${totalItems}`
      };
    }
  },

  // ===== SUBCONTRACTS =====
  {
    keywords: ['subcontract', 'subcontractor', 'vendor', 'supplier', 'sub-contract'],
    handler: async (userId) => {
      const subs = await Subcontract.find().populate('project createdBy', 'name');
      const total = subs.length;
      const active = subs.filter(s => s.status === 'active').length;
      const terminated = subs.filter(s => s.status === 'terminated').length;
      const totalAmount = subs.reduce((sum, s) => sum + s.amount, 0);
      const topText = subs.filter(s => s.status === 'active').slice(0, 5)
        .map(s => `  - ${s.vendor} (${s.service}) - ZMW ${s.amount}`).join('\n');
      return {
        text: `🔧 **Subcontract Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Terminated: ${terminated}\n• Total Value: ZMW ${totalAmount.toLocaleString()}\n\n**Active Subcontracts:**\n${topText || 'No active subcontracts'}`
      };
    }
  },

  // ===== NOTIFICATIONS =====
  {
    keywords: ['notification', 'alert', 'messages', 'unread', 'pending alerts'],
    handler: async (userId) => {
      const notifications = await Notification.find({ user: userId, read: false }).sort({ createdAt: -1 });
      const total = notifications.length;
      const topText = notifications.slice(0, 5).map(n => `  - ${n.title}: ${n.message}`).join('\n');
      return {
        text: `🔔 **Notifications**\n\n• Unread: ${total}\n\n**Recent:**\n${topText || 'No unread notifications'}`
      };
    }
  },

  // ===== SUMMARY / DASHBOARD =====
  {
    keywords: ['summary', 'overview', 'dashboard', 'what is happening', 'tell me everything'],
    handler: async (userId) => {
      const [workers, projects, funding, payments, procurement] = await Promise.all([
        Worker.find(),
        Project.find(),
        FundingRequest.find(),
        Payment.find({ status: 'completed' }),
        ProcurementOrder.find()
      ]);
      
      const totalWorkers = workers.length;
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const pendingFunding = funding.filter(f => f.status === 'pending').length;
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingProcurement = procurement.filter(p => p.status === 'pending').length;
      
      return {
        text: `📊 **System Overview**\n\n👥 **Workers:** ${totalWorkers}\n🏗️ **Projects:** ${totalProjects} (${activeProjects} active)\n💰 **Funding Requests:** ${funding.length} (${pendingFunding} pending)\n💳 **Total Paid:** ZMW ${totalPaid.toLocaleString()}\n📦 **Procurement Orders:** ${procurement.length} (${pendingProcurement} pending)\n\n✅ All systems operational.`
      };
    }
  }
];

// ============================================================
// COMPREHENSIVE CONSTRUCTION KNOWLEDGE
// ============================================================

const constructionKnowledge = [
  // ===== FOUNDATIONS =====
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'pile', 'raft', 'strip footing', 'pad footing'],
    response: `🏗️ **FOUNDATION DESIGN & SOIL ANALYSIS**

**Types of Foundations:**
• **Strip Footing** – For load-bearing walls, suitable for stable soils. Most common in residential.
• **Raft Foundation** – For poor soils, spreads load across entire footprint. Good for expansive soils.
• **Pile Foundation** – For very weak soils or high-rise buildings. Transfers load to deeper stable layers.
• **Pad Footing** – For individual columns. Simple and cost-effective.

**Soil Testing:**
• Conduct a **geotechnical investigation** before design.
• Key tests: Standard Penetration Test (SPT), Plate Load Test, Atterberg Limits.
• Soil bearing capacity determines foundation type and depth.

**Best Practices:**
• Minimum depth: 1.0m (Zambia climate).
• Include a **damp-proof course** (DPC) 150mm above ground.
• Reinforced concrete is standard (use 1:2:4 mix).
• For expansive soils (black cotton), use raft or piled foundations.
• Always consult a structural engineer for final design.`
  },
  
  // ===== CONCRETE =====
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing', 'aggregate', 'slump'],
    response: `🧱 **CONCRETE TECHNOLOGY**

**Concrete Mix Ratios:**
| Grade | Mix (C:S:A) | Use |
|-------|-------------|-----|
| C15   | 1:3:6       | Mass concrete, blinding |
| C20   | 1:2.5:5     | General ground floor |
| C25   | 1:2:4       | Columns, beams, slabs |
| C30   | 1:1.5:3     | High-strength structures |

**Water-Cement Ratio:**
• For C25: 0.45 – 0.50 (by weight).
• Too much water = weak concrete (reduces strength).
• Too little water = unworkable concrete.

**Curing:**
• Minimum 7 days (keep wet with water, sand, or curing compound).
• For high-strength: 14 days.
• Temperature affects curing – keep below 30°C if possible.

**Quality Control:**
• Cube tests: 150mm cubes tested at 7, 14, 28 days.
• Slump test: 75-100mm for normal work, 25-50mm for dry mix.
• Use quality cement (ZAMCEM, Larfarge, Sika).`
  },

  // ===== STEEL REINFORCEMENT =====
  {
    keywords: ['steel', 'reinforcement', 'rebar', 'tensile', 'column', 'beam', 'lintel'],
    response: `🔩 **REINFORCED CONCRETE DESIGN**

**Steel Reinforcement Guide:**
• Standard rebar grades: **Y12, Y16, Y20, Y25** (mm diameter).
• Yield strength: 460 MPa (high tensile) or 250 MPa (mild steel).
• Always use **high tensile** for structural members.

**Cover Requirements:**
| Element | Cover (mm) |
|---------|------------|
| Foundation | 50-75 |
| Columns | 40-50 |
| Beams | 40-50 |
| Slabs | 25-30 |

**Bending & Cutting Rules:**
• Minimum bend diameter: 4x bar diameter.
• Lap length: 40-50 x bar diameter (compression).
• For tension: 50-60 x bar diameter.
• Always use **hooks** at ends of beams/columns.

**Spacing:**
• Main bars: 150-200mm spacing.
• Stirrups: 150-200mm spacing (tighter near supports).

**Inspection Checklist:**
✓ Correct bar sizes and grades.
✓ Proper cover with spacers.
✓ Correct lap lengths.
✓ Ties/welds secure.
✓ Formwork clean and oiled.`
  },

  // ===== SAFETY =====
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves', 'harness', 'first aid', 'emergency'],
    response: `🦺 **CONSTRUCTION SAFETY MANAGEMENT**

**Mandatory PPE:**
✅ Hard hat (EN 397)
✅ Safety boots (steel toe, EN 20345)
✅ High-vis vest (EN 471)
✅ Gloves (EN 388)
✅ Safety glasses (EN 166)
✅ Ear protection (if >85 dB)
✅ Harness (for work >2m height)

**Weekly Safety Checklist:**
☑️ PPE inspections.
☑️ Scaffolding stability.
☑️ Electrical cable condition.
☑️ Fire extinguisher presence.
☑️ First aid kit supplies.
☑️ Tool condition.
☑️ Signage visibility.

**Emergency Response:**
1. **Stop work** immediately.
2. **Alert** all nearby workers.
3. **Call** emergency services (999 in Zambia).
4. **Administer** first aid if trained.
5. **Report** incident to management.

**Common Hazards:**
⚠️ Falling from height.
⚠️ Struck by objects.
⚠️ Electrical shocks.
⚠️ Machinery accidents.
⚠️ Chemical exposure.`
  },

  // ===== COST ESTIMATION =====
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing', 'valuation', 'unit rate'],
    response: `💰 **CONSTRUCTION COST ESTIMATION**

**Cost Per Square Meter (Zambia, 2026):**
• Residential (standard): ZMW 3,500-5,500/m²
• Residential (premium): ZMW 6,000-8,500/m²
• Commercial (standard): ZMW 4,500-6,500/m²
• Commercial (premium): ZMW 7,000-10,000/m²

**Contingency:**
• 10-15% for unexpected costs.
• 5% for design changes.
• 5% for price fluctuations.

**Cost-Saving Tips:**
💰 Bulk purchase discounts.
💰 Use local materials where possible.
💰 Reduce waste (optimize cutting plans).
💰 Hire local labor.
💰 Consider prefabricated elements.

**Unit Rates (Zambia):**
| Item | Unit | Rate (ZMW) |
|------|------|------------|
| Excavation | m³ | 150-250 |
| Concrete (C25) | m³ | 5,500-7,000 |
| Steel rebar | ton | 12,000-15,000 |
| Brickwork | m² | 120-180 |
| Plastering | m² | 80-120 |
| Tiling | m² | 100-150 |
| Roofing | m² | 200-350 |
| Painting | m² | 50-80 |`
  },

  // ===== PROJECT MANAGEMENT =====
  {
    keywords: ['project management', 'planning', 'schedule', 'timeline', 'gantt', 'milestone', 'critical path'],
    response: `📅 **PROJECT MANAGEMENT & PLANNING**

**Project Phases:**
1. **Initiation** – feasibility, approvals, budget.
2. **Design** – architect, engineer, BOQ.
3. **Procurement** – materials, contractors, permits.
4. **Construction** – site works, quality control.
5. **Commissioning** – testing, handover, defects.

**Critical Path Method (CPM):**
• Identify **dependencies** between tasks.
• Calculate **earliest and latest start times**.
• Identify **critical path** (longest duration).
• Focus resources on critical path tasks.

**Milestone Checklist:**
☑️ 10%: Site cleared, foundations started.
☑️ 30%: Ground floor complete.
☑️ 50%: Structure complete (roof on).
☑️ 70%: Services (MEP) installed.
☑️ 90%: Finishing (painting, tiling).
☑️ 100%: Handover.

**Zambia Context:**
• Rainy season (Nov-Mar) affects outdoor work.
• Allow 2-3 weeks for material delivery delays.`
  },

  // ===== CONTRACTS =====
  {
    keywords: ['contract', 'agreement', 'tender', 'bid', 'procurement', 'negotiation', 'arbitration'],
    response: `📝 **CONSTRUCTION CONTRACTS & TENDERING**

**Contract Types:**
• **Lump Sum** – fixed price (good for clear scope).
• **Unit Price** – pay per item (good for uncertain quantities).
• **Cost Plus** – cost + fee (good for design-build).
• **NEC** – collaborative, modern approach.

**Tender Documents Checklist:**
☑️ Invitation to Tender.
☑️ Instructions to Bidders.
☑️ Form of Tender.
☑️ Conditions of Contract.
☑️ Scope of Work.
☑️ Specifications.
☑️ Drawings.
☑️ Bill of Quantities (BOQ).

**Key Contract Clauses:**
• **Variations** – how changes are handled.
• **Payment** – schedule and milestones.
• **Delay** – penalties and extensions.
• **Defects** – liability period.
• **Dispute Resolution** – arbitration or litigation.

**Zambia Context:**
• Public Procurement Act (ZPPA).
• Standard Form of Contract (SFOC).
• ERB regulates professional services.`
  },

  // ===== ROOFING =====
  {
    keywords: ['roofing', 'roof', 'truss', 'corrugated', 'tiles', 'insulation', 'ceiling'],
    response: `🏠 **ROOFING SYSTEMS**

**Roof Types:**
• **Pitched** – with trusses (common in Zambia).
• **Flat** – with parapets (commercial buildings).
• **Mono-pitch** – single slope (modern style).

**Materials:**
| Type | Lifespan | Cost |
|------|----------|------|
| Corrugated iron | 15-20 years | Low |
| Colorbond | 20-30 years | Medium |
| Clay tiles | 50+ years | High |
| Concrete tiles | 40-50 years | Medium |

**Roof Truss Design:**
• Span: up to 15m (timber), 30m (steel).
• Pitch: 20°-30° for corrugated, 30°-45° for tiles.
• Truss spacing: 1.2-1.5m.
• Use treated timber (CCA) or galvanized steel.

**Installation Tips:**
✓ Start from eaves to ridge.
✓ Overlap: 1.5 corrugations (side), 150mm (end).
✓ Use pop-rivets or screws (not nails).
✓ Install flashing at valleys, ridges, and penetrations.`
  },

  // ===== PLUMBING =====
  {
    keywords: ['plumbing', 'drainage', 'pipe', 'water', 'sanitary', 'waste', 'septic', 'sewer'],
    response: `🚿 **PLUMBING & DRAINAGE SYSTEMS**

**Pipe Materials:**
• **UPVC** – for cold water, drainage (lightweight, cheap).
• **Copper** – for hot water (durable, expensive).
• **HDPE** – for underground, pressure (flexible).
• **GI** – for heavy duty (galvanized iron).

**Drainage System:**
• **Foul water** – from toilets, kitchens (to sewer/septic).
• **Stormwater** – from roofs, parking (to soakaway/storm drain).
• **Vents** – every 5-10m (to prevent vacuum).

**Septic Tank Design:**
• Size: based on number of users.
• Standard: 1.5-2.5m deep, 2-4m long.
• Soakaway: 1m from tank, gravel filled.
• Empty every 2-5 years.

**Installation Checklist:**
✓ Correct pipe sizes (DN 100 for WC, DN 50 for sinks).
✓ Falls: 1:40 to 1:100 (2.5%).
✓ Solvent weld joints (UPVC) or compression (copper).
✓ Water test under pressure (1.5x working).`
  },

  // ===== ELECTRICAL =====
  {
    keywords: ['electrical', 'wiring', 'cable', 'circuit', 'lighting', 'power', 'distribution', 'panel'],
    response: `⚡ **ELECTRICAL SYSTEMS**

**Cable Sizing Guide:**
| Application | Cable Size | Breaker |
|-------------|------------|---------|
| Lighting | 1.5mm² | 6A |
| Power (sockets) | 2.5mm² | 16A |
| Cooker | 6mm² | 32A |
| AC unit | 4mm² | 20A |
| Main supply | 16mm² | 63A |

**Distribution:**
• Main switchboard → sub-panels → final circuits.
• Use **RCD** (residual current device) for safety (30mA).
• Earth leakage protection required.

**Installation Requirements:**
• All wiring in trunking or conduit.
• Secure cables at intervals (1m max).
• Use terminal blocks for connections.
• Test insulation resistance (>1MΩ).
• Earth continuity test (<0.5Ω).

**Zambia Context:**
• ZESCO supply: 230V single phase, 400V three phase.
• Generator backup optional.
• Solar systems growing in popularity.`
  },

  // ===== SUSTAINABLE CONSTRUCTION =====
  {
    keywords: ['sustainable', 'green', 'eco', 'environment', 'recycling', 'energy efficiency', 'solar'],
    response: `🌿 **SUSTAINABLE CONSTRUCTION**

**Green Building Principles:**
1. **Reduce** – use less material (optimize design).
2. **Reuse** – salvage and repurpose materials.
3. **Recycle** – use recycled materials where possible.
4. **Renewable** – use sustainable sources.

**Energy Efficiency:**
• High-performance glazing (low-E glass).
• Insulation (min. 50mm).
• Natural lighting (skylights, large windows).
• Passive cooling (cross ventilation, shading).

**Water Conservation:**
• Rainwater harvesting (tanks).
• Greywater recycling (gardens).
• Low-flow fixtures (taps, showers).
• Drought-tolerant landscaping.

**Solar Energy:**
• Solar potential: 5-7 kWh/m²/day in Zambia.
• Solar panels for electricity and hot water.
• Payback period: 3-5 years.
• Government incentives available.

**Zambia Context:**
• Abundant solar resources.
• Water scarcity: rainwater harvesting recommended.
• Local materials reduce carbon footprint.`
  },

  // ===== QUALITY CONTROL =====
  {
    keywords: ['quality', 'inspection', 'check', 'standard', 'compliance', 'defect', 'handover'],
    response: `✅ **QUALITY CONTROL & INSPECTION**

**Inspection Stages:**
1. **Foundation** – soil, formwork, rebar, concrete.
2. **Frame** – columns, beams, slabs, joints.
3. **Services** – plumbing, electrical, HVAC.
4. **Finishing** – plastering, tiling, painting.
5. **Handover** – snagging, final tests.

**Key Tests:**
• **Concrete cube test** – 7, 14, 28 days.
• **Slump test** – workability.
• **Steel tensile test** – yield/ultimate strength.
• **Water test** – for plumbing and waterproofing.
• **Electrical test** – continuity, insulation.

**Snagging Checklist:**
☑️ Doors and windows open/close properly.
☑️ Floor level tolerances (±5mm).
☑️ Wall straightness (plumb).
☑️ Paint finish smooth.
☑️ Tile grout complete.
☑️ Electrical sockets work.
☑️ Plumbing no leaks.
☑️ Site clean and safe.`
  }
];

// ============================================================
// MAIN AI FUNCTION
// ============================================================

const getAIResponse = async (userQuestion, userId) => {
  const lower = userQuestion.toLowerCase().trim();
  console.log('🤖 AI Question:', userQuestion);

  // 1. Check system queries first
  for (const item of systemHandlers) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('🔍 Matched system query:', item.keywords[0]);
      try {
        const result = await item.handler(userId);
        return {
          type: 'system',
          text: result.text,
          data: result.data
        };
      } catch (err) {
        console.error('System query error:', err);
        return {
          type: 'error',
          text: '⚠️ I encountered an error fetching system data. Please try again.'
        };
      }
    }
  }

  // 2. Check construction knowledge
  for (const item of constructionKnowledge) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('📚 Matched construction knowledge:', item.keywords[0]);
      return {
        type: 'knowledge',
        text: item.response
      };
    }
  }

  // 3. General fallback with examples
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can answer questions about:

📊 **System Data:**
• "How many workers do we have?" – Worker count
• "How much are we owing workers?" – Worker balances
• "What's our total budget?" – Financial summary
• "Show me pending funding requests" – Pending approvals
• "What's the project status?" – Project overview
• "Tell me everything" – System summary

🏗️ **Construction Knowledge:**
• Foundations and soil analysis
• Concrete design and mix ratios
• Steel reinforcement and structural design
• Safety requirements and PPE
• Cost estimation and budgeting
• Project management and planning
• Contracts and tendering
• Plumbing, electrical, roofing
• Sustainable construction
• Quality control and inspection

💡 **Just ask! I'm here to help.**`
  };
};

module.exports = { getAIResponse };
