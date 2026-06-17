const User = require('../models/User');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');
const Notification = require('../models/Notification');

// More comprehensive keyword mapping for system queries
const SYSTEM_QUERIES = [
  {
    keywords: ['workers', 'employee', 'staff', 'personnel', 'labor', 'labour'],
    type: 'workers',
    query: async (userId) => {
      const workers = await Worker.find().populate('enrolledBy', 'name');
      const total = workers.length;
      const active = workers.filter(w => w.status === 'active').length;
      const suspended = workers.filter(w => w.status === 'suspended').length;
      const inactive = workers.filter(w => w.status === 'inactive').length;
      const topText = workers.slice(0, 5).map(w => `  - ${w.name} (${w.nrc}) - ${w.status}`).join('\n');
      return {
        text: `📊 **Workers Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`,
        data: workers
      };
    }
  },
  {
    keywords: ['projects', 'project', 'building', 'construction site', 'site'],
    type: 'projects',
    query: async (userId) => {
      const projects = await Project.find().populate('manager createdBy', 'name');
      const total = projects.length;
      const active = projects.filter(p => p.status === 'active').length;
      const planning = projects.filter(p => p.status === 'planning').length;
      const completed = projects.filter(p => p.status === 'completed').length;
      const paused = projects.filter(p => p.status === 'paused').length;
      const topText = projects.filter(p => p.status === 'active' || p.status === 'planning').slice(0, 5)
        .map(p => `  - ${p.name} (${p.location}) - Budget: ${p.budget}`).join('\n');
      return {
        text: `📋 **Projects Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Active/Planning Projects:**\n${topText || 'No active projects'}`,
        data: projects
      };
    }
  },
  {
    keywords: ['budget', 'fund', 'funding', 'money', 'financial', 'amount', 'total amount', 'how much', 'budget on all'],
    type: 'funding',
    query: async (userId) => {
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
        text: `💰 **Financial Summary**\n\n📌 **Project Budgets:**\n• Total Budget: ZMW ${totalProjectBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n📌 **Funding Requests:**\n• Total Requested: ZMW ${totalFunding.toLocaleString()}\n• Pending: ZMW ${pendingAmount.toLocaleString()} (${pendingFunding.length} requests)\n• Approved: ZMW ${approvedAmount.toLocaleString()}\n\n📌 **Payments:**\n• Total Paid: ZMW ${totalPaid.toLocaleString()}\n• Number of Payments: ${payments.length}\n\n📌 **Overall:**\n• Total Budget + Funding: ZMW ${(totalProjectBudget + totalFunding).toLocaleString()}`,
        data: { projects, funding, payments }
      };
    }
  },
  {
    keywords: ['payment', 'paid', 'salary', 'wage', 'payments'],
    type: 'payments',
    query: async (userId) => {
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
    keywords: ['procurement', 'order', 'material', 'supplies', 'items', 'spare parts'],
    type: 'procurement',
    query: async (userId) => {
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
    type: 'boq',
    query: async (userId) => {
      const boqs = await BOQ.find().populate('project createdBy', 'name');
      const total = boqs.length;
      const submitted = boqs.filter(b => b.status === 'submitted').length;
      const approved = boqs.filter(b => b.status === 'approved').length;
      const draft = boqs.filter(b => b.status === 'draft').length;
      const totalItems = boqs.reduce((sum, b) => sum + (b.items?.length || 0), 0);
      const submittedText = boqs.filter(b => b.status === 'submitted').slice(0, 5)
        .map(b => `  - ${b.project?.name || 'N/A'} (${b.items?.length || 0} items)`).join('\n');
      return {
        text: `📋 **BOQ Summary**\n\n• Total BOQs: ${total}\n• Draft: ${draft}\n• Submitted: ${submitted} (awaiting approval)\n• Approved: ${approved}\n• Total Items: ${totalItems}\n\n**Pending BOQs:**\n${submittedText || 'No pending BOQs'}`,
        data: boqs
      };
    }
  },
  {
    keywords: ['subcontract', 'subcontractor', 'vendor', 'supplier', 'sub-contract'],
    type: 'subcontracts',
    query: async (userId) => {
      const subs = await Subcontract.find().populate('project createdBy', 'name');
      const total = subs.length;
      const active = subs.filter(s => s.status === 'active').length;
      const terminated = subs.filter(s => s.status === 'terminated').length;
      const totalAmount = subs.reduce((sum, s) => sum + s.amount, 0);
      const activeText = subs.filter(s => s.status === 'active').slice(0, 5)
        .map(s => `  - ${s.vendor} (${s.service}) - ZMW ${s.amount}`).join('\n');
      return {
        text: `🔧 **Subcontract Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Terminated: ${terminated}\n• Total Value: ZMW ${totalAmount.toLocaleString()}\n\n**Active Subcontracts:**\n${activeText || 'No active subcontracts'}`,
        data: subs
      };
    }
  },
  {
    keywords: ['balance', 'bal', 'remaining', 'owed', 'earnings'],
    type: 'balance',
    query: async (userId) => {
      const workers = await Worker.find();
      const balances = [];
      for (const w of workers) {
        const attendance = require('../models/Attendance').find({ worker: w._id });
        const payments = await Payment.find({ worker: w._id, status: 'completed' });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        // Estimate earnings based on daily rate and attendance (simplified)
        const earned = attendance.length * w.dailyRate || 0;
        const balance = earned - totalPaid;
        if (balance !== 0 || totalPaid > 0) {
          balances.push({ name: w.name, earned, paid: totalPaid, balance });
        }
      }
      const topText = balances.sort((a, b) => b.balance - a.balance).slice(0, 5)
        .map(w => `  - ${w.name}: Earned ZMW ${w.earned}, Paid ZMW ${w.paid}, Balance ZMW ${w.balance}`).join('\n');
      return {
        text: `⚖️ **Worker Balances**\n\n**Top Balances:**\n${topText || 'No balances found'}`,
        data: balances
      };
    }
  },
  {
    keywords: ['notification', 'alert', 'pending', 'unread'],
    type: 'notifications',
    query: async (userId) => {
      const notifications = await Notification.find({ user: userId, read: false }).sort({ createdAt: -1 });
      const total = notifications.length;
      const topText = notifications.slice(0, 5).map(n => `  - ${n.title}: ${n.message}`).join('\n');
      return {
        text: `🔔 **Pending Notifications**\n\n• Unread: ${total}\n\n**Recent:**\n${topText || 'No unread notifications'}`,
        data: notifications
      };
    }
  }
];

// General construction knowledge responses (more comprehensive)
const CONSTRUCTION_KNOWLEDGE = [
  {
    keywords: ['foundation', 'footing', 'base', 'ground', 'soil', 'subgrade'],
    response: "🏗️ **Foundation Guide**\n\n• Always conduct a soil test first (bearing capacity).\n• For most buildings: reinforced concrete strip footings.\n• Depth depends on soil type and building height.\n• Ensure proper drainage to prevent water pooling.\n• Recommended: consult a structural engineer for final design."
  },
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing'],
    response: "🧱 **Concrete Guide**\n\n• Standard mix: 1:2:4 (cement:sand:aggregate) – for general use.\n• Higher strength: 1:1.5:3 – for columns and beams.\n• Cure concrete for at least 7 days (keep moist).\n• Use quality cement – ZAMCEM, Larfarge, or Sika are reliable.\n• Test slump for workability (75-100mm is ideal)."
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves', 'hard hat'],
    response: "🦺 **Safety Requirements**\n\n• Mandatory PPE: Hard hat, safety boots, high-vis vest, gloves, safety glasses.\n• Daily safety briefings before work starts.\n• Report all incidents immediately (near misses too).\n• Weekly safety inspections required.\n• First aid kit must be accessible on site."
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing'],
    response: "💰 **Cost Estimation**\n\n• Residential: ZMW 3,500-5,500 per square meter.\n• Commercial: ZMW 4,500-7,500 per square meter.\n• Always include 10-15% contingency.\n• Get 3-5 quotes from suppliers and contractors.\n• Factor in transport, VAT, and professional fees."
  },
  {
    keywords: ['timeline', 'schedule', 'delay', 'completion', 'deadline', 'duration'],
    response: "⏱️ **Project Timeline**\n\n• Break down into phases: site prep, foundation, structure, finishing, handover.\n• Set realistic milestones (weekly checkpoints).\n• Track progress on a Gantt chart.\n• Allow 20% buffer for weather and material delays.\n• Hold weekly progress meetings with all stakeholders."
  },
  {
    keywords: ['quality', 'inspection', 'check', 'standard', 'compliance'],
    response: "✅ **Quality Control**\n\n• Inspect at every stage: foundation, structure, MEP, finishing.\n• Use checklists for consistency.\n• Test materials (concrete cubes, steel tensile tests).\n• Document everything – photos, reports, and test results.\n• PURVEYOLS follows international building standards."
  },
  {
    keywords: ['zambia', 'lusaka', 'copperbelt', 'local', 'zambian', 'zambia'],
    response: "🇿🇲 **Zambia Construction Context**\n\n• Use local materials to reduce costs (sand, aggregates, cement).\n• Follow Zambian building codes and regulations.\n• Engage local contractors and suppliers.\n• Plan for rainy season (November to March) – schedule outdoor work accordingly.\n• Consider solar solutions for energy efficiency."
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greeting', 'good morning', 'good afternoon', 'how are you'],
    response: "👋 Hello! I'm PURVEYOLS ASSISTANT AI, ready to help with:\n• System data (workers, projects, funding, payments)\n• Construction knowledge (foundations, concrete, safety, costs)\n• Project management and planning\n\nAsk me anything!"
  },
  {
    keywords: ['how', 'what', 'when', 'where', 'who', 'explain', 'tell me', 'show me'],
    response: "🤔 I can help with many things! Try asking:\n\n📊 **System Data:**\n'How many workers do we have?'\n'What's our total budget?'\n'Show me pending funding requests'\n'What are our project budgets?'\n\n🏗️ **Construction Knowledge:**\n'What's the best concrete mix?'\n'Tell me about foundation design'\n'What are safety requirements?'\n'How to estimate construction costs?'\n\n⚖️ **Financial:**\n'What's our total spending?'\n'Show me worker balances'\n'How much is pending for funding?'"
  }
];

