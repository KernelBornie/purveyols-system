// ─── Upload hard copy tender ─────────────────────────────────────
const multer = require('multer');
// (If you want, you can reuse the same upload instance from server.js, but for simplicity we create a new one here)
const upload = multer({ 
  dest: 'uploads/tenders/',
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// We'll use a custom filename to keep original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/tenders/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = require('path').extname(file.originalname);
    cb(null, `tender-${unique}${ext}`);
  }
});
const uploadWithStorage = multer({ storage, fileFilter: upload.fileFilter, limits: upload.limits });

router.post('/upload-hardcopy', auth, uploadWithStorage.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/tenders/${req.file.filename}`;
    // Create a new tender with the file as the main document
    const newTender = new Tender({
      title: req.body.title || 'Hard Copy Tender',
      referenceNumber: req.body.referenceNumber || `HCT-${Date.now()}`,
      client: req.body.client || 'Unknown',
      status: 'draft',
      type: req.body.type || 'tender',
      documents: [{
        name: req.file.originalname,
        path: filePath,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
      }],
      image: filePath, // also set as main image for quick preview
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