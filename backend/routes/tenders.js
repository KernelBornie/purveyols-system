const express = require('express');
const router = express.Router();
const Tender = require('../models/Tender');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');

// ─── Log that the router is loaded ──────────────────────────────
console.log('✅ Tenders router loaded');

// ─── Multer config for hard copy upload ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tenders/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tender-${unique}${ext}`);
  }
});

// ✅ Accept any file type – remove fileFilter
// ✅ Increase file size limit to 100MB
const upload = multer({ 
  storage, 
  limits: { fileSize: 100 * 1024 * 1024 }   // 100MB
});

// ─── Upload hard copy tender ───────────────────────────────────────
router.post('/upload-hardcopy', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/tenders/${req.file.filename}`;
    const newTender = new Tender({
      title: req.body.title || 'Hard Copy Tender',
      referenceNumber: req.body.referenceNumber || `HCT-${Date.now()}`,
      client: req.body.client || 'Unknown',
      status: 'draft',
      type: req.body.type || 'tender',
      documents: [{
        name: req.file.originalname,
        path: filePath,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      }],
      image: filePath,
      createdBy: req.user.id,
    });
    await newTender.save();
    res.status(201).json({
      message: 'Hard copy tender uploaded successfully.',
      tender: newTender,
    });
  } catch (err) {
    console.error('Upload hard copy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Test route ──────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({ message: 'Tenders router is working' });
});

// ─── GET all tenders ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const tenders = await Tender.find()
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name')
      .sort({ createdAt: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single tender ────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE tender ──────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const tender = new Tender({
      ...req.body,
      createdBy: req.user.id,
    });
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE tender ──────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status === 'submitted' || tender.status === 'awarded' || tender.status === 'verified') {
      return res.status(400).json({ error: 'Cannot edit submitted, awarded or verified tender' });
    }
    const updated = await Tender.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── SUBMIT tender ──────────────────────────────────────────────────
router.put('/:id/submit', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status === 'submitted' || tender.status === 'awarded' || tender.status === 'verified') {
      return res.status(400).json({ error: 'Tender already submitted or further' });
    }
    tender.status = 'submitted';
    tender.submittedBy = req.user.id;
    tender.submittedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── APPROVE tender ─────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'procurement-officer', 'engineer', 'accountant'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'submitted' && tender.status !== 'under_review') {
      return res.status(400).json({ error: 'Tender must be submitted or under review to approve' });
    }
    tender.status = 'approved';
    tender.approvedBy = req.user.id;
    tender.approvedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── ASSIGN tender (multi‑select) ──────────────────────────────────
router.put('/:id/assign', auth, authorize('admin', 'director', 'project-manager', 'engineer', 'accountant'), async (req, res) => {
  try {
    const { assigneeIds } = req.body;
    if (!assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return res.status(400).json({ error: 'assigneeIds array is required' });
    }
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'approved' && tender.status !== 'verified') {
      return res.status(400).json({ error: 'Tender must be approved or verified to assign' });
    }
    tender.assignedStaff = assigneeIds;
    tender.assignedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── VERIFY tender ──────────────────────────────────────────────────
router.put('/:id/verify', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'approved') {
      return res.status(400).json({ error: 'Tender must be approved to verify' });
    }
    tender.status = 'verified';
    tender.verifiedBy = req.user.id;
    tender.verifiedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── AWARD tender ───────────────────────────────────────────────────
router.put('/:id/award', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const { awardAmount, awardee } = req.body;
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'verified') {
      return res.status(400).json({ error: 'Tender must be verified to award' });
    }
    tender.status = 'awarded';
    tender.awardAmount = awardAmount || tender.priceProposal.grandTotal;
    tender.awardee = awardee || tender.client;
    tender.awardDate = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REJECT tender ──────────────────────────────────────────────────
router.put('/:id/reject', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const { reason } = req.body;
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    tender.status = 'rejected';
    tender.notes = reason || tender.notes;
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('verifiedBy', 'name role')
      .populate('convertedToProject', 'name');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE tender ──────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await Tender.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Tender not found' });
    res.json({ message: 'Tender deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── CONVERT AWARDED TENDER TO PROJECT ─────────────────────────────
router.post('/:id/convert-to-project', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id).populate('createdBy', 'name role');
    if (!tender) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    if (tender.status !== 'awarded') {
      return res.status(400).json({ error: 'Tender must be awarded to convert' });
    }
    if (tender.convertedToProject) {
      return res.status(400).json({ error: 'Project already created from this tender' });
    }

    const project = new Project({
      name: tender.title,
      location: tender.location,
      budget: tender.priceProposal?.grandTotal || 0,
      status: 'planning',
      description: tender.description,
      image: tender.image,
      createdBy: tender.createdBy?._id || req.user.id,
      manager: req.user.id,
      isFromTender: true,
      tenderSource: tender._id,
      sourceUrl: tender.sourceUrl || '',
      bidAmount: tender.priceProposal?.grandTotal,
    });
    await project.save();

    tender.convertedToProject = project._id;
    await tender.save();

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── Always export the router ──────────────────────────────────
module.exports = router;