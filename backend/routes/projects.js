const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification } = require('../utils/notificationHelper');

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'name role')
      .populate('createdBy', 'name role');
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = new Project({ ...req.body, createdBy: req.user.id });
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name role')
      .populate('createdBy', 'name role');
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/approve', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'active';
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role');
    await createNotification(
      project.createdBy,
      'project_approved',
      'Project Approved',
      `Your project "${project.name}" has been approved by ${req.user.name}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id/reject', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'rejected';
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role');
    await createNotification(
      project.createdBy,
      'project_rejected',
      'Project Rejected',
      `Your project "${project.name}" has been rejected by ${req.user.name}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
