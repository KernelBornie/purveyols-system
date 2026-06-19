const express = require('express');
const router = express.Router();
const SitePlan = require('../models/SitePlan');
const auth = require('../middleware/auth');

// GET all site plans
router.get('/', auth, async (req, res) => {
  try {
    const plans = await SitePlan.find().populate('project', 'name').populate('createdBy', 'name');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await SitePlan.findById(req.params.id).populate('project', 'name').populate('createdBy', 'name');
    if (!plan) return res.status(404).json({ error: 'Not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', auth, async (req, res) => {
  try {
    const plan = new SitePlan({ ...req.body, createdBy: req.user.id });
    await plan.save();
    const populated = await SitePlan.findById(plan._id).populate('project', 'name').populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
  try {
    const plan = await SitePlan.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name');
    if (!plan) return res.status(404).json({ error: 'Not found' });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await SitePlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
