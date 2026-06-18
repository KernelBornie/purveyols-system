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
// SYSTEM QUERY DETECTION – EXACT PHRASE MATCHING
// ============================================================

// Keywords that trigger system data queries
const SYSTEM_KEYWORDS = {
  workers: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour', 'how many workers', 'worker count'],
  balances: ['owing', 'owe', 'balance', 'bal', 'remaining', 'pending payment', 'how much are we owing', 'how much do we owe', 'worker balance'],
  projects: ['projects', 'project count', 'how many projects', 'active projects', 'planning projects'],
  budget: ['budget', 'total budget', 'project budget', 'how much budget', 'financial'],
  funding: ['funding', 'fund request', 'funding requests', 'pending funding', 'fund approvals'],
  payments: ['payments', 'paid', 'salary', 'wage', 'earnings', 'total paid'],
  procurement: ['procurement', 'order', 'material', 'supplies', 'items', 'spare parts'],
  boq: ['boq', 'bill of quantities', 'estimate', 'quantities'],
  subcontracts: ['subcontract', 'subcontractor', 'vendor', 'supplier'],
  notifications: ['notification', 'alert', 'unread', 'pending alerts'],
  summary: ['summary', 'overview', 'dashboard', 'what is happening', 'tell me everything', 'system status']
};

// ============================================================
// SYSTEM QUERY HANDLERS
// ============================================================

const handleWorkers = async () => {
  const workers = await Worker.find().populate('enrolledBy', 'name');
  const total = workers.length;
  const active = workers.filter(w => w.status === 'active').length;
  const suspended = workers.filter(w => w.status === 'suspended').length;
  const inactive = workers.filter(w => w.status === 'inactive').length;
  const topText = workers.slice(0, 5).map(w => `  - ${w.name} (${w.nrc}) - ${w.status}`).join('\n');
  return `📊 **Workers Summary**\n\n• Total Workers: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`;
};

