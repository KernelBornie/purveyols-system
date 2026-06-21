const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Delivery.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Delivery.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Delivery note not found' });
    res.json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'driver'), async (req, res) => {
  try {
    const note = new Delivery({ ...req.body, createdBy: req.user.id });
    await note.save();
    res.status(201).json(note);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'driver'), async (req, res) => {
  try {
    const updated = await Delivery.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Delivery note not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await Delivery.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Delivery note not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
