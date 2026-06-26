const express = require('express');
const router = express.Router(); // 👈 THIS LINE WAS MISSING
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Tender = require('../models/Tender');
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

    const updates = req.body;
    updates.updatedAt = new Date();
    Object.assign(bid, updates);
    await bid.save();
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

// ─── Convert bid to Tender ──────────────────────────────
router.post('/:id/convert-to-tender', auth, async (req, res) => {
  try {
    const bid = await Bid.findOne({ _id: req.params.id, user: req.user.id });
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.isConvertedToTender) {
      return res.status(400).json({ error: 'This bid has already been forwarded to Tenders' });
    }

    // Parse budget as number
    const budgetNumber = parseFloat(bid.budget?.replace(/[^0-9.-]+/g, '')) || 0;

    const tender = new Tender({
      title: bid.projectTitle || 'Untitled Tender',
      referenceNumber: `TND-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      client: bid.client || 'Unknown Client',
      clientAddress: '',
      clientEmail: bid.contactEmail || '',
      clientPhone: bid.contactPhone || '',
      type: 'tender',
      projectName: bid.projectTitle || '',
      location: bid.location || '',
      description: bid.description || '',
      status: 'draft',
      createdBy: req.user.id,
      priceProposal: {
        subtotal: budgetNumber,
        grandTotal: budgetNumber,
        currency: 'ZMW',
        percentageAdjustment: 0,
        contingencies: 0,
        vat: 0,
        exchangeRate: 1,
      },
      notes: `Forwarded from bidded project "${bid.projectTitle}" (ID: ${bid.projectId})`,
    });

    await tender.save();

    // Link the bid to the tender
    bid.convertedToTender = tender._id;
    bid.isConvertedToTender = true;
    bid.updatedAt = new Date();
    await bid.save();

    // Populate the tender for response
    const populatedTender = await Tender.findById(tender._id)
      .populate('createdBy', 'name role');

    res.status(201).json({
      message: '✅ Tender created successfully from bid!',
      tender: populatedTender,
      bid
    });
  } catch (err) {
    console.error('Convert bid to tender error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // 👈 THIS LINE WAS ALSO MISSING