const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Tender = require('../models/Tender'); // 👈 NEW
const auth = require('../middleware/auth');

// ─── Get all bids for current user ──────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single bid ──────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create a bid from advertised project ──────────────────
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

// ─── Update bid ──────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    const oldStatus = bid.status;
    const updates = req.body;
    updates.updatedAt = new Date();
    Object.assign(bid, updates);
    await bid.save();

    // ─── If status changed to "awarded", auto‑create a Tender ───
    if (oldStatus !== 'awarded' && bid.status === 'awarded' && !bid.isConvertedToTender) {
      try {
        const tender = new Tender({
          title: `Tender from bid: ${bid.projectTitle}`,
          referenceNumber: `TND-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          client: bid.client || 'Unknown Client',
          clientAddress: '',
          clientEmail: bid.contactEmail || '',
          clientPhone: bid.contactPhone || '',
          type: 'tender',
          description: bid.description || '',
          status: 'draft',
          createdBy: req.user.id,
          // Use the bid budget as the tender's grand total (approx)
          priceProposal: {
            subtotal: parseFloat(bid.budget?.replace(/[^0-9.-]+/g, '')) || 0,
            grandTotal: parseFloat(bid.budget?.replace(/[^0-9.-]+/g, '')) || 0,
            currency: 'ZMW',
          },
          // You can fill more fields as needed
          notes: `Auto‑generated from awarded bid "${bid.projectTitle}"`,
        });
        await tender.save();

        // Link the bid to the tender
        bid.convertedToTender = tender._id;
        bid.isConvertedToTender = true;
        await bid.save();

        // Optionally, you could also create a project from the bid here
        // (we keep the separate "Create Project" button for manual conversion)
      } catch (err) {
        console.error('❌ Auto‑tender creation failed:', err);
        // We don't roll back the status change – just log the error
      }
    }

    res.json(bid);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Delete bid ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    res.json({ message: 'Bid deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Convert awarded bid to Project ──────────────────────────
router.post('/:id/convert-to-project', auth, async (req, res) => {
  // ... (unchanged, you already have this)
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status !== 'awarded') {
      return res.status(400).json({ error: 'Only awarded bids can be converted to projects' });
    }
    if (bid.isConverted) {
      return res.status(400).json({ error: 'This bid has already been converted to a project' });
    }

    const project = new Project({
      name: bid.projectTitle || 'Project from Bid',
      location: bid.location || '',
      budget: parseFloat(bid.budget?.replace(/[^0-9.-]+/g, '')) || 0,
      endDate: bid.deadline ? new Date(bid.deadline) : null,
      status: 'planning',
      createdBy: req.user.id,
      bidder: req.user.id,
      bidSource: bid.source || '',
      bidAmount: parseFloat(bid.bidAmount?.replace(/[^0-9.-]+/g, '')) || 0,
      assignedStaff: [],
      timeFrame: '',
      isFromBid: true,
      sourceUrl: bid.sourceUrl || '',
      description: bid.description || '',
      manager: null,
    });

    await project.save();

    bid.convertedToProject = project._id;
    bid.isConverted = true;
    bid.updatedAt = new Date();
    await bid.save();

    res.status(201).json({
      message: 'Project created successfully from bid!',
      project,
      bid
    });
  } catch (err) {
    console.error('Convert bid error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;