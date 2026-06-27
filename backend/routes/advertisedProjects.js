const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const AdvertisedProject = require('../models/AdvertisedProject');
const advertisedService = require('../services/advertisedProjectsService');

// ─── GET all open projects (with filters) ──────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (search) filters.search = search;

    const projects = await advertisedService.getProjectsFromDB(filters);
    res.json({ projects });
  } catch (err) {
    console.error('❌ GET /api/advertised-projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ─── POST /fetch – manually scrape and save new projects ──────
// Allowed roles: any role that might need to fetch projects
router.post(
  '/fetch',
  auth,
  authorize(
    'admin',
    'director',
    'procurement-officer',
    'accountant',
    'civil-engineer',
    'quantity-surveyor',
    'foreman',
    'safety-officer',
    'engineer',
    'manager',
    'supervisor',
    'planner',
    'estimator',
    'surveyor',
    'architect',
    'project-manager',
    'site-engineer',
    'construction-manager',
    'quality-control',
    'store-keeper',
    'driver',
    'receptionist'
  ),
  async (req, res) => {
    try {
      const result = await advertisedService.fetchAdvertisedProjects();
      res.json({
        results: {
          added: result.results?.added || 0,
          skipped: result.results?.skipped || 0,
        },
        projects: result.projects || [],
      });
    } catch (err) {
      console.error('❌ POST /api/advertised-projects/fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch new projects: ' + err.message });
    }
  }
);

// ─── POST /:id/bid – mark a project as bidded ─────────────────
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const success = await advertisedService.markProjectAsBidded(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project marked as bidded successfully' });
  } catch (err) {
    console.error('❌ POST /api/advertised-projects/:id/bid error:', err);
    res.status(500).json({ error: 'Failed to mark project as bidded' });
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