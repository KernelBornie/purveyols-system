const express = require('express');
const router = express.Router();
const SiteDiary = require('../models/SiteDiary');
const auth = require('../middleware/auth');

// GET diary for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const diary = await SiteDiary.findOne({ project: req.params.projectId })
      .populate('entries.createdBy', 'name')
      .populate('createdBy', 'name');
    res.json(diary || { project: req.params.projectId, entries: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD an entry to a diary
router.post('/entry', auth, async (req, res) => {
  try {
    const { project, ...entryData } = req.body;
    let diary = await SiteDiary.findOne({ project });
    if (!diary) {
      diary = new SiteDiary({ project, createdBy: req.user.id });
    }
    diary.entries.push({ ...entryData, createdBy: req.user.id });
    diary.updatedAt = Date.now();
    await diary.save();
    const populated = await SiteDiary.findById(diary._id)
      .populate('entries.createdBy', 'name')
      .populate('createdBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE an entry
router.delete('/entry/:entryId', auth, async (req, res) => {
  try {
    const diary = await SiteDiary.findOne({ 'entries._id': req.params.entryId });
    if (!diary) return res.status(404).json({ error: 'Entry not found' });
    diary.entries.id(req.params.entryId).remove();
    await diary.save();
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;