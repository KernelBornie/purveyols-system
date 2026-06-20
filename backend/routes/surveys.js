const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const auth = require('../middleware/auth');
const { calculateCutFill } = require('../services/surveyCalculator');

// ─── GET all surveys ──────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const surveys = await Survey.find()
      .populate('project', 'name')
      .populate('surveyor', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single survey ──────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('project')
      .populate('surveyor', 'name')
      .populate('createdBy', 'name');
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE survey ──────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const survey = new Survey({ ...req.body, createdBy: req.user.id });
    await survey.save();
    const populated = await Survey.findById(survey._id)
      .populate('project', 'name')
      .populate('surveyor', 'name')
      .populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE survey ──────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('surveyor', 'name')
      .populate('createdBy', 'name');
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE survey ──────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ message: 'Survey deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMPUTE cut/fill ──────────────────────────────────
router.post('/:id/calculate', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Survey not found' });
    const { cutVolume, fillVolume, netVolume } = calculateCutFill(
      survey.boundaryCoordinates,
      survey.contours
    );
    survey.cutVolume = cutVolume;
    survey.fillVolume = fillVolume;
    survey.netVolume = netVolume;
    await survey.save();
    res.json({ cutVolume, fillVolume, netVolume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;