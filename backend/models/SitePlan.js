const mongoose = require('mongoose');

const SitePlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  // ─── Type with all options from frontend dropdown ──────────────
  type: {
    type: String,
    enum: [
      'site_plan',
      'building_plan',
      'floor_plan',
      'foundation_plan',
      'fence_plan',
      'road_design',
      'drainage',
      'water_reticulation',
      'electrical',
      'access_control',
      'fire_safety',
      'landscape',
      'topographic',
      'as_built',
      // Keep legacy ones for backward compatibility
      'fence_drawing',
      'access_plan',
      'boundary_fence',
      'survey_data'
    ],
    default: 'site_plan',
    required: true,
  },

  description: String,
  fileUrl: String,
  fileType: String,
  dimensions: String,
  scale: String,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'survey_review', 'engineering_review', 'qs_review', 'director_approval', 'issued', 'as_built', 'approved', 'rejected'],
    default: 'draft',
  },
  revision: { type: Number, default: 1 },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issueDate: Date,
  drawingNumber: String,
  surveyNumber: String,
  surveyDate: Date,
  surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  equipmentUsed: [String],
  coordinateSystem: String,
  datum: String,

  // ─── Coordinates (array of objects) ─────────────────────────────
  coordinates: [{
    northing: Number,
    easting: Number,
    elevation: Number,
  }],

  // ─── Calculated fields ────────────────────────────────────────────
  area: { type: Number, default: 0 },
  perimeter: { type: Number, default: 0 },
  fenceLength: { type: Number, default: 0 },
  posts: { type: Number, default: 0 },
  concreteVolume: { type: Number, default: 0 },
  chainLinkQty: { type: Number, default: 0 },
  razorWireQty: { type: Number, default: 0 },
  roadLength: { type: Number, default: 0 },
  subgradeVol: { type: Number, default: 0 },
  subbaseVol: { type: Number, default: 0 },
  baseCourseVol: { type: Number, default: 0 },
  asphaltQty: { type: Number, default: 0 },

  // ─── Survey-specific ──────────────────────────────────────────────
  surveyPoints: [{
    label: String,
    x: Number,
    y: Number,
    z: Number,
    description: String,
  }],
  boundaryData: {
    perimeter: Number,
    area: Number,
    coordinates: [[Number]],
  },
  foundationType: String,
  soilType: String,
  waterTableLevel: Number,

  // ─── Drawing canvas data ─────────────────────────────────────────
  drawingData: { type: String },   // JSON from fabric.js
  drawingImage: { type: String },  // base64 preview

  // ─── Layers (array of objects) ──────────────────────────────────
  layers: [{
    key: { type: String, enum: ['survey', 'boundary', 'road', 'building', 'fence', 'drainage', 'electrical', 'water', 'security', 'annotation'] },
    label: String,
    visible: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    icon: String,
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SitePlan', SitePlanSchema);