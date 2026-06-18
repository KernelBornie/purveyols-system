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
// SYSTEM QUERY HANDLERS
// ============================================================

const systemHandlers = {
  workers: async () => {
    const workers = await Worker.find().populate('enrolledBy', 'name');
    const total = workers.length;
    const active = workers.filter(w => w.status === 'active').length;
    const suspended = workers.filter(w => w.status === 'suspended').length;
    const inactive = workers.filter(w => w.status === 'inactive').length;
    const details = workers.map(w => 
      `  • **${w.name}** | NRC: ${w.nrc} | Site: ${w.site || 'N/A'} | Rate: ZMW ${w.dailyRate || 0} | Status: ${w.status}`
    ).join('\n');
    return {
      text: `📊 **WORKERS SUMMARY**\n\n` +
        `**Overview:**\n` +
        `• Total Workers: **${total}**\n` +
        `• Active: ${active} | Suspended: ${suspended} | Inactive: ${inactive}\n\n` +
        `**Worker Details:**\n${details || 'No workers enrolled yet'}\n\n` +
        `💡 *Tip: Enroll new workers from the Workers page.*`
    };
  },
  
  balances: async () => {
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
    if (balances.length === 0) {
      return { text: `⚖️ **WORKER BALANCES**\n\n✅ **No outstanding balances!** All workers are fully paid.\n\n💡 *To create balances, check in workers from the Workers page.*` };
    }
    const details = balances.map(w => 
      `  • **${w.name}** | Owing: ZMW ${w.balance.toFixed(2)} | Earned: ZMW ${w.earned} | Paid: ZMW ${w.paid}`
    ).join('\n');
    return {
      text: `⚖️ **WORKER BALANCES (Owing)**\n\n` +
        `**Summary:**\n` +
        `• Total Owing: **ZMW ${totalOwed.toFixed(2)}**\n` +
        `• Workers with Balance: ${balances.length}\n\n` +
        `**Breakdown:**\n${details}\n\n` +
        `💡 *Pay workers from the Accountant Dashboard using Airtel Money.*`
    };
  },
  
  projects: async () => {
    const projects = await Project.find().populate('manager createdBy', 'name');
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const planning = projects.filter(p => p.status === 'planning').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const paused = projects.filter(p => p.status === 'paused').length;
    const details = projects.map(p => 
      `  • **${p.name}** | Location: ${p.location || 'N/A'} | Status: ${p.status} | Budget: ZMW ${p.budget || 0}`
    ).join('\n');
    return {
      text: `📋 **PROJECTS SUMMARY**\n\n` +
        `**Overview:**\n` +
        `• Total Projects: **${total}**\n` +
        `• Active: ${active} | Planning: ${planning} | Paused: ${paused} | Completed: ${completed}\n\n` +
        `**Project Details:**\n${details || 'No projects found'}\n\n` +
        `💡 *Create new projects from the Projects page.*`
    };
  },
  
  budget: async () => {
    const projects = await Project.find();
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const funding = await FundingRequest.find();
    const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
    const payments = await Payment.find({ status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const projectDetails = projects.map(p => `  • ${p.name}: ZMW ${p.budget?.toLocaleString() || 0}`).join('\n');
    return {
      text: `💰 **FINANCIAL SUMMARY**\n\n` +
        `**Project Budgets:**\n` +
        `• Total Budget: **ZMW ${totalBudget.toLocaleString()}**\n` +
        `• Number of Projects: ${projects.length}\n\n` +
        `**Breakdown:**\n${projectDetails || 'No projects'}\n\n` +
        `**Funding:**\n` +
        `• Total Funding Requests: ZMW ${totalFunding.toLocaleString()}\n\n` +
        `**Payments:**\n` +
        `• Total Paid to Workers: ZMW ${totalPaid.toLocaleString()}\n\n` +
        `💡 *Manage budgets from the Projects and Funding pages.*`
    };
  },
  
  funding: async () => {
    const funding = await FundingRequest.find().populate('project requestedBy', 'name');
    const total = funding.length;
    const pending = funding.filter(f => f.status === 'pending');
    const approved = funding.filter(f => f.status === 'approved');
    const rejected = funding.filter(f => f.status === 'rejected');
    const totalAmount = funding.reduce((sum, f) => sum + f.amount, 0);
    const details = funding.map(f => 
      `  • ${f.project?.name || 'N/A'} | ZMW ${f.amount} | Status: ${f.status} | By: ${f.requestedBy?.name || 'N/A'}`
    ).join('\n');
    return {
      text: `📌 **FUNDING REQUESTS**\n\n` +
        `**Overview:**\n` +
        `• Total Requests: **${total}**\n` +
        `• Pending: ${pending.length} | Approved: ${approved.length} | Rejected: ${rejected.length}\n` +
        `• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n` +
        `**Details:**\n${details || 'No funding requests'}\n\n` +
        `💡 *Approve/reject funding from the Funding page or Director Dashboard.*`
    };
  },
  
  payments: async () => {
    const payments = await Payment.find().populate('worker paidBy', 'name');
    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const recent = payments.slice(0, 5);
    const details = recent.map(p => 
      `  • ${p.worker?.name || 'Unknown'} | ZMW ${p.amount} | Status: ${p.status} | Paid by: ${p.paidBy?.name || 'N/A'}`
    ).join('\n');
    return {
      text: `💳 **PAYMENT SUMMARY**\n\n` +
        `**Overview:**\n` +
        `• Total Payments: **${total}**\n` +
        `• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n` +
        `**Recent Payments:**\n${details || 'No payments recorded'}\n\n` +
        `💡 *Process payments from the Accountant Dashboard.*`
    };
  },
  
  procurement: async () => {
    const orders = await ProcurementOrder.find().populate('project createdBy', 'name');
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const funded = orders.filter(o => o.status === 'funded').length;
    const purchased = orders.filter(o => o.status === 'purchased').length;
    const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    const details = orders.map(o => 
      `  • ${o.project?.name || 'N/A'} | ${o.items?.length || 0} items | Status: ${o.status} | By: ${o.createdBy?.name || 'N/A'}`
    ).join('\n');
    return {
      text: `📦 **PROCUREMENT SUMMARY**\n\n` +
        `**Overview:**\n` +
        `• Total Orders: **${total}**\n` +
        `• Pending: ${pending} | Funded: ${funded} | Purchased: ${purchased}\n` +
        `• Total Items: ${totalItems}\n\n` +
        `**Details:**\n${details || 'No procurement orders'}\n\n` +
        `💡 *Create orders from Procurement page. Fund orders from Accountant Dashboard.*`
    };
  },
  
  summary: async (userId) => {
    const [workers, projects, funding, payments, procurement] = await Promise.all([
      Worker.find(),
      Project.find(),
      FundingRequest.find(),
      Payment.find({ status: 'completed' }),
      ProcurementOrder.find()
    ]);
    return {
      text: `📊 **SYSTEM OVERVIEW**\n\n` +
        `👥 **Workers:** ${workers.length} (${workers.filter(w => w.status === 'active').length} active)\n` +
        `🏗️ **Projects:** ${projects.length} (${projects.filter(p => p.status === 'active').length} active)\n` +
        `💰 **Funding Requests:** ${funding.length} (${funding.filter(f => f.status === 'pending').length} pending)\n` +
        `💳 **Total Paid:** ZMW ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}\n` +
        `📦 **Procurement Orders:** ${procurement.length} (${procurement.filter(p => p.status === 'pending').length} pending)\n\n` +
        `✅ **All systems operational.**\n\n` +
        `💡 *Use the dashboard for detailed views and actions.*`
    };
  }
};

// ============================================================
// SYSTEM KEYWORDS
// ============================================================

const SYSTEM_KEYWORDS = {
  workers: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour', 'how many workers', 'worker count'],
  balances: ['owing', 'owe', 'balance', 'bal', 'remaining', 'pending payment', 'how much are we owing', 'how much do we owe'],
  projects: ['projects', 'project count', 'how many projects', 'active projects', 'planning projects'],
  budget: ['budget', 'total budget', 'project budget', 'how much budget', 'financial'],
  funding: ['funding', 'fund request', 'funding requests', 'pending funding', 'fund approvals'],
  payments: ['payments', 'paid', 'salary', 'wage', 'earnings', 'total paid'],
  procurement: ['procurement', 'order', 'material', 'supplies', 'items', 'spare parts'],
  summary: ['summary', 'overview', 'dashboard', 'what is happening', 'tell me everything', 'system status']
};

// ============================================================
// COMPREHENSIVE CONSTRUCTION KNOWLEDGE
// ============================================================

const constructionKnowledge = [
  {
    keywords: ['construction company', 'what is a construction company', 'construction industry', 'contractor', 'building company'],
    response: `🏗️ **WHAT IS A CONSTRUCTION COMPANY?**

**Definition:**
A construction company is a business entity that specializes in the planning, design, and execution of building and infrastructure projects. They manage the entire construction process from conception to completion.

**Types of Construction Companies:**

1. **General Contractors**
   • Manage entire projects from start to finish
   • Hire and coordinate subcontractors
   • Responsible for quality, budget, and timeline
   • Example: Building a school or hospital

2. **Specialty Contractors**
   • Focus on specific trades
   • Examples: Electrical, plumbing, roofing, painting
   • Subcontracted by general contractors

3. **Design-Build Firms**
   • Provide both design and construction services
   • Single point of contact for clients
   • Streamlined process

4. **Construction Management Firms**
   • Oversee projects for clients
   • Ensure quality and compliance
   • May not do actual construction work

**What Construction Companies Do:**

| Service | Description |
|---------|-------------|
| Project Planning | Feasibility studies, budgeting, scheduling |
| Design | Architectural and engineering design |
| Procurement | Sourcing materials and equipment |
| Construction | Site work, building, and installation |
| Quality Control | Inspections and testing |
| Project Management | Coordination and communication |

**Key Sectors:**

🏠 **Residential** – Houses, apartments, estates
🏢 **Commercial** – Offices, retail, hotels
🏥 **Institutional** – Schools, hospitals, government buildings
🛣️ **Infrastructure** – Roads, bridges, utilities

**Zambia Context:**
• Companies must be registered with ERB (Engineering Registration Board)
• ZPPA regulates public procurement
• Local content is encouraged in projects

💡 **Pro Tip:** When choosing a construction company, check their ERB registration and past project experience!`
  },
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'pile', 'raft'],
    response: `🏗️ **FOUNDATION DESIGN & SOIL ANALYSIS**

**Types of Foundations:**
• **Strip Footing** – For load-bearing walls, suitable for stable soils.
• **Raft Foundation** – For poor soils, spreads load across entire footprint.
• **Pile Foundation** – For very weak soils or high-rise buildings.
• **Pad Footing** – For individual columns.

**Soil Testing:**
• Standard Penetration Test (SPT) – Measures soil resistance
• Plate Load Test – Determines bearing capacity
• Atterberg Limits – Classifies soil type

**Best Practices:**
• Always consult a structural engineer
• Minimum depth: 1.0m (Zambia)
• Include damp-proof course (DPC) 150mm above ground
• Use reinforced concrete (1:2:4 mix)

💡 **Pro Tip:** Always conduct a soil test before designing foundations!`
  },
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing'],
    response: `🧱 **CONCRETE TECHNOLOGY**

**Concrete Mix Ratios:**
| Grade | Mix (C:S:A) | Use |
|-------|-------------|-----|
| C15   | 1:3:6       | Mass concrete, blinding |
| C20   | 1:2.5:5     | Ground floor slabs, walls |
| C25   | 1:2:4       | Columns, beams, structural slabs |
| C30   | 1:1.5:3     | High-strength structures |

**Water-Cement Ratio:**
• For C25: 0.45 – 0.50 (by weight)
• Too much water = weak concrete

**Curing:**
• Minimum: 7 days
• Recommended: 14 days for high-strength

💡 **Pro Tip:** Use clean, potable water and quality cement from ZAMCEM or Larfarge.`
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves'],
    response: `🦺 **CONSTRUCTION SAFETY MANAGEMENT**

**Mandatory PPE:**
✅ Hard hat (EN 397)
✅ Safety boots (steel toe, EN 20345)
✅ High-vis vest (EN 471)
✅ Gloves (EN 388)
✅ Safety glasses (EN 166)
✅ Harness (for work >2m height)

**Safety Checklist (Weekly):**
☑️ PPE inspections
☑️ Scaffolding stability
☑️ Electrical cable condition
☑️ Fire extinguisher presence
☑️ First aid kit supplies

💡 **Pro Tip:** Conduct daily safety briefings before work starts!`
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing'],
    response: `💰 **CONSTRUCTION COST ESTIMATION**

**Cost Per Square Meter (Zambia, 2026):**
• Residential (standard): ZMW 3,500-5,500/m²
• Residential (premium): ZMW 6,000-8,500/m²
• Commercial (standard): ZMW 4,500-6,500/m²
• Commercial (premium): ZMW 7,000-10,000/m²

**Cost Breakdown (Typical):**
• Materials: 40-50%
• Labor: 20-30%
• Equipment: 10-15%
• Subcontracts: 10-15%
• Overheads: 5-10%
• Profit: 5-10%

💡 **Pro Tip:** Always add 10-15% contingency for unexpected costs!`
  },
  {
    keywords: ['project management', 'planning', 'schedule', 'timeline', 'gantt'],
    response: `📅 **PROJECT MANAGEMENT & PLANNING**

**Project Lifecycle:**
1. Initiation – feasibility, approvals
2. Design – architect, engineer, BOQ
3. Procurement – materials, contractors
4. Construction – site works, quality control
5. Commissioning – testing, handover

**Milestone Checklist:**
☑️ 10%: Site cleared, foundations started
☑️ 30%: Ground floor complete
☑️ 50%: Structure complete
☑️ 70%: Services installed
☑️ 90%: Finishing
☑️ 100%: Handover

💡 **Pro Tip:** Use project management software like MS Project or Trello!`
  }
];

