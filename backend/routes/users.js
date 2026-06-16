const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'users endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'users created' }));
module.exports = router;
