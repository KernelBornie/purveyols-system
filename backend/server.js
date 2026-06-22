const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single (by id) ────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ──────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer'), async (req, res) => {
  try {
    const project = new Project({ ...req.body, createdBy: req.user.id });
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────
// ✅ Allow admin, director, and civil‑engineer to edit
router.put('/:id', auth, authorize('admin', 'director', 'civil-engineer'), async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────
// Only admin and director can delete
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── APPROVE ──────────────────────────────────────────────────
// Only admin and director can approve
router.put('/:id/approve', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'active';
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    const senderName = await getSenderName(req.user.id);
    await createNotification(
      project.createdBy,
      'project_approved',
      'Project Approved',
      `Your project "${project.name}" has been approved by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REJECT ──────────────────────────────────────────────────
// Only admin and director can reject
router.put('/:id/reject', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'rejected';
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    const senderName = await getSenderName(req.user.id);
    await createNotification(
      project.createdBy,
      'project_rejected',
      'Project Rejected',
      `Your project "${project.name}" has been rejected by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
