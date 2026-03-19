const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ProcurementOrder = require('../models/ProcurementOrder');
const { createNotification } = require('../utils/notifications');

// GET /api/procurement
router.get('/', auth, async (req, res) => {
  try {
    const orders = await ProcurementOrder.find()
      .populate('requestedBy', 'name email')
      .populate('project', 'name')
      .populate('approvedBy', 'name email')
      .populate('priceSetBy', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/procurement – engineer submits a material request WITHOUT price
router.post('/', auth, roleCheck('engineer'), async (req, res) => {
  try {
    const { items, project, deliveryDate } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    const sanitizedItems = [];
    for (const item of items) {
      const name = item?.name?.trim();
      const quantity = Number(item?.quantity);
      if (!name) {
        return res.status(400).json({ message: 'Each item name is required' });
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Each item quantity must be at least 1' });
      }
      const sanitizedItem = {
        name,
        quantity,
        description: item?.description?.trim() || undefined
      };
      if (item.unitPrice != null && item.unitPrice !== '') {
        const unitPrice = Number(item.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          return res.status(400).json({ message: 'Each item unitPrice must be 0 or greater when provided' });
        }
        sanitizedItem.unitPrice = unitPrice;
      }
      sanitizedItems.push(sanitizedItem);
    }
    const order = new ProcurementOrder({
      items: sanitizedItems,
      project: project || undefined,
      deliveryDate: deliveryDate || undefined,
      requestedBy: req.user._id
    });
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    const itemSummary = order.items.length === 1
      ? `"${order.items[0].name}"`
      : `${order.items.length} items`;
    createNotification(
      req.user._id,
      `Your procurement request for ${itemSummary} has been submitted and is pending review.`,
      'procurement_request'
    );
    res.status(201).json({
      message: 'Procurement order created successfully',
      order
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/price – procurement officer sets supplier and unit prices per item
router.put('/:id/price', auth, roleCheck('procurement'), async (req, res) => {
  try {
    const { supplier, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items with prices are required' });
    }
    for (const item of items) {
      if (item.unitPrice == null || item.unitPrice <= 0) {
        return res.status(400).json({ message: 'Unit price is required and must be greater than 0 for all items' });
      }
    }
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Price can only be set on pending orders' });
    }
    if (items.length !== order.items.length) {
      return res.status(400).json({ message: 'Items count does not match order' });
    }
    order.supplier = supplier;
    order.items = order.items.map((item, i) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: items[i].unitPrice
    }));
    order.priceSetBy = req.user._id;
    order.status = 'priced';
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    await order.populate('priceSetBy', 'name email');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/approve – director approves a priced request
router.put('/:id/approve', auth, roleCheck('director'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    if (order.status !== 'priced') {
      return res.status(400).json({ message: 'Only priced orders can be approved by the director' });
    }
    // Capture requestedBy before populate replaces it with an object
    const requestedById = order.requestedBy;
    order.status = 'approved';
    order.approvedBy = req.user._id;
    order.approvedByDirector = true;
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    await order.populate('approvedBy', 'name email');
    createNotification(
      requestedById,
      `Your procurement request for ${order.items.length === 1 ? `"${order.items[0].name}"` : `${order.items.length} items`} has been approved.`,
      'approval'
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/fund – accountant funds a director-approved request
router.put('/:id/fund', auth, roleCheck('accountant'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    if (!order.approvedByDirector || order.status !== 'approved') {
      return res.status(400).json({ message: 'Only director-approved orders can be funded' });
    }
    order.status = 'funded';
    order.fundedByAccountant = true;
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    await order.populate('approvedBy', 'name email');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/reject – director rejects a priced request
router.put('/:id/reject', auth, roleCheck('director'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    if (order.status !== 'priced') {
      return res.status(400).json({ message: 'Only priced orders can be rejected by the director' });
    }
    // Capture requestedBy before populate replaces it with an object
    const requestedById = order.requestedBy;
    order.status = 'rejected';
    order.rejectionReason = rejectionReason;
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    createNotification(
      requestedById,
      `Your procurement request for ${order.items.length === 1 ? `"${order.items[0].name}"` : `${order.items.length} items`} has been rejected.`,
      'rejection'
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id – admin-only maintenance update (data correction/recovery use cases)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    const { items, project, deliveryDate } = req.body;
    if (items !== undefined) {
      order.items = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        description: item.description
      }));
    }
    if (project !== undefined) order.project = project || undefined;
    if (deliveryDate !== undefined) order.deliveryDate = deliveryDate || undefined;
    await order.save();
    await order.populate('requestedBy', 'name email');
    await order.populate('project', 'name');
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/procurement/:id/deactivate – engineer/director only
router.put('/:id/deactivate', auth, roleCheck('engineer', 'director'), async (req, res) => {
  try {
    const order = await ProcurementOrder.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .populate('requestedBy', 'name email')
      .populate('project', 'name');
    if (!order) return res.status(404).json({ message: 'Procurement order not found' });
    res.json({ message: 'Procurement order deactivated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
