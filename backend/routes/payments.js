const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'payments endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'payments created' }));
module.exports = router;
