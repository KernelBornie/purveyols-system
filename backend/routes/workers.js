const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find().populate('enrolledBy', 'name role');
    res.json(workers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const worker = new Worker({ ...req.body, enrolledBy: req.user.id });
    await worker.save();
    const populated = await Worker.findById(worker._id).populate('enrolledBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('enrolledBy', 'name role');
    res.json(worker);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
