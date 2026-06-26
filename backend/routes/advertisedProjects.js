const express = require('express');
const router = express.Router();
const AdvertisedProject = require('../models/AdvertisedProject');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

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

    const project = await AdvertisedProject.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingBid = await Bid.findOne({ projectId, user: req.user.id });
    if (existingBid) {
      return res.status(400).json({ error: 'You have already bid on this project' });
    }

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

    res.status(201).json({ message: '✅ Project marked as bidded!', bid });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fetch fresh projects from external sources ──────────────────
router.post('/fetch', auth, authorize('admin', 'director', 'procurement-officer'), async (req, res) => {
  try {
    const { fetchFreshProjects } = require('../services/newsScraper');
    const results = await fetchFreshProjects();
    res.json({ message: 'Fetch completed', results });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single project ─────────────────────────────────────────
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