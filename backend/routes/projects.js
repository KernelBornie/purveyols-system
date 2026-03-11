const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Project = require('../models/Project');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('assignedEngineer', 'name email')
      .populate('assignedForeman', 'name email')
      .populate('createdBy', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/projects – director/engineer only
router.post('/', auth, roleCheck('director', 'engineer'), async (req, res) => {
  try {
    const project = new Project({ ...req.body, createdBy: req.user._id });
    await project.save();
    await project.populate('assignedEngineer', 'name email');
    await project.populate('assignedForeman', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedEngineer', 'name email')
      .populate('assignedForeman', 'name email')
      .populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedEngineer', 'name email')
      .populate('assignedForeman', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/projects/:id – director only
router.delete('/:id', auth, roleCheck('director'), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
