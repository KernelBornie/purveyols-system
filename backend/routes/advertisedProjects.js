const express = require('express');
const router = express.Router();
const AdvertisedProject = require('../models/AdvertisedProject');
const Bid = require('../models/Bid'); // 👈 import Bid model
const auth = require('../middleware/auth');

// ─── GET all advertised projects ──────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await AdvertisedProject.find(filter).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bid on an advertised project ──────────────────────────────
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Find the advertised project
    const project = await AdvertisedProject.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user already bid on this project
    const existingBid = await Bid.findOne({ projectId, user: req.user.id });
    if (existingBid) {
      return res.status(400).json({ error: 'You have already bid on this project' });
    }

    // Create a new bid
    const bid = new Bid({
      projectId: project.id,
      projectTitle: project.title,
      client: project.client,
      location: project.location,
      budget: project.budget,
      deadline: project.deadline,
      source: project.source,
      sourceUrl: project.sourceUrl,
      description: project.description,
      skills: project.skills || [],
      contactEmail: project.contactEmail,
      biddingFee: project.biddingFee,
      status: 'bidded',
      user: req.user.id,
      bidDate: new Date(),
    });

    await bid.save();

    // Optionally, you could remove the project from the feed or mark it as bidded
    // For now, we just return success and the frontend filters it out.

    res.status(201).json({ message: '✅ Project marked as bidded!', bid });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── (Optional) GET single project ─────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await AdvertisedProject.findOne({ id: req.params.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;