const express = require('express');
const router = express.Router();
const FundingRequest = require('../models/FundingRequest');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole, formatCurrency } = require('../utils/notificationHelper');
const { sendMoney } = require('../services/airtelMoneyService'); // 👈 ADDED

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const requests = await FundingRequest.find()
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'quantity-surveyor', 'foreman', 'driver', 'safety-officer', 'procurement-officer', 'accountant'), async (req, res) => {
  try {
    const request = new FundingRequest({ ...req.body, requestedBy: req.user.id });
    await request.save();
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    // Notify creator
    await createNotification(
      req.user.id,
      'funding_requested',
      'Funding Requested',
      `✅ You requested ${amount} for "${projectName}"`,
      `/funding/${request._id}`
    );

    // Notify accountants and directors (exclude creator)
    const recipients = await User.find({ role: { $in: ['accountant', 'director'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'funding_requested',
        'New Funding Request',
        `${senderName} (${senderRole}) requested ${amount} for "${projectName}"`,
        `/funding/${request._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const updated = await FundingRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ─────────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    await createNotification(
      request.requestedBy,
      'funding_approved',
      'Funding Approved',
      `✅ Your request for ${amount} for "${projectName}" was approved by ${senderName}`,
      `/funding/${request._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── REJECT ──────────────────────────────────────────────────────────
router.put('/:id/reject', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    request.status = 'rejected';
    request.rejectionReason = req.body.reason || 'No reason provided';
    await request.save();
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    await createNotification(
      request.requestedBy,
      'funding_rejected',
      'Funding Rejected',
      `❌ Your request for ${amount} for "${projectName}" was rejected by ${senderName}`,
      `/funding/${request._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── FUND (with Airtel payment) ─────────────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { recipientPhone } = req.body;
    if (!recipientPhone) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const request = await FundingRequest.findById(req.params.id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role phone mobileMoneyNumber');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved requests can be funded' });
    }

    // ─── Get accountant (sender) ────────────────────────────────────
    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({
        error: 'Accountant mobile money number not set. Please update your profile.'
      });
    }

    // ─── Send money via Airtel ──────────────────────────────────────
    const reference = `FUND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    let airtelResponse = null;
    let paymentStatus = 'pending';

    try {
      airtelResponse = await sendMoney(
        recipientPhone,
        request.amount,
        reference,
        `Funding for request ${request._id}`
      );
      if (airtelResponse?.status === 'success' || airtelResponse?.data?.status === 'SUCCESS') {
        paymentStatus = 'completed';
      }
    } catch (err) {
      console.error('Airtel sendMoney error:', err);
      paymentStatus = 'failed';
    }

    // ─── Create Payment record ──────────────────────────────────────
    const payment = new Payment({
      type: 'funding',
      recipientName: request.requestedBy?.name || 'Funding Recipient',
      recipientPhone,
      amount: request.amount,
      reference,
      paidBy: req.user.id,
      project: request.project,
      status: paymentStatus,
      notes: `Funding for request ${request._id}`,
    });
    await payment.save();

    // ─── Mark request as funded ─────────────────────────────────────
    request.status = 'funded';
    request.fundedBy = req.user.id;
    request.fundedAt = new Date();
    await request.save();

    // ─── Notifications ──────────────────────────────────────────────
    const senderName = await getSenderName(req.user.id);
    const projectName = request.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    await createNotification(
      request.requestedBy._id,
      'funding_funded',
      'Funding Released',
      `💰 ${amount} for "${projectName}" has been sent to ${recipientPhone} by ${senderName}`,
      `/funding/${request._id}`
    );

    const recipients = await User.find({ role: { $in: ['admin', 'accountant'] } });
    for (let recipient of recipients) {
      if (recipient._id.toString() !== req.user.id) {
        await createNotification(
          recipient._id,
          'funding_funded',
          'Funding Released',
          `${senderName} funded ${amount} for "${projectName}" to ${recipientPhone}`,
          `/funding/${request._id}`
        );
      }
    }

    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role phone mobileMoneyNumber')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');

    res.json({
      message: 'Funding processed successfully',
      payment,
      airtelResponse,
      request: populated,
    });

  } catch (err) {
    console.error('Funding error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const deleted = await FundingRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;