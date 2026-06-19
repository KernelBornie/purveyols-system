const express = require('express');
const router = express.Router();
const Drawing = require('../models/Drawing');
const auth = require('../middleware/auth');
const { generateBOQFromDrawing } = require('../services/boqGenerator');

// ─── CRUD ────────────────────────────────────────────────

// GET all drawings (with filter)
router.get('/', auth, async (req, res) => {
  try {
    const { project, type, status } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (type) filter.type = type;
    if (status) filter.status = status;
    const drawings = await Drawing.find(filter)
      .populate('project', 'name')
      .populate('designer checker approver createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id)
      .populate('project')
      .populate('designer checker approver createdBy', 'name');
    if (!drawing) return res.status(404).json({ error: 'Not found' });
    res.json(drawing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', auth, async (req, res) => {
  try {
    const drawing = new Drawing({ ...req.body, createdBy: req.user.id });
    await drawing.save();
    const populated = await Drawing.findById(drawing._id)
      .populate('project', 'name')
      .populate('designer checker approver createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', auth, async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('designer checker approver createdBy', 'name');
    if (!drawing) return res.status(404).json({ error: 'Not found' });
    res.json(drawing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await Drawing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auto‑BOQ Generation ──────────────────────────────
router.post('/:id/generate-boq', auth, async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ error: 'Drawing not found' });
    const boq = await generateBOQFromDrawing(drawing);
    drawing.generatedBOQ = boq._id;
    await drawing.save();
    res.json({ message: 'BOQ generated', boq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
