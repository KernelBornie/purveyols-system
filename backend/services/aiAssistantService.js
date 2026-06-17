const User = require('../models/User');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');
const Notification = require('../models/Notification');

// ============================================================
// SYSTEM QUERY HANDLERS (FULLY IMPLEMENTED)
// ============================================================

const systemHandlers = [
  {
    keywords: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour'],
    handler: async (userId) => {
      const workers = await Worker.find().populate('enrolledBy', 'name');
      const total = workers.length;
      const active = workers.filter(w => w.status === 'active').length;
      const suspended = workers.filter(w => w.status === 'suspended').length;
      const inactive = workers.filter(w => w.status === 'inactive').length;
      const topText = workers.slice(0, 5).map(w => `  - ${w.name} (${w.nrc}) - ${w.status}`).join('\n');
      return {
        text: `📊 **Workers Summary**\n\n• Total Workers: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`,
        data: workers
      };
    }
  },
  {
    keywords: ['projects', 'project', 'building', 'construction site', 'site'],
    handler: async (userId) => {
      const projects = await Project.find().populate('manager createdBy', 'name');
      const total = projects.length;
      const active = projects.filter(p => p.status === 'active').length;
      const planning = projects.filter(p => p.status === 'planning').length;
      const completed = projects.filter(p => p.status === 'completed').length;
      const paused = projects.filter(p => p.status === 'paused').length;
      const topText = projects.filter(p => p.status === 'active' || p.status === 'planning').slice(0, 5)
        .map(p => `  - ${p.name} (${p.location}) - Budget: ${p.budget}`).join('\n');
      return {
        text: `📋 **Projects Summary**\n\n• Total Projects: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Active/Planning Projects:**\n${topText || 'No active projects'}`,
        data: projects
      };
    }
  },
  {
    keywords: ['budget', 'fund', 'funding', 'money', 'financial', 'amount', 'total amount', 'how much'],
    handler: async (userId) => {
      const projects = await Project.find();
      const totalProjectBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const funding = await FundingRequest.find().populate('project requestedBy', 'name');
      const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
      const pendingFunding = funding.filter(f => f.status === 'pending');
      const pendingAmount = pendingFunding.reduce((sum, f) => sum + f.amount, 0);
      const payments = await Payment.find({ status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        text: `💰 **Financial Summary**\n\n📌 **Project Budgets:**\n• Total Budget: ZMW ${totalProjectBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n📌 **Funding Requests:**\n• Total Requested: ZMW ${totalFunding.toLocaleString()}\n• Pending: ZMW ${pendingAmount.toLocaleString()} (${pendingFunding.length} requests)\n\n📌 **Payments:**\n• Total Paid: ZMW ${totalPaid.toLocaleString()}\n• Number of Payments: ${payments.length}`,
        data: { projects, funding, payments }
      };
    }
  },
  {
    keywords: ['payments', 'paid', 'salary', 'wage', 'earnings', 'pay'],
    handler: async (userId) => {
      const payments = await Payment.find().populate('worker paidBy', 'name');
      const total = payments.length;
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const recent = payments.slice(0, 5);
      const topText = recent.map(p => `  - ${p.worker?.name || 'Unknown'} (ZMW ${p.amount}) - ${p.status}`).join('\n');
      return {
        text: `💳 **Payment Summary**\n\n• Total Payments: ${total}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Recent Payments:**\n${topText || 'No payments recorded'}`,
        data: payments
      };
    }
  },
  {
    keywords: ['owing', 'balance', 'bal', 'remaining', 'owed', 'pending payment'],
    handler: async (userId) => {
      const workers = await Worker.find();
      const balances = [];
      let totalOwed = 0;
      
      for (const w of workers) {
        const payments = await Payment.find({ worker: w._id, status: 'completed' });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        // Estimate earnings based on attendance
        const attendance = await require('../models/Attendance').find({ worker: w._id });
        const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
        const balance = totalEarned - totalPaid;
        if (balance !== 0) {
          balances.push({ name: w.name, earned: totalEarned, paid: totalPaid, balance });
          totalOwed += balance;
        }
      }
      
      const topText = balances.sort((a, b) => b.balance - a.balance).slice(0, 5)
        .map(w => `  - ${w.name}: Owing ZMW ${w.balance.toFixed(2)} (Earned: ${w.earned}, Paid: ${w.paid})`).join('\n');
      
      return {
        text: `⚖️ **Worker Balances (Owing)**\n\n• Total Owing to Workers: ZMW ${totalOwed.toFixed(2)}\n• Workers with Balance: ${balances.length}\n\n**Top Outstanding:**\n${topText || 'No outstanding balances'}`,
        data: balances
      };
    }
  },
  {
    keywords: ['construction company', 'what is construction', 'construction industry', 'contractor'],
    handler: async (userId) => {
      return {
        text: `🏗️ **What is a Construction Company?**

A construction company is a business entity that specializes in the planning, design, and execution of building and infrastructure projects.

**Key Services:**
• **General Contracting** – Manages entire projects from start to finish.
• **Subcontracting** – Specializes in specific trades (electrical, plumbing, etc.).
• **Design-Build** – Provides both design and construction services.
• **Construction Management** – Oversees projects for clients.

**Common Sectors:**
🏠 **Residential** – Houses, apartments, estates.
🏢 **Commercial** – Offices, retail spaces, hotels.
🏥 **Institutional** – Schools, hospitals, government buildings.
🛣️ **Infrastructure** – Roads, bridges, utilities, airports.

**In Zambia:**
• Companies must be registered with ERB (Engineering Registration Board).
• ZPPA regulates public procurement.
• Local content is encouraged in many projects.

**PURVEYOLS CMS** helps construction companies manage their projects, workers, finances, and procurement efficiently.`
      };
    }
  },
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
        text: `📦 **Procurement Summary**\n\n• Total Orders: ${total}\n• Pending: ${pending} (needs funding)\n• Funded: ${funded}\n• Purchased: ${purchased}\n• Total Items: ${totalItems}\n\n**Pending Orders:**\n${pendingText || 'No pending orders'}`,
        data: orders
      };
    }
  }
];

