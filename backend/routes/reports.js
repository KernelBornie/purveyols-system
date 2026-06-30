const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createNotification, getSenderName } = require('../utils/notificationHelper');

// ─── Multer config for Project documents ────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/projects/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `project-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }  // 50MB
});

// Ensure upload directory exists
const projectUploadDir = 'uploads/projects';
if (!fs.existsSync(projectUploadDir)) {
  fs.mkdirSync(projectUploadDir, { recursive: true });
  console.log(`📁 Created upload directory: ${projectUploadDir}`);
}

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('⚠️ xlsx module not installed. Excel uploads will not work.');
}

const uploadFile = multer({ dest: 'uploads/' });

// ─── GET all projects ──────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET single project ──────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CREATE ──────────────────────────────────────────────────────
router.post('/', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'), async (req, res) => {
  try {
    const project = new Project({ ...req.body, createdBy: req.user.id });
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    const recipients = await User.find({ role: { $in: ['director', 'admin'] } });
    for (let rec of recipients) {
      await createNotification(
        rec._id,
        'project_created',
        'New Project Created',
        `${senderName} created a new project: ${project.name}`,
        `/projects/${project._id}`
      );
    }
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPDATE ──────────────────────────────────────────────────────
router.put('/:id', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant', 'qs', 'quantity-surveyor'), async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── DELETE ──────────────────────────────────────────────────────
router.delete('/:id', auth, authorize('admin', 'director', 'accountant'), async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── APPROVE ──────────────────────────────────────────────────────
router.put('/:id/approve', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'active';
    project.approvedBy = req.user.id;
    project.approvedAt = new Date();
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    await createNotification(
      project.createdBy,
      'project_approved',
      'Project Approved',
      `Your project "${project.name}" has been approved by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── REJECT ──────────────────────────────────────────────────────
router.put('/:id/reject', auth, authorize('admin', 'director'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.status = 'rejected';
    await project.save();
    const populated = await Project.findById(project._id)
      .populate('manager', 'name role')
      .populate('createdBy', 'name role')
      .populate('bidder', 'name role')
      .populate('assignedStaff', 'name role')
      .populate('approvedBy', 'name role');

    const senderName = await getSenderName(req.user.id);
    await createNotification(
      project.createdBy,
      'project_rejected',
      'Project Rejected',
      `Your project "${project.name}" has been rejected by ${senderName}`,
      `/projects/${project._id}`
    );
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── UPLOAD routes (preview + import) ──────────────────────────────
router.post('/upload/preview', auth, authorize('admin', 'director', 'accountant'), uploadFile.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];
    if (ext === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else if ((ext === '.xlsx' || ext === '.xls') && XLSX) {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === '.xlsx' || ext === '.xls') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'xlsx module is not installed. Please install it via: npm install xlsx' });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
    }
    fs.unlinkSync(filePath);
    const errors = [];
    const projects = [];
    rows.forEach((row, idx) => {
      const name = row.name || row.Name || row.NAME || '';
      if (!name || !name.trim()) {
        errors.push(`Row ${idx+1}: name is required`);
        return;
      }
      const project = {
        name: name.trim(),
        location: row.location || row.Location || row.LOCATION || '',
        budget: parseFloat(row.budget || row.Budget || row.BUDGET || 0) || 0,
        status: row.status || row.Status || row.STATUS || 'planning',
        description: row.description || row.Description || row.DESCRIPTION || '',
        progress: parseInt(row.progress || row.Progress || row.PROGRESS || 0) || 0,
        endDate: row.endDate || row.EndDate || row.ENDDATE || null,
        image: row.image || row.Image || row.IMAGE || '',
      };
      projects.push(project);
    });
    res.json({ projects, errors });
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', auth, authorize('admin', 'director', 'accountant'), uploadFile.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];
    if (ext === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else if ((ext === '.xlsx' || ext === '.xls') && XLSX) {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === '.xlsx' || ext === '.xls') {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'xlsx module is not installed. Please install it via: npm install xlsx' });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Only CSV and Excel files are supported' });
    }
    fs.unlinkSync(filePath);
    const created = [];
    const errors = [];
    for (const row of rows) {
      const name = row.name || row.Name || row.NAME || '';
      if (!name || !name.trim()) {
        errors.push(`Skipped row: name missing`);
        continue;
      }
      const projectData = {
        name: name.trim(),
        location: row.location || row.Location || '',
        budget: parseFloat(row.budget || row.Budget || 0) || 0,
        status: row.status || row.Status || 'planning',
        description: row.description || row.Description || '',
        progress: parseInt(row.progress || row.Progress || 0) || 0,
        endDate: row.endDate || row.EndDate ? new Date(row.endDate || row.EndDate) : null,
        image: row.image || row.Image || '',
        createdBy: req.user.id,
      };
      const project = new Project(projectData);
      await project.save();
      created.push(project);
    }
    if (created.length > 0) {
      const senderName = await getSenderName(req.user.id);
      const recipients = await User.find({ role: { $in: ['admin', 'director'] } });
      for (let rec of recipients) {
        await createNotification(
          rec._id,
          'project_uploaded',
          'Projects Uploaded',
          `${senderName} uploaded ${created.length} project(s) via file`,
          `/projects`
        );
      }
    }
    res.json({ count: created.length, errors, projects: created });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DOCUMENT UPLOAD ──────────────────────────────────────────────
router.post('/:id/documents', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant'), upload.single('file'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = {
      name: req.body.name || req.file.originalname,
      path: `/uploads/projects/${req.file.filename}`,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };
    project.documents.push(doc);
    await project.save();
    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE DOCUMENT ──────────────────────────────────────────────
router.delete('/:id/documents/:docIndex', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const index = parseInt(req.params.docIndex);
    if (isNaN(index) || index < 0 || index >= project.documents.length) {
      return res.status(400).json({ error: 'Invalid document index' });
    }
    project.documents.splice(index, 1);
    await project.save();
    res.json({ message: 'Document removed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── UPDATE DOCUMENT METADATA ──────────────────────────────────────
router.put('/:id/documents/:docIndex', auth, authorize('admin', 'director', 'civil-engineer', 'foreman', 'accountant'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const index = parseInt(req.params.docIndex);
    if (isNaN(index) || index < 0 || index >= project.documents.length) {
      return res.status(400).json({ error: 'Invalid document index' });
    }
    if (req.body.name) project.documents[index].name = req.body.name;
    await project.save();
    res.json({ message: 'Document updated', document: project.documents[index] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;