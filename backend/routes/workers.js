const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Worker = require('../models/Worker');

// GET /api/workers/search?nrc=
router.get('/search', auth, async (req, res) => {
  try {
    const { nrc } = req.query;
    if (!nrc) return res.status(400).json({ message: 'NRC query parameter is required' });
    const worker = await Worker.findOne({ nrc: new RegExp(`^${nrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
      .populate('project', 'name')
      .populate('enrolledBy', 'name email role');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ worker });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/workers
router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('project', 'name')
      .populate('enrolledBy', 'name email role');
    res.json({ workers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/workers
router.post('/', auth, async (req, res) => {
  try {
    const worker = new Worker({ ...req.body, enrolledBy: req.user._id });
    await worker.save();
    await worker.populate('project', 'name');
    await worker.populate('enrolledBy', 'name email role');
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/workers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('project', 'name')
      .populate('enrolledBy', 'name email role');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/workers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('enrolledBy', 'name email role');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/workers/:id – director/engineer only, deactivate
router.delete('/:id', auth, roleCheck('director', 'engineer'), async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ message: 'Worker deactivated', worker });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
