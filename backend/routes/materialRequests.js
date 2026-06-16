const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => res.json({ message: 'materialRequests endpoint' }));
router.post('/', auth, (req, res) => res.json({ message: 'materialRequests created' }));
module.exports = router;
