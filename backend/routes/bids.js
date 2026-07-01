const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/bids/' });

// ─── GET bids for a project ──────────────────────────────────
router.get('/projects/:id', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.id })
      .populate('bidderId', 'name role')
      .sort({ submittedAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST bid for a project ──────────────────────────────────
router.post('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const bid = new Bid({
      projectId: req.params.id,
      bidderId: req.user.id,
      amount: req.body.amount,
      timeline: req.body.timeline,
      notes: req.body.notes,
      documents: req.body.documents || [],
      status: 'pending',
      submittedAt: new Date()
    });
    await bid.save();
    const populated = await Bid.findById(bid._id).populate('bidderId', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT bid status (accept/reject) ──────────────────────────
router.put('/:id/status', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    bid.status = status;
    bid.updatedAt = new Date();
    await bid.save();

    // If accepted, update project with awarded bid
    if (status === 'accepted') {
      await Project.findByIdAndUpdate(bid.projectId, { awardedBidId: bid._id });
    }

    const populated = await Bid.findById(bid._id).populate('bidderId', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Upload document for bid ──────────────────────────────────
router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.bidderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const document = {
      name: req.file.originalname,
      path: `/uploads/bids/${req.file.filename}`,
      mimeType: req.file.mimetype,
      uploadedAt: new Date()
    };
    
    bid.documents.push(document);
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE bid document ──────────────────────────────────────
router.delete('/:id/documents/:docIndex', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.bidderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const docIndex = parseInt(req.params.docIndex);
    if (docIndex < 0 || docIndex >= bid.documents.length) {
      return res.status(400).json({ error: 'Invalid document index' });
    }
    
    const doc = bid.documents[docIndex];
    const filePath = path.join(__dirname, '..', doc.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    
    bid.documents.splice(docIndex, 1);
    await bid.save();
    res.json(bid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;