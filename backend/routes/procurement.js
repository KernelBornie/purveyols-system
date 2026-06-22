const express = require('express');
const router = express.Router();
const ProcurementOrder = require('../models/ProcurementOrder');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all – drivers see only their own, others see all ──────────
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

// ─── GET single ──────────────────────────────────────────────────
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

// ─── CREATE ──────────────────────────────────────────────────────
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
    // Notify directors and accountants
    const recipients = await User.find({ role: { $in: ['director', 'admin', 'accountant'] } });
    for (let rec of recipients) {
      await createNotification(
        rec._id,
        'procurement_ordered',
        'New Procurement Order',
        `${senderName} created a procurement order`,
        `/procurement/${order._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE (edit) – only if pending ──────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if ((req.user.role === 'driver' || req.user.role === 'safety-officer') && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be edited' });
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

// ─── APPROVE (set status → 'funded') ──────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be approved' });
    }
    order.status = 'funded';
    order.fundedBy = req.user.id;
    order.fundedAt = new Date();
    await order.save();

    const senderName = await getSenderName(req.user.id);
    if (order.createdBy) {
      await createNotification(
        order.createdBy,
        'procurement_approved',
        'Procurement Order Approved',
        `Your requisition was approved by ${senderName}`,
        `/procurement/${order._id}`
      );
    }

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── REJECT ──────────────────────────────────────────────────────
router.put('/:id/reject', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be rejected' });
    }
    order.status = 'rejected';
    await order.save();

    const senderName = await getSenderName(req.user.id);
    if (order.createdBy) {
      await createNotification(
        order.createdBy,
        'procurement_rejected',
        'Procurement Order Rejected',
        `Your requisition was rejected by ${senderName}`,
        `/procurement/${order._id}`
      );
    }

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── FUND (backward compatibility) ────────────────────────────
router.put('/:id/fund', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = 'funded';
    order.fundedBy = req.user.id;
    order.fundedAt = new Date();
    await order.save();

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'procurement-officer', 'civil-engineer', 'quantity-surveyor', 'driver', 'safety-officer', 'accountant', 'foreman'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'driver' || req.user.role === 'safety-officer') {
      if (order.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Cannot delete approved/rejected order' });
      }
    }
    await ProcurementOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
