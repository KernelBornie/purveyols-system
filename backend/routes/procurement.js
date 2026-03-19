const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ProcurementOrder = require('../models/ProcurementOrder');
const { createNotification } = require('../utils/notifications');

// GET /api/procurement
router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProcurementOrder.find({ isActive: { $ne: false } })
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email')
      .populate('priceSetBy', 'name email');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/procurement – engineer submits request (NO PRICE)
router.post('/', auth, roleCheck('engineer'), async (req, res) => {
  try {
    const { items, project, deliveryDate } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const sanitizedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      description: item.description
    }));

    const order = new ProcurementOrder({
      items: sanitizedItems,
      project,
      deliveryDate,
      requestedBy: req.user._id,
      status: 'pending'
    });

    await order.save();

    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');

    createNotification(
      req.user._id,
      `Procurement request submitted (${order.items.length} item(s))`,
      'procurement_request'
    );

    res.status(201).json(order);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/procurement/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id)
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email')
      .populate('priceSetBy', 'name email');

    if (!order) return res.status(404).json({ message: 'Not found' });

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// SET PRICE (PROCUREMENT)
router.put('/:id/price', auth, roleCheck('procurement'), async (req, res) => {
  try {
    const { supplier, items } = req.body;

    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    if (order.status !== 'pending' || order.priceSetBy) {
      return res.status(400).json({ message: 'Already priced' });
    }

    if (!items || items.length !== order.items.length) {
      return res.status(400).json({ message: 'Invalid items' });
    }

    order.supplier = supplier;

    order.items = order.items.map((item, i) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: items[i].unitPrice,
      totalPrice: item.quantity * items[i].unitPrice
    }));

    order.priceSetBy = req.user._id;
    order.status = 'priced';

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// APPROVE (DIRECTOR)
router.put('/:id/approve', auth, roleCheck('director'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    if (order.status !== 'priced') {
      return res.status(400).json({ message: 'Must be priced first' });
    }

    order.status = 'approved';
    order.approvedBy = req.user._id;
    order.approvedByDirector = true;

    await order.save();

    createNotification(
      order.requestedBy,
      `Procurement approved`,
      'approval'
    );

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FUND (ACCOUNTANT)
router.put('/:id/fund', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    if (!order.approvedByDirector) {
      return res.status(400).json({ message: 'Not approved yet' });
    }

    order.status = 'funded';
    order.fundedByAccountant = true;

    await order.save();

    createNotification(
      order.requestedBy,
      `Procurement funded`,
      'funding'
    );

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REJECT
router.put('/:id/reject', auth, roleCheck('director'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    order.status = 'rejected';
    order.rejectionReason = req.body.rejectionReason;

    await order.save();

    createNotification(
      order.requestedBy,
      `Procurement rejected`,
      'rejection'
    );

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// EDIT (ENGINEER ONLY BEFORE PRICING)
router.put('/:id', auth, roleCheck('engineer'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot edit after pricing' });
    }

    const { items, project, deliveryDate } = req.body;

    if (items) {
      order.items = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description
      }));
    }

    order.project = project;
    order.deliveryDate = deliveryDate;

    await order.save();

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SOFT DELETE
router.put('/:id/deactivate', auth, roleCheck('engineer', 'director'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    res.json({ message: 'Deactivated', order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;