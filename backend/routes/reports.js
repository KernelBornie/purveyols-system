const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const auth = require('../middleware/auth');

router.get('/accountant', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let startDate;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate = new Date(0);
    }
    const [workers, projects, payments, fundingRequests] = await Promise.all([
      Worker.find({ enrolledAt: { $gte: startDate } }),
      Project.find({ createdAt: { $gte: startDate } }),
      Payment.find({ paidAt: { $gte: startDate } }),
      FundingRequest.find({ requestedAt: { $gte: startDate } }),
    ]);
    const totalReleased = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({
      period,
      startDate,
      workersEnrolled: workers.length,
      projectsCreated: projects.length,
      payments: payments.length,
      totalAmountReleased: totalReleased,
      fundingRequests: fundingRequests.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
