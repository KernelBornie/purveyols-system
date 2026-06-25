const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const Subcontract = require('../models/Subcontract');

// ─── GET accountant stats report ──────────────────────────────
router.get('/accountant/stats', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include end of day

    // ─── Workers enrolled in period ──────────────────────────────
    const workersEnrolled = await Worker.countDocuments({
      enrolledAt: { $gte: start, $lte: end }
    });

    // ─── Projects created in period ──────────────────────────────
    const projectsCreated = await Project.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // ─── Payments completed in period ──────────────────────────────
    const payments = await Payment.find({
      paidAt: { $gte: start, $lte: end },
      status: 'completed'
    });
    const paymentsMade = payments.length;
    const totalReleased = payments.reduce((sum, p) => sum + p.amount, 0);

    // ─── Funding requests created in period ──────────────────────
    const fundingRequests = await FundingRequest.countDocuments({
      requestedAt: { $gte: start, $lte: end }
    });

    // ─── Procurement orders created in period ────────────────────
    const procurementOrders = await ProcurementOrder.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // ─── Subcontracts created in period ──────────────────────────
    const subcontracts = await Subcontract.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // ─── Total workers overall (active) ──────────────────────────
    const totalWorkers = await Worker.countDocuments({ status: 'active' });
    const totalProjects = await Project.countDocuments();

    res.json({
      period: { startDate, endDate },
      workersEnrolled,
      projectsCreated,
      paymentsMade,
      totalReleased,
      fundingRequests,
      procurementOrders,
      subcontracts,
      totalWorkers,
      totalProjects,
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;