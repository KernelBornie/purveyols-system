const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');

// Get all visitors
router.get('/', auth, async (req, res) => {
  try {
    const visitors = await Visitor.find().populate('loggedBy', 'name role');
    res.json(visitors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get a single visitor
router.get('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id).populate('loggedBy', 'name role');
    if (!visitor) return res.status(404).json({ error: 'Not found' });
    res.json(visitor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a visitor
router.post('/', auth, async (req, res) => {
  try {
    const visitor = new Visitor({
      ...req.body,
      loggedBy: req.user.id,
      checkIn: req.body.checkIn || new Date(),
    });
    await visitor.save();
    const populated = await Visitor.findById(visitor._id).populate('loggedBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update visitor (e.g., check out)
router.put('/:id', auth, async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('loggedBy', 'name role');
    res.json(visitor);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete visitor
router.delete('/:id', auth, async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
