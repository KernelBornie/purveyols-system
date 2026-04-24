const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { analyzeSite, generateBOQ, predictCost, analyzeRisk, estimateProgress } = require('../modules/ai-engine/engine.service');

// POST /api/ai/analyze-site
router.post('/analyze-site', auth, async (req, res) => {
  try {
    const { projectType, area, terrain, location, budget, estimatedCost, startDate, endDate, teamSize, pendingApprovals } = req.body;
    const result = analyzeSite({ projectType, area, terrain, location, budget, estimatedCost, startDate, endDate, teamSize, pendingApprovals });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
});

// POST /api/ai/cost-predict
router.post('/cost-predict', auth, async (req, res) => {
  try {
    const { boqTotalAmount, projectType, location, contingencyRate } = req.body;
    if (boqTotalAmount === undefined || boqTotalAmount === null) {
      return res.status(400).json({ message: 'boqTotalAmount is required' });
    }
    const result = predictCost({ boqTotalAmount, projectType, location, contingencyRate });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Cost prediction failed', error: err.message });
  }
});

// POST /api/ai/risk-analyze
router.post('/risk-analyze', auth, async (req, res) => {
  try {
    const { projectType, budget, estimatedCost, terrain, location, daysRemaining, teamSize, pendingApprovals } = req.body;
    const result = analyzeRisk({ projectType, budget, estimatedCost, terrain, location, daysRemaining, teamSize, pendingApprovals });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Risk analysis failed', error: err.message });
  }
});

// POST /api/ai/project-intelligence
router.post('/project-intelligence', auth, async (req, res) => {
  try {
    const { startDate, endDate, currentDate, completedTasks, totalTasks, budgetSpent, budgetTotal } = req.body;
    const result = estimateProgress({ startDate, endDate, currentDate, completedTasks, totalTasks, budgetSpent, budgetTotal });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Project intelligence failed', error: err.message });
  }
});

// POST /api/ai/generate-boq
router.post('/generate-boq', auth, async (req, res) => {
  try {
    const { projectType, area, terrain, location } = req.body;
    const result = generateBOQ({ projectType, area, terrain, location });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'BOQ generation failed', error: err.message });
  }
});

module.exports = router;
