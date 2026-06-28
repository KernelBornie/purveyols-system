const express = require('express');
const router = express.Router();
const Tender = require('../models/Tender');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');

// ─── Multer config for hard copy upload ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tenders/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tender-${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Upload hard copy tender ───────────────────────────────────────
router.post('/upload-hardcopy', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/tenders/${req.file.filename}`;
    const newTender = new Tender({
      title: req.body.title || 'Hard Copy Tender',
      referenceNumber: req.body.referenceNumber || `HCT-${Date.now()}`,
      client: req.body.client || 'Unknown',
      status: 'draft',
      type: req.body.type || 'tender',
      documents: [{
        name: req.file.originalname,
        path: filePath,
        mimeType: req.file.mimetype,   // ✅ now correctly saved
        uploadedAt: new Date(),
      }],
      image: filePath,
      createdBy: req.user.id,
    });
    await newTender.save();
    res.status(201).json({
      message: 'Hard copy tender uploaded successfully.',
      tender: newTender,
    });
  } catch (err) {
    console.error('Upload hard copy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ... (all other routes remain unchanged)

module.exports = router;