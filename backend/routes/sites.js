const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Site = require('../modules/mapping-service/Site');

// GET /api/sites – list all sites (filtered by user unless director/admin)
router.get('/', auth, async (req, res) => {
  try {
    const isPrivileged = ['director', 'admin'].includes(req.user.role);
    const filter = isPrivileged ? {} : { createdBy: req.user._id };
    const sites = await Site.find(filter)
      .populate('createdBy', 'name role')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/sites – create a site
router.post('/', auth, roleCheck('director', 'engineer', 'surveyor', 'foreman'), async (req, res) => {
  try {
    const site = new Site({ ...req.body, createdBy: req.user._id });
    await site.save();
    await site.populate('createdBy', 'name role');
    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/sites/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('project', 'name status');
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/sites/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const isPrivileged = ['director', 'admin'].includes(req.user.role);
    // Whitelist updatable fields to prevent injection via arbitrary operators in req.body
    const { name, projectName, description, terrain, accessibility, siteType, area, areaUnit, status } = req.body;
    const updates = { name, projectName, description, terrain, accessibility, siteType, area, areaUnit, status };
    // Remove undefined keys so existing values aren't overwritten with undefined
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, ...(isPrivileged ? {} : { createdBy: req.user._id }) },
      { $set: updates },
      { new: true }
    ).populate('createdBy', 'name role');
    if (!site) return res.status(404).json({ message: 'Site not found or access denied' });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/sites/:id/gps – add a GPS coordinate to a site
router.post('/:id/gps', auth, async (req, res) => {
  try {
    const { lat, lng, altitude, accuracy } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    site.coordinates.push({ lat, lng, altitude, accuracy, capturedBy: req.user._id });
    // Keep primary coordinate as the first captured
    if (!site.primaryCoordinate?.lat) {
      site.primaryCoordinate = { lat, lng };
    }
    await site.save();
    res.json({ message: 'GPS coordinate added', coordinates: site.coordinates });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/sites/:id – director/admin only
router.delete('/:id', auth, roleCheck('director', 'admin'), async (req, res) => {
  try {
    const site = await Site.findByIdAndDelete(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json({ message: 'Site deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
