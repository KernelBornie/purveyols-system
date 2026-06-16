const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'logbooks endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'logbooks created' }));
module.exports = router;
