const express = require('express');
const router = express.Router();
const BOQ = require('../models/BOQ');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole, formatCurrency } = require('../utils/notificationHelper');

// ─── GET all BOQs ────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const boqs = await BOQ.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(boqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single BOQ ──────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id)
      .populate('project', 'name location')
      .populate('createdBy', 'name role');
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    res.json(boq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE ──────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'foreman'), async (req, res) => {
  try {
    const { items, preliminaries, contingency, vat, ...rest } = req.body;
    let subTotal = 0;
    if (items && items.length) {
      subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    const prelims = subTotal * (preliminaries || 0) / 100;
    const conting = subTotal * (contingency || 0) / 100;
    const vatAmount = subTotal * (vat || 0) / 100;
    const grandTotal = subTotal + prelims + conting + vatAmount;

    const boq = new BOQ({
      ...rest,
      items: items || [],
      preliminaries: preliminaries || 0,
      contingency: contingency || 0,
      vat: vat || 0,
      subTotal,
      grandTotal,
      createdBy: req.user.id
    });
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const total = formatCurrency(grandTotal);

    // ─── Notify the creator (you created this) ──────────────
    await createNotification(
      req.user.id,
      'boq_shared',
      'BOQ Created',
      `✅ You created a BOQ for "${projectName}" with total ${total}`,
      `/boq/${boq._id}`
    );

    // ─── Notify directors (engineer created a BOQ) ──────────
    const directors = await User.find({ role: 'director' });
    for (let director of directors) {
      await createNotification(
        director._id,
        'boq_shared',
        'New BOQ Created',
        `${senderName} (${senderRole}) created a BOQ for "${projectName}" with total ${total}`,
        `/boq/${boq._id}`
      );
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE ──────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const { items, preliminaries, contingency, vat, ...rest } = req.body;
    let subTotal = 0;
    if (items && items.length) {
      subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    const prelims = subTotal * (preliminaries || 0) / 100;
    const conting = subTotal * (contingency || 0) / 100;
    const vatAmount = subTotal * (vat || 0) / 100;
    const grandTotal = subTotal + prelims + conting + vatAmount;

    const updateData = {
      ...rest,
      items: items || [],
      preliminaries: preliminaries || 0,
      contingency: contingency || 0,
      vat: vat || 0,
      subTotal,
      grandTotal,
      updatedAt: new Date()
    };
    const boq = await BOQ.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role');
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    res.json(boq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── SUBMIT ──────────────────────────────────────────────────
router.put('/:id/submit', auth, authorize('admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    if (boq.status === 'submitted') return res.status(400).json({ error: 'Already submitted' });
    boq.status = 'submitted';
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const total = formatCurrency(boq.grandTotal || 0);

    // ─── Notify creator (you submitted) ──────────────────────
    await createNotification(
      req.user.id,
      'boq_shared',
      'BOQ Submitted',
      `✅ You submitted a BOQ for "${projectName}" for approval`,
      `/boq/${boq._id}`
    );

    // ─── Notify directors (BOQ submitted) ────────────────────
    const directors = await User.find({ role: 'director' });
    for (let director of directors) {
      await createNotification(
        director._id,
        'boq_shared',
        'BOQ Submitted for Approval',
        `${senderName} submitted a BOQ for "${projectName}" with total ${total}`,
        `/boq/${boq._id}`
      );
    }
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── APPROVE ──────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const boq = await BOQ.findById(req.params.id);
    if (!boq) return res.status(404).json({ error: 'BOQ not found' });
    if (boq.status === 'approved') return res.status(400).json({ error: 'Already approved' });
    boq.status = 'approved';
    boq.approvedBy = req.user.id;
    boq.approvedAt = new Date();
    await boq.save();
    const populated = await BOQ.findById(boq._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const total = formatCurrency(boq.grandTotal || 0);

    // ─── Notify creator (your BOQ was approved) ─────────────
    if (boq.createdBy) {
      await createNotification(
        boq.createdBy,
        'boq_shared',
        'BOQ Approved',
        `✅ Your BOQ for "${projectName}" with total ${total} was approved by ${senderName}`,
        `/boq/${boq._id}`
      );
    }
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await BOQ.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'BOQ not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
