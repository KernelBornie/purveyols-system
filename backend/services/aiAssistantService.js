const User = require('../models/User');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');
const Attendance = require('../models/Attendance');

// ============================================================
// SYSTEM QUERY HANDLERS
// ============================================================

const systemHandlers = [
  {
    keywords: ['owing', 'owe', 'balance', 'bal', 'remaining', 'pending payment', 'how much are we owing', 'how much do we owe', 'worker balance'],
    handler: async (userId) => {
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
      
      const topText = balances.sort((a, b) => b.balance - a.balance).slice(0, 5)
        .map(w => `  - ${w.name}: Owing ZMW ${w.balance.toFixed(2)} (Earned: ${w.earned}, Paid: ${w.paid})`).join('\n');
      
      if (balances.length === 0) {
        return {
          text: `⚖️ **Worker Balances**\n\n✅ No outstanding balances! All workers are fully paid.\n\n📊 Total Earned: ZMW ${totalEarnedAll.toFixed(2)}\n📊 Total Paid: ZMW ${totalPaidAll.toFixed(2)}`
        };
      }
      
      return {
        text: `⚖️ **Worker Balances (Owing)**\n\n• Total Owing to Workers: ZMW ${totalOwed.toFixed(2)}\n• Workers with Balance: ${balances.length}\n• Total Earned by All Workers: ZMW ${totalEarnedAll.toFixed(2)}\n• Total Paid to All Workers: ZMW ${totalPaidAll.toFixed(2)}\n\n**Top Outstanding:**\n${topText || 'No outstanding balances'}`
      };
    }
  },
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
        text: `📊 **Workers Summary**\n\n• Total Workers: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`
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
        text: `📋 **Projects Summary**\n\n• Total Projects: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Active/Planning Projects:**\n${topText || 'No active projects'}`
      };
    }
  },
  {
    keywords: ['budget', 'fund', 'funding', 'money', 'financial', 'amount', 'total amount', 'how much money'],
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
        text: `💰 **Financial Summary**\n\n📌 **Project Budgets:**\n• Total Budget: ZMW ${totalProjectBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n📌 **Funding Requests:**\n• Total Requested: ZMW ${totalFunding.toLocaleString()}\n• Pending: ZMW ${pendingAmount.toLocaleString()} (${pendingFunding.length} requests)\n• Approved: ZMW ${approvedAmount.toLocaleString()}\n\n📌 **Payments:**\n• Total Paid: ZMW ${totalPaid.toLocaleString()}\n• Number of Payments: ${payments.length}`
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
        text: `💳 **Payment Summary**\n\n• Total Payments: ${total}\n• Total Amount: ZMW ${totalAmount.toLocaleString()}\n\n**Recent Payments:**\n${topText || 'No payments recorded'}`
      };
    }
  },
  {
    keywords: ['funding requests', 'approvals', 'pending requests', 'fund requests'],
    handler: async (userId) => {
      const funding = await FundingRequest.find().populate('project requestedBy', 'name');
      const pending = funding.filter(f => f.status === 'pending');
      const approved = funding.filter(f => f.status === 'approved');
      const rejected = funding.filter(f => f.status === 'rejected');
      const pendingText = pending.slice(0, 5).map(f => `  - ${f.project?.name} (ZMW ${f.amount}) - by ${f.requestedBy?.name}`).join('\n');
      return {
        text: `📌 **Funding Requests**\n\n• Total: ${funding.length}\n• Pending: ${pending.length}\n• Approved: ${approved.length}\n• Rejected: ${rejected.length}\n\n**Pending Requests:**\n${pendingText || 'No pending requests'}`
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
        text: `📦 **Procurement Summary**\n\n• Total Orders: ${total}\n• Pending: ${pending} (needs funding)\n• Funded: ${funded}\n• Purchased: ${purchased}\n• Total Items: ${totalItems}\n\n**Pending Orders:**\n${pendingText || 'No pending orders'}`
      };
    }
  }
];

// ============================================================
// CONSTRUCTION KNOWLEDGE
// ============================================================

const constructionKnowledge = [
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'pile', 'raft', 'strip footing'],
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
• Minimum depth: 1.0m (Zambia).
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

  // 3. Default fallback
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I can help with:

📊 **System Data**
• "How much are we owing workers?" – Shows worker balances
• "How many workers do we have?" – Worker count
• "What's our total budget?" – Financial summary
• "Show me pending funding requests" – Pending approvals

🏗️ **Construction Knowledge**
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"

💡 **Try asking a specific question!**`
  };
};

module.exports = { getAIResponse };