const handleBalances = async () => {
  const workers = await Worker.find();
  const balances = [];
  let totalOwed = 0;
  let totalEarnedAll = 0;
  let totalPaidAll = 0;
  
  for (const w of workers) {
    const payments = await Payment.find({ worker: w._id, status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const attendance = await Attendance.find({ worker: w._id });
    const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
    const balance = totalEarned - totalPaid;
    totalEarnedAll += totalEarned;
    totalPaidAll += totalPaid;
    if (balance !== 0) {
      balances.push({ name: w.name, earned: totalEarned, paid: totalPaid, balance });
      totalOwed += balance;
    }
  }
  
  if (balances.length === 0) {
    return `⚖️ **Worker Balances**\n\n✅ No outstanding balances! All workers are fully paid.\n\n📊 Total Earned: ZMW ${totalEarnedAll.toFixed(2)}\n📊 Total Paid: ZMW ${totalPaidAll.toFixed(2)}`;
  }
  
  const topText = balances.slice(0, 5).map(w => `  - ${w.name}: Owing ZMW ${w.balance.toFixed(2)}`).join('\n');
  return `⚖️ **Worker Balances (Owing)**\n\n• Total Owing: ZMW ${totalOwed.toFixed(2)}\n• Workers with Balance: ${balances.length}\n\n**Top Outstanding:**\n${topText || 'No outstanding balances'}`;
};

const handleProjects = async () => {
  const projects = await Project.find().populate('manager createdBy', 'name');
  const total = projects.length;
  const active = projects.filter(p => p.status === 'active').length;
  const planning = projects.filter(p => p.status === 'planning').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const paused = projects.filter(p => p.status === 'paused').length;
  const topText = projects.slice(0, 5).map(p => `  - ${p.name} (${p.location}) - Budget: ${p.budget}`).join('\n');
  return `📋 **Projects Summary**\n\n• Total Projects: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Projects:**\n${topText || 'No projects found'}`;
};

const handleBudget = async () => {
  const projects = await Project.find();
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const funding = await FundingRequest.find();
  const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
  const payments = await Payment.find({ status: 'completed' });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return `💰 **Financial Summary**\n\n• Total Project Budget: ZMW ${totalBudget.toLocaleString()}\n• Total Funding Requests: ZMW ${totalFunding.toLocaleString()}\n• Total Paid to Workers: ZMW ${totalPaid.toLocaleString()}\n• Number of Projects: ${projects.length}`;
};

const handleFunding = async () => {
  const funding = await FundingRequest.find().populate('project requestedBy', 'name');
  const total = funding.length;
  const pending = funding.filter(f => f.status === 'pending');
  const approved = funding.filter(f => f.status === 'approved');
  const rejected = funding.filter(f => f.status === 'rejected');
  const totalAmount = funding.reduce((sum, f) => sum + f.amount, 0);
  const pendingText = pending.slice(0, 5).map(f => `  - ${f.project?.name} (ZMW ${f.amount}) - by ${f.requestedBy?.name}`).join('\n');
  return `📌 **Funding Requests**\n\n• Total: ${total}\n• Pending: ${pending.length}\n• Approved: ${approved.length}\n• Rejected: ${rejected.length}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Pending Requests:**\n${pendingText || 'No pending requests'}`;
};

const handlePayments = async () => {
  const payments = await Payment.find().populate('worker paidBy', 'name');
  const total = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const recent = payments.slice(0, 5);
  const topText = recent.map(p => `  - ${p.worker?.name || 'Unknown'} (ZMW ${p.amount})`).join('\n');
  return `💳 **Payment Summary**\n\n• Total Payments: ${total}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Recent Payments:**\n${topText || 'No payments recorded'}`;
};

const handleProcurement = async () => {
  const orders = await ProcurementOrder.find().populate('project createdBy', 'name');
  const total = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const funded = orders.filter(o => o.status === 'funded').length;
  const purchased = orders.filter(o => o.status === 'purchased').length;
  const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  const pendingText = orders.filter(o => o.status === 'pending').slice(0, 5)
    .map(o => `  - ${o.project?.name || 'N/A'} (${o.items?.length || 0} items)`).join('\n');
  return `📦 **Procurement Summary**\n\n• Total Orders: ${total}\n• Pending: ${pending}\n• Funded: ${funded}\n• Purchased: ${purchased}\n• Total Items: ${totalItems}\n\n**Pending Orders:**\n${pendingText || 'No pending orders'}`;
};

const handleBOQ = async () => {
  const boqs = await BOQ.find().populate('project createdBy', 'name');
  const total = boqs.length;
  const submitted = boqs.filter(b => b.status === 'submitted').length;
  const approved = boqs.filter(b => b.status === 'approved').length;
  const draft = boqs.filter(b => b.status === 'draft').length;
  const totalItems = boqs.reduce((sum, b) => sum + (b.items?.length || 0), 0);
  return `📋 **BOQ Summary**\n\n• Total BOQs: ${total}\n• Draft: ${draft}\n• Submitted: ${submitted}\n• Approved: ${approved}\n• Total Items: ${totalItems}`;
};

const handleSubcontracts = async () => {
  const subs = await Subcontract.find().populate('project createdBy', 'name');
  const total = subs.length;
  const active = subs.filter(s => s.status === 'active').length;
  const terminated = subs.filter(s => s.status === 'terminated').length;
  const totalAmount = subs.reduce((sum, s) => sum + s.amount, 0);
  const topText = subs.filter(s => s.status === 'active').slice(0, 5)
    .map(s => `  - ${s.vendor} (${s.service}) - ZMW ${s.amount}`).join('\n');
  return `🔧 **Subcontract Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Terminated: ${terminated}\n• Total Value: ZMW ${totalAmount.toLocaleString()}\n\n**Active Subcontracts:**\n${topText || 'No active subcontracts'}`;
};

const handleNotifications = async (userId) => {
  const notifications = await Notification.find({ user: userId, read: false }).sort({ createdAt: -1 });
  const total = notifications.length;
  const topText = notifications.slice(0, 5).map(n => `  - ${n.title}: ${n.message}`).join('\n');
  return `🔔 **Notifications**\n\n• Unread: ${total}\n\n**Recent:**\n${topText || 'No unread notifications'}`;
};

const handleSummary = async (userId) => {
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
  
  return `📊 **System Overview**\n\n👥 **Workers:** ${totalWorkers}\n🏗️ **Projects:** ${totalProjects} (${activeProjects} active)\n💰 **Funding Requests:** ${funding.length} (${pendingFunding} pending)\n💳 **Total Paid:** ZMW ${totalPaid.toLocaleString()}\n📦 **Procurement Orders:** ${procurement.length} (${pendingProcurement} pending)\n\n✅ All systems operational.`;
};

// Map system keywords to handlers
const systemHandlers = {
  workers: handleWorkers,
  balances: handleBalances,
  projects: handleProjects,
  budget: handleBudget,
  funding: handleFunding,
  payments: handlePayments,
  procurement: handleProcurement,
  boq: handleBOQ,
  subcontracts: handleSubcontracts,
  notifications: handleNotifications,
  summary: handleSummary
};

// ============================================================
// CONSTRUCTION KNOWLEDGE
// ============================================================

const constructionKnowledge = [
  {
    keywords: ['foundation', 'footing', 'soil', 'pile', 'raft'],
    response: `🏗️ **FOUNDATION DESIGN & SOIL ANALYSIS**

**Types of Foundations:**
• **Strip Footing** – For load-bearing walls, suitable for stable soils.
• **Raft Foundation** – For poor soils, spreads load across entire footprint.
• **Pile Foundation** – For very weak soils or high-rise buildings.
• **Pad Footing** – For individual columns.

**Best Practices:**
• Conduct a geotechnical investigation before design.
• Minimum depth: 1.0m (Zambia climate).
• Include a damp-proof course (DPC) 150mm above ground.
• Use reinforced concrete (1:2:4 mix).`
  },
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing'],
    response: `🧱 **CONCRETE TECHNOLOGY**

**Concrete Mix Ratios:**
| Grade | Mix (C:S:A) | Use |
|-------|-------------|-----|
| C15   | 1:3:6       | Mass concrete |
| C20   | 1:2.5:5     | Ground floor |
| C25   | 1:2:4       | Columns, beams |
| C30   | 1:1.5:3     | High-strength |

**Curing:** Minimum 7 days (keep wet).
**Water-Cement Ratio:** 0.45-0.50 for C25.`
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves'],
    response: `🦺 **CONSTRUCTION SAFETY**

**Mandatory PPE:**
✅ Hard hat (EN 397)
✅ Safety boots (steel toe)
✅ High-vis vest (EN 471)
✅ Gloves (EN 388)
✅ Safety glasses (EN 166)
✅ Harness (for work >2m height)

**Weekly Safety Checklist:**
☑️ PPE inspections
☑️ Scaffolding stability
☑️ Electrical cable condition
☑️ Fire extinguisher presence
☑️ First aid kit supplies`
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing'],
    response: `💰 **COST ESTIMATION**

**Cost Per Square Meter (Zambia, 2026):**
• Residential (standard): ZMW 3,500-5,500/m²
• Residential (premium): ZMW 6,000-8,500/m²
• Commercial (standard): ZMW 4,500-6,500/m²
• Commercial (premium): ZMW 7,000-10,000/m²

**Contingency:** 10-15% for unexpected costs.`
  },
  {
    keywords: ['project management', 'planning', 'schedule', 'timeline', 'gantt'],
    response: `📅 **PROJECT MANAGEMENT**

**Project Phases:**
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
☑️ 100%: Handover`
  },
  {
    keywords: ['plumbing', 'drainage', 'pipe', 'water', 'septic'],
    response: `🚿 **PLUMBING & DRAINAGE**

**Pipe Materials:**
• **UPVC** – cold water, drainage (cheap)
• **Copper** – hot water (durable)
• **HDPE** – underground, pressure (flexible)

**Septic Tank Design:**
• Size based on number of users
• Standard: 1.5-2.5m deep, 2-4m long
• Soakaway: 1m from tank, gravel filled
• Empty every 2-5 years`
  },
  {
    keywords: ['electrical', 'wiring', 'cable', 'circuit', 'lighting'],
    response: `⚡ **ELECTRICAL SYSTEMS**

**Cable Sizing Guide:**
| Application | Cable Size | Breaker |
| Lighting | 1.5mm² | 6A |
| Power (sockets) | 2.5mm² | 16A |
| Cooker | 6mm² | 32A |
| AC unit | 4mm² | 20A |
| Main supply | 16mm² | 63A |

**Zambia Context:** ZESCO supply: 230V single phase, 400V three phase.`
  },
  {
    keywords: ['roofing', 'roof', 'truss', 'corrugated', 'tiles'],
    response: `🏠 **ROOFING SYSTEMS**

**Materials:**
| Type | Lifespan | Cost |
| Corrugated iron | 15-20 years | Low |
| Colorbond | 20-30 years | Medium |
| Clay tiles | 50+ years | High |
| Concrete tiles | 40-50 years | Medium |

**Installation Tips:**
✓ Start from eaves to ridge
✓ Overlap: 1.5 corrugations (side), 150mm (end)
✓ Use pop-rivets or screws (not nails)`
  }
];

// ============================================================
// MAIN AI FUNCTION
// ============================================================

const getAIResponse = async (userQuestion, userId) => {
  const lower = userQuestion.toLowerCase().trim();
  console.log('🤖 AI Question:', userQuestion);

  // 1. CHECK SYSTEM QUERIES FIRST
  for (const [key, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        console.log('🔍 Matched system query:', key, 'keyword:', keyword);
        try {
          const handler = systemHandlers[key];
          if (handler) {
            let result;
            if (key === 'notifications' || key === 'summary') {
              result = await handler(userId);
            } else {
              result = await handler();
            }
            return {
              type: 'system',
              text: result,
              data: null
            };
          }
        } catch (err) {
          console.error('System query error:', err);
          return {
            type: 'error',
            text: '⚠️ I encountered an error fetching system data. Please try again.'
          };
        }
      }
    }
  }

  // 2. CHECK CONSTRUCTION KNOWLEDGE
  for (const item of constructionKnowledge) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('📚 Matched construction knowledge:', item.keywords[0]);
      return {
        type: 'knowledge',
        text: item.response
      };
    }
  }

  // 3. DEFAULT FALLBACK
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can answer questions about:

📊 **System Data (Ask these exact questions):**
• "How many workers do we have?" – Worker count
• "How much are we owing workers?" – Worker balances
• "What's our total budget?" – Financial summary
• "Show me pending funding requests" – Pending approvals
• "What's the project status?" – Project overview
• "Tell me everything" – System summary

🏗️ **Construction Knowledge:**
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"
• "What are the project management phases?"

💡 **Try asking one of the exact questions above!**`
  };
};

module.exports = { getAIResponse };
