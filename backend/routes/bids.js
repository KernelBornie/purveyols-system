const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── GET all bids (for the logged-in user) ──────────────────
router.get('/', auth, async (req, res) => {
  try {
    // Return bids where the user is the bidder
    const bids = await Bid.find({ bidderId: req.user.id })
      .populate('projectId', 'name')  // populate project name if projectId exists
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET bids for a specific project ─────────────────────────
router.get('/projects/:id', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.id })
      .populate('bidderId', 'name role')
      .sort({ submittedAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST bid for a project (real project only) ──────────────
router.post('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const bid = new Bid({
      projectId: req.params.id,
      bidderId: req.user.id,
      amount: req.body.amount,
      timeline: req.body.timeline,
      notes: req.body.notes,
      documents: req.body.documents || [],
      status: 'pending',
      bidDate: new Date(),
    });
    await bid.save();
    const populated = await Bid.findById(bid._id).populate('bidderId', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT bid status (accept/reject) – only for project bids ──
router.put('/:id/status', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'bidded', 'shortlisted', 'interviewing', 'awarded', 'lost', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    bid.status = status;
    bid.updatedAt = new Date();
    await bid.save();

    // If this is a project bid and status is 'accepted', update the project
    if (bid.projectId && status === 'accepted') {
      await Project.findByIdAndUpdate(bid.projectId, { awardedBidId: bid._id });
    }

    const populated = await Bid.findById(bid._id).populate('bidderId', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Update a bid (edit) ──────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    // Only the bidder can edit
    if (bid.bidderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedUpdates = ['status', 'bidAmount', 'notes', 'followUpDate', 'contactPerson', 'contactPhone'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        bid[field] = req.body[field];
      }
    });
    bid.updatedAt = new Date();
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE a bid ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.bidderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await bid.deleteOne();
    res.json({ message: 'Bid deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Convert awarded bid to a real Project ────────────────────
router.post('/:id/convert-to-project', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status !== 'awarded') {
      return res.status(400).json({ error: 'Only awarded bids can be converted' });
    }
    if (bid.isConverted) {
      return res.status(400).json({ error: 'Bid already converted' });
    }

    // Create a new Project using bid data
    const project = new Project({
      name: bid.projectTitle || 'Project from bid',
      location: bid.location || '',
      budget: parseFloat(bid.budget) || 0,
      status: 'planning',
      description: bid.description || '',
      // For bid-specific data, we may want to store more
      createdBy: req.user.id,
      // You can add more fields as needed
    });
    await project.save();

    bid.isConverted = true;
    bid.projectId = project._id;  // link to the new project
    await bid.save();

    res.status(201).json({ 
      message: 'Project created from bid',
      project,
      bid
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Convert bid to a Tender (RFQ) ────────────────────────────
// (This would be a separate endpoint, but we'll keep it simple)
router.post('/:id/convert-to-tender', auth, async (req, res) => {
  // Implementation can be similar to convert-to-project,
  // but create a Tender document instead.
  // For now, we'll just mark it.
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    bid.isConvertedToTender = true;
    await bid.save();
    res.json({ message: 'Bid forwarded to tenders', bid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;