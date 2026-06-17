const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchAdvertisedProjects, markProjectAsBidded } = require('../services/advertisedProjectsService');

// Get advertised projects with optional filters
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

// Mark a project as bidded (so it disappears from feed)
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const result = markProjectAsBidded(req.params.id);
    if (result) {
      res.json({ message: 'Project marked as bidded', id: req.params.id });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force refresh
router.get('/refresh', auth, async (req, res) => {
  try {
    // Clear cache to force refresh
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
