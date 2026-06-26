const express = require('express');
const router = express.Router();
const ProcurementOrder = require('../models/ProcurementOrder');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName, formatCurrency } = require('../utils/notificationHelper');
const { sendMoney } = require('../services/airtelMoneyService');

// ─── GET all ──────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'driver') {
      filter.createdBy = req.user.id;
    }
    const orders = await ProcurementOrder.find(filter)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role')
      .sort({ createdAt: -1 });

    const enriched = orders.map(order => {
      const obj = order.toObject();
      if (!obj.grandTotal && Array.isArray(obj.items)) {
        obj.grandTotal = obj.items.reduce((sum, item) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unitPrice) || 0;
          return sum + (qty * price);
        }, 0);
      }
      return obj;
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id)
      .populate('project')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'driver' && order.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const obj = order.toObject();
    if (!obj.grandTotal && Array.isArray(obj.items)) {
      obj.grandTotal = obj.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
    }
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const order = new ProcurementOrder({ ...req.body, createdBy: req.user.id });
    await order.save();
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    const senderName = await getSenderName(req.user.id);

    await createNotification(
      req.user.id,
      'procurement_ordered',
      'Procurement Order Created',
      `✅ You created a procurement order`,
      `/procurement/${order._id}`
    );

    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant', 'procurement-officer'] } });
    const filtered = recipients.filter(r => r._id.toString() !== req.user.id);
    for (let recipient of filtered) {
      await createNotification(
        recipient._id,
        'procurement_ordered',
        'New Procurement Order',
        `${senderName} created a procurement order`,
        `/procurement/${order._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if ((req.user.role === 'driver' || req.user.role === 'safety-officer') && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending' && order.status !== 'procurement_approved') {
      return res.status(400).json({ error: 'Only pending or procurement-approved orders can be edited' });
    }

    const {
      project,
      items,
      supplier,
      grandTotal,
      preparedBy,
      approvedBy,
      authorisedBy,
      preparedSign,
      approvedSign,
      authorisedSign,
    } = req.body;

    if (project !== undefined) order.project = project;
    if (items !== undefined) order.items = items;
    if (supplier !== undefined) order.supplier = supplier;
    if (grandTotal !== undefined) order.grandTotal = grandTotal;
    if (preparedBy !== undefined) order.preparedBy = preparedBy;
    if (approvedBy !== undefined) order.approvedBy = approvedBy;
    if (authorisedBy !== undefined) order.authorisedBy = authorisedBy;
    if (preparedSign !== undefined) order.preparedSign = preparedSign;
    if (approvedSign !== undefined) order.approvedSign = approvedSign;
    if (authorisedSign !== undefined) order.authorisedSign = authorisedSign;

    await order.save();

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Procurement Officer Approve ──────────────────────────────────
router.put('/:id/procurement-approve', auth, authorize('admin', 'director', 'procurement-officer', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be approved by procurement' });
    }
    order.status = 'procurement_approved';
    await order.save();

    const senderName = await getSenderName(req.user.id);
    await createNotification(
      order.createdBy,
      'procurement_approved',
      'Procurement Order Approved (Preliminary)',
      `Your requisition has been approved by Procurement Officer ${senderName}`,
      `/procurement/${order._id}`
    );
    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant'] } });
    for (let recipient of recipients) {
      if (recipient._id.toString() !== req.user.id) {
        await createNotification(
          recipient._id,
          'procurement_approved',
          'Procurement Order Pending Final Approval',
          `${senderName} approved a requisition. Please review and final approve.`,
          `/procurement/${order._id}`
        );
      }
    }
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Procurement Officer Reject ──────────────────────────────────
router.put('/:id/procurement-reject', auth, authorize('admin', 'director', 'procurement-officer', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be rejected' });
    }
    order.status = 'rejected';
    await order.save();
    const senderName = await getSenderName(req.user.id);
    await createNotification(
      order.createdBy,
      'procurement_rejected',
      'Procurement Order Rejected',
      `Your requisition was rejected by Procurement Officer ${senderName}`,
      `/procurement/${order._id}`
    );
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Final Approve (Director/Accountant) ──────────────────────────
router.put('/:id/final-approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'procurement_approved') {
      return res.status(400).json({ error: 'Order must be procurement-approved first' });
    }
    order.status = 'approved';
    await order.save();
    const senderName = await getSenderName(req.user.id);
    await createNotification(
      order.createdBy,
      'procurement_approved',
      'Procurement Order Final Approved',
      `Your requisition has been final approved by ${senderName}`,
      `/procurement/${order._id}`
    );
    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── FUND (only admin & accountant) ──────────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { recipientPhone } = req.body;
    if (!recipientPhone) {
      return res.status(400).json({ error: 'Recipient phone number is required.' });
    }

    const order = await ProcurementOrder.findById(req.params.id)
      .populate('project', 'name')
      .populate('createdBy', 'name role phone mobileMoneyNumber');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved orders can be funded' });
    }

    const accountant = await User.findById(req.user.id);
    if (!accountant.mobileMoneyNumber) {
      return res.status(400).json({
        error: 'Accountant mobile money number not set. Please update your profile.'
      });
    }

    // ─── Check for missing Airtel credentials ──────────────────────
    if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
      const amount = order.grandTotal || order.total || 0;
      const reference = `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const payment = new Payment({
        type: 'procurement',
        recipientName: order.createdBy?.name || 'Procurement Recipient',
        recipientPhone,
        amount,
        reference,
        paidBy: req.user.id,
        project: order.project,
        procurementOrder: order._id,
        status: 'failed',
        notes: `Funding attempt failed: Airtel credentials missing.`,
        errorMessage: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.',
      });
      await payment.save();

      await createNotification(
        req.user.id,
        'payment_failed',
        'Procurement Funding Failed',
        `❌ Funding for procurement order ${order.orderNumber || order._id} failed because Airtel credentials are missing. Please contact system administrator.`,
        `/procurement/${order._id}`
      );

      return res.status(500).json({
        error: 'Airtel credentials missing. Please set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in environment variables.',
        payment
      });
    }

    // ─── Send money via Airtel ──────────────────────────────────────
    const amount = order.grandTotal || order.total || 0;
    const reference = `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    let airtelResponse = null;
    let paymentStatus = 'pending';

    try {
      airtelResponse = await sendMoney(
        recipientPhone,
        amount,
        reference,
        `Procurement order ${order.orderNumber || order._id}`
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

    // ─── Create Payment record ──────────────────────────────────────
    const payment = new Payment({
      type: 'procurement',
      recipientName: order.createdBy?.name || 'Procurement Recipient',
      recipientPhone,
      amount,
      reference,
      paidBy: req.user.id,
      project: order.project,
      procurementOrder: order._id,
      status: paymentStatus,
      notes: `Procurement order ${order.orderNumber || order._id}`,
      airtelResponse,
      errorMessage: paymentStatus === 'failed' ? (airtelResponse?.error || 'Airtel payment failed') : undefined,
    });
    await payment.save();

    if (paymentStatus === 'failed') {
      await createNotification(
        req.user.id,
        'payment_failed',
        'Procurement Funding Failed',
        `❌ Funding for procurement order ${order.orderNumber || order._id} failed. Please check Airtel logs.`,
        `/procurement/${order._id}`
      );
      return res.status(500).json({
        error: 'Airtel payment failed.',
        payment,
        airtelResponse,
      });
    }

    // ─── Mark order as funded ─────────────────────────────────────
    order.status = 'funded';
    order.fundedBy = req.user.id;
    order.fundedAt = new Date();
    await order.save();

    // ─── Notifications ──────────────────────────────────────────────
    const senderName = await getSenderName(req.user.id);
    const projectName = order.project?.name || 'Unknown Project';
    const formattedAmount = formatCurrency(amount);

    await createNotification(
      order.createdBy,
      'procurement_funded',
      'Procurement Order Funded',
      `💰 ${formattedAmount} for procurement order "${order.orderNumber || order._id}" has been sent to ${recipientPhone} by ${senderName}`,
      `/procurement/${order._id}`
    );

    const recipients = await User.find({ role: { $in: ['admin', 'accountant', 'director'] } });
    for (let recipient of recipients) {
      if (recipient._id.toString() !== req.user.id) {
        await createNotification(
          recipient._id,
          'procurement_funded',
          'Procurement Order Funded',
          `${senderName} funded ${formattedAmount} for procurement order "${order.orderNumber || order._id}" to ${recipientPhone}`,
          `/procurement/${order._id}`
        );
      }
    }

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json({
      message: 'Procurement order funded successfully',
      payment,
      airtelResponse,
      order: populated,
    });

  } catch (err) {
    console.error('Procurement funding error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─── Delete ────────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'driver' || req.user.role === 'safety-officer') {
      if (order.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (order.status !== 'pending' && order.status !== 'procurement_approved') {
        return res.status(400).json({ error: 'Cannot delete approved/rejected order' });
      }
    }
    await ProcurementOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;