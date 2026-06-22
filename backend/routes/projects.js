const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole } = require('../utils/notificationHelper');

// ─── GET all ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
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

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);

    // ─── Notify creator ──────────────────────────────────────
    await createNotification(
      req.user.id,
      'project_created',
      'Project Created',
      `✅ You created a new project: "${project.name}"`,
      `/projects/${project._id}`
    );

    // ─── Notify directors ────────────────────────────────────
    const directors = await User.find({ role: 'director' });
    for (let director of directors) {
      await createNotification(
        director._id,
        'project_created',
        'New Project Created',
        `${senderName} (${senderRole}) created a new project: "${project.name}"`,
        `/projects/${project._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'civil-engineer', 'accountant'), async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role');
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ──────────────────────────────────────────────────
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
    const projectName = project.name;

    // ─── Notify creator ──────────────────────────────────────
    await createNotification(
      project.createdBy,
      'project_approved',
      'Project Approved',
      `✅ Your project "${projectName}" was approved by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── REJECT ──────────────────────────────────────────────────
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
    const projectName = project.name;

    await createNotification(
      project.createdBy,
      'project_rejected',
      'Project Rejected',
      `❌ Your project "${projectName}" was rejected by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
