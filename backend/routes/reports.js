const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const auth = require('../middleware/auth');

// Accountant dashboard stats with date range
router.get('/accountant/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [workers, projects, payments, fundingRequests, procurementOrders, boqs] = await Promise.all([
      Worker.find(filter),
      Project.find(filter),
      Payment.find({ ...filter, status: 'completed' }),
      FundingRequest.find(filter),
      ProcurementOrder.find(filter),
      BOQ.find(filter),
    ]);

    const totalReleased = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingFunding = fundingRequests.filter(f => f.status === 'pending').length;
    const pendingBOQs = boqs.filter(b => b.status === 'draft' || b.status === 'submitted').length;

    // Spending by project
    const projectSpending = {};
    payments.forEach(p => {
      if (p.project) {
        const key = p.project.toString();
        projectSpending[key] = (projectSpending[key] || 0) + p.amount;
      }
    });

    // Payment trends (daily)
    const paymentTrends = {};
    payments.forEach(p => {
      const date = p.paidAt ? p.paidAt.toISOString().split('T')[0] : 'unknown';
      paymentTrends[date] = (paymentTrends[date] || 0) + p.amount;
    });

    // Top workers by earnings
    const workerEarnings = {};
    payments.forEach(p => {
      if (p.worker) {
        const key = p.worker.toString();
        workerEarnings[key] = (workerEarnings[key] || 0) + p.amount;
      }
    });

    res.json({
      workers: workers.length,
      projects: projects.length,
      payments: payments.length,
      fundingRequests: fundingRequests.length,
      totalReleased,
      pendingFunding,
      pendingBOQs,
      projectSpending,
      paymentTrends,
      workerEarnings,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Funding approval ratio
router.get('/accountant/approval-ratio', auth, async (req, res) => {
  try {
    const funding = await FundingRequest.find();
    const pending = funding.filter(f => f.status === 'pending').length;
    const approved = funding.filter(f => f.status === 'approved').length;
    const rejected = funding.filter(f => f.status === 'rejected').length;
    res.json({ pending, approved, rejected, total: funding.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pending items count (for notifications)
router.get('/accountant/pending-count', auth, async (req, res) => {
  try {
    const [funding, boqs, procurement] = await Promise.all([
      FundingRequest.find({ status: 'pending' }),
      BOQ.find({ status: { $in: ['draft', 'submitted'] } }),
      ProcurementOrder.find({ status: { $in: ['draft', 'pending'] } }),
    ]);
    res.json({
      pendingFunding: funding.length,
      pendingBOQs: boqs.length,
      pendingProcurement: procurement.length,
      total: funding.length + boqs.length + procurement.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
