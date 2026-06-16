const express = require('express');
const router = express.Router();
const BOQ = require('../models/BOQ');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const boqs = await BOQ.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(boqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const boq = new BOQ({ ...req.body, createdBy: req.user.id });
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(boq);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/submit', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    boq.status = 'submitted';
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    boq.status = 'approved';
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await BOQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
