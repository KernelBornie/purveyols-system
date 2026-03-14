const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Worker = require('../models/Worker');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const FundingRequest = require('../models/FundingRequest');
const SafetyReport = require('../models/SafetyReport');
const MaterialRequest = require('../models/MaterialRequest');

// GET /api/reports/summary – director/accountant/engineer
router.get('/summary', auth, roleCheck('director', 'accountant', 'engineer'), async (req, res) => {
  try {
    const [
      totalWorkers,
      activeWorkers,
      totalProjects,
      pendingFunding,
      totalPaymentsResult,
      openSafetyReports,
      pendingMaterialRequests
    ] = await Promise.all([
      Worker.countDocuments(),
      Worker.countDocuments({ status: 'active' }),
      Project.countDocuments(),
      FundingRequest.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      SafetyReport.countDocuments({ status: 'open' }),
      MaterialRequest.countDocuments({ status: 'pending' })
    ]);

    const paymentStats = totalPaymentsResult[0] || { total: 0, count: 0 };

    res.json({
      workers: { total: totalWorkers, active: activeWorkers },
      projects: { total: totalProjects },
      fundingRequests: { pending: pendingFunding },
      payments: { totalAmount: paymentStats.total, count: paymentStats.count },
      safetyReports: { open: openSafetyReports },
      materialRequests: { pending: pendingMaterialRequests }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
