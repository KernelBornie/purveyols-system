const express = require('express');
const router = express.Router();
const Tender = require('../models/Tender');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const tenders = await Tender.find()
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ──────────────────────────────────────────────────────────
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── SUBMIT ──────────────────────────────────────────────────────────
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── APPROVE ────────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'procurement-officer'), async (req, res) => {
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── ASSIGN ─────────────────────────────────────────────────────────
router.put('/:id/assign', auth, authorize('admin', 'director', 'project-manager'), async (req, res) => {
  try {
    const { assigneeId } = req.body;
    if (!assigneeId) return res.status(400).json({ error: 'assigneeId is required' });
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'approved' && tender.status !== 'awarded') {
      return res.status(400).json({ error: 'Tender must be approved or awarded to assign' });
    }
    tender.assignedTo = assigneeId;
    tender.assignedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── AWARD ──────────────────────────────────────────────────────────
router.put('/:id/award', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const { awardAmount, awardee } = req.body;
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status === 'awarded' || tender.status === 'verified') {
      return res.status(400).json({ error: 'Tender already awarded or verified' });
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── VERIFY ─────────────────────────────────────────────────────────
router.put('/:id/verify', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ error: 'Tender not found' });
    if (tender.status !== 'awarded') {
      return res.status(400).json({ error: 'Tender must be awarded to verify' });
    }
    tender.status = 'verified';
    tender.verifiedBy = req.user.id;
    tender.verifiedAt = new Date();
    await tender.save();
    const populated = await Tender.findById(tender._id)
      .populate('createdBy', 'name role')
      .populate('submittedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REJECT ──────────────────────────────────────────────────────────
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
      .populate('assignedTo', 'name role')
      .populate('verifiedBy', 'name role');
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────────
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
    if (tender.status !== 'awarded' && tender.status !== 'verified') {
      return res.status(400).json({ error: 'Tender must be awarded or verified to convert' });
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

module.exports = router;