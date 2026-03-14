const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Subcontract = require('../models/Subcontract');

// GET /api/subcontracts – engineer sees own; director/admin see all
router.get('/', auth, async (req, res) => {
  try {
    const filter = ['director', 'admin'].includes(req.user.role)
      ? {}
      : { hiredBy: req.user._id };
    const subcontracts = await Subcontract.find(filter)
      .populate('hiredBy', 'name email role')
      .populate('project', 'name')
      .sort({ dateHired: -1 });
    res.json({ subcontracts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/subcontracts – create a subcontract entry
router.post('/', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const subcontract = new Subcontract({ ...req.body, hiredBy: req.user._id });
    await subcontract.save();
    await subcontract.populate('hiredBy', 'name email role');
    await subcontract.populate('project', 'name');
    res.status(201).json({ subcontract });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/subcontracts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const subcontract = await Subcontract.findById(req.params.id)
      .populate('hiredBy', 'name email role')
      .populate('project', 'name');
    if (!subcontract) return res.status(404).json({ message: 'Subcontract not found' });
    res.json({ subcontract });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/subcontracts/:id – update
router.put('/:id', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const subcontract = await Subcontract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('hiredBy', 'name email role')
      .populate('project', 'name');
    if (!subcontract) return res.status(404).json({ message: 'Subcontract not found' });
    res.json({ subcontract });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/subcontracts/:id
router.delete('/:id', auth, roleCheck('engineer', 'director', 'admin'), async (req, res) => {
  try {
    const subcontract = await Subcontract.findByIdAndDelete(req.params.id);
    if (!subcontract) return res.status(404).json({ message: 'Subcontract not found' });
    res.json({ message: 'Subcontract record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
