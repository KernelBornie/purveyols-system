const express = require('express');
const router = express.Router();
const FundingRequest = require('../models/FundingRequest');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, getSenderRole, formatCurrency } = require('../utils/notificationHelper');
const { sendMoney } = require('../services/airtelMoneyService');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const requests = await FundingRequest.find()
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role')
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
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'quantity-surveyor', 'foreman', 'driver', 'safety-officer', 'procurement-officer', 'accountant'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = new FundingRequest({
      ...req.body,
      requestedBy: req.user.id,
      status: status || 'pending',
    });
    await request.save();
    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const senderRole = await getSenderRole(req.user.id);
    const projectName = populated.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    await createNotification(
      req.user.id,
      'funding_requested',
      'Funding Requested',
      `✅ You requested ${amount} for "${projectName}"`,
      `/funding/${request._id}`
    );

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

// ─── UPDATE (EDIT) ──────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'accountant', 'civil-engineer', 'quantity-surveyor', 'procurement-officer'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!['draft', 'pending'].includes(request.status)) {
      return res.status(400).json({ error: 'Cannot edit approved/rejected/funded request' });
    }
    const isCreator = request.requestedBy.toString() === req.user.id;
    const isAuthorized = ['admin', 'director', 'accountant'].includes(req.user.role);
    if (!isCreator && !isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to edit this request' });
    }
    const { project, amount, description, status, recipientPhone } = req.body;
    if (project !== undefined) request.project = project;
    if (amount !== undefined) request.amount = amount;
    if (description !== undefined) request.description = description;
    if (recipientPhone !== undefined) request.recipientPhone = recipientPhone;
    if (status !== undefined && ['draft', 'pending'].includes(status)) {
      request.status = status;
    }
    request.updatedAt = new Date();
    await request.save();

    const populated = await FundingRequest.findById(request._id)
      .populate('project', 'name')
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('fundedBy', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ─────────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be approved' });
    }
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
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be rejected' });
    }
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

// ─── FORWARD to Director ──────────────────────────────────────────
router.put('/:id/forward', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be forwarded' });
    }

    // ─── Send notification to all directors ──────────────────────
    const directors = await User.find({ role: 'director' });
    const senderName = await getSenderName(req.user.id);
    const projectName = request.project?.name || 'Unknown Project';
    const amount = formatCurrency(request.amount);

    for (let director of directors) {
      await createNotification(
        director._id,
        'funding_forwarded',
        'Funding Request Forwarded',
        `${senderName} forwarded a funding request for "${projectName}" (${amount}) for your approval.`,
        `/funding/${request._id}`
      );
    }

    // ─── Also notify the requester ──────────────────────────────
    await createNotification(
      request.requestedBy,
      'funding_forwarded',
      'Your Request Forwarded',
      `Your funding request for "${projectName}" (${amount}) has been forwarded to the Director for approval.`,
      `/funding/${request._id}`
    );

    res.json({ message: 'Request forwarded to Director', request });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── FUND ──────────────────────────────────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'accountant'), async (req, res) => {
  // ... (existing fund route, unchanged) ...
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

    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({
        error: 'Accountant mobile money number not set. Please update your profile.'
      });
    }

    if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
      const reference = `FUND-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const payment = new Payment({
        type: 'funding',
        recipientName: request.requestedBy?.name || 'Funding Recipient',
        recipientPhone,
        amount: request.amount,
        reference,
        paidBy: req.user.id,
        project: request.project,
        fundingRequest: request._id,
        status: 'failed',
        notes: `Funding attempt failed: Airtel credentials missing.`,
        errorMessage: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.',
      });
      await payment.save();

      await createNotification(
        req.user.id,
        'payment_failed',
        'Funding Failed',
        `❌ Funding for request ${request._id} failed because Airtel credentials are missing. Please contact system administrator.`,
        `/funding/${request._id}`
      );

      return res.status(500).json({
        error: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.',
        payment
      });
    }

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
      } else {
        paymentStatus = 'failed';
      }
    } catch (err) {
      console.error('Airtel sendMoney error:', err);
      paymentStatus = 'failed';
      airtelResponse = { error: err.message };
    }

    const payment = new Payment({
      type: 'funding',
      recipientName: request.requestedBy?.name || 'Funding Recipient',
      recipientPhone,
      amount: request.amount,
      reference,
      paidBy: req.user.id,
      project: request.project,
      fundingRequest: request._id,
      status: paymentStatus,
      notes: `Funding for request ${request._id}`,
      airtelResponse,
      errorMessage: paymentStatus === 'failed' ? (airtelResponse?.error || 'Airtel payment failed') : undefined,
    });
    await payment.save();

    if (paymentStatus === 'failed') {
      await createNotification(
        req.user.id,
        'payment_failed',
        'Funding Failed',
        `❌ Funding for request ${request._id} failed. Please check Airtel logs.`,
        `/funding/${request._id}`
      );
      return res.status(500).json({
        error: 'Airtel payment failed.',
        payment,
        airtelResponse,
      });
    }

    request.status = 'funded';
    request.fundedBy = req.user.id;
    request.fundedAt = new Date();
    await request.save();

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
router.delete('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    await FundingRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Funding request deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;