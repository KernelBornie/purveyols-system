const mongoose = require('mongoose');

const SitePlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  type: {
    type: String,
    enum: ['site_plan', 'fence_drawing', 'access_plan', 'boundary_fence', 'survey_data'],
    required: true,
  },
  description: String,
  fileUrl: String, // uploaded file URL
  fileType: String, // e.g., 'image/png', 'application/pdf'
  dimensions: String, // e.g., "100m x 50m"
  scale: String, // e.g., "1:100"
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // ─── Survey‑specific fields ──────────────────────────────────────
  surveyPoints: [{
    label: String,
    x: Number,
    y: Number,
    z: Number, // elevation
    description: String,
  }],
  boundaryData: {
    perimeter: Number,
    area: Number,
    coordinates: [[Number]], // [[lat, lng], ...]
  },
  foundationType: String,
  soilType: String,
  waterTableLevel: Number,

  // ─── Drawing canvas data (new) ──────────────────────────────────
  drawingData: { type: String },   // JSON string from fabric.js canvas
  drawingImage: { type: String },  // base64 PNG thumbnail for preview
});

module.exports = mongoose.model('SitePlan', SitePlanSchema);
