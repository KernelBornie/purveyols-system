const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const MaterialList = require('../models/MaterialList');

// GET /api/material-list – list material lists (engineer sees own; director/procurement see all)
router.get('/', auth, async (req, res) => {
  try {
    const filter = ['director', 'procurement'].includes(req.user.role)
      ? {}
      : { createdBy: req.user._id };
    const materialLists = await MaterialList.find(filter)
      .populate('createdBy', 'name email role')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });
    res.json({ materialLists });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/material-list – create a material list
router.post('/', auth, roleCheck('engineer', 'director'), async (req, res) => {
  try {
    const materialList = new MaterialList({ ...req.body, createdBy: req.user._id });
    await materialList.save();
    await materialList.populate('createdBy', 'name email role');
    await materialList.populate('projectId', 'name');
    res.status(201).json({ materialList });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/material-list/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const materialList = await MaterialList.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('projectId', 'name');
    if (!materialList) return res.status(404).json({ message: 'Material list not found' });
    res.json({ materialList });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/material-list/:id – update a material list
router.put('/:id', auth, roleCheck('engineer', 'director'), async (req, res) => {
  try {
    const materialList = await MaterialList.findById(req.params.id);
    if (!materialList) return res.status(404).json({ message: 'Material list not found' });
    Object.assign(materialList, req.body);
    await materialList.save();
    await materialList.populate('createdBy', 'name email role');
    await materialList.populate('projectId', 'name');
    res.json({ materialList });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/material-list/:id
router.delete('/:id', auth, roleCheck('engineer', 'director'), async (req, res) => {
  try {
    const materialList = await MaterialList.findByIdAndDelete(req.params.id);
    if (!materialList) return res.status(404).json({ message: 'Material list not found' });
    res.json({ message: 'Material list deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