// ============================================================
// MAIN AI FUNCTION
// ============================================================

const getAIResponse = async (userQuestion, userId) => {
  const lower = userQuestion.toLowerCase().trim();
  console.log('🤖 AI Question:', userQuestion);

  // Check system queries
  for (const [key, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        console.log('🔍 Matched system query:', key);
        try {
          const handler = systemHandlers[key];
          if (handler) {
            const result = await handler(userId);
            return { type: 'system', text: result.text };
          }
        } catch (err) {
          console.error('System query error:', err);
          return { type: 'error', text: '⚠️ Error fetching system data. Please try again.' };
        }
      }
    }
  }

  // Check construction knowledge
  for (const item of constructionKnowledge) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('📚 Matched construction knowledge:', item.keywords[0]);
      return { type: 'knowledge', text: item.response };
    }
  }

  // Default
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can answer questions about:

📊 **System Data:**
• "How many workers do we have?" – Worker count with details
• "How much are we owing workers?" – Worker balances
• "What's our total budget?" – Financial summary
• "Show me pending funding requests" – Pending approvals
• "Tell me everything" – Full system overview

🏗️ **Construction Knowledge:**
• "What is a construction company?" – Full definition with types and services
• "What's the best foundation for clay soil?" – Detailed explanation
• "How to design a concrete mix for C25?" – Mix ratios
• "What are the safety requirements on site?" – PPE & safety
• "How to estimate construction costs?" – Cost breakdown
• "What are the project management phases?" – Project lifecycle

💡 **Ask a question and I'll give a detailed answer!**`
  };
};

module.exports = { getAIResponse };
