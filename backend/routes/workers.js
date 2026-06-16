const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const workers = await Worker.find()
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.json(workers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, nrc, phone, dailyRate, site, project } = req.body;
    const worker = new Worker({ name, nrc, phone, dailyRate, site, project, enrolledBy: req.user.id });
    await worker.save();
    const populated = await Worker.findById(worker._id)
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('enrolledBy', 'name role')
      .populate('project', 'name');
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