// ============================================================
// CONSTRUCTION KNOWLEDGE DATABASE
// ============================================================

const constructionKnowledge = [
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'subgrade', 'bearing capacity', 'pile', 'raft', 'strip footing'],
    response: `🏗️ **FOUNDATION DESIGN & SOIL ANALYSIS**

**Types of Foundations:**
• **Strip Footing** – For load-bearing walls, suitable for stable soils.
• **Raft Foundation** – For poor soils, spreads load across entire footprint.
• **Pile Foundation** – For very weak soils or high-rise buildings.
• **Pad Footing** – For individual columns.

**Soil Testing:**
• Conduct a **geotechnical investigation** before design.
• Key tests: Standard Penetration Test (SPT), Plate Load Test.
• Soil bearing capacity determines foundation type and depth.

**Best Practices:**
• Minimum depth: 1.5m for frost protection (Zambia: 1.0m is adequate).
• Include a **damp-proof course** (DPC) 150mm above ground.
• Reinforced concrete is standard (use 1:2:4 mix).
• For expansive soils (black cotton), use raft or piled foundations.

**Zambia Context:**
• Most soils in Lusaka are **lateritic** – suitable for strip footings.
• In Copperbelt, some areas have **expansive clays** – need raft or pile.`
  },
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
• Too much water = weak concrete.
• Use clean, potable water.

**Curing:**
• Minimum 7 days (keep wet).
• For high-strength: 14 days.
• Temperature affects curing – keep below 30°C if possible.

**Quality Control:**
• Cube tests: 150mm cubes tested at 7, 14, 28 days.
• Slump test: 75-100mm for normal work.`
  },
  {
    keywords: ['steel', 'reinforcement', 'rebar', 'tensile', 'column', 'beam'],
    response: `🔩 **REINFORCED CONCRETE DESIGN**

**Steel Reinforcement Guide:**
• Standard rebar grades: **Y12, Y16, Y20, Y25** (mm).
• Yield strength: 460 MPa (high tensile).
• Always use **high tensile** for structural members.

**Cover Requirements:**
| Element | Cover (mm) |
|---------|------------|
| Foundation | 50-75 |
| Columns | 40-50 |
| Beams | 40-50 |
| Slabs | 25-30 |

**Bending Rules:**
• Minimum bend diameter: 4x bar diameter.
• Lap length: 40-50 x bar diameter (compression).
• For tension: 50-60 x bar diameter.

**Inspection Checklist:**
✓ Correct bar sizes and grades.
✓ Proper cover with spacers.
✓ Correct lap lengths.
✓ Ties/welds secure.`
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves', 'harness', 'first aid'],
    response: `🦺 **CONSTRUCTION SAFETY MANAGEMENT**

**Mandatory PPE:**
✅ Hard hat (EN 397)
✅ Safety boots (steel toe, EN 20345)
✅ High-vis vest (EN 471)
✅ Gloves (EN 388)
✅ Safety glasses (EN 166)
✅ Harness (for work >2m height)

**Weekly Safety Checklist:**
☑️ PPE inspections.
☑️ Scaffolding stability.
☑️ Electrical cable condition.
☑️ Fire extinguisher presence.
☑️ First aid kit supplies.

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
⚠️ Machinery accidents.`
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing', 'valuation'],
    response: `💰 **CONSTRUCTION COST ESTIMATION**

**Cost Breakdown (Typical):**
| Category | % of Total |
|----------|------------|
| Materials | 40-50% |
| Labor | 20-30% |
| Equipment | 10-15% |
| Subcontracts | 10-15% |
| Overheads | 5-10% |
| Profit | 5-10% |

**Cost Per Square Meter (Zambia, 2025):**
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
💰 Use local materials.
💰 Reduce waste.
💰 Hire local labor.`
  },
  {
    keywords: ['project', 'management', 'planning', 'schedule', 'timeline', 'gantt', 'milestone'],
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
  {
    keywords: ['contract', 'agreement', 'tender', 'bid', 'procurement', 'negotiation'],
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
  {
    keywords: ['roofing', 'roof', 'truss', 'corrugated', 'tiles', 'insulation'],
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

**Installation Tips:**
✓ Start from eaves to ridge.
✓ Overlap: 1.5 corrugations (side), 150mm (end).
✓ Use pop-rivets or screws (not nails).
✓ Install flashing at valleys, ridges, and penetrations.`
  },
  {
    keywords: ['plumbing', 'drainage', 'pipe', 'water', 'sanitary', 'waste', 'septic'],
    response: `🚿 **PLUMBING & DRAINAGE SYSTEMS**

**Pipe Materials:**
• **UPVC** – for cold water, drainage (lightweight, cheap).
• **Copper** – for hot water (durable, expensive).
• **HDPE** – for underground, pressure (flexible).

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
        continue;
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

  // 3. Default fallback
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can help with:

📊 **System Data**
• "How many workers do we have?"
• "How much are we owing workers?"
• "What's our total budget?"
• "Show me pending funding requests"

🏗️ **Construction Knowledge**
• "What is a construction company?"
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"
• "What are the steps for quality control?"

💡 Be specific for better answers!`
  };
};

module.exports = { getAIResponse };
