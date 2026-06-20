const express = require('express');
const router = express.Router();
const ProjectPlan = require('../models/ProjectPlan');
const auth = require('../middleware/auth');

// GET all plans for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const plan = await ProjectPlan.findOne({ project: req.params.projectId })
      .populate('tasks.assignedTo', 'name')
      .populate('createdBy', 'name');
    res.json(plan || { project: req.params.projectId, tasks: [], milestones: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE or UPDATE a plan
router.post('/', auth, async (req, res) => {
  try {
    let plan = await ProjectPlan.findOne({ project: req.body.project });
    if (plan) {
      // Update existing
      plan.tasks = req.body.tasks || plan.tasks;
      plan.milestones = req.body.milestones || plan.milestones;
      plan.baselineStart = req.body.baselineStart || plan.baselineStart;
      plan.baselineEnd = req.body.baselineEnd || plan.baselineEnd;
      plan.updatedAt = Date.now();
    } else {
      plan = new ProjectPlan({ ...req.body, createdBy: req.user.id });
    }
    await plan.save();
    const populated = await ProjectPlan.findById(plan._id)
      .populate('tasks.assignedTo', 'name')
      .populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a plan (soft remove tasks/milestones)
router.delete('/:id', auth, async (req, res) => {
  try {
    await ProjectPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;