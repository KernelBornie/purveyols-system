const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Logbook = require('../models/Logbook');

const logbookPopulatePaths = [
  { path: 'projectId', select: 'name' },
  { path: 'workerId', select: 'name email' },
  { path: 'project', select: 'name' },
  { path: 'worker', select: 'name email' },
  { path: 'workerEnrolled', select: 'name nrc' },
  { path: 'createdBy', select: 'name email' },
  { path: 'verifiedBy', select: 'name email' }
];

// GET /api/logbooks
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (['foreman', 'driver'].includes(req.user.role)) {
      filter = { createdBy: req.user._id };
    }
    const entries = await Logbook.find(filter).populate(logbookPopulatePaths);
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/logbooks
router.post('/', auth, async (req, res) => {
  try {
    const logbook = new Logbook({ ...req.body, createdBy: req.user._id });
    await logbook.save();
    await logbook.populate(logbookPopulatePaths);
    res.status(201).json(logbook);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/logbooks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const logbook = await Logbook.findById(req.params.id).populate(logbookPopulatePaths);
    if (!logbook) return res.status(404).json({ message: 'Logbook entry not found' });
    res.json(logbook);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/logbooks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.verified) {
      updateData.verifiedBy = req.user._id;
    }
    const logbook = await Logbook.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate(logbookPopulatePaths);
    if (!logbook) return res.status(404).json({ message: 'Logbook entry not found' });
    res.json(logbook);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
