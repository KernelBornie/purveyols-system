const express = require('express');
const router = express.Router();
const BOQ = require('../models/BOQ');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const boqs = await BOQ.find().populate('project createdBy');
    res.json(boqs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const boq = new BOQ({ ...req.body, createdBy: req.user.id });
    await boq.save();
    const populated = await BOQ.findById(boq._id).populate('project createdBy');
    // Notify director (and maybe accountant)
    const directors = await User.find({ role: 'director' });
    for (let director of directors) {
      await createNotification(
        director._id,
        'boq_shared',
        'New BOQ Created',
        `${req.user.name} created a BOQ for ${boq.project?.name || 'project'}`,
        `/boq/${boq._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const boq = await BOQ.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('project createdBy');
    res.json(boq);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/submit', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    boq.status = 'submitted';
    await boq.save();
    const populated = await BOQ.findById(boq._id).populate('project createdBy');
    // Notify director
    const directors = await User.find({ role: 'director' });
    for (let director of directors) {
      await createNotification(
        director._id,
        'boq_shared',
        'BOQ Submitted for Approval',
        `${boq.createdBy?.name} submitted a BOQ for ${boq.project?.name}`,
        `/boq/${boq._id}`
      );
    }
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    boq.status = 'approved';
    await boq.save();
    const populated = await BOQ.findById(boq._id).populate('project createdBy');
    // Notify creator
    if (boq.createdBy) {
      await createNotification(
        boq.createdBy,
        'boq_shared',
        'BOQ Approved',
        `Your BOQ for ${boq.project?.name} was approved by ${req.user.name}`,
        `/boq/${boq._id}`
      );
    }
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
