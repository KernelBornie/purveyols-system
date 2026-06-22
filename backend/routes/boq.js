const express = require('express');
const router = express.Router();
const BOQ = require('../models/BOQ');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

// GET all, GET single, POST already done; we just update PUT and SUBMIT to include accountant, and maybe DELETE? We'll add accountant to PUT and SUBMIT, keep DELETE admin/director.

router.put('/:id', auth, authorize('admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant'), async (req, res) => {
  // ... existing code (same as before but with accountant added)
});

router.put('/:id/submit', auth, authorize('admin', 'director', 'quantity-surveyor', 'civil-engineer', 'procurement-officer', 'accountant'), async (req, res) => {
  // ... existing code
});

// DELETE stays as admin/director (if you want accountant to delete, add 'accountant' as well)
router.delete('/:id', auth, authorize('admin', 'director'), async (req, res) => {
  // ...
});
