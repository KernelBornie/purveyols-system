const express = require('express');
const router = express.Router();
const Subcontract = require('../models/Subcontract');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subcontract.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(subs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant'), async (req, res) => {
  try {
    const sub = new Subcontract({ ...req.body, createdBy: req.user.id });
    await sub.save();
    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant'), async (req, res) => {
  try {
    const sub = await Subcontract.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    res.json(sub);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'accountant'), async (req, res) => {
  try {
    await Subcontract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
