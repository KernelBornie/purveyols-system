const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchAdvertisedProjects } = require('../services/advertisedProjectsService');

// Get advertised projects with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const projects = await fetchAdvertisedProjects({ status, category, search });
    res.json({
      count: projects.length,
      projects,
      timestamp: new Date().toISOString(),
      source: 'Simulated (social media, tenders, etc.)',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get project details
router.get('/:id', auth, async (req, res) => {
  try {
    const projects = await fetchAdvertisedProjects();
    const project = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
