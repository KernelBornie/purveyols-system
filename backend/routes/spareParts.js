const express = require('express');
const router = express.Router();
const SparePartRequest = require('../models/SparePartRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── GET all ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'driver') filter.driver = req.user.id;
    const requests = await SparePartRequest.find(filter)
      .populate('driver', 'name')
      .populate('project', 'name')
      .populate('approvedBy', 'name')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single ──────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await SparePartRequest.findById(req.params.id)
      .populate('driver', 'name')
      .populate('project', 'name')
      .populate('approvedBy', 'name');
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'driver' && request.driver._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(request);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { project, item, quantity, description } = req.body;
    if (!item || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Item and quantity are required' });
    }
    const request = new SparePartRequest({
      driver: req.user.id,
      project: project || null,
      item,
      quantity,
      description: description || '',
      status: 'pending',
    });
    await request.save();
    const populated = await SparePartRequest.findById(request._id)
      .populate('driver', 'name')
      .populate('project', 'name');

    const senderName = await getSenderName(req.user.id);
    const recipients = await User.find({ role: { $in: ['procurement-officer', 'director', 'admin'] } });
    for (let rec of recipients) {
      await createNotification(
        rec._id,
        'spare_part_requested',
        'New Spare Parts Request',
        `${senderName} requested ${quantity} x ${item}`,
        `/spare-parts/${request._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE (drivers can edit if pending, others approve/reject) ──
router.put('/:id', auth, async (req, res) => {
  try {
    const request = await SparePartRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });

    if (req.user.role === 'driver') {
      if (request.driver.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      if (request.status !== 'pending') return res.status(400).json({ error: 'Cannot edit approved/rejected request' });
      const { item, quantity, description } = req.body;
      if (item) request.item = item;
      if (quantity) request.quantity = quantity;
      if (description) request.description = description;
      request.updatedAt = new Date();
      await request.save();
    } else {
      // Procurement/Admin/Director can approve/reject
      const { status, rejectionReason } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const senderName = await getSenderName(req.user.id);
      if (status === 'approved') {
        request.status = 'approved';
        request.approvedBy = req.user.id;
        request.approvedAt = new Date();
        await createNotification(
          request.driver,
          'spare_part_approved',
          'Spare Parts Approved',
          `Your request for ${request.quantity} x ${request.item} was approved by ${senderName}`,
          `/spare-parts/${request._id}`
        );
      } else {
        request.status = 'rejected';
        request.rejectionReason = rejectionReason || '';
        await createNotification(
          request.driver,
          'spare_part_rejected',
          'Spare Parts Rejected',
          `Your request for ${request.quantity} x ${request.item} was rejected by ${senderName}`,
          `/spare-parts/${request._id}`
        );
      }
      request.updatedAt = new Date();
      await request.save();
    }

    const populated = await SparePartRequest.findById(request._id)
      .populate('driver', 'name')
      .populate('project', 'name')
      .populate('approvedBy', 'name');
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await SparePartRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'driver') {
      if (request.driver.toString() !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      if (request.status !== 'pending') return res.status(400).json({ error: 'Cannot delete approved/rejected request' });
    }
    await SparePartRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
