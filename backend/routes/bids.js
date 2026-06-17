const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

// Get all bids for current user
router.get('/', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bid
router.get('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a bid from advertised project
router.post('/', auth, async (req, res) => {
  try {
    const bidData = { ...req.body, user: req.user.id, bidDate: new Date(), status: 'bidded' };
    const bid = new Bid(bidData);
    await bid.save();
    res.status(201).json(bid);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update bid
router.put('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    const updates = req.body;
    updates.updatedAt = new Date();
    Object.assign(bid, updates);
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete bid
router.delete('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json({ message: 'Bid deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
