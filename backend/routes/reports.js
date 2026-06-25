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
const BOQ = require('../models/BOQ');
const SafetyReport = require('../models/SafetyReport');

// ─── Helper: get common stats for any role ─────────────────────
const getCommonStats = async (start, end) => {
  const [workersEnrolled, projectsCreated, payments, fundingRequests, procurementOrders, subcontracts] = await Promise.all([
    Worker.countDocuments({ enrolledAt: { $gte: start, $lte: end } }),
    Project.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Payment.find({ paidAt: { $gte: start, $lte: end }, status: 'completed' }),
    FundingRequest.countDocuments({ requestedAt: { $gte: start, $lte: end } }),
    ProcurementOrder.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Subcontract.countDocuments({ createdAt: { $gte: start, $lte: end } }),
  ]);
  const paymentsMade = payments.length;
  const totalReleased = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    workersEnrolled,
    projectsCreated,
    paymentsMade,
    totalReleased,
    fundingRequests,
    procurementOrders,
    subcontracts,
    totalWorkers: await Worker.countDocuments({ status: 'active' }),
    totalProjects: await Project.countDocuments(),
  };
};

// ─── Accountant stats ────────────────────────────────────────────
router.get('/accountant/stats', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required.' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const stats = await getCommonStats(start, end);
    // Accountant also sees funding approval ratio
    const fundingApproved = await FundingRequest.countDocuments({ status: 'approved', requestedAt: { $gte: start, $lte: end } });
    const fundingRejected = await FundingRequest.countDocuments({ status: 'rejected', requestedAt: { $gte: start, $lte: end } });
    res.json({ ...stats, fundingApproved, fundingRejected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Director stats ──────────────────────────────────────────────
router.get('/director/stats', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required.' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const stats = await getCommonStats(start, end);
    // Director also sees BOQs and safety reports
    const boqsCreated = await BOQ.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const safetyReports = await SafetyReport.countDocuments({ createdAt: { $gte: start, $lte: end } });
    res.json({ ...stats, boqsCreated, safetyReports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Civil Engineer stats ────────────────────────────────────────
router.get('/engineer/stats', auth, authorize('admin', 'director', 'civil-engineer'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required.' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const stats = await getCommonStats(start, end);
    // Engineer also sees site plans and drawings
    const sitePlans = await SitePlan.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const drawings = await Drawing.countDocuments({ createdAt: { $gte: start, $lte: end } });
    res.json({ ...stats, sitePlans, drawings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;