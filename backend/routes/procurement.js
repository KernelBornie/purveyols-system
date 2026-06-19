const express = require('express');
const router = express.Router();
const ProcurementOrder = require('../models/ProcurementOrder');
const auth = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// ─── GET all orders with grandTotal fallback ──────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProcurementOrder.find()
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    // Enrich with grandTotal if missing
    const enriched = orders.map(order => {
      const obj = order.toObject();
      // If grandTotal is not set, compute from items
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET single order ──────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id)
      .populate('project')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Ensure grandTotal is present
    const obj = order.toObject();
    if (!obj.grandTotal && Array.isArray(obj.items)) {
      obj.grandTotal = obj.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
    }

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE new order ──────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const order = new ProcurementOrder({ ...req.body, createdBy: req.user.id });
    await order.save();

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE (edit) – only if pending ──────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── APPROVE (set status → 'funded') ──────────────────────────────────
router.put('/:id/approve', auth, async (req, res) => {
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

    // Notify creator
    if (order.createdBy) {
      await createNotification(
        order.createdBy,
        'procurement_approved',
        'Procurement Order Approved',
        `Your requisition for ${order.project?.name || 'project'} has been approved.`,
        `/procurement/${order._id}`
      );
    }

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── REJECT (set status → 'rejected') ──────────────────────────────────
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be rejected' });
    }

    order.status = 'rejected';
    await order.save();

    // Notify creator
    if (order.createdBy) {
      await createNotification(
        order.createdBy,
        'procurement_rejected',
        'Procurement Order Rejected',
        `Your requisition for ${order.project?.name || 'project'} has been rejected.`,
        `/procurement/${order._id}`
      );
    }

    const populated = await ProcurementOrder.findById(order._id)
      .populate('project', 'name')
      .populate('createdBy', 'name role')
      .populate('fundedBy', 'name role')
      .populate('procurementOfficer', 'name role');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── FUND (backward compatibility) ────────────────────────────────────
router.put('/:id/fund', auth, async (req, res) => {
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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE ──────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await ProcurementOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
