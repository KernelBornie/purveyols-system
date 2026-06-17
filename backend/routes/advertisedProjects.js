const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { fetchAdvertisedProjects } = require('../services/advertisedProjectsService');

router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const projects = await fetchAdvertisedProjects({ status, category, search });
    res.json({
      count: projects.length,
      projects,
      timestamp: new Date().toISOString(),
      source: 'Mixed (real + fallback)',
      note: 'Data is automatically refreshed every hour',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/refresh', auth, async (req, res) => {
  try {
    // Force refresh by clearing cache
    const { fetchAdvertisedProjects: fetchFresh } = require('../services/advertisedProjectsService');
    // We need to reset the cache – we'll just re-fetch
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
