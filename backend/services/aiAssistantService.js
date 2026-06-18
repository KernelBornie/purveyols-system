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
// SYSTEM QUERY HANDLERS
// ============================================================

const systemHandlers = [
  {
    keywords: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour', 'how many workers'],
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
    keywords: ['projects', 'project', 'building', 'construction site', 'site', 'how many projects'],
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
      const approvedFunding = funding.filter(f => f.status === 'approved');
      const approvedAmount = approvedFunding.reduce((sum, f) => sum + f.amount, 0);
      const payments = await Payment.find({ status: 'completed' });
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        text: `💰 **Financial Summary**\n\n📌 **Project Budgets:**\n• Total Budget: ZMW ${totalProjectBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n📌 **Funding Requests:**\n• Total Requested: ZMW ${totalFunding.toLocaleString()}\n• Pending: ZMW ${pendingAmount.toLocaleString()} (${pendingFunding.length} requests)\n• Approved: ZMW ${approvedAmount.toLocaleString()}\n\n📌 **Payments:**\n• Total Paid: ZMW ${totalPaid.toLocaleString()}\n• Number of Payments: ${payments.length}`,
        data: { projects, funding, payments }
      };
    }
  },
  {
    keywords: ['payments', 'paid', 'salary', 'wage', 'earnings', 'pay', 'released'],
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
    keywords: ['owing', 'balance', 'bal', 'remaining', 'owed', 'pending payment', 'how much are we owing', 'how much do we owe'],
    handler: async (userId) => {
      const workers = await Worker.find();
      const balances = [];
      let totalOwed = 0;
      let totalEarnedAll = 0;
      let totalPaidAll = 0;
      
      for (const w of workers) {
        const payments = await Payment.find({ worker: w._id, status: 'completed' });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const attendance = await require('../models/Attendance').find({ worker: w._id });
        const totalEarned = attendance.reduce((sum, a) => sum + a.rate, 0);
        const balance = totalEarned - totalPaid;
        totalEarnedAll += totalEarned;
        totalPaidAll += totalPaid;
        if (balance !== 0) {
          balances.push({ name: w.name, earned: totalEarned, paid: totalPaid, balance });
          totalOwed += balance;
        }
      }
      
      const topText = balances.sort((a, b) => b.balance - a.balance).slice(0, 5)
        .map(w => `  - ${w.name}: Owing ZMW ${w.balance.toFixed(2)} (Earned: ${w.earned}, Paid: ${w.paid})`).join('\n');
      
      return {
        text: `⚖️ **Worker Balances (Owing)**\n\n• Total Owing to Workers: ZMW ${totalOwed.toFixed(2)}\n• Workers with Balance: ${balances.length}\n• Total Earned by All Workers: ZMW ${totalEarnedAll.toFixed(2)}\n• Total Paid to All Workers: ZMW ${totalPaidAll.toFixed(2)}\n\n**Top Outstanding:**\n${topText || 'No outstanding balances'}`,
        data: balances
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
  },
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
        text: `📋 **BOQ Summary**\n\n• Total BOQs: ${total}\n• Draft: ${draft}\n• Submitted: ${submitted} (awaiting approval)\n• Approved: ${approved}\n• Total Items: ${totalItems}`,
        data: boqs
      };
    }
  },
  {
    keywords: ['subcontract', 'subcontractor', 'vendor', 'supplier', 'sub-contract'],
    handler: async (userId) => {
      const subs = await Subcontract.find().populate('project createdBy', 'name');
      const total = subs.length;
      const active = subs.filter(s => s.status === 'active').length;
      const terminated = subs.filter(s => s.status === 'terminated').length;
      const totalAmount = subs.reduce((sum, s) => sum + s.amount, 0);
      return {
        text: `🔧 **Subcontract Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Terminated: ${terminated}\n• Total Value: ZMW ${totalAmount.toLocaleString()}`,
        data: subs
      };
    }
  },
  {
    keywords: ['funding requests', 'approvals', 'pending requests'],
    handler: async (userId) => {
      const funding = await FundingRequest.find().populate('project requestedBy', 'name');
      const pending = funding.filter(f => f.status === 'pending');
      const approved = funding.filter(f => f.status === 'approved');
      const rejected = funding.filter(f => f.status === 'rejected');
      const pendingText = pending.slice(0, 5).map(f => `  - ${f.project?.name} (ZMW ${f.amount}) - by ${f.requestedBy?.name}`).join('\n');
      return {
        text: `📌 **Funding Requests**\n\n• Total: ${funding.length}\n• Pending: ${pending.length}\n• Approved: ${approved.length}\n• Rejected: ${rejected.length}\n\n**Pending Requests:**\n${pendingText || 'No pending requests'}`,
        data: funding
      };
    }
  }
];

// ============================================================
// CONSTRUCTION KNOWLEDGE (Complex)
// ============================================================

const constructionKnowledge = [
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'bearing capacity', 'pile', 'raft'],
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
• For expansive soils (black cotton), use raft or piled foundations.`
  },
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing'],
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

**Curing:**
• Minimum 7 days (keep wet).
• For high-strength: 14 days.`
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves'],
    response: `🦺 **CONSTRUCTION SAFETY**

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
☑️ First aid kit supplies.`
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing'],
    response: `💰 **COST ESTIMATION**

**Cost Per Square Meter (Zambia, 2026):**
• Residential (standard): ZMW 3,500-5,500/m²
• Residential (premium): ZMW 6,000-8,500/m²
• Commercial (standard): ZMW 4,500-6,500/m²
• Commercial (premium): ZMW 7,000-10,000/m²

**Contingency:**
• 10-15% for unexpected costs.
• 5% for design changes.
• 5% for price fluctuations.`
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
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"

💡 **Try asking a specific question!**`
  };
};

module.exports = { getAIResponse };