// Main AI function
const getAIResponse = async (userQuestion, userId) => {
  const lower = userQuestion.toLowerCase().trim();
  console.log('🤖 AI Question:', userQuestion);
  let response = '';

  // 1. Check if it's a system question
  for (const handler of SYSTEM_QUERIES) {
    if (handler.keywords.some(kw => lower.includes(kw))) {
      console.log('🔍 Matched system query:', handler.type);
      try {
        const result = await handler.query(userId);
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

  // 2. Check if it's a construction knowledge question
  for (const item of CONSTRUCTION_KNOWLEDGE) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('📚 Matched construction knowledge:', item.keywords[0]);
      return {
        type: 'knowledge',
        text: item.response
      };
    }
  }

  // 3. Default fallback with suggestions
  console.log('❓ No match found – returning fallback');
  return {
    type: 'general',
    text: `🤖 **I'm PURVEYOLS ASSISTANT AI**\n\nI can help with:\n\n📊 **System Data**\n• Workers: "How many workers?" / "Show worker balances"\n• Projects: "List active projects" / "Project budgets"\n• Funding: "Show pending requests" / "Total funding"\n• Payments: "Recent payments" / "Total paid"\n• Procurement: "Pending orders" / "Materials ordered"\n\n🏗️ **Construction Knowledge**\n• Foundations, concrete, safety, costs\n• Project planning, timelines, quality control\n• Zambian construction context\n\nAsk me anything – I'm here to help!`
  };
};

module.exports = { getAIResponse };
