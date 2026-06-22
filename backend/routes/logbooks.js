const express = require('express');
const router = express.Router();
const multer = require('multer');
const Logbook = require('../models/Logbook');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  }
});

// ─── GET all ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'driver') filter.createdBy = req.user.id;
    const logbooks = await Logbook.find(filter)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(logbooks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const logbook = await Logbook.findById(req.params.id)
      .populate('createdBy', 'name role');
    if (!logbook) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'driver' && logbook.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(logbook);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { vehicle, route, startTime, endTime, distance, fuelUsed, notes, status } = req.body;
    let fileData = null, fileName = null, fileType = null;
    if (req.file) {
      fileData = req.file.buffer.toString('base64');
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
    }
    const logbook = new Logbook({
      vehicle,
      route,
      startTime: startTime || new Date(),
      endTime,
      distance: parseFloat(distance) || 0,
      fuelUsed: parseFloat(fuelUsed) || 0,
      notes,
      status: status || 'pending',
      fileData,
      fileName,
      fileType,
      createdBy: req.user.id,
    });
    await logbook.save();
    const populated = await Logbook.findById(logbook._id).populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    // Notify directors, admins, safety officers
    const recipients = await User.find({ role: { $in: ['director', 'admin', 'safety-officer'] } });
    for (let rec of recipients) {
      await createNotification(
        rec._id,
        'logbook_entry',
        'New Logbook Entry',
        `${senderName} added a logbook entry for trip: ${logbook.vehicle || 'Unknown'}`,
        `/logbooks/${logbook._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const logbook = await Logbook.findById(req.params.id);
    if (!logbook) return res.status(404).json({ error: 'Not found' });
    const update = { ...req.body };
    if (req.file) {
      update.fileData = req.file.buffer.toString('base64');
      update.fileName = req.file.originalname;
      update.fileType = req.file.mimetype;
    }
    const updated = await Logbook.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('createdBy', 'name role');
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Logbook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
