const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'safetyReports endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'safetyReports created' }));
module.exports = router;
