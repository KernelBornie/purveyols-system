const express = require('express');
const router = express.Router();
const Subcontract = require('../models/Subcontract');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, formatCurrency } = require('../utils/notificationHelper');
const { sendMoney } = require('../services/airtelMoneyService');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subcontract.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = new Subcontract({ ...req.body, createdBy: req.user.id });
    await sub.save();
    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role');

    const senderName = await getSenderName(req.user.id);

    await createNotification(
      req.user.id,
      'subcontract_created',
      'Subcontract Created',
      `✅ You created a subcontract for ${sub.vendor || 'vendor'}`,
      `/subcontracts/${sub._id}`
    );

    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'subcontract_created',
        'New Subcontract',
        `${senderName} created a subcontract for ${sub.vendor || 'vendor'}`,
        `/subcontracts/${sub._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'accountant', 'foreman'), async (req, res) => {
  try {
    const sub = await Subcontract.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    await Subcontract.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ──────────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const sub = await Subcontract.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    if (sub.status !== 'pending' && sub.status !== 'draft') {
      return res.status(400).json({ error: 'Only pending or draft subcontracts can be approved' });
    }
    sub.status = 'approved';
    sub.approvedBy = req.user.id;
    sub.approvedAt = new Date();
    await sub.save();

    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    await createNotification(
      sub.createdBy,
      'subcontract_approved',
      'Subcontract Approved',
      `✅ Your subcontract for "${sub.vendor || 'vendor'}" was approved by ${senderName}`,
      `/subcontracts/${sub._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── FUND (upgraded) ─────────────────────────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const { recipientPhone } = req.body;
    if (!recipientPhone) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const sub = await Subcontract.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role phone mobileMoneyNumber');
    if (!sub) return res.status(404).json({ error: 'Subcontract not found' });

    // Only allow funding if not completed/terminated
    if (sub.status === 'completed' || sub.status === 'terminated') {
      return res.status(400).json({ error: 'Cannot fund a completed or terminated subcontract' });
    }

    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({
        error: 'Accountant mobile money number not set. Please update your profile.'
      });
    }

    const reference = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    let airtelResponse = null;
    let paymentStatus = 'pending';

    try {
      airtelResponse = await sendMoney(
        recipientPhone,
        sub.amount,
        reference,
        `Subcontract payment for ${sub.vendor}`
      );
      if (airtelResponse?.status === 'success' || airtelResponse?.data?.status === 'SUCCESS') {
        paymentStatus = 'completed';
      }
    } catch (err) {
      console.error('Airtel sendMoney error:', err);
      paymentStatus = 'failed';
    }

    const payment = new Payment({
      type: 'subcontract',
      recipientName: sub.vendor || 'Subcontract Vendor',
      recipientPhone,
      amount: sub.amount,
      reference,
      paidBy: req.user.id,
      project: sub.project,
      subcontract: sub._id,
      status: paymentStatus,
      notes: `Subcontract payment for ${sub.vendor}`,
      airtelResponse,
    });
    await payment.save();

    sub.status = 'funded';
    sub.fundedBy = req.user.id;
    sub.fundedAt = new Date();
    if (req.body.recipientPhone) {
      sub.vendorPhone = req.body.recipientPhone;
    }
    await sub.save();

    const senderName = await getSenderName(req.user.id);
    const projectName = sub.project?.name || 'Unknown Project';
    const amount = formatCurrency(sub.amount);

    await createNotification(
      sub.createdBy,
      'subcontract_funded',
      'Subcontract Funded',
      `💰 ${amount} for subcontract "${sub.vendor}" has been sent to ${recipientPhone} by ${senderName}`,
      `/subcontracts/${sub._id}`
    );

    const recipients = await User.find({ role: { $in: ['admin', 'director', 'accountant'] } });
    for (let recipient of recipients) {
      if (recipient._id.toString() !== req.user.id) {
        await createNotification(
          recipient._id,
          'subcontract_funded',
          'Subcontract Funded',
          `${senderName} funded ${amount} for subcontract "${sub.vendor}" to ${recipientPhone}`,
          `/subcontracts/${sub._id}`
        );
      }
    }

    const populated = await Subcontract.findById(sub._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role phone mobileMoneyNumber')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');

    res.json({
      message: 'Subcontract funded successfully',
      payment,
      airtelResponse,
      subcontract: populated,
    });

  } catch (err) {
    console.error('Subcontract funding error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;