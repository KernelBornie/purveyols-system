const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchAdvertisedProjects, markProjectAsBidded, getBiddedProjects } = require('../services/advertisedProjectsService');
const Bid = require('../models/Bid');

// Get advertised projects
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const projects = await fetchAdvertisedProjects({ status, category, search });
    res.json({
      count: projects.length,
      projects,
      timestamp: new Date().toISOString(),
      source: 'Mixed (real + fallback)',
      note: 'Data is automatically refreshed every 15 minutes. Only open projects shown.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get bidded projects from database
router.get('/bidded', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      count: bids.length,
      projects: bids,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a project as bidded and save to database
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get project data from the service (with fresh fetch)
    let projects = await fetchAdvertisedProjects({});
    
    // Also check fallback projects if not found
    const { fetchAdvertisedProjects: fetchFresh } = require('../services/advertisedProjectsService');
    const freshProjects = await fetchFresh({});
    if (freshProjects && freshProjects.length > 0) {
      projects = freshProjects;
    }
    
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found. Please refresh and try again.' });
    }
    
    // Check if already bidded
    const existingBid = await Bid.findOne({ projectId: projectId, user: req.user.id });
    if (existingBid) {
      return res.status(400).json({ error: 'Already bidded on this project' });
    }
    
    // Create bid in database
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
      user: req.user.id,
      status: 'bidded',
      bidDate: new Date(),
    });
    await bid.save();
    
    // Also mark in service cache
    markProjectAsBidded(projectId);
    
    res.json({ 
      message: '✅ Project marked as bidded!', 
      id: projectId,
      bid: bid 
    });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ error: err.message || 'Failed to mark as bidded' });
  }
});

// Force refresh
router.get('/refresh', auth, async (req, res) => {
  try {
    const { fetchAdvertisedProjects: fetchFresh } = require('../services/advertisedProjectsService');
    const projects = await fetchFresh({});
    res.json({
      count: projects.length,
      projects,
      timestamp: new Date().toISOString(),
      refreshed: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
